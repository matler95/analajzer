import { useState, useCallback, useEffect } from "react";
import { apiFetch, setTokens, clearTokens, getTokens } from "../api.js";
import { formatFastApiDetail } from "../utils/normalize.js";

export function useAuth() {
  const [me, setMe] = useState(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authErr, setAuthErr] = useState(null);

  const refreshMe = useCallback(async () => {
    if (!getTokens().access) { setMe(null); return; }
    const res = await apiFetch("/auth/me");
    if (res.ok) setMe(await res.json());
    else setMe(null);
  }, []);

  useEffect(() => { refreshMe(); }, [refreshMe]);

  const login = useCallback(async () => {
    setAuthErr(null);
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: { email: authEmail, password: authPass },
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setAuthErr(formatFastApiDetail(j.detail) || "Błąd logowania"); return false; }
    setTokens(j.access_token, j.refresh_token);
    setAuthPass("");
    await refreshMe();
    return true;
  }, [authEmail, authPass, refreshMe]);

  const register = useCallback(async () => {
    setAuthErr(null);
    const res = await apiFetch("/auth/register", {
      method: "POST",
      body: { email: authEmail, password: authPass },
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setAuthErr(formatFastApiDetail(j.detail) || "Błąd rejestracji"); return false; }
    setTokens(j.access_token, j.refresh_token);
    setAuthPass("");
    await refreshMe();
    return true;
  }, [authEmail, authPass, refreshMe]);

  const logout = useCallback(() => {
    clearTokens();
    setMe(null);
  }, []);

  return {
    me,
    authEmail, setAuthEmail,
    authPass, setAuthPass,
    authErr,
    login, register, logout,
    refreshMe,
  };
}
