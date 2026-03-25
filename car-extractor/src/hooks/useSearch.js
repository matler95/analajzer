import { useState, useCallback } from "react";
import { apiFetch } from "../api.js";
import { fetchPage, parseMd, detectPortal } from "../utils/carParser.js";
import { normListingUrl, mergeSearchRecord, stripDebug, formatFastApiDetail } from "../utils/normalize.js";

export function useSearch({ me }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [savedSearchId, setSavedSearchId] = useState(null);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [cepik, setCepik] = useState(null);
  const [vinLoading, setVinLoading] = useState(false);

  const portal = detectPortal(url);

  const run = useCallback(async () => {
    const u = url.trim();
    if (!u) return;
    setLoading(true);
    setError(null);
    setData(null);
    setSavedSearchId(null);
    setCepik(null);
    setVinLoading(false);
    setSaveMsg(null);
    try {
      const normU = normListingUrl(u);
      if (me) {
        const existingRes = await apiFetch(`/searches/lookup/by-url?listing_url=${encodeURIComponent(normU)}`);
        if (existingRes.ok) {
          const existing = await existingRes.json();
          if (existing) {
            setData(mergeSearchRecord(existing));
            setSavedSearchId(existing.id);
            if (existing.latest_verification?.normalized) {
              setCepik({
                technicalData: existing.latest_verification.normalized.technicalData || {},
                odometerReadings: existing.latest_verification.normalized.odometerReadings || [],
                events: existing.latest_verification.normalized.events || [],
                meta: { fromHistory: true, cacheHit: existing.latest_verification.cache_hit },
                comparison: existing.latest_verification.comparison || null,
              });
            }
            setSaveMsg("Wczytano z historii.");
            return;
          }
        }
      }
      const mdPromise = fetchPage(u);
      
      const mdResult = await mdPromise.catch(e => { throw e; });
      const md = mdResult;
      const car = parseMd(md, u);
      car.listingUrl = normU;
      
      setData(car);
      setLoading(false); // End main loading so skeleton disappears

      // Call scraper API only for otomoto AFTER rendering initial data
      const isOtomoto = portal === "otomoto" || u.includes("otomoto.pl");
      if (isOtomoto && !car.vin) {
        setVinLoading(true);
        try {
          const r = await apiFetch(`/scraper/vin?listing_url=${encodeURIComponent(normU)}`);
          if (r.ok) {
            const json = await r.json();
            if (json && json.vin) {
              car.vin = json.vin;
              setData(prev => prev ? { ...prev, vin: json.vin } : prev);
            }
          }
        } catch (e) {
          // ignore vin fetch error silently
        } finally {
          setVinLoading(false);
        }
      }

      // Auto-save when logged in
      if (me) {
        const res = await apiFetch("/searches", {
          method: "POST",
          body: {
            listing_url: normU,
            snapshot_json: stripDebug(car),
            manual_vin: car.vin || null,
            manual_first_registration: car.firstRegistration || null,
            manual_license_plate: car.licensePlate || null,
          },
        });
        if (res.ok) {
          const j = await res.json();
          setSavedSearchId(j.id);
          setSaveMsg("Zapisano automatycznie.");
        }
      }
    } catch (e) {
      setError(e.message ?? "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  }, [url, me]);

  const saveSearch = useCallback(async ({ cepik: cepikResult } = {}) => {
    if (!data || !me) return;
    setSaveBusy(true);
    setSaveMsg(null);
    try {
      const res = await apiFetch("/searches", {
        method: "POST",
        body: {
          listing_url: normListingUrl(data.listingUrl),
          snapshot_json: stripDebug(data),
          manual_vin: data.vin || null,
          manual_first_registration: data.firstRegistration || null,
          manual_license_plate: data.licensePlate || null,
          latest_verification: cepikResult
            ? {
                technicalData: cepikResult.technicalData || {},
                odometerReadings: cepikResult.odometerReadings || [],
                events: cepikResult.events || [],
                comparison: cepikResult.comparison || null,
                meta: cepikResult.meta || {},
              }
            : null,
        },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setSaveMsg(formatFastApiDetail(j.detail) || "Nie zapisano"); return; }
      setSavedSearchId(j.id);
      setSaveMsg("Zapisano ponownie.");
    } finally {
      setSaveBusy(false);
    }
  }, [data, me]);

  const updateField = useCallback((key, value) => {
    setData(prev => prev ? { ...prev, [key]: value } : prev);
  }, []);

  return {
    url, setUrl,
    loading,
    data, setData,
    error,
    portal,
    savedSearchId, setSavedSearchId,
    saveBusy,
    saveMsg, setSaveMsg,
    cepik, setCepik,
    vinLoading,
    run,
    saveSearch,
    updateField,
  };
}
