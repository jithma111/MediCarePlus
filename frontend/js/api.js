// Small fetch wrapper for the MediCare Plus REST API.
// Keeps the login token in localStorage and sends it as "Authorization: Bearer <token>".
const API = (() => {
  const base = window.APP_CONFIG.apiBase;
  const KEY = "mcp_token";
  let token = null;
  try { token = localStorage.getItem(KEY); } catch (e) {}

  const api = { onUnauthorized: null };

  api.getToken = () => token;
  api.setToken = t => {
    token = t || null;
    try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch (e) {}
  };

  async function request(method, path, body) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = "Bearer " + token;

    let res;
    try {
      res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    } catch (e) {
      throw new Error("Cannot reach the server. Is the backend running at " + base + " ?");
    }

    let data = null;
    const text = await res.text();
    if (text) { try { data = JSON.parse(text); } catch (e) {} }

    if (!res.ok) {
      if (res.status === 401 && token) {          // session expired or server restarted
        api.setToken(null);
        if (api.onUnauthorized) api.onUnauthorized();
      }
      throw new Error((data && data.message) || res.statusText || "Request failed");
    }
    return data;
  }

  api.get = p => request("GET", p);
  api.post = (p, b) => request("POST", p, b === undefined ? {} : b);
  api.put = (p, b) => request("PUT", p, b);
  api.patch = (p, b) => request("PATCH", p, b);
  api.del = p => request("DELETE", p);
  return api;
})();
