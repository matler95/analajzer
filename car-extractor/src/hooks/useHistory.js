import { useState, useCallback } from "react";
import { apiFetch } from "../api.js";
import {
  mergeSearchRecord,
  normalizeDateForCepik,
  normalizeLicensePlate,
  normalizeVin,
  isValidLicensePlate,
  isValidVin,
  stripDebug,
  formatFastApiDetail,
} from "../utils/normalize.js";

export function useHistory({ me }) {
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [histVerifyBusy, setHistVerifyBusy] = useState({});
  const [uxNotice, setUxNotice] = useState(null);

  const loadHistory = useCallback(async () => {
    if (!me) return;
    setHistLoading(true);
    try {
      const res = await apiFetch("/searches");
      if (res.ok) setHistory(await res.json());
      else setHistory([]);
    } finally {
      setHistLoading(false);
    }
  }, [me]);

  const deleteHistoryItem = useCallback(async (id) => {
    const ok = window.confirm("Usunąć to ogłoszenie z historii?");
    if (!ok) return;
    const res = await apiFetch(`/searches/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setUxNotice({ kind: "error", msg: formatFastApiDetail(j.detail) || "Nie udało się usunąć wpisu." });
      return;
    }
    setHistory(prev => prev.filter(h => h.id !== id));
    return id;
  }, []);

  const patchHistoryItem = useCallback(async (id, key, val) => {
    const res = await apiFetch(`/searches/${id}`, { method: "PATCH", body: { [key]: val } });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return { error: formatFastApiDetail(j.detail) || "Nie udało się zapisać." };
    }
    await loadHistory();
    return { ok: true };
  }, [loadHistory]);

  const verifyHistoryItem = useCallback(async (row) => {
    if (!me) return;
    const snap = row.snapshot_json || {};
    const reg = (row.manual_license_plate ?? snap.licensePlate ?? "").toString().trim();
    const vin = (row.manual_vin ?? snap.vin ?? "").toString().trim();
    const fr = normalizeDateForCepik(row.manual_first_registration ?? snap.firstRegistration ?? "");
    if (!reg || !vin || !fr) return;
    if (!isValidLicensePlate(reg)) {
      setUxNotice({
        kind: "error",
        msg: "Numer rejestracyjny nieprawidłowy (4–9 znaków po połączeniu w jeden ciąg, m.in. krótkie tablice).",
      });
      return;
    }
    if (!isValidVin(vin)) {
      setUxNotice({ kind: "error", msg: "VIN musi mieć 17 poprawnych znaków." });
      return;
    }

    setHistVerifyBusy(b => ({ ...b, [row.id]: true }));
    try {
      const res = await apiFetch("/cepik/verify", {
        method: "POST",
        body: {
          search_id: row.id,
          registration_number: normalizeLicensePlate(reg),
          vin_number: normalizeVin(vin),
          first_registration_date: fr,
          listing_snapshot: stripDebug(mergeSearchRecord(row)),
          force_refresh: false,
        },
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setUxNotice({ kind: "error", msg: formatFastApiDetail(j.detail) || "Weryfikacja nie powiodła się." });
        return;
      }
      await loadHistory();
    } finally {
      setHistVerifyBusy(b => ({ ...b, [row.id]: false }));
    }
  }, [me, loadHistory]);

  const openHistoryItem = useCallback(async (id) => {
    const res = await apiFetch(`/searches/${id}`);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setUxNotice({ kind: "error", msg: formatFastApiDetail(j.detail) || "Nie udało się otworzyć wpisu." });
      return null;
    }
    return await res.json();
  }, []);

  return {
    history,
    histLoading,
    histVerifyBusy,
    uxNotice, setUxNotice,
    loadHistory,
    deleteHistoryItem,
    patchHistoryItem,
    verifyHistoryItem,
    openHistoryItem,
  };
}
