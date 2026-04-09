import { useState, useCallback, useRef } from "react";
import { apiFetch } from "../api.js";
import { fetchPage, parseMd } from "../utils/carParser.js";
import {
  normListingUrl,
  normalizeDateForCepik,
  normalizeLicensePlate,
  normalizeVin,
  isValidLicensePlate,
  isValidVin,
  stripDebug,
} from "../utils/normalize.js";
import {
  PRICE_CHANGE_TTL_MS,
  MAX_PRICE_HISTORY,
  SCAN_DELAY_MS,
  MAX_PAGES_AUTO,
} from "../utils/constants.js"; // FIX #9: single source of truth

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchAllListingUrls(searchUrl, cancelRef, onProgress) {
  const allUrls  = [];
  let currentUrl = searchUrl;
  let pageNum    = 0;

  while (pageNum < MAX_PAGES_AUTO) {
    if (cancelRef.current) break;
    onProgress?.(`Strona ${pageNum + 1}…`);

    try {
      const res = await apiFetch(
        `/scraper/search-urls?search_url=${encodeURIComponent(currentUrl)}&max_pages=1`
      );
      if (!res.ok) break;
      const data = await res.json();
      const urls = data.urls || [];
      if (urls.length === 0) break;
      allUrls.push(...urls);
      pageNum++;

      try {
        const u = new URL(currentUrl);
        const cur = parseInt(u.searchParams.get("page") || "1", 10);
        u.searchParams.set("page", String(cur + 1));
        currentUrl = u.toString();
      } catch { break; }

      if (urls.length < 28) break;
      await sleep(600);
    } catch { break; }
  }

  const seen = new Set();
  return allUrls.filter(u => {
    const n = normListingUrl(u);
    if (seen.has(n)) return false;
    seen.add(n);
    return true;
  });
}

