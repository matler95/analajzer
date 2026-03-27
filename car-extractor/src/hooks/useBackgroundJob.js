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
// Max pages safety limit — auto detection can go up to this
const MAX_PAGES_AUTO = 10;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Fetch ALL listing URLs from a search URL, auto-detecting total pages.
 * Returns deduplicated list of listing URLs.
 */
async function fetchAllListingUrls(searchUrl, cancelRef, onProgress) {
  const allUrls = [];
  let currentUrl = searchUrl;
  let pageNum = 0;

  while (pageNum < MAX_PAGES_AUTO) {
    if (cancelRef.current) break;

    onProgress?.(`Pobieranie strony ${pageNum + 1}…`);

    const res = await apiFetch(
      `/scraper/search-urls?search_url=${encodeURIComponent(currentUrl)}&max_pages=1`
    );

    if (!res.ok) break;
    const { urls, next_url } = await res.json();

    if (!urls || urls.length === 0) break;

    allUrls.push(...urls);
    pageNum++;

    // If backend returned a next page URL use it, otherwise try to build it
    if (next_url) {
      currentUrl = next_url;
    } else {
      // Build next page URL using otomoto's page parameter
      try {
        const u = new URL(currentUrl);
        const currentPage = parseInt(u.searchParams.get("page") || "1", 10);
        u.searchParams.set("page", String(currentPage + 1));
        currentUrl = u.toString();
      } catch {
        break;
      }
    }

    // If this page returned fewer than 32 results it's likely the last page
    if (urls.length < 30) break;

    await sleep(800);
  }

  // Deduplicate preserving order
  const seen = new Set();
  return allUrls.filter(u => {
    if (seen.has(u)) return false;
    seen.add(u);
    return true;
  });
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

    // Support both old (single searchUrl) and new (multi searchUrls) filters
    const searchUrls = filter.searchUrls?.length
      ? filter.searchUrls
      : filter.searchUrl
        ? [filter.searchUrl]
        : [];

    if (searchUrls.length === 0) {
      runningRef.current = false;
      return;
    }

    setJob({
      isRunning: true,
      filterId: filter.id,
      filterName: filter.name,
      phase: "scraping",
      batchIndex: 0,
      batchTotal: searchUrls.length,
      total: 0,
      processed: 0,
      skipped: 0,
      cepikVerified: 0,
      current: null,
      errors: [],
      phaseMsg: "",
    });

    let processedCount = 0;
    let skippedCount = 0;
    let cepikVerifiedCount = 0;

    try {
      // ── Process each brand/URL batch ──────────────────────────────────
      for (let batchIdx = 0; batchIdx < searchUrls.length; batchIdx++) {
        if (cancelRef.current) break;

        const batchUrl = searchUrls[batchIdx];
        const batchLabel = filter.vehicles?.[batchIdx]
          ? `${filter.vehicles[batchIdx].brand}${filter.vehicles[batchIdx].model ? "/" + filter.vehicles[batchIdx].model : ""}`
          : `Partia ${batchIdx + 1}`;

        setJob(prev => ({
          ...prev,
          phase: "scraping",
          batchIndex: batchIdx,
          phaseMsg: `Pobieranie ogłoszeń: ${batchLabel}…`,
        }));

        // Auto-detect all pages for this batch
        let urls = [];
        try {
          urls = await fetchAllListingUrls(batchUrl, cancelRef, (msg) => {
            setJob(prev => ({ ...prev, phaseMsg: msg }));
          });
        } catch (err) {
          setJob(prev => ({
            ...prev,
            errors: [...(prev?.errors ?? []), `Błąd pobierania URL: ${err.message}`],
          }));
          continue;
        }

        if (cancelRef.current) break;

        setJob(prev => ({
          ...prev,
          phase: "processing",
          total: prev.total + urls.length,
          phaseMsg: `${batchLabel}: znaleziono ${urls.length} ogłoszeń`,
        }));

        // ── Phase 2: Process each listing URL ──────────────────────────
        for (let i = 0; i < urls.length; i++) {
          if (cancelRef.current) break;

          const listingUrl = urls[i];
          const normUrl = normListingUrl(listingUrl);

          setJob(prev => ({
            ...prev,
            processed: processedCount + skippedCount,
            current: listingUrl,
          }));

          try {
            // Check if already in database (skip duplicates)
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

            // ── CEPiK verification if all required data is available ───
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
                ...(prev?.errors ?? []).slice(-4),
                `${new URL(listingUrl).pathname.split("/").pop()}: ${err.message ?? "nieznany błąd"}`,
              ],
            }));
          }

          // Rate-limit delay
          await sleep(DELAY_BETWEEN_REQUESTS_MS + Math.random() * 1500);
        }
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
