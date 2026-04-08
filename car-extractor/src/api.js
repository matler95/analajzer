const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export function getTokens() {
  try {
    const a = localStorage.getItem("analajzer_access");
    const r = localStorage.getItem("analajzer_refresh");
    return { access: a, refresh: r };
  } catch {
    return { access: null, refresh: null };
  }
}

export function setTokens(access, refresh) {
  if (access) localStorage.setItem("analajzer_access", access);
  if (refresh) localStorage.setItem("analajzer_refresh", refresh);
}

export function clearTokens() {
  localStorage.removeItem("analajzer_access");
  localStorage.removeItem("analajzer_refresh");
}

async function refreshAccess() {
  const { refresh } = getTokens();
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const j = await res.json();
    setTokens(j.access_token, j.refresh_token);
    return j.access_token;
  } catch {
    return null;
  }
}

export async function apiFetch(path, opts = {}) {
  // FIX #15: Spread into a new object so the caller's opts are never mutated.
  const reqOpts = { ...opts };

  const { access } = getTokens();
  const headers = { ...(reqOpts.headers || {}) };

  if (reqOpts.body && typeof reqOpts.body === "object" && !(reqOpts.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    reqOpts.body = JSON.stringify(reqOpts.body);
  }

  if (access) headers.Authorization = `Bearer ${access}`;

  let res = await fetch(`${API_BASE}${path}`, { ...reqOpts, headers });

  if (res.status === 401 && getTokens().refresh) {
    const newA = await refreshAccess();
    if (newA) {
      headers.Authorization = `Bearer ${newA}`;
      res = await fetch(`${API_BASE}${path}`, { ...reqOpts, headers });
    }
  }
  return res;
}

export { API_BASE };