export function useBackgroundJob({ me, onJobComplete }) {
  const [job,        setJob]        = useState(null);
  const cancelRef    = useRef(false);
  const runningRef   = useRef(false);
  const filterIdRef  = useRef(null);

  const startJob = useCallback(async (filter) => {
    if (!me || runningRef.current) return;
    cancelRef.current  = false;
    runningRef.current = true;
    filterIdRef.current = filter.id;

    const searchUrls = filter.searchUrls?.length
      ? filter.searchUrls
      : filter.searchUrl ? [filter.searchUrl] : [];

    if (!searchUrls.length) { runningRef.current = false; return; }

    setJob({
      isRunning: true, filterId: filter.id, filterName: filter.name,
      phase: "scraping", batchIndex: 0, batchTotal: searchUrls.length,
      total: 0, processed: 0, skipped: 0, cepikVerified: 0,
      newCount: 0, archivedCount: 0, priceChanges: 0,
      current: null, errors: [], phaseMsg: "",
    });

    let processedCount = 0, skippedCount = 0, cepikVerifiedCount = 0;
    let newCount = 0, archivedCount = 0, priceChanges = 0;

    const foundUrls = new Set();

    try {
      // ── Phase A: scrape all URLs ──────────────────────────────
      const allFoundUrls = [];

      for (let bi = 0; bi < searchUrls.length; bi++) {
        if (cancelRef.current) break;
        const batchLabel = filter.vehicles?.[bi]
          ? `${filter.vehicles[bi].brand}${filter.vehicles[bi].model ? "/" + filter.vehicles[bi].model : ""}`
          : `Partia ${bi + 1}`;

        setJob(prev => ({
          ...prev, phase: "scraping", batchIndex: bi,
          phaseMsg: `Pobieranie ogłoszeń: ${batchLabel}…`,
        }));

        let urls = [];
        try {
          urls = await fetchAllListingUrls(searchUrls[bi], cancelRef, msg => {
            setJob(prev => ({ ...prev, phaseMsg: msg }));
          });
        } catch (err) {
          setJob(prev => ({
            ...prev, errors: [...(prev?.errors ?? []), `Błąd pobierania: ${err.message}`],
          }));
        }

        urls.forEach(u => {
          const n = normListingUrl(u);
          foundUrls.add(n);
          allFoundUrls.push(u);
        });
      }

      // ── Phase B: archive detection ───────────────────────────
      // FIX #5: Use __filterNames (multi-filter tracking) not just __filterId.
      // Only archive a vehicle when no other filter still claims it.
      try {
        const allRes = await apiFetch("/searches");
        if (allRes.ok) {
          const allSaved = await allRes.json();
          const filterSaved = allSaved.filter(r => {
            const snap = r.snapshot_json || {};
            if (snap.__source !== "auto") return false;
            // New multi-filter format
            if (Array.isArray(snap.__filterNames) && snap.__filterNames.includes(filter.name)) return true;
            // Legacy single-filter format (backward compat)
            if (snap.__filterId === filter.id) return true;
            return false;
          });

          for (const saved of filterSaved) {
            const normUrl = normListingUrl(saved.listing_url);
            if (!foundUrls.has(normUrl)) {
              const snap = saved.snapshot_json || {};
              // Remove this filter from __filterNames; only archive when empty.
              const remaining = (snap.__filterNames || [snap.__filterName].filter(Boolean))
                .filter(name => name !== filter.name);

              await apiFetch(`/searches/${saved.id}`, {
                method: "PATCH",
                body: {
                  snapshot_json: {
                    ...snap,
                    __filterNames:  remaining,
                    __archived:     remaining.length === 0,
                    __archivedAt:   remaining.length === 0 ? new Date().toISOString() : snap.__archivedAt,
                    __isNew:        false,
                  },
                },
              });

              if (remaining.length === 0) {
                archivedCount++;
                setJob(prev => ({ ...prev, archivedCount }));
              }
            }
          }
        }
      } catch { /* archive detection failed silently */ }

      setJob(prev => ({
        ...prev, phase: "processing",
        total: allFoundUrls.length,
        phaseMsg: `Znaleziono ${allFoundUrls.length} ogłoszeń`,
      }));

      // ── Phase C: process each listing ────────────────────────
      const dedupUrls = [...new Set(allFoundUrls.map(u => normListingUrl(u)))];

      for (let i = 0; i < dedupUrls.length; i++) {
        if (cancelRef.current) break;
        const normUrl = dedupUrls[i];

        setJob(prev => ({
          ...prev, processed: processedCount + skippedCount, current: normUrl,
        }));

        try {
          const existingRes = await apiFetch(
            `/searches/lookup/by-url?listing_url=${encodeURIComponent(normUrl)}`
          );
          let existingRow = null;
          if (existingRes.ok) existingRow = await existingRes.json();

          if (existingRow?.id) {
            const existSnap = existingRow.snapshot_json || {};

            // FIX #5: sameFilter uses __filterNames, not __filterId.
            const existingFilterNames = new Set(
              existSnap.__filterNames || [existSnap.__filterName].filter(Boolean)
            );
            const sameFilter = existingFilterNames.has(filter.name);

            if (!sameFilter) {
              // Add this filter to the vehicle's filter tracking.
              existingFilterNames.add(filter.name);

              try {
                await apiFetch(`/searches/${existingRow.id}`, {
                  method: "PATCH",
                  body: {
                    snapshot_json: {
                      ...existSnap,
                      __filterNames: [...existingFilterNames],
                      __lastSeenAt:  new Date().toISOString(),
                      __archived:    false,
                      __isNew:       false,
                    },
                  },
                });
              } catch { /* silent */ }
              skippedCount++;
              setJob(prev => ({ ...prev, skipped: skippedCount }));
              await sleep(300);
              continue;
            }

            // Same filter — check for price change and refresh __lastSeenAt
            const oldPrice = existSnap.price;
            try {
              const md  = await fetchPage(normUrl);
              const car = parseMd(md, normUrl);

              if (car.price && oldPrice && Math.abs(car.price - oldPrice) > 100) {
                priceChanges++;
                const priceDiff = car.price - oldPrice;

                const prevHistory = Array.isArray(existSnap.__priceHistory)
                  ? existSnap.__priceHistory
                  : [];
                const cappedHistory = [
                  ...prevHistory,
                  { price: oldPrice, recordedAt: existSnap.__lastSeenAt || existingRow.created_at },
                ].slice(-MAX_PRICE_HISTORY);

                await apiFetch(`/searches/${existingRow.id}`, {
                  method: "PATCH",
                  body: {
                    snapshot_json: {
                      ...existSnap,
                      price:           car.price,
                      __priceHistory:  cappedHistory,
                      __priceDiff:     priceDiff,
                      __priceChangedAt: new Date().toISOString(),
                      __lastSeenAt:    new Date().toISOString(),
                      __archived:      false,
                      __isNew:         false,
                    },
                  },
                });
                setJob(prev => ({ ...prev, priceChanges }));
              } else {
                const changedAt = existSnap.__priceChangedAt;
                const isExpired =
                  changedAt &&
                  Date.now() - new Date(changedAt).getTime() > PRICE_CHANGE_TTL_MS;

                await apiFetch(`/searches/${existingRow.id}`, {
                  method: "PATCH",
                  body: {
                    snapshot_json: {
                      ...existSnap,
                      ...(isExpired ? { __priceDiff: null, __priceChangedAt: null } : {}),
                      __lastSeenAt: new Date().toISOString(),
                      __archived:   false,
                      __isNew:      false,
                    },
                  },
                });
              }
            } catch { /* price re-fetch failed silently */ }

            skippedCount++;
            setJob(prev => ({ ...prev, skipped: skippedCount }));
            await sleep(400);
            continue;
          }

          // ── New listing ──────────────────────────────────────
          const md  = await fetchPage(normUrl);
          const car = parseMd(md, normUrl);
          car.listingUrl = normUrl;

          const snapshot = {
            ...stripDebug(car),
            __source:        "auto",
            __filterId:      filter.id,
            __filterName:    filter.name,
            __filterNames:   [filter.name],
            __isNew:         true,
            __firstSeenAt:   new Date().toISOString(),
            __lastSeenAt:    new Date().toISOString(),
            __archived:      false,
            __priceHistory:  [],
            __priceDiff:     null,
            __priceChangedAt: null,
          };

          if (!car.vin && /otomoto\.pl/i.test(normUrl)) {
            try {
              const vinRes = await apiFetch(`/scraper/vin?listing_url=${encodeURIComponent(normUrl)}`);
              if (vinRes.ok) {
                const { vin } = await vinRes.json();
                if (vin) { car.vin = vin; snapshot.vin = vin; }
              }
            } catch { /* silent */ }
          }

          if (cancelRef.current) break;

          let searchId = null;
          try {
            const manualRes = await apiFetch(
              `/searches/lookup/by-url?listing_url=${encodeURIComponent(normUrl)}`
            );
            if (manualRes.ok) {
              const manualRow = await manualRes.json();
              if (manualRow?.id && manualRow.snapshot_json?.__source === "manual") {
                await apiFetch(`/searches/${manualRow.id}`, {
                  method: "PATCH",
                  body: {
                    snapshot_json: {
                      ...manualRow.snapshot_json,
                      __source:        "auto",
                      __filterId:      filter.id,
                      __filterName:    filter.name,
                      __filterNames:   [filter.name],
                      __isNew:         true,
                      __firstSeenAt:   new Date().toISOString(),
                      __lastSeenAt:    new Date().toISOString(),
                      __archived:      false,
                      __priceHistory:  [],
                      __priceDiff:     null,
                      __priceChangedAt: null,
                    },
                  },
                });
                searchId = manualRow.id;
                newCount++;
                processedCount++;
                setJob(prev => ({ ...prev, newCount }));
              }
            }
          } catch { /* silent */ }

          if (!searchId) {
            const saveRes = await apiFetch("/searches", {
              method: "POST",
              body: {
                listing_url:               normUrl,
                snapshot_json:             snapshot,
                manual_vin:                car.vin               || null,
                manual_first_registration: car.firstRegistration || null,
                manual_license_plate:      car.licensePlate       || null,
              },
            });
            if (saveRes.ok) {
              const saved = await saveRes.json();
              searchId = saved.id;
              newCount++;
              setJob(prev => ({ ...prev, newCount }));
            }
          }

          if (cancelRef.current) break;

          const plate = normalizeLicensePlate(car.licensePlate || "");
          const vin   = normalizeVin(car.vin || "");
          const fr    = normalizeDateForCepik(car.firstRegistration || "");

          if (searchId && isValidLicensePlate(plate) && isValidVin(vin) && fr) {
            try {
              const cepikRes = await apiFetch("/cepik/verify", {
                method: "POST",
                body: {
                  search_id:               searchId,
                  registration_number:     plate,
                  vin_number:              vin,
                  first_registration_date: fr,
                  listing_snapshot:        snapshot,
                  force_refresh:           false,
                },
              });
              if (cepikRes.ok) {
                cepikVerifiedCount++;
                setJob(prev => ({ ...prev, cepikVerified: cepikVerifiedCount }));
              }
            } catch { /* silent */ }
          }

          processedCount++;
        } catch (err) {
          setJob(prev => ({
            ...prev,
            errors: [...(prev?.errors ?? []).slice(-4),
              `${normUrl.split("/").pop()}: ${err.message ?? "błąd"}`],
          }));
        }

        await sleep(SCAN_DELAY_MS + Math.random() * 1500);
      }

    } catch (err) {
      setJob(prev => ({
        ...prev, errors: [...(prev?.errors ?? []), err.message ?? "Nieznany błąd"],
      }));
    } finally {
      runningRef.current = false;
      setJob(null);
      onJobComplete?.({
        processedCount, skippedCount, cepikVerifiedCount,
        newCount, archivedCount, priceChanges,
        filterId: filterIdRef.current,
      });
    }
  }, [me, onJobComplete]);

  const cancelJob = useCallback(() => { cancelRef.current = true; }, []);

  return { job, isRunning: Boolean(job?.isRunning), startJob, cancelJob };
}
