import { useState, useCallback } from "react";
import { apiFetch } from "../api.js";
import {
  normalizeLicensePlate,
  normalizeVin,
  normalizeDateForCepik,
  isValidLicensePlate,
  stripDebug,
} from "../utils/normalize.js";

export function useCepik({ me, data, savedSearchId, onVerified }) {
  const [cepikLoading, setCepikLoading] = useState(false);
  const [cepikErr, setCepikErr] = useState(null);

  const persistManualToServer = useCallback(async (id) => {
    if (!id || !me || !data) return;
    await apiFetch(`/searches/${id}`, {
      method: "PATCH",
      body: {
        manual_vin: data.vin || null,
        manual_first_registration: data.firstRegistration || null,
        manual_license_plate: data.licensePlate || null,
      },
    });
  }, [me, data]);

  const verifyGov = useCallback(async () => {
    if (!data) return;
    const reg = (data.licensePlate || "").trim();
    const vin = (data.vin || "").trim();
    const fr = normalizeDateForCepik(data.firstRegistration || "");
    if (!reg || !vin || !fr) {
      setCepikErr("Uzupełnij VIN, numer rejestracyjny i datę pierwszej rejestracji (YYYY-MM-DD).");
      return;
    }
    if (!isValidLicensePlate(reg)) {
      setCepikErr("Numer rejestracyjny wygląda na niepełny (połącz znaki w jeden ciąg; dopuszczalne 4–9 znaków, m.in. krótkie tablice).");
      return;
    }
    if (!me) {
      setCepikErr("Zaloguj się, aby weryfikować przez API.");
      return;
    }
    setCepikLoading(true);
    setCepikErr(null);
    try {
      if (savedSearchId) await persistManualToServer(savedSearchId);
      const res = await apiFetch("/cepik/verify", {
        method: "POST",
        body: {
          search_id: savedSearchId,
          registration_number: normalizeLicensePlate(reg),
          vin_number: normalizeVin(vin),
          first_registration_date: fr,
          listing_snapshot: stripDebug(data),
          force_refresh: false,
        },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCepikErr(typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail || j));
        return;
      }
      onVerified?.(j);
    } finally {
      setCepikLoading(false);
    }
  }, [data, me, savedSearchId, persistManualToServer, onVerified]);

  const canVerify = Boolean(
    me &&
    data &&
    isValidLicensePlate(data.licensePlate || "") &&
    (data.vin || "").trim() &&
    normalizeDateForCepik(data.firstRegistration || "")
  );

  return {
    cepikLoading,
    cepikErr, setCepikErr,
    verifyGov,
    canVerify,
  };
}
