// Contact page.  Replaces R.contact from app.js (this file loads after app.js).
// The backend only stores name, email and message, so the phone number and subject
// are written at the top of the message text. No backend change is needed.
(() => {
    /* ---- clinic details: change these to your real ones ---- */
    const WA_NUMBER = "94707769993"; // WhatsApp number: country code + number, digits only (no + or spaces). Replace with your real WhatsApp number.
    const WA_HREF = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent("Hello MediCare Plus, I need some help.");
    const PHONE = "+94 707769993", PHONE_HREF = "tel:+94707769993", HOURS = "Mon – Sat, 8:00 AM – 6:00 PM";
    const EMAIL_ADDR = "help@medicareplus.example";
    const ADDRESS = ["23 , Deshamanya H K Dharmadasa Mawatha, Colombo 00200"];
    const SUBJECTS = ["General enquiry", "Appointment help", "Billing question", "Feedback", "Technical problem", "Other"];

    const P = {
        phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
        mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
        pin: '<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
        headset: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/><path d="M19 20c0 1.5-2 2-5 2"/>',
        arrow: '<path d="M9 6l6 6-6 6"/>',
        arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
        clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
        shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
        users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5"/><circle cx="17.5" cy="9" r="2.5"/><path d="M18 14.5c2.5 0 4 1.5 4 4"/>',
        user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
        tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.3"/>',
        chat: '<path d="M4 5h16v11H9l-5 4z"/>',
        send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
        heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
        pulse: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/><path d="M6 11h3l1.5-3 3 6 1.5-3h3"/>',
        leaf: '<path d="M5 19C5 9 11 4 20 4c0 9-5 15-15 15zM5 19c3-5 6-8 10-10"/>',
        check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
    };
    const I = (n, s = 22) => `<svg class="ei" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;

    const building = `<svg class="ctbuild" viewBox="0 0 360 270" role="img" aria-label="Illustration of a hospital">
    <defs>
      <linearGradient id="ctw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9f1fd"/><stop offset="1" stop-color="#c9dbf5"/></linearGradient>
      <linearGradient id="ctg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe3fb"/><stop offset="1" stop-color="#9dc0ee"/></linearGradient>
    </defs>
    <path d="M30 210c-20-10-22-60 18-78 6-40 50-62 88-42 22-34 78-30 98 6 44-4 74 34 60 70 14 18 6 40-16 44z" fill="#e4eefc"/>
    <ellipse cx="180" cy="232" rx="150" ry="14" fill="#d3e2f6"/>
    <rect x="60" y="130" width="70" height="98" rx="4" fill="url(#ctw)" stroke="#b9cfee"/>
    <rect x="230" y="130" width="70" height="98" rx="4" fill="url(#ctw)" stroke="#b9cfee"/>
    <rect x="110" y="86" width="140" height="142" rx="5" fill="url(#ctw)" stroke="#b9cfee"/>
    <rect x="104" y="80" width="152" height="10" rx="3" fill="#a9c4ea"/>
    ${[0, 1, 2, 3].map(r => [0, 1, 2, 3, 4].map(c => `<rect x="${121 + c * 24}" y="${100 + r * 24}" width="16" height="14" rx="2" fill="url(#ctg)"/>`).join("")).join("")}
    ${[0, 1, 2].map(r => [0, 1].map(c => `<rect x="${72 + c * 28}" y="${142 + r * 26}" width="16" height="14" rx="2" fill="url(#ctg)"/><rect x="${242 + c * 28}" y="${142 + r * 26}" width="16" height="14" rx="2" fill="url(#ctg)"/>`).join("")).join("")}
    <rect x="150" y="190" width="60" height="38" rx="3" fill="#8fb4e8"/><path d="M180 190v38" stroke="#e9f1fd" stroke-width="2"/>
    <rect x="140" y="182" width="80" height="8" rx="2" fill="#6f9bdc"/>
    <g transform="translate(204 92)"><circle r="14" fill="#2f7bff" stroke="#fff" stroke-width="3"/><path d="M-2.5-7h5v4.5h4.5v5h-4.5v4.5h-5v-4.5h-4.5v-5h4.5z" fill="#fff" transform="scale(.9)"/></g>
    <g><rect x="48" y="206" width="6" height="24" fill="#8a6a4b"/><circle cx="51" cy="196" r="20" fill="#4caf6a"/><circle cx="40" cy="206" r="13" fill="#5cc27a"/><circle cx="62" cy="206" r="13" fill="#3f9e5c"/></g>
    <g><rect x="306" y="208" width="6" height="22" fill="#8a6a4b"/><circle cx="309" cy="198" r="18" fill="#4caf6a"/><circle cx="298" cy="207" r="12" fill="#5cc27a"/><circle cx="320" cy="207" r="12" fill="#3f9e5c"/></g>
    <g><rect x="22" y="214" width="5" height="16" fill="#8a6a4b"/><circle cx="24" cy="206" r="13" fill="#5cc27a"/></g>
    <g transform="translate(180 30)"><path d="M0 40C-30 14-26-22 0-22 26-22 30 14 0 40z" fill="#1d6bff" transform="translate(0 -4)"/><path d="M-13 4h7l4-8 6 14 4-8h9" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 -8) scale(.95)"/></g>
  </svg>`;

    const row = (cls, icon, label, value, sub, href, extra = "") =>
        `<a class="ctrow" href="${href}"${extra}><span class="cti ${cls}">${I(icon, 26)}</span><span><small>${label}</small><b>${value}</b>${sub ? `<small>${sub}</small>` : ""}</span><span class="ctgo">${I("arrow", 14)}</span></a>`;

    const field = (id, label, icon, control, req = true, full = false) =>
        `<div class="ctfield${full ? " full" : ""}"><label class="ctlab" for="${id}">${I(icon, 15)}${label}${req ? " <i>*</i>" : ""}</label><div class="ctctl" id="w_${id}">${control}</div></div>`;

    R.contact = () => {
        const u = me();
        const nm = u ? esc(u.name) : "", em = u ? esc(u.email) : "";
        const mapQ = encodeURIComponent(ADDRESS.join(", "));
        return `<main class="ct">
      <section class="cthero"><div class="ctin">
        <div class="ctcrumb"><a href="#/">Home</a><span>›</span><b>Contact</b></div>
        <h1>Contact <span>Us</span></h1>
        <p>We're here to help! Have a question, feedback, or need assistance? Reach out to us — we'll get back to you as soon as possible.</p>
        <div class="ctscript" aria-hidden="true">Better Care<br>Together ${I("heart", 24)}
          <svg width="130" height="14" viewBox="0 0 130 14"><path d="M2 12C40 2 90 2 128 4" fill="none" stroke="#6f8fd0" stroke-width="1.6" stroke-linecap="round"/></svg></div>
      </div></section>

      <div class="ctin ctgrid">
        <section class="ctcard ctinfo" aria-label="Contact details">
          ${row("b", "phone", "Phone", PHONE, HOURS, WA_HREF, ' target="_blank" rel="noopener" aria-label="Open WhatsApp to chat or call us"')}
          ${row("g", "mail", "Email", EMAIL_ADDR, "We usually reply within 24 hours", "mailto:" + EMAIL_ADDR)}
          ${row("p", "pin", "Our Location", ADDRESS[0], ADDRESS[1], "https://www.google.com/maps/search/?api=1&query=" + mapQ, ' target="_blank" rel="noopener"')}
          <a class="ctrow urgent" href="#/emergency"><span class="cti">${I("headset", 24)}</span><span><b>Need urgent help?</b><small>For medical emergencies, please call <b>1990</b></small></span><span class="ctgo" style="border:0">${I("arrow", 16)}</span></a>
        </section>

        <section class="ctmid" aria-hidden="false">
          ${building}
          <div class="ctbadges">
            <div class="ctbadge"><span class="ctbi b">${I("clock", 26)}</span><b>24/7</b><small>Emergency<br>Support</small></div>
            <div class="ctbadge"><span class="ctbi g">${I("shield", 26)}</span><b>Secure</b><small>Your data is<br>safe with us</small></div>
            <div class="ctbadge"><span class="ctbi v">${I("users", 26)}</span><b>Expert Team</b><small>Always ready<br>to assist</small></div>
          </div>
          <div class="ctmatter">Your health matters ${I("heart", 20)}</div>
        </section>

        <section class="ctcard ctform">
          <div class="cthead"><span class="cti">${I("mail", 26)}</span><div><h2>Send us a message</h2><p>Fill out the form below and we'll get back to you shortly.</p></div></div>
          <form id="ctform" novalidate>
            <div class="ctfields">
              ${field("ctn", "Your name", "user", `${I("user", 18)}<input id="ctn" value="${nm}" placeholder="Enter your name" autocomplete="name">`)}
              ${field("cte", "Email address", "mail", `${I("mail", 18)}<input id="cte" type="email" value="${em}" placeholder="Enter your email" autocomplete="email">`)}
              ${field("ctp", "Phone number", "phone", `${I("phone", 18)}<input id="ctp" type="tel" placeholder="Enter your phone number" autocomplete="tel">`)}
              ${field("cts", "Subject", "tag", `${I("tag", 18)}<select id="cts"><option value="">Select a subject</option>${SUBJECTS.map(s => `<option>${s}</option>`).join("")}</select>`)}
              ${field("ctm", "Your message", "chat", `${I("chat", 18)}<textarea id="ctm" rows="5" maxlength="1700" placeholder="Type your message here..."></textarea>`, true, true)}
            </div>
            <p class="cterr" id="cterr" role="alert"></p>
            <div class="ctfoot">
              <span class="ctnote">${I("shield", 20)}<span>Your details are only used to reply to you.</span></span>
              <button type="submit" class="ctsend" id="ctsend">${I("send", 18)} Send message ${I("arrowR", 18)}</button>
            </div>
            <div class="ctok" id="ctok" role="status">${I("check", 24)}<span>Thank you! Your message has been sent. We'll reply within 24 hours.</span></div>
          </form>
        </section>
      </div>

      <section class="ctstrip"><div class="ctin">
        <div class="ctpt"><span class="cti">${I("pulse", 24)}</span><div><b>Quality Healthcare</b><small>For a healthier tomorrow</small></div></div>
        <div class="ctpt"><span class="cti">${I("shield", 24)}</span><div><b>Trusted by Thousands</b><small>Your trust drives us</small></div></div>
        <div class="ctpt"><span class="cti">${I("users", 24)}</span><div><b>Dedicated Support</b><small>We are here for you</small></div></div>
        <div class="ctpt"><span class="cti">${I("leaf", 24)}</span><div><b>Better Health, Brighter Future</b><small>Together we can</small></div></div>
      </div></section>
    </main>`;
    };

    /* ---------- submit ---------- */
    const MAIL = /^\S+@\S+\.\S+$/, PH = /^\+?[\d\s\-()]{7,}$/;
    document.addEventListener("submit", async e => {
        if (e.target.id != "ctform") return;
        e.preventDefault();
        const g = id => document.getElementById(id), v = id => g(id).value.trim();
        const err = g("cterr"), ok = g("ctok"), btn = g("ctsend");
        ["ctn", "cte", "ctp", "cts", "ctm"].forEach(id => g("w_" + id).classList.remove("bad"));
        ok.classList.remove("on"); err.textContent = "";

        const checks = [
            ["ctn", v("ctn"), "Please enter your name."],
            ["cte", MAIL.test(v("cte")), "Please enter a valid email address."],
            ["ctp", PH.test(v("ctp")), "Please enter a valid phone number."],
            ["cts", v("cts"), "Please select a subject."],
            ["ctm", v("ctm"), "Please type your message."],
        ];
        const bad = checks.find(c => !c[1]);
        if (bad) { g("w_" + bad[0]).classList.add("bad"); err.textContent = bad[2]; g(bad[0]).focus(); return; }

        const label = btn.innerHTML;
        btn.disabled = true; btn.textContent = "Sending…";
        try {
            await API.post("/contact", {
                name: v("ctn"), email: v("cte"),
                message: `Subject: ${v("cts")}\nPhone: ${v("ctp")}\n\n${v("ctm")}`,
            });
            ok.classList.add("on");
            g("ctp").value = ""; g("cts").value = ""; g("ctm").value = "";
            toast("Message sent. We'll reply soon.");
        } catch (ex) {
            err.textContent = ex.message;
        } finally {
            btn.disabled = false; btn.innerHTML = label;
        }
    });
})();