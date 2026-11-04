// MediCare Plus help chatbot (floating, bottom-left).
// Rule-based: answers common questions from the site's own FAQ/contact info.
(function () {
    "use strict";

    // ---------- Knowledge base ----------
    const L = {
        doctors: ["Find a doctor", "#/doctors"],
        login: ["Log in / Register", "#/login"],
        faq: ["Read the FAQ", "#/faq"],
        contact: ["Contact page", "#/contact"],
        emergency: ["Emergency page", "#/emergency"],
        about: ["About us", "#/about"]
    };

    const INTENTS = [
        { id: "emergency", re: /emergenc|ambulance|urgent|chest pain|can.?t breathe|bleeding|unconscious|heart attack|stroke|overdose/,
            t: "If this is a medical emergency, call your local emergency number or go to the nearest hospital right away. Our 24/7 emergency hotline is 1990. This chat can’t help with urgent medical situations.",
            links: ["emergency"] },
        { id: "greet", re: /^(hi|hello|hey|hii+|good (morning|afternoon|evening)|ayubowan)\b/,
            t: "Hello! 👋 I’m the MediCare Plus assistant. I can help you book appointments, find doctors and answer common questions. What do you need?" },
        { id: "cancel", re: /cancel|reschedul|update my appointment|modify|change (my )?(appointment|time|date)|postpone/,
            t: "Yes, you can. Log in, open your dashboard and choose Cancel or Reschedule on any upcoming appointment.",
            links: ["login"] },
        { id: "book", re: /book|appointment|schedul|reserve|slot|visit a doctor/,
            t: "Booking takes three steps: 1) Find a doctor, 2) pick a date and time, 3) choose Book appointment. You need a patient account to confirm the booking.",
            links: ["doctors", "login"] },
        { id: "status", re: /status|pending|confirmed|completed/,
            t: "Pending: waiting for the doctor. Confirmed: the doctor accepted. Completed: the visit took place. Cancelled: the appointment was cancelled." },
        { id: "remind", re: /remind|notif|bell|alert/,
            t: "Yes. The 🔔 bell icon at the top shows confirmations, changes and reminders for visits in the next 48 hours. Log in to see yours." },
        { id: "doctor", re: /doctor|specialist|specialt|physician|cardio|paediatr|pediatr|dermat|gynae|gyne|orthop|general practi|hospital/,
            t: "You can search by name, specialty or hospital on the Find a doctor page. Specialties include General practice, Cardiology, Paediatrics, Dermatology, Gynaecology and Orthopaedics.",
            links: ["doctors"] },
        { id: "contact", re: /contact|phone|call|email|mail|hours|open|time.*open|address|reach|support|help desk/,
            t: "You can reach us on +94 11 234 5678, Mon–Sat, 8:00–18:00. You can also send a message from the Contact page. We reply within one working day.",
            links: ["contact"] },
        { id: "account", re: /log ?in|sign ?in|register|sign ?up|account|password|create/,
            t: "Use Log in / Register at the top right of the page. A free patient account lets you book, reschedule and track your appointments.",
            links: ["login"] },
        { id: "privacy", re: /privacy|\bdata\b|secure|\bsafe|confiden/,
            t: "Your details are used only to arrange your appointment. For more information, see the FAQ & Privacy page.",
            links: ["faq", "about"] },
        { id: "price", re: /price|cost|fee|charge|pay|insurance|how much/,
            t: "Consultation fees are set by each doctor or hospital. For fee or insurance questions, please contact us and we’ll point you in the right direction.",
            links: ["contact"] },
        { id: "medical", re: /diagnos|symptom|medicine|medication|dose|prescri|pain|fever|treatment|what should i take/,
            t: "I can’t give medical advice. Please book an appointment with a doctor to discuss your symptoms.",
            links: ["doctors"] },
        { id: "thanks", re: /thank|thanks|cheers|great|awesome|ok(ay)?$/,
            t: "You’re welcome! Is there anything else I can help with? 😊" },
        { id: "bye", re: /\b(bye|goodbye|see you|that’s all|that's all)\b/,
            t: "Take care! I’m here whenever you need help. 👋" }
    ];

    const FALLBACK = {
        t: "Sorry, I didn’t quite get that. I can help with booking, cancelling, finding doctors, reminders and contact details. Try one of the options below, or visit the FAQ.",
        links: ["faq", "contact"]
    };

    const CHIPS = ["Book an appointment", "Find a doctor", "Cancel or reschedule", "Opening hours", "Emergency"];

    // Try to suggest real doctors from the site data when a specialty is mentioned.
    function doctorSuggestion(q) {
        try {
            if (typeof docs !== "function") return null;
            const list = docs() || [];
            const hits = list.filter(d => q.includes(String(d.s || "").toLowerCase().split(" ")[0]) && String(d.s || "").length > 2).slice(0, 3);
            if (!hits.length) return null;
            return "Doctors available now: " + hits.map(d => d.n + " (" + d.s + (d.h ? ", " + d.h : "") + ")").join("; ") + ".";
        } catch (e) { return null; }
    }

    function reply(text) {
        const q = text.toLowerCase().trim().replace(/[?!.,]+$/g, "");
        for (const it of INTENTS) {
            if (it.re.test(q)) {
                let t = it.t;
                if (it.id === "doctor") { const s = doctorSuggestion(q); if (s) t = s + " " + t; }
                return { t, links: (it.links || []).map(k => L[k]) };
            }
        }
        return { t: FALLBACK.t, links: FALLBACK.links.map(k => L[k]) };
    }

    // Animated robot icon (inline SVG; animated with CSS)
    const ICON =
        '<svg class="cb-bot" viewBox="0 0 40 40" width="34" height="34" aria-hidden="true" focusable="false">' +
        '<line x1="20" y1="9" x2="20" y2="5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
        '<circle class="cb-ant" cx="20" cy="4" r="2.7" fill="#ffd166"/>' +
        '<rect x="3.5" y="18" width="4" height="9" rx="2" fill="currentColor" opacity=".75"/>' +
        '<rect x="32.5" y="18" width="4" height="9" rx="2" fill="currentColor" opacity=".75"/>' +
        '<rect x="7" y="9" width="26" height="23" rx="9" fill="currentColor"/>' +
        '<g class="cb-eyes"><ellipse cx="14.5" cy="19" rx="2.6" ry="3.2" fill="var(--blue)"/><ellipse cx="25.5" cy="19" rx="2.6" ry="3.2" fill="var(--blue)"/></g>' +
        '<path class="cb-smile" d="M15 26.2q5 4 10 0" stroke="var(--blue)" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '</svg>';

    // ---------- UI ----------
    function el(tag, cls, txt) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (txt != null) e.textContent = txt;
        return e;
    }

    function build() {
        const root = el("div", "cb");
        root.innerHTML =
            '<section class="cb-panel" id="cb-panel" role="dialog" aria-label="MediCare Plus assistant" hidden>' +
            '<header class="cb-head"><div class="cb-ava" aria-hidden="true">' + ICON + '</div>' +
            '<div><b>MediCare Assistant</b><small>Online · replies instantly</small></div>' +
            '<button type="button" class="cb-x" aria-label="Close chat">✕</button></header>' +
            '<div class="cb-log" id="cb-log" role="log" aria-live="polite"></div>' +
            '<div class="cb-chips" id="cb-chips"></div>' +
            '<div class="cb-form"><input id="cb-in" type="text" autocomplete="off" maxlength="200" placeholder="Type your question…" aria-label="Type your question">' +
            '<button type="button" class="cb-send" aria-label="Send">➤</button></div>' +
            '</section>' +      '<div class="cb-teaser" id="cb-teaser" role="status" hidden>' +
            '<button type="button" class="cb-teaser-go">👋 Hi! How can we help?</button>' +
            '<button type="button" class="cb-teaser-x" aria-label="Dismiss message">✕</button></div>' +
            '<button type="button" class="cb-fab" id="cb-fab" aria-expanded="false" aria-controls="cb-panel" aria-label="Open chat assistant">' +
            '<span class="cb-fab-ic" aria-hidden="true">' + ICON + '</span><span class="cb-fab-tx">Chat with us</span></button>';
        document.body.appendChild(root);

        const panel = root.querySelector(".cb-panel"), fab = root.querySelector("#cb-fab"),
            log = root.querySelector("#cb-log"), input = root.querySelector("#cb-in"),
            chips = root.querySelector("#cb-chips"), teaser = root.querySelector("#cb-teaser");
        let started = false;

        function add(who, text, links) {
            const m = el("div", "cb-m " + who);
            m.appendChild(el("div", "cb-b", text));
            if (links && links.length) {
                const r = el("div", "cb-links");
                links.forEach(l => { const a = el("a", "cb-link", l[0] + " →"); a.href = l[1]; a.addEventListener("click", () => { if (window.innerWidth < 600) close(); }); r.appendChild(a); });
                m.appendChild(r);
            }
            log.appendChild(m);
            log.scrollTop = log.scrollHeight;
        }

        function typing() { const m = el("div", "cb-m bot cb-typing"); m.innerHTML = '<div class="cb-b"><i></i><i></i><i></i></div>'; log.appendChild(m); log.scrollTop = log.scrollHeight; return m; }

        function ask(text) {
            text = text.trim();
            if (!text) return;
            add("me", text);
            const t = typing();
            const r = reply(text);
            setTimeout(() => { t.remove(); add("bot", r.t, r.links); }, 450);
        }

        function open() {
            hideTeaser();
            panel.hidden = false;
            fab.setAttribute("aria-expanded", "true");
            fab.setAttribute("aria-label", "Close chat assistant");
            root.classList.add("open");
            if (!started) {
                started = true;
                add("bot", "Hi! 👋 I’m the MediCare Plus assistant. How can I help you today?");
                CHIPS.forEach(c => { const b = el("button", "cb-chip", c); b.type = "button"; b.addEventListener("click", () => ask(c)); chips.appendChild(b); });
            }
            setTimeout(() => input.focus(), 50);
        }
        function close() {
            panel.hidden = true;
            fab.setAttribute("aria-expanded", "false");
            fab.setAttribute("aria-label", "Open chat assistant");
            root.classList.remove("open");
        }
        // Greeting bubble: shown once per browser session, shortly after the site opens.
        let teaserTimer;
        function hideTeaser() { clearTimeout(teaserTimer); teaser.hidden = true; }
        function showTeaser() {
            if (!panel.hidden) return;
            teaser.hidden = false;
            teaserTimer = setTimeout(hideTeaser, 20000);
        }
        teaser.querySelector(".cb-teaser-go").addEventListener("click", open);
        teaser.querySelector(".cb-teaser-x").addEventListener("click", hideTeaser);
        let seen = false;
        try { seen = sessionStorage.getItem("cbTeaser") === "1"; sessionStorage.setItem("cbTeaser", "1"); } catch (e) {}
        if (!seen) setTimeout(showTeaser, 1500);
        fab.addEventListener("click", () => (panel.hidden ? open() : close()));
        root.querySelector(".cb-x").addEventListener("click", () => { close(); fab.focus(); });
        root.querySelector(".cb-send").addEventListener("click", () => { ask(input.value); input.value = ""; input.focus(); });
        input.addEventListener("keydown", e => { if (e.key === "Enter") { ask(input.value); input.value = ""; } });
        document.addEventListener("keydown", e => { if (e.key === "Escape" && !panel.hidden) { close(); fab.focus(); } });
        window.MCPChat = { open, close, ask, reply };
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build); else build();
})();