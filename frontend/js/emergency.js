// Emergency Management dashboard.
// Real data  : the emergency requests from  GET /api/emergencies  (staff)  or  /api/emergencies/mine  (patient).
// Sample data: ambulances, hospital beds and the map. The backend has no tables for these yet,
//              so they are fixed demo values defined below. Replace them when you add the endpoints.
(() => {
    const EM = { rows: [], q: "", all: false };

    /* ---------- sample data (no backend support yet) ---------- */
    const AMBULANCES = [
        { n: 3, state: "On Route",  x: 330, y: 100, c: "#2563eb" },
        { n: 1, state: "Available", x: 475, y: 150, c: "#16a34a" },
        { n: 5, state: "On Route",  x: 372, y: 236, c: "#2563eb" },
    ];
    const AMBULANCES_ON_DUTY = 6;
    const HOSPITALS = [               // [name, free beds, total beds]
        ["National Hospital", 6, 20],
        ["Colombo South Teaching", 4, 15],
        ["Kalubowila Hospital", 3, 12],
        ["Dehiwala Hospital", 5, 18],
    ];

    /* ---------- lookups ---------- */
    const SEV = { CRITICAL: ["Critical", "crit", "#ef4444"], HIGH: ["High", "high", "#f59e0b"], LOW: ["Low", "low", "#3b82f6"] };
    const STATUS = { OPEN: ["Waiting", "wait"], IN_PROGRESS: ["Responding", "resp"], RESOLVED: ["Completed", "done"] };
    const ROLE = { admin: "Emergency Coordinator", doctor: "Doctor", patient: "Patient" };

    /* ---------- tiny helpers ---------- */
    const IC = {
        home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
        alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.4"/>',
        truck: '<path d="M2 6h12v10H2zM14 9h4l4 4v3h-8z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
        user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
        users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5"/><circle cx="17.5" cy="9" r="2.5"/><path d="M18 14.5c2.5 0 4 1.5 4 4"/>',
        hospital: '<path d="M4 21V7l8-4 8 4v14zM12 9v6M9 12h6"/>',
        chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
        gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
        bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
        search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/>',
        menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
        pin: '<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
        phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
        bed: '<path d="M3 18V6M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/>',
        chat: '<path d="M4 5h16v11H9l-5 4z"/>',
        locate: '<circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
        send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
        report: '<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5"/>',
        siren: '<path d="M7 18v-6a5 5 0 0 1 10 0v6M4 18h16M12 3v2M4.5 7l1.5 1M19.5 7L18 8"/>',
    };
    const I = (n, s = 20) => `<svg class="ei" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;

    const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
    const erId = r => "#ER-" + (1000 + r.id);
    const ago = s => {
        const m = Math.max(0, Math.round((Date.now() - new Date(s)) / 60000));
        return m < 1 ? "just now" : m < 60 ? m + " min ago" : m < 1440 ? Math.floor(m / 60) + " hr ago" : Math.floor(m / 1440) + " d ago";
    };
    const clock = s => new Date(s).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" });
    const shortName = n => { const p = n.trim().split(/\s+/); return p.length > 1 ? p[0][0] + ". " + p[p.length - 1] : n; };
    const matches = r => {
        const q = EM.q.trim().toLowerCase();
        return !q || [erId(r), r.patient, r.location, r.description, r.phone, r.severity].join(" ").toLowerCase().includes(q);
    };

    /* ---------- static map (sample positions) ---------- */
    function mapSvg() {
        const label = (x, y, t1, t2, bg, fg, border) =>
            `<g transform="translate(${x},${y})"><rect width="98" height="34" rx="8" fill="${bg}" stroke="${border}" stroke-width="1"/>` +
            `<text x="9" y="14" font-size="11" font-weight="700" fill="${fg}">${t1}</text><text x="9" y="27" font-size="10" fill="${fg}" opacity=".85">${t2}</text></g>`;
        const pin = (x, y, c, inner) =>
            `<circle cx="${x}" cy="${y}" r="15" fill="${c}" opacity=".18"/><circle cx="${x}" cy="${y}" r="11" fill="${c}" stroke="#fff" stroke-width="2.5"/>${inner}`;
        const car = (x, y) => `<path d="M${x - 5} ${y - 3}h7v6h-7zM${x + 2} ${y - 1}h3l2 2v3h-5z" fill="#fff"/>`;
        const amb = AMBULANCES.map(a =>
            pin(a.x, a.y, a.c, car(a.x, a.y)) +
            label(a.x + 16, a.y - 17, "Ambulance " + a.n, a.state, "#fff", "#12233f", "#d7e1f0")).join("");
        return `<svg class="emmap" viewBox="0 0 600 290" role="img" aria-label="Sample map of ambulance positions">
      <rect width="600" height="290" fill="#edf2ee"/>
      <path d="M0 0H72C100 40 62 72 92 112S74 192 112 232 92 270 124 290H0z" fill="#bfe0f5"/>
      <rect x="425" y="26" width="92" height="52" rx="12" fill="#d5e9d1"/><rect x="160" y="215" width="70" height="46" rx="12" fill="#d5e9d1"/>
      <g stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"><path d="M84 122C200 98 300 152 592 88"/><path d="M132 262C222 202 332 222 424 272"/><path d="M204 18C236 100 262 182 250 284"/><path d="M362 8C382 82 440 142 592 202"/></g>
      <g stroke="#dde5e0" stroke-width="2" fill="none"><path d="M100 60H590M110 200H590M300 8V284M440 8V284"/></g>
      <path d="M86 100L255 175" stroke="#ef4444" stroke-width="2" fill="none"/>
      <path d="M330 100L255 175M372 236L255 175" stroke="#3b82f6" stroke-width="1.6" fill="none"/>
      ${amb}
      ${pin(86, 100, "#ef4444", '<path d="M86 94l6 11H80z" fill="#fff"/>')}
      ${label(104, 66, "Emergency", "ETA 6 min", "#ef4444", "#fff", "#ef4444")}
      ${pin(255, 175, "#ef4444", '<path d="M252 169h6v4h4v6h-4v4h-6v-4h-4v-6h4z" fill="#fff"/>')}
      <text x="255" y="204" text-anchor="middle" font-size="11" font-weight="700" fill="#33425e">National Hospital</text>
    </svg>`;
    }

    /* ---------- page shell ---------- */
    const navItem = (icon, text, target, o = {}) =>
        `<a class="emn${o.on ? " on" : ""}" href="${o.href || "#/emergency"}"${target ? ` data-scroll="${target}"` : ""}>${I(icon)}<span>${text}</span>${o.badge ? `<b class="emb" id="embadge" hidden>0</b>` : ""}</a>`;

    R.emergency = () => {
        const u = me();
        if (!u) return go("/login?next=/emergency");
        setTimeout(loadEm, 0);
        const staff = u.role != "patient";

        const sidebar = `<aside class="emside" id="emside">
      <div class="emlogo"><svg width="40" height="36" viewBox="0 0 40 36" aria-hidden="true"><path d="M20 33C8 24 2 17 2 10a8 8 0 0 1 14-5l4 4 4-4a8 8 0 0 1 14 5c0 7-6 14-18 23z" fill="#2563eb"/><path d="M6 17h9l3-6 4 11 3-5h9" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div><b>MediCare</b><small>Emergency Management</small></div></div>
      <nav aria-label="Emergency menu">
        ${navItem("home", "Dashboard", "emtop", { on: 1 })}
        ${navItem("alert", "Emergency Requests", "emreqc", { badge: 1 })}
        ${navItem("truck", "Ambulance Tracking", "emmapc")}
        ${navItem("user", "Patients", "emincc")}
        ${navItem("hospital", "Hospitals &amp; Beds", "emhospc")}
        ${navItem("chart", "Reports", "emsevc")}
        ${navItem("gear", "Settings", "", { href: "#/profile" })}
      </nav>
      <div class="emecg"><svg width="130" height="40" viewBox="0 0 130 40" aria-hidden="true"><path d="M2 22h30l6-14 9 28 8-20 6 6h67" fill="none" stroke="#2f8cff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <b>Every Second Matters</b><small>Faster Response · Better Care</small></div>
      <a class="emback" href="#/dashboard">← Back to site</a>
    </aside>`;

        const topbar = `<header class="emtop">
      <button class="emburger" data-em="menu" aria-label="Open menu">${I("menu", 24)}</button>
      <label class="emsearch">${I("search", 18)}<input id="emq" type="search" placeholder="Search by patient name, ID, location or incident code..." aria-label="Search emergencies" autocomplete="off"></label>
      <span class="emsp"></span>
      <a class="embell" href="#/emergency" data-scroll="emreqc" aria-label="Active emergencies">${I("bell", 22)}<b id="embell" hidden>0</b></a>
      <div class="emme"><span class="emav" id="emav">${esc(ini(u.name))}</span><div><b>${esc(u.name)}</b><small>${ROLE[u.role] || ""}</small></div></div>
    </header>`;

        const report = `<section class="emcard emrep" id="emrepc">
      <div class="emrh"><span class="emrhi">${I("alert", 22)}</span><div><h3>Report an Emergency</h3><small>Quickly provide details to get help.</small></div></div>
      <div class="emrb">
        <label class="emlab" for="ep">Contact phone <i>*</i></label>
        <div class="emf">${I("phone", 18)}<input id="ep" type="tel" placeholder="Enter contact number" autocomplete="tel"></div>
        <label class="emlab" for="el">Location <i>*</i></label>
        <div class="emf">${I("pin", 18)}<input id="el" placeholder="Enter location"><button type="button" class="emgeo" data-em="geo" aria-label="Use my current location">${I("locate", 20)}</button></div>
        <label class="emlab" for="ed">What happened? <i>*</i></label>
        <div class="emf">${I("chat", 18)}<textarea id="ed" rows="3" placeholder="Describe the situation..."></textarea></div>
        <label class="emlab" for="es">Severity <i>*</i></label>
        <div class="emf"><select id="es"><option value="LOW">Low</option><option value="HIGH" selected>High</option><option value="CRITICAL">Critical</option></select></div>
        <p class="emerr" id="e6" role="alert"></p>
        <button class="emsend" data-act="sendem">${I("send", 18)} Send Emergency Request</button>
      </div></section>`;

        const targets = `<section class="emcard"><div class="emch"><h3>Response targets</h3></div>
      ${["CRITICAL", "HIGH", "LOW"].map((k, i) => `<div class="emtg"><span class="empill ${SEV[k][1]}">${SEV[k][0]}</span><b>${[5, 30, 120][i]} min</b></div>`).join("")}
      <p class="emmute" style="margin-top:8px;font-size:12px">Mark a request <b>In progress</b> when a unit is on its way and <b>Resolved</b> when it is handled.</p></section>`;

        const quick = `<section class="emcard emqa"><div class="emch"><span style="color:#2563eb">${I("siren", 18)}</span><h3>Quick Actions</h3></div>
      <div class="emqg">
        <a class="emq" href="#/emergency" data-scroll="emmapc">${I("truck", 24)}View Ambulances</a>
        <a class="emq" href="#/emergency" data-scroll="emhospc">${I("pin", 24)}Find Nearest Hospital</a>
        <a class="emq" href="#/emergency" data-scroll="emincc">${I("users", 24)}View Patients</a>
        <button class="emq" data-em="print">${I("report", 24)}Generate Report</button>
      </div>
      <a class="emcall" href="tel:1990">${I("phone", 26)}<div><small>Life-threatening emergency? Call</small><b>1990</b></div></a></section>`;

        return `<div class="emx" id="emtop"><h1 class="emsr">Emergency ${staff ? "management" : "help"}</h1>
      ${sidebar}
      <div class="emmain">${topbar}
        <div class="emcontent">
          <div class="emstats" id="emstats"></div>
          <div class="emgrid">
            <div class="emleft">
              <div class="emrow2">
                <section class="emcard" id="emmapc"><div class="emch">${I("pin", 18)}<h3>Ambulance Tracking<span class="emsub">Sample ambulance positions (demo data)</span></h3>
                  <span class="emleg"><span><i style="background:#ef4444"></i>Emergency</span><span><i style="background:#2563eb"></i>Ambulance</span><span><i style="background:#16a34a"></i>Available</span></span></div>
                  <div class="emmapwrap">${mapSvg()}</div>
                  <div class="emunits">${AMBULANCES.map(a => `<div class="emunit">${I("truck", 18)}<b>Ambulance ${a.n}</b><span class="emst ${a.state == "Available" ? "done" : "resp"}">${a.state}</span></div>`).join("")}</div></section>
                <section class="emcard" id="emreqc"><div class="emch"><span style="color:#ef4444">${I("alert", 18)}</span><h3>${staff ? "Active Emergency Requests" : "My Emergency Requests"}</h3><button class="emlink" id="emall" data-em="all">View All →</button></div>
                  <div class="emreqs" id="emreq"><p class="emmute">Loading…</p></div></section>
              </div>
              <div class="emrow3">
                <section class="emcard" id="emincc"><div class="emch"><span style="color:#2563eb">${I("report", 18)}</span><h3>Recent Emergency Incidents</h3></div><div id="eminc"></div></section>
                <section class="emcard" id="emsevc"><div class="emch"><h3>Emergency Severity</h3></div><div id="emsev"></div></section>
                <section class="emcard" id="emhospc"><div class="emch"><span style="color:#2563eb">${I("hospital", 18)}</span><h3>Hospitals &amp; Bed Availability</h3></div>
                  ${HOSPITALS.map(h => `<div class="emhosp"><span>${h[0]}</span><span class="embed ${h[1] / h[2] <= .25 ? "a" : "g"}">${h[1]} / ${h[2]}</span></div>`).join("")}</section>
              </div>
            </div>
            <div class="emright">${staff ? targets : report}${quick}</div>
          </div>
        </div>
      </div></div>`;
    };

    /* ---------- painting the data-driven panels ---------- */
    const statCard = (c, ic, label, n, sub) =>
        `<div class="emsc ${c}"><span class="emsci">${I(ic, 26)}</span><div><div class="emscl">${label}</div><div class="emscn">${n}</div><div class="emscs">${sub}</div></div></div>`;

    function reqItem(r, staff, admin) {
        const [sl, sc2] = SEV[r.severity] || [r.severity, "low"];
        const st = STATUS[r.status] || [r.status];
        const who = staff ? `${esc(r.patient)} · ${esc(r.phone)}` : esc(st[0]);
        const act = staff
            ? `<div class="emact">${r.status == "OPEN" ? `<button class="embtn" data-act="emst" data-id="${r.id}" data-v="IN_PROGRESS">In progress</button>` : ""}${r.status != "RESOLVED" ? `<button class="embtn go" data-act="emst" data-id="${r.id}" data-v="RESOLVED">Resolved</button>` : ""}<button class="embtn" data-em="showloc" data-loc="${esc(r.location)}">Show location</button>${admin ? `<button class="embtn bad" data-act="emdel" data-id="${r.id}">Delete</>` : ""}</div>`
            : "";
        return `<div class="emreq"><span class="emdot ${sc2}"></span><div class="emreqb">
      <div class="emreqh"><b>${erId(r)}</b><span class="empill ${sc2}">${sl}</span><span class="emago">${ago(r.createdAt)}</span></div>
      <div class="emloc">${esc(r.location)}</div>
      <div class="emdesc">${esc(trunc(r.description, 44))}${staff ? " • " + who : ""}</div>
      <div class="emdesc">Respond within ${r.targetMinutes} min${r.status != "OPEN" ? " · " + esc(st[0]) : ""}</div>${act}</div></div>`;
    }

    function paintEm() {
        const u = me();
        if (!u || !$("#emreq")) return;
        const staff = u.role != "patient", admin = u.role == "admin", rows = EM.rows;
        const active = rows.filter(r => r.status != "RESOLVED");

        // stat cards
        const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
        const t0 = +midnight, y0 = t0 - 864e5;
        const patientsBetween = (a, b) => new Set(rows.filter(r => { const t = +new Date(r.createdAt); return t >= a && t < b; }).map(r => r.patient)).size;
        const today = patientsBetween(t0, Infinity), yest = patientsBetween(y0, t0);
        const newLastHour = active.filter(r => Date.now() - new Date(r.createdAt) < 36e5).length;
        const beds = HOSPITALS.reduce((s, h) => s + h[1], 0);
        $("#emstats").innerHTML =
            statCard("red", "alert", "Active Emergencies", active.length, `<span class="up">${newLastHour ? "▲ " + newLastHour + " new (last 1 hour)" : "No new in the last hour"}</span>`) +
            statCard("blue", "truck", "Ambulances on Duty", AMBULANCES_ON_DUTY, `<span class="ok">● All operational</span>`) +
            statCard("green", "users", "Total Patients Today", today, yest ? `<span class="ok">${today >= yest ? "▲" : "▼"} ${Math.abs(Math.round(100 * (today - yest) / yest))}% vs. yesterday</span>` : "No data for yesterday") +
            statCard("purple", "bed", "Available Beds", beds, `<span class="pu">● Across ${HOSPITALS.length} hospitals</span>`);

        // sidebar + bell counters
        for (const [id, el] of [["#embadge", $("#embadge")], ["#embell", $("#embell")]]) { if (el) { el.textContent = active.length; el.hidden = !active.length; } }

        // active requests
        const list = (EM.all ? rows : active).filter(matches), shown = EM.all ? list : list.slice(0, 5);
        $("#emreq").innerHTML = shown.map(r => reqItem(r, staff, admin)).join("") ||
            `<p class="emmute">${EM.q ? "No requests match your search." : staff ? "No active emergency requests." : "You have not sent any emergency requests."}</p>`;
        $("#emall").textContent = EM.all ? "Show active" : "View All →";

        // recent incidents
        const inc = [...rows].filter(matches).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
        $("#eminc").innerHTML = inc.length
            ? `<table class="emtbl"><thead><tr><th>Time</th><th>Patient</th><th>Location</th><th>Status</th></tr></thead><tbody>${inc.map(r => {
                const st = STATUS[r.status] || [r.status, "wait"];
                return `<tr><td>${clock(r.createdAt)}</td><td>${esc(shortName(r.patient))}</td><td>${esc(trunc(r.location, 18))}</td><td><span class="emst ${st[1]}">${st[0]}</span></td></tr>`;
            }).join("")}</tbody></table>`
            : `<p class="emmute">No incidents yet.</p>`;

        // severity donut
        const keys = ["CRITICAL", "HIGH", "LOW"], counts = keys.map(k => rows.filter(r => r.severity == k).length), total = rows.length;
        if (!total) { $("#emsev").innerHTML = `<p class="emmute">No data yet.</p>`; return; }
        const rad = 42, C = 2 * Math.PI * rad;
        let off = 0;
        const arcs = keys.map((k, i) => {
            if (!counts[i]) return "";
            const len = C * counts[i] / total, s = `<circle r="${rad}" cx="60" cy="60" fill="none" stroke="${SEV[k][2]}" stroke-width="16" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 60 60)"><title>${SEV[k][0]}: ${counts[i]}</title></circle>`;
            off += len; return s;
        }).join("");
        $("#emsev").innerHTML = `<div class="emdon"><svg width="124" height="124" viewBox="0 0 120 120" role="img" aria-label="Requests by severity">${arcs}<text x="60" y="58" text-anchor="middle" font-size="22" font-weight="800" fill="#0f1f3d">${total}</text><text x="60" y="74" text-anchor="middle" font-size="11" fill="#6b7a94">Total</text></svg>
      <div class="emdl">${keys.map((k, i) => `<div><i style="background:${SEV[k][2]}"></i><span>${SEV[k][0]}</span><em>${Math.round(100 * counts[i] / total)}% (${counts[i]})</em></div>`).join("")}</div></div>`;
    }

    async function loadEm() {
        const u = me();
        if (!u || !$("#emreq")) return;
        try {
            EM.rows = await API.get(u.role == "patient" ? "/emergencies/mine" : "/emergencies");
            paintEm();
        } catch (e) { toast(e.message); }
    }
    window.loadEm = loadEm;           // app.js calls loadEm() after send / status change / delete


    /* ---------- show patient location on Google Maps ---------- */
    function showLocation(loc) {
        const m = /(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/.exec(loc || "");
        const ok = m && Math.abs(+m[1]) <= 90 && Math.abs(+m[2]) <= 180;
        const query = ok ? m[1] + "," + m[2] : encodeURIComponent(loc || "");
        if (!query) return toast("This request has no location.");
        window.open("https://www.google.com/maps/search/?api=1&query=" + query, "_blank", "noopener");
    }

    /* ---------- events ---------- */

    /* ---------- events ---------- */
    document.addEventListener("input", e => { if (e.target.id == "emq") { EM.q = e.target.value; paintEm(); } });

    document.addEventListener("click", e => {
        if (e.target.closest(".emn")) { const s = $("#emside"); if (s) s.classList.remove("on"); }
        const b = e.target.closest("[data-em]");
        if (!b) return;
        const k = b.dataset.em;
        if (k == "all") { EM.all = !EM.all; paintEm(); }
        else if (k == "menu") { $("#emside").classList.toggle("on"); }
        else if (k == "print") { window.print(); }
        else if (k == "showloc") { showLocation(b.dataset.loc); }
        else if (k == "geo") {
            if (!navigator.geolocation) return toast("Location is not available in this browser.");
            navigator.geolocation.getCurrentPosition(
                p => { $("#el").value = p.coords.latitude.toFixed(5) + ", " + p.coords.longitude.toFixed(5); },
                () => toast("Could not get your location. Please type it in."));
        }
    });

    // keep the list fresh while the page is open
    setInterval(() => { if (location.hash.startsWith("#/emergency") && me()) loadEm(); }, 30000);
})();

