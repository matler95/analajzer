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

const DELAY_BETWEEN_REQUESTS_MS = 2500;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export function useBackgroundJob({ me, onJobComplete }) {
  const [job, setJob] = useState(null);
  const cancelRef = useRef(false);
  const runningRef = useRef(false);
  const filterIdRef = useRef(null);

  const startJob = useCallback(async (filter) => {
    if (!me || runningRef.current) return;
    cancelRef.current = false;
    runningRef.current = true;
    filterIdRef.current = filter.id;

    setJob({
      isRunning: true,
      filterId: filter.id,
      filterName: filter.name,
      phase: "scraping",
      total: 0,
      processed: 0,
      skipped: 0,
      cepikVerified: 0,
      current: null,
      errors: [],
    });

    let processedCount = 0;
    let skippedCount = 0;
    let cepikVerifiedCount = 0;

    try {
      // ── Phase 1: Get listing URLs from search page ────────────────────
      const searchRes = await apiFetch(
        `/scraper/search-urls?search_url=${encodeURIComponent(filter.searchUrl)}&max_pages=${filter.maxPages || 2}`
      );

      if (!searchRes.ok) {
        const j = await searchRes.json().catch(() => ({}));
        setJob(prev => ({
          ...prev,
          errors: [...(prev?.errors ?? []), j.detail || "Błąd pobierania URL-i"],
        }));
        return;
      }

      const { urls } = await searchRes.json();

      setJob(prev => ({
        ...prev,
        phase: "processing",
        total: urls.length,
      }));

      // ── Phase 2: Process each listing URL ────────────────────────────
      for (let i = 0; i < urls.length; i++) {
        if (cancelRef.current) break;

        const listingUrl = urls[i];
        const normUrl = normListingUrl(listingUrl);

        setJob(prev => ({
          ...prev,
          processed: i,
          current: listingUrl,
        }));

        try {
          // Check if already in database (skip duplicates)
          if (me) {
            const existing = await apiFetch(
              `/searches/lookup/by-url?listing_url=${encodeURIComponent(normUrl)}`
            );
            if (existing.ok) {
              const row = await existing.json();
              if (row && row.id) {
                skippedCount++;
                setJob(prev => ({ ...prev, skipped: skippedCount }));
                await sleep(300);
                continue;
              }
            }
          }

          // Fetch listing via Jina AI
          const md = await fetchPage(listingUrl);
          const car = parseMd(md, listingUrl);
          car.listingUrl = normUrl;

          // Enrich snapshot with filter metadata
          const snapshot = {
            ...stripDebug(car),
            __source: "auto",
            __filterId: filter.id,
            __filterName: filter.name,
          };

          // Try to get VIN via backend scraper if missing (otomoto only)
          if (!car.vin && /otomoto\.pl/i.test(listingUrl)) {
            try {
              const vinRes = await apiFetch(
                `/scraper/vin?listing_url=${encodeURIComponent(normUrl)}`
              );
              if (vinRes.ok) {
                const { vin } = await vinRes.json();
                if (vin) {
                  car.vin = vin;
                  snapshot.vin = vin;
                }
              }
            } catch {
              // VIN fetch failed silently
            }
          }

          if (cancelRef.current) break;

          // Save to searches database
          let searchId = null;
          const saveRes = await apiFetch("/searches", {
            method: "POST",
            body: {
              listing_url: normUrl,
              snapshot_json: snapshot,
              manual_vin: car.vin || null,
              manual_first_registration: car.firstRegistration || null,
              manual_license_plate: car.licensePlate || null,
            },
          });

          if (saveRes.ok) {
            const saved = await saveRes.json();
            searchId = saved.id;
          }

          if (cancelRef.current) break;

          // ── CEPiK verification if all required data is available ──────
          const plate = normalizeLicensePlate(car.licensePlate || "");
          const vin = normalizeVin(car.vin || "");
          const fr = normalizeDateForCepik(car.firstRegistration || "");

          if (searchId && isValidLicensePlate(plate) && isValidVin(vin) && fr) {
            try {
              const cepikRes = await apiFetch("/cepik/verify", {
                method: "POST",
                body: {
                  search_id: searchId,
                  registration_number: plate,
                  vin_number: vin,
                  first_registration_date: fr,
                  listing_snapshot: snapshot,
                  force_refresh: false,
                },
              });
              if (cepikRes.ok) {
                cepikVerifiedCount++;
                setJob(prev => ({ ...prev, cepikVerified: cepikVerifiedCount }));
              }
            } catch {
              // CEPiK verification failed silently
            }
          }

          processedCount++;

        } catch (err) {
          setJob(prev => ({
            ...prev,
            errors: [
              ...(prev?.errors ?? []).slice(-4), // keep last 5 errors
              `${new URL(listingUrl).pathname.split("/").pop()}: ${err.message ?? "nieznany błąd"}`,
            ],
          }));
        }

        // Rate-limit delay
        await sleep(DELAY_BETWEEN_REQUESTS_MS + Math.random() * 1500);
      }

    } catch (err) {
      setJob(prev => ({
        ...prev,
        errors: [...(prev?.errors ?? []), err.message ?? "Nieznany błąd"],
      }));
    } finally {
      runningRef.current = false;
      setJob(null);
      onJobComplete?.({ processedCount, skippedCount, cepikVerifiedCount, filterId: filterIdRef.current });
    }
  }, [me, onJobComplete]);

  const cancelJob = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const isRunning = Boolean(job?.isRunning);

  return { job, isRunning, startJob, cancelJob };
}
