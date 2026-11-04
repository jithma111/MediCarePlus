// Location helpers shared by the emergency page (patient) and the ambulance driver dashboard.
// Free services, no API key needed:  OpenStreetMap Nominatim (address -> position)
//                                    OSRM public server       (route, distance, travel time)
// For a production site, use your own geocoding / routing service (these public servers are for light use).
window.MCGeo = (() => {
    const geocodeCache = new Map();

    /** Only treats the WHOLE text as a position (e.g. "6.92710, 79.86120"), so house numbers are never mistaken for GPS. */
    function parse(text) {
        const m = /^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/.exec(text || "");
        if (!m) return null;
        const lat = +m[1], lng = +m[2];
        return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
    }

    async function fetchJson(url, ms) {
        const ctl = new AbortController();
        const t = setTimeout(() => ctl.abort(), ms);
        try {
            const r = await fetch(url, { signal: ctl.signal, headers: { Accept: "application/json" } });
            if (!r.ok) throw new Error(r.status);
            return await r.json();
        } finally { clearTimeout(t); }
    }

    /** Address text -> { lat, lng } or null. Never throws. */
    async function geocode(q) {
        q = (q || "").trim();
        if (!q) return null;
        const direct = parse(q);
        if (direct) return direct;
        if (geocodeCache.has(q)) return geocodeCache.get(q);
        try {
            const j = await fetchJson("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" + encodeURIComponent(q), 5000);
            const g = j && j[0] ? { lat: +j[0].lat, lng: +j[0].lon } : null;
            if (g) geocodeCache.set(q, g);
            return g;
        } catch (e) { return null; }
    }

    function km(a, b) {                         // straight-line distance (haversine)
        const R = 6371, r = d => d * Math.PI / 180;
        const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
        const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(h));
    }

    /** Driving route -> { coords:[[lat,lng]...], km, min, approx }. Falls back to a straight line estimate. */
    async function route(from, to) {
        try {
            const j = await fetchJson(`https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`, 6000);
            const r = j && j.routes && j.routes[0];
            if (r) return { coords: r.geometry.coordinates.map(c => [c[1], c[0]]), km: r.distance / 1000, min: Math.max(1, Math.round(r.duration / 60)), approx: false };
        } catch (e) { /* use the estimate below */ }
        const d = km(from, to) * 1.3;           // roads are longer than a straight line
        return { coords: [[from.lat, from.lng], [to.lat, to.lng]], km: d, min: Math.max(1, Math.round(d / 35 * 60)), approx: true };
    }

    /** Link that opens turn-by-turn directions in Google Maps. */
    function googleDirections(from, to, text) {
        const dest = to ? to.lat + "," + to.lng : encodeURIComponent(text || "");
        return "https://www.google.com/maps/dir/?api=1&destination=" + dest + (from ? "&origin=" + from.lat + "," + from.lng : "") + "&travelmode=driving";
    }

    return { parse, geocode, km, route, googleDirections };
})();