// Ambulance driver dashboard  (#/driver)
// Real data : emergency requests, assignment, trip stages, notes and positions come from  /api/driver/...
// The map   : Leaflet + OpenStreetMap tiles (no API key). Routes/ETA from OSRM, addresses from Nominatim (see geo.js).
// Live data : the page polls the backend every 5 seconds (no WebSocket needed).
(() => {
    const LF = window.L;                                   // Leaflet (loaded in index.html)

    const STAGES = [                                       // [api value, label, timestamp field]
        ["ASSIGNED", "Assigned", "assignedAt"],
        ["ON_ROUTE", "On Route", "onRouteAt"],
        ["ARRIVED", "Arrived", "arrivedAt"],
        ["AT_HOSPITAL", "At Hospital", "atHospitalAt"],
    ];
    const NEXT = { ASSIGNED: ["ON_ROUTE", "Start Route"], ON_ROUTE: ["ARRIVED", "Mark Arrived"], ARRIVED: ["AT_HOSPITAL", "At Hospital"] };
    const SEV = { CRITICAL: ["Critical Priority", "crit"], HIGH: ["High Priority", "high"], LOW: ["Low Priority", "low"] };
    const STATUS = { OPEN: "Waiting", IN_PROGRESS: "In progress", RESOLVED: "Completed" };

    const DV = {
        job: null, queue: [], history: [],
        me: null, gpsErr: "", watch: null, timer: null, online: true,
        patientPos: null, route: null, routeKey: "", routeAt: 0, routing: false,
        map: null, layers: {}, fitKey: "", idleCentered: false,
        seen: new Set(), firstLoad: true, lastSent: 0, notesDirty: false,
    };

    /* ---------- icons + helpers ---------- */
    const IC = {
        home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
        list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
        nav: '<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
        status: '<path d="M4 7h12M4 12h16M4 17h10M18 5l2 2-2 2M16 15l2 2-2 2"/>',
        user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
        out: '<path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9"/>',
        truck: '<path d="M2 6h12v10H2zM14 9h4l4 4v3h-8z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
        clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
        route: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>',
        check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
        pin: '<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
        phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
        bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
        heart: '<path d="M12 21C5 15.5 3 12 3 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9 2.5C21 12 19 15.5 12 21z"/>',
        note: '<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5"/>',
        send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
        bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
        menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
        locate: '<circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
        ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
        alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.4"/>',
    };
    const I = (n, s = 20) => `<svg class="dvi" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;

    const code = r => "ER-" + (1000 + r.id);                // same number the emergency dashboard shows (#ER-1025)
    const clock = s => s ? new Date(s).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" }) : "";
    const ago = s => {
        const m = Math.max(0, Math.round((Date.now() - new Date(s)) / 60000));
        return m < 1 ? "just now" : m < 60 ? m + " min ago" : Math.floor(m / 60) + " hr ago";
    };
    const trunc = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + "…" : s || "");
    const stageIdx = j => STAGES.findIndex(s => s[0] == j.stage);
    const tel = p => "tel:" + String(p || "").replace(/[^\d+]/g, "");

    /* ---------- page shell ---------- */
    const navItem = (icon, text, href, scroll, on) =>
        `<a class="dvn${on ? " on" : ""}" href="${href}"${scroll ? ` data-scroll="${scroll}"` : ""}>${I(icon)}<span>${text}</span></a>`;

    R.driver = () => {
        const u = me();
        if (!u) return go("/login?next=/driver");
        if (u.role != "driver") return go("/dashboard");
        setTimeout(startDv, 0);

        return `<div class="dvx" id="dvtop"><h1 class="dvsr">Ambulance driver dashboard</h1>
      <aside class="dvside" id="dvside">
        <div class="dvlogo"><svg width="46" height="42" viewBox="0 0 40 36" aria-hidden="true"><path d="M20 33C8 24 2 17 2 10a8 8 0 0 1 14-5l4 4 4-4a8 8 0 0 1 14 5c0 7-6 14-18 23z" fill="#e53935"/><path d="M6 17h9l3-6 4 11 3-5h9" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <b>MediCarePlus</b><small>Ambulance Management</small></div>
        <nav aria-label="Driver menu">
          ${navItem("home", "Driver Dashboard", "#/driver", "dvtop", 1)}
          ${navItem("list", "My Requests", "#/driver", "dvhistc")}
          ${navItem("nav", "Navigation", "#/driver", "dvmapc")}
          ${navItem("status", "Update Status", "#/driver", "dvprogc")}
          ${navItem("user", "Profile", "#/profile")}
          <button class="dvn dvlogout" data-act="out">${I("out")}<span>Logout</span></button>
        </nav>
        <div class="dvart"><svg width="190" height="46" viewBox="0 0 190 46" aria-hidden="true"><path d="M2 26h52l8-16 11 32 10-24 8 8h97" fill="none" stroke="#2f8cff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <em>Save Lives,<br>Together</em></div>
        <a class="dvback" href="#/">← Back to site</a>
      </aside>
      <div class="dvmain">
        <header class="dvbar">
          <button class="dvburger" data-dv="menu" aria-label="Open menu">${I("menu", 24)}</button>
          <div class="dvhello"><h2>Hello, Driver! <span aria-hidden="true">👋</span></h2><p>Be Ready. Save Lives.</p></div>
          <span class="dvsp"></span>
          <span class="dvonline" id="dvonline"><i></i><b>Online</b></span>
          <div class="dvme"><span class="dvav">${esc(ini(u.name))}</span><div><b>${esc(u.name)}</b><small>Ambulance Driver</small></div></div>
        </header>
        <div class="dvcontent">
          <div class="dvstats" id="dvstats"></div>

          <section class="dvcard" id="dvqueuec" hidden>
            <div class="dvch">${I("alert", 20)}<h3>Incoming Emergency Requests</h3></div>
            <div class="dvcb" id="dvqueue"></div>
          </section>

          <div class="dvrow">
            <section class="dvcard dvmapcard" id="dvmapc">
              <div class="dvch">${I("nav", 20)}<h3>Live Navigation</h3><a class="dvgm" id="dvgm" href="#" target="_blank" rel="noopener" hidden>Google Maps ${I("ext", 14)}</a></div>
              <div class="dvmapbox"><div id="dvmap" aria-label="Map showing the patient and your ambulance"></div>
                <button class="dvfit" data-dv="fit" aria-label="Show the whole route">${I("locate", 22)}</button>
                <div class="dvmapfoot"><span id="dvgps"></span></div></div>
            </section>
            <section class="dvcard" id="dvdetc">
              <div class="dvch">${I("bell", 20)}<h3>Emergency Request Details</h3></div>
              <div class="dvcb" id="dvdet"></div>
            </section>
          </div>

          <div class="dvrow3">
            <section class="dvcard" id="dvprogc"><div class="dvch">${I("status", 20)}<h3>Trip Progress</h3></div><div class="dvcb" id="dvprog"></div></section>
            <section class="dvcard" id="dvinfoc"><div class="dvch">${I("heart", 20)}<h3>Patient Info</h3></div><div class="dvcb" id="dvinfo"></div></section>
            <section class="dvcard" id="dvactc"><div class="dvch">${I("bolt", 20)}<h3>Quick Actions</h3></div><div class="dvcb" id="dvact"></div></section>
          </div>

          <section class="dvcard" id="dvhistc"><div class="dvch">${I("list", 20)}<h3>My Requests</h3></div><div class="dvcb" id="dvhist"></div></section>
        </div>
      </div></div>`;
    };

    /* ---------- start / stop ---------- */
    function startDv() {
        stopDv();
        if (!$("#dvmap")) return;
        DV.firstLoad = true; DV.seen = new Set(); DV.job = null; DV.patientPos = null; DV.route = null; DV.routeKey = "";
        DV.fitKey = ""; DV.idleCentered = false; DV.notesDirty = false;
        initMap();
        watchGps();
        loadDv();
        DV.timer = setInterval(() => {
            if (!location.hash.startsWith("#/driver")) return stopDv();   // left the page
            loadDv();
        }, 5000);
    }

    function stopDv() {
        clearInterval(DV.timer); DV.timer = null;
        if (DV.watch != null && navigator.geolocation) { navigator.geolocation.clearWatch(DV.watch); DV.watch = null; }
        if (DV.map) { try { DV.map.remove(); } catch (e) { } DV.map = null; }
        DV.layers = {};
    }

    /* ---------- map ---------- */
    function initMap() {
        if (!LF) { $("#dvmap").innerHTML = '<p class="dvmute" style="padding:20px">The map library could not load. Check your internet connection and reload.</p>'; return; }
        DV.map = LF.map("dvmap", { zoomControl: false }).setView([6.9271, 79.8612], 12);   // Colombo until the real positions arrive
        LF.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(DV.map);
        LF.control.zoom({ position: "bottomleft" }).addTo(DV.map);
        DV.layers.queue = LF.layerGroup().addTo(DV.map);
    }

    const pin = (cls, glyph, label) => LF.divIcon({
        className: "dvmk", iconSize: [0, 0],
        html: `<div class="dvpin ${cls}">${glyph}</div>${label ? `<span class="dvmklab ${cls}">${esc(label)}</span>` : ""}`,
    });

    function paintMap() {
        if (!DV.map) return;
        const m = DV.map, L2 = DV.layers, j = DV.job;

        // ambulance (the driver's own GPS)
        if (DV.me) {
            if (!L2.amb) L2.amb = LF.marker([DV.me.lat, DV.me.lng], { icon: pin("amb", "🚑"), zIndexOffset: 500 }).addTo(m);
            else L2.amb.setLatLng([DV.me.lat, DV.me.lng]);
        }

        // the patient's location
        if (j && DV.patientPos) {
            const ll = [DV.patientPos.lat, DV.patientPos.lng];
            if (!L2.pat) L2.pat = LF.marker(ll, { icon: pin("pat", "!", "Patient Location"), zIndexOffset: 400 }).addTo(m);
            else L2.pat.setLatLng(ll);
        } else if (L2.pat) { m.removeLayer(L2.pat); L2.pat = null; }

        // route line
        if (L2.route) { m.removeLayer(L2.route); L2.route = null; }
        if (j && DV.route) L2.route = LF.polyline(DV.route.coords, { color: "#2563eb", weight: 6, opacity: .9, dashArray: DV.route.approx ? "2 10" : null }).addTo(m);

        // waiting requests (only while the driver is free)
        L2.queue.clearLayers();
        if (!j) DV.queue.forEach(q => { if (q.latitude != null) LF.marker([q.latitude, q.longitude], { icon: pin("pat", "!", code(q)) }).addTo(L2.queue); });

        // camera: fit once per situation, never fight the driver while they pan around
        const key = j ? j.id + "|" + !!DV.me + "|" + !!DV.patientPos : "idle";
        if (key != DV.fitKey) { DV.fitKey = key; fitMap(); }
        if (!j && DV.me && !DV.idleCentered) { DV.idleCentered = true; m.setView([DV.me.lat, DV.me.lng], 14); }
    }

    function fitMap() {
        if (!DV.map) return;
        const pts = [];
        if (DV.me) pts.push([DV.me.lat, DV.me.lng]);
        if (DV.job && DV.patientPos) pts.push([DV.patientPos.lat, DV.patientPos.lng]);
        if (pts.length > 1) DV.map.fitBounds(LF.latLngBounds(pts).pad(.25), { maxZoom: 16 });
        else if (pts.length) DV.map.setView(pts[0], 15);
    }

    /* ---------- driver GPS ---------- */
    function watchGps() {
        if (!navigator.geolocation) { DV.gpsErr = "GPS is not available in this browser."; return paintGps(); }
        DV.watch = navigator.geolocation.watchPosition(
            p => { DV.me = { lat: p.coords.latitude, lng: p.coords.longitude }; DV.gpsErr = ""; onMove(false); },
            err => { DV.gpsErr = err.code == 1 ? "Location access is blocked. Allow it in your browser so patients can see you." : "Cannot read your GPS position."; paintGps(); },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
        paintGps();
    }

    function onMove(force) {
        paintMap(); paintGps();
        if (DV.job && (force || Date.now() - DV.lastSent > 10000)) sendLoc();
        updateRoute(force);
    }

    async function sendLoc() {
        if (!DV.job || !DV.me) return;
        DV.lastSent = Date.now();
        try { await API.put("/driver/requests/" + DV.job.id + "/location", { latitude: DV.me.lat, longitude: DV.me.lng }); } catch (e) { }
    }

    function updateLocationNow() {
        if (!navigator.geolocation) return toast("Location is not available in this browser.");
        navigator.geolocation.getCurrentPosition(
            p => { DV.me = { lat: p.coords.latitude, lng: p.coords.longitude }; DV.gpsErr = ""; onMove(true); toast("Location updated"); },
            () => toast("Could not get your location. Allow location access in the browser."),
            { enableHighAccuracy: true, timeout: 15000 });
    }

    /* ---------- patient position + route ---------- */
    async function resolvePatient() {
        const j = DV.job;
        if (!j) { DV.patientPos = null; return; }
        let pos = j.latitude != null ? { lat: j.latitude, lng: j.longitude } : await MCGeo.geocode(j.location);
        if (!DV.job || DV.job.id != j.id) return;               // job changed while we waited
        DV.patientPos = pos;
    }

    async function updateRoute(force) {
        const j = DV.job;
        if (!j || !DV.me || !DV.patientPos || stageIdx(j) >= 2) {      // no route needed after arriving
            if (DV.route) { DV.route = null; paintMap(); paintStats(); }
            return;
        }
        const key = [DV.me.lat.toFixed(3), DV.me.lng.toFixed(3), DV.patientPos.lat.toFixed(4), DV.patientPos.lng.toFixed(4)].join();
        if (!force && key == DV.routeKey && Date.now() - DV.routeAt < 60000) return;
        if (DV.routing) return;
        DV.routing = true;
        try {
            const r = await MCGeo.route(DV.me, DV.patientPos);
            if (DV.job && DV.job.id == j.id) { DV.route = r; DV.routeKey = key; DV.routeAt = Date.now(); paintMap(); paintStats(); }
        } finally { DV.routing = false; }
    }

    /* ---------- painting the panels ---------- */
    const statCard = (cls, icon, label, value, sub) =>
        `<div class="dvsc ${cls}"><span class="dvsci">${I(icon, 34)}</span><div><small>${label}</small><b>${value}</b>${sub ? `<em>${sub}</em>` : ""}</div></div>`;

    function paintTop() {
        const o = $("#dvonline");
        if (o) { o.classList.toggle("off", !DV.online); o.querySelector("b").textContent = DV.online ? "Online" : "Offline"; }
    }

    function paintGps() {
        const g = $("#dvgps");
        if (g) { g.textContent = DV.gpsErr || (DV.me ? "● GPS active" : "Waiting for GPS…"); g.className = DV.gpsErr ? "bad" : DV.me ? "ok" : ""; }
    }

    function paintStats() {
        const el = $("#dvstats"); if (!el) return;
        const j = DV.job, idx = j ? stageIdx(j) : -1, r = j && idx < 2 ? DV.route : null, a = r && r.approx ? "~" : "";
        const eta = r ? a + r.min + " min" : "—", dist = r ? a + r.km.toFixed(1) + " km" : "—";
        const noGps = j && idx < 2 && !DV.me ? "Waiting for GPS" : "";
        el.innerHTML =
            `<div class="dvsc req"><span class="dvsci">${I("truck", 44)}</span><div>${j
                ? `<b>Request #${code(j)}</b><em>${STATUS[j.status] || j.status}</em>`
                : `<b>No active request</b><em>${DV.queue.length ? DV.queue.length + " waiting for an ambulance" : "Waiting for requests"}</em>`}</div></div>` +
            statCard("eta", "clock", "ETA", eta, noGps) +
            statCard("dist", "route", "Distance", dist, r && r.approx ? "estimate" : "") +
            statCard("state", "check", "Status", j ? (STAGES[idx] || STAGES[0])[1] : "Available", "");
    }

    function paintDetails() {
        const el = $("#dvdet"), gm = $("#dvgm"); if (!el) return;
        const j = DV.job;
        if (!j) {
            el.innerHTML = `<p class="dvmute">No active request. Accept one from the list above and its details will appear here.</p>`;
            gm.hidden = true; return;
        }
        const [sl, sc] = SEV[j.severity] || [j.severity, "low"];
        const who = [j.patientAge != null ? "Age " + j.patientAge : "", j.patientGender || ""].filter(Boolean).join(" · ");
        const href = MCGeo.googleDirections(DV.me, DV.patientPos, j.location);
        gm.href = href; gm.hidden = false;
        el.innerHTML = `<div class="dvpri ${sc}"><span>!</span>${sl}</div>
      <div class="dvdl">
        <div class="dvdr">${I("user", 26)}<div><small>Patient</small><b>${esc(j.patient)}</b>${who ? `<em>(${esc(who)})</em>` : ""}</div></div>
        <div class="dvdr">${I("pin", 26)}<div><small>Location</small><b>${esc(j.location)}</b>${j.latitude != null ? `<em>GPS position shared by the patient</em>` : ""}<a class="dvlink" href="${href}" target="_blank" rel="noopener">Open in Google Maps ${I("ext", 13)}</a></div></div>
        <div class="dvdr">${I("phone", 26)}<div><small>Contact</small><b>${esc(j.phone)}</b></div></div>
        <div class="dvdr">${I("clock", 26)}<div><small>Reported</small><b>${clock(j.createdAt)} · ${ago(j.createdAt)}</b><em>Target response: ${j.targetMinutes} min</em></div></div>
      </div>
      <a class="dvcall" href="${tel(j.phone)}">${I("phone", 22)} Call Patient</a>`;
    }

    function paintProgress() {
        const el = $("#dvprog"); if (!el) return;
        const j = DV.job, cur = j ? stageIdx(j) : -1;
        el.innerHTML = `<div class="dvsteps">${STAGES.map((s, i) =>
            `<div class="dvstep${i <= cur ? " done" : ""}${i == cur ? " cur" : ""}"><span class="dvdot">${i <= cur ? I("check", 16) : ""}</span><b>${s[1]}</b><small>${j && j[s[2]] ? "(" + clock(j[s[2]]) + ")" : "&nbsp;"}</small></div>`).join("")}</div>`;
    }

    function paintInfo() {
        const el = $("#dvinfo"); if (!el) return;
        const j = DV.job;
        if (!j) { el.innerHTML = `<p class="dvmute">Patient details show here once you accept a request.</p>`; return; }
        const ta = $("#dvnotes");
        if (ta && ta.dataset.job == j.id && (document.activeElement === ta || DV.notesDirty)) return;   // don't wipe what the driver is typing
        const conds = (j.medicalConditions || "").split(/[,\n]/).map(s => s.trim()).filter(Boolean);
        el.innerHTML = `<div class="dvir">${I("heart", 24)}<div><small>Medical conditions</small>${conds.length ? `<div class="dvchips">${conds.map(c => `<span>${esc(c)}</span>`).join("")}</div>` : `<p>Not provided</p>`}</div></div>
      <div class="dvir">${I("note", 24)}<div><small>Patient report</small><p>${esc(j.description)}</p></div></div>
      <div class="dvir col"><small>Driver notes</small><textarea id="dvnotes" rows="3" maxlength="500" data-job="${j.id}" placeholder="Add notes for the hospital team…">${esc(j.notes || "")}</textarea>
        <button class="dvsave" data-dv="savenotes">Save notes</button></div>`;
    }

    function paintActions() {
        const el = $("#dvact"); if (!el) return;
        const j = DV.job, next = j && NEXT[j.stage];
        const off = j ? "" : " disabled";
        el.innerHTML = `<div class="dvqa">
      <button class="dvq b" data-dv="loc"${off}>${I("send", 30)}<span>Update<br>Location</span></button>
      <button class="dvq g" data-dv="next"${next ? "" : " disabled"}>${I("check", 30)}<span>${next ? next[1].replace(" ", "<br>") : "Mark<br>Arrived"}</span></button>
      <button class="dvq p" data-dv="notes"${off}>${I("note", 30)}<span>Add<br>Notes</span></button></div>`;
    }

    function paintQueue() {
        const box = $("#dvqueuec"), el = $("#dvqueue"); if (!box) return;
        box.hidden = !!DV.job;
        if (DV.job) return;
        el.innerHTML = DV.queue.length ? DV.queue.map(q => {
            const [sl, sc] = SEV[q.severity] || [q.severity, "low"];
            return `<div class="dvreq"><span class="dvdotp ${sc}"></span><div class="dvreqb">
          <div class="dvreqh"><b>${code(q)}</b><span class="dvpill ${sc}">${sl.replace(" Priority", "")}</span><span class="dvago">${ago(q.createdAt)}</span></div>
          <div class="dvloc">${esc(q.location)}</div>
          <div class="dvdesc">${esc(trunc(q.description, 90))} · ${esc(q.patient)}</div></div>
          <button class="dvacc" data-dv="accept" data-id="${q.id}">Accept</button></div>`;
        }).join("") : `<p class="dvmute">No open emergency requests right now. You will be alerted when a patient reports one.</p>`;
    }

    function paintHistory() {
        const el = $("#dvhist"); if (!el) return;
        const rows = DV.history.slice(0, 8);
        el.innerHTML = rows.length
            ? `<div class="dvtw"><table class="dvt"><thead><tr><th>Request</th><th>Patient</th><th>Location</th><th>Reported</th><th>Status</th></tr></thead><tbody>${rows.map(r =>
                `<tr><td>${code(r)}</td><td>${esc(r.patient)}</td><td>${esc(trunc(r.location, 34))}</td><td>${clock(r.createdAt)}</td><td><span class="dvst ${r.status == "RESOLVED" ? "done" : "act"}">${r.status == "RESOLVED" ? "Completed" : (STAGES[stageIdx(r)] || ["", "In progress"])[1]}</span></td></tr>`).join("")}</tbody></table></div>`
            : `<p class="dvmute">Requests you take will be listed here.</p>`;
    }

    function paintAll() {
        paintTop(); paintGps(); paintStats(); paintQueue(); paintDetails(); paintProgress(); paintInfo(); paintActions(); paintHistory(); paintMap();
    }

    /* ---------- loading ---------- */
    async function loadDv() {
        const u = me();
        if (!u) return go("/login?next=/driver");               // session ended
        if (u.role != "driver" || !$("#dvstats")) return;
        try {
            const [job, queue, hist] = await Promise.all([API.get("/driver/active"), API.get("/driver/requests"), API.get("/driver/mine")]);
            DV.online = true;
            const prev = DV.job;
            DV.job = job || null; DV.queue = queue || []; DV.history = hist || [];

            if (DV.firstLoad) { DV.queue.forEach(q => DV.seen.add(q.id)); DV.firstLoad = false; }
            else {
                const fresh = DV.queue.filter(q => !DV.seen.has(q.id));
                DV.queue.forEach(q => DV.seen.add(q.id));
                if (fresh.length && !DV.job) { toast("🚨 New emergency: " + code(fresh[0]) + " · " + trunc(fresh[0].location, 40)); beep(); }
            }
            if (prev && !DV.job) toast("Request completed. Well done!");
            if ((prev && prev.id) !== (DV.job && DV.job.id)) { DV.notesDirty = false; DV.patientPos = null; DV.route = null; DV.routeKey = ""; }

            paintAll();
            resolvePatient().then(() => { paintDetails(); paintMap(); updateRoute(false); });
            if (DV.job && DV.me && Date.now() - DV.lastSent > 10000) sendLoc();
        } catch (e) {
            DV.online = false; paintTop();
            if (!me()) go("/login?next=/driver");
        }
    }

    function beep() {
        try {
            const c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(), g = c.createGain();
            o.connect(g); g.connect(c.destination); o.frequency.value = 880; g.gain.value = .08; o.start();
            setTimeout(() => { o.stop(); c.close(); }, 350);
        } catch (e) { /* browsers block sound until the page has been clicked */ }
    }

    /* ---------- events ---------- */
    document.addEventListener("input", e => { if (e.target.id == "dvnotes") DV.notesDirty = true; });

    document.addEventListener("click", async e => {
        if (e.target.closest(".dvn")) { const s = $("#dvside"); if (s) s.classList.remove("on"); }
        const b = e.target.closest("[data-dv]");
        if (!b || b.disabled) return;
        const k = b.dataset.dv;
        try {
            if (k == "menu") $("#dvside").classList.toggle("on");
            else if (k == "fit") fitMap();
            else if (k == "loc") updateLocationNow();
            else if (k == "notes") { const t = $("#dvnotes"); if (t) { t.scrollIntoView({ behavior: "smooth", block: "center" }); t.focus(); } }
            else if (k == "savenotes") {
                if (!DV.job) return;
                await API.put("/driver/requests/" + DV.job.id + "/notes", { notes: $("#dvnotes").value });
                DV.notesDirty = false; toast("Notes saved"); loadDv();
            }
            else if (k == "accept") {
                b.disabled = true;
                await API.post("/driver/requests/" + b.dataset.id + "/accept");
                toast("Request accepted. Head to the patient.");
                await loadDv(); sendLoc();
            }
            else if (k == "next") {
                const j = DV.job, n = j && NEXT[j.stage];
                if (!n) return;
                if (n[0] == "AT_HOSPITAL" && !confirm("Confirm the patient has reached the hospital? This completes the request.")) return;
                b.disabled = true;
                await API.put("/driver/requests/" + j.id + "/stage", { stage: n[0] });
                toast(n[1] + " ✓"); await loadDv();
            }
        } catch (err) { toast(err.message); b.disabled = false; loadDv(); }
    });
})();
