import { useEffect, useState, useCallback } from "react";
import "./styles/app.css";
import "./styles/additions.css";

import { useAuth } from "./hooks/useAuth.js";
import { useSearch } from "./hooks/useSearch.js";
import { useCepik } from "./hooks/useCepik.js";
import { useHistory } from "./hooks/useHistory.js";
import { useFilters } from "./hooks/useFilters.js";
import { useBackgroundJob } from "./hooks/useBackgroundJob.js";
import { mergeSearchRecord, stripDebug } from "./utils/normalize.js";
import { apiFetch } from "./api.js";

import AuthBar from "./components/AuthBar.jsx";
import HistoryDrawer from "./components/HistoryDrawer.jsx";
import ResultCard from "./components/ResultCard.jsx";
import SkeletonResult from "./components/SkeletonResult.jsx";
import StatusBanner from "./components/StatusBanner.jsx";
import FiltersTab from "./components/FiltersTab.jsx";
import VehicleDatabaseTab from "./components/VehicleDatabaseTab.jsx";
import BackgroundJobOverlay from "./components/BackgroundJobOverlay.jsx";

const MAIN_TABS = [
  { key: "search",   label: "Wyszukaj"      },
  { key: "filters",  label: "Filtry"         },
  { key: "database", label: "Baza pojazdów"  },
];

export default function App() {
  const [historyOpen,  setHistoryOpen]  = useState(false);
  const [mainTab,      setMainTab]      = useState("search");
  const [dbRefreshKey, setDbRefreshKey] = useState(0);
  const [uxNoticeGlobal, setUxNoticeGlobal] = useState(null);

  // ─── Auth ────────────────────────────────────────────────
  const {
    me, authEmail, setAuthEmail, authPass, setAuthPass, authErr,
    login, register, logout,
  } = useAuth();

  // ─── Search ──────────────────────────────────────────────
  const {
    url, setUrl, loading, data, setData, error,
    portal, savedSearchId, setSavedSearchId,
    saveBusy, saveMsg, setSaveMsg,
    cepik, setCepik,
    vinLoading,
    run, saveSearch, updateField,
  } = useSearch({ me });

  // ─── CEPiK ───────────────────────────────────────────────
  const { cepikLoading, cepikErr, setCepikErr, verifyGov } = useCepik({
    me,
    data,
    savedSearchId,
    onVerified: (result) => {
      setCepik(result);
      setSaveMsg(null);
    },
  });

  // ─── History (kept for backward compat, drawer still works) ──
  const {
    history, histLoading, histVerifyBusy,
    uxNotice, setUxNotice,
    loadHistory, deleteHistoryItem, patchHistoryItem,
    verifyHistoryItem, openHistoryItem,
  } = useHistory({ me });

  useEffect(() => {
    if (historyOpen && me) loadHistory();
  }, [historyOpen, me, loadHistory]);

  // ─── Filters ─────────────────────────────────────────────
  const { filters, addFilter, removeFilter, updateFilter, markFilterRun } = useFilters();

  // ─── Background Job ──────────────────────────────────────
  const { job, isRunning, startJob, cancelJob } = useBackgroundJob({
    me,
    onJobComplete: useCallback(({ processedCount, newCount, archivedCount, priceChanges, filterId }) => {
      setDbRefreshKey(k => k + 1);
      if (filterId) {
        markFilterRun(filterId, { processedCount, newCount, archivedCount });
      }
      // Show summary notice
      const parts = [];
      if (newCount > 0)      parts.push(`${newCount} nowych`);
      if (archivedCount > 0) parts.push(`${archivedCount} archiwalnych`);
      if (priceChanges > 0)  parts.push(`${priceChanges} zmian cen`);
      if (parts.length > 0) {
        setUxNoticeGlobal({ msg: `Skanowanie zakończone: ${parts.join(", ")}` });
        setTimeout(() => setUxNoticeGlobal(null), 8000);
      }
    }, [markFilterRun]),
  });

  // ─── Save manual search to DB (with __source: "manual") ──
  const saveManualToDb = useCallback(async ({ cepikResult } = {}) => {
    if (!data || !me) return;
    const normUrl = data.listingUrl;
    const snap = {
      ...stripDebug(data),
      __source: "manual",
      __isNew: false,
      __firstSeenAt: new Date().toISOString(),
      __lastSeenAt: new Date().toISOString(),
      __archived: false,
    };

    // Check deduplication with auto-sourced entries
    try {
      const existRes = await apiFetch(`/searches/lookup/by-url?listing_url=${encodeURIComponent(normUrl)}`);
      if (existRes.ok) {
        const existRow = await existRes.json();
        if (existRow?.id && existRow.snapshot_json?.__source === "auto") {
          // Already tracked in a filter group — just notify user
          setSaveMsg("Pojazd już jest w bazie (skanowanie automatyczne).");
          setSavedSearchId(existRow.id);
          return;
        }
      }
    } catch { /* silent */ }

    const res = await apiFetch("/searches", {
      method: "POST",
      body: {
        listing_url: normUrl,
        snapshot_json: snap,
        manual_vin: data.vin || null,
        manual_first_registration: data.firstRegistration || null,
        manual_license_plate: data.licensePlate || null,
        latest_verification: cepikResult ? {
          technicalData:  cepikResult.technicalData  || {},
          odometerReadings: cepikResult.odometerReadings || [],
          events:         cepikResult.events         || [],
          comparison:     cepikResult.comparison     || null,
          meta:           cepikResult.meta           || {},
        } : null,
      },
    });
    if (res.ok) {
      const j = await res.json();
      setSavedSearchId(j.id);
      setSaveMsg("Zapisano w bazie pojazdów.");
      setDbRefreshKey(k => k + 1);
    }
  }, [data, me, setSaveMsg, setSavedSearchId]);

  // ─── Open from history / DB ──────────────────────────────
  const handleOpenHistoryItem = useCallback(async (id) => {
    const row = await openHistoryItem(id);
    if (!row) return;
    setData(mergeSearchRecord(row));
    setSavedSearchId(row.id);
    setCepik(null); setCepikErr(null); setSaveMsg(null);
    if (row.latest_verification?.normalized) {
      setCepik({
        technicalData:    row.latest_verification.normalized.technicalData    || {},
        odometerReadings: row.latest_verification.normalized.odometerReadings || [],
        events:           row.latest_verification.normalized.events           || [],
        meta:             { fromHistory: true, cacheHit: row.latest_verification.cache_hit },
        comparison:       row.latest_verification.comparison || null,
      });
    }
    setHistoryOpen(false);
    setMainTab("search");
  }, [openHistoryItem, setData, setSavedSearchId, setCepik, setCepikErr, setSaveMsg]);

  const handleOpenDbItem = useCallback(async (id) => {
    const row = await openHistoryItem(id);
    if (!row) return;
    setData(mergeSearchRecord(row));
    setSavedSearchId(row.id);
    setCepik(null); setCepikErr(null); setSaveMsg(null);
    if (row.latest_verification?.normalized) {
      setCepik({
        technicalData:    row.latest_verification.normalized.technicalData    || {},
        odometerReadings: row.latest_verification.normalized.odometerReadings || [],
        events:           row.latest_verification.normalized.events           || [],
        meta:             { fromHistory: true, cacheHit: row.latest_verification.cache_hit },
        comparison:       row.latest_verification.comparison || null,
      });
    }
    setMainTab("search");
    setSaveMsg("Otworzono z bazy pojazdów");
  }, [openHistoryItem, setData, setSavedSearchId, setCepik, setCepikErr, setSaveMsg]);

  const handleDeleteHistoryItem = useCallback(async (id) => {
    const deletedId = await deleteHistoryItem(id);
    if (deletedId && savedSearchId === deletedId) {
      setSavedSearchId(null); setData(null); setCepik(null);
    }
    await loadHistory();
    setDbRefreshKey(k => k + 1);
  }, [deleteHistoryItem, savedSearchId, setSavedSearchId, setData, setCepik, loadHistory]);

  const handleRunFilter = useCallback((filter) => {
    if (isRunning) return;
    startJob(filter);
  }, [isRunning, startJob]);

  const combinedNotice = uxNotice || (uxNoticeGlobal ? uxNoticeGlobal : null);

  return (
    <div className="app">
      {/* ─── HEADER ─── */}
      <header className="hdr">
        <div className="hdr-hex">VX</div>
        <div>
          <div className="hdr-title">VEHICLE EXTRACTOR</div>
          <div className="hdr-sub">OTOMOTO · OLX · via Jina AI</div>
        </div>
        <AuthBar
          me={me} authEmail={authEmail} setAuthEmail={setAuthEmail}
          authPass={authPass} setAuthPass={setAuthPass} authErr={authErr}
          login={login} register={register} logout={logout}
          onHistoryToggle={() => setHistoryOpen(o => !o)}
          historyOpen={historyOpen}
        />
      </header>

      {/* ─── MAIN NAV ─── */}
      <nav className="main-nav">
        {MAIN_TABS.map(tab => (
          <button
            key={tab.key} type="button"
            className={`main-nav-tab ${mainTab === tab.key ? "main-nav-tab--active" : ""}`}
            onClick={() => setMainTab(tab.key)}
          >
            {tab.label}
            {tab.key === "database" && isRunning && (
              <span className="main-nav-badge main-nav-badge--running" title="Skanowanie w toku" />
            )}
          </button>
        ))}
      </nav>

      {/* ─── HISTORY DRAWER ─── */}
      <HistoryDrawer
        open={historyOpen} onClose={() => setHistoryOpen(false)}
        history={history} histLoading={histLoading} histVerifyBusy={histVerifyBusy}
        me={me}
        onOpenItem={handleOpenHistoryItem}
        onDeleteItem={handleDeleteHistoryItem}
        onPatchItem={patchHistoryItem}
        onVerifyItem={verifyHistoryItem}
      />

      {/* ─── MAIN CONTENT ─── */}
      <div className="main">

        {mainTab === "search" && (
          <>
            <StatusBanner notice={combinedNotice} />
            <div className="input-area">
              <div className="section-label">URL ogłoszenia</div>
              <div className="input-wrap">
                <input
                  className="url-in"
                  placeholder="https://www.otomoto.pl/osobowe/oferta/..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !loading && run()}
                />
                {portal !== "unknown" && (
                  <div className={`portal-chip ${portal}`}>{portal.toUpperCase()}.PL</div>
                )}
                <button type="button" className="go-btn" onClick={run} disabled={loading || !url.trim()}>
                  {loading ? "···" : "ANALIZUJ"}
                </button>
              </div>
              <div className="hint">
                Obsługiwane: otomoto.pl <span className="hint-dot">·</span> olx.pl
                <span className="hint-dot">·</span> Działa przez r.jina.ai
              </div>
            </div>

            {loading && <SkeletonResult />}

            {error && (
              <div className="err">
                <span className="err-ico">⚠</span>
                <div><strong>Błąd</strong> — {error}</div>
              </div>
            )}

            {data && (
              <ResultCard
                data={data} cepik={cepik}
                savedSearchId={savedSearchId} saveMsg={saveMsg} saveBusy={saveBusy}
                me={me} cepikLoading={cepikLoading} cepikErr={cepikErr} vinLoading={vinLoading}
                onUpdateField={updateField} onVerify={verifyGov}
                onSave={saveManualToDb}
              />
            )}
          </>
        )}

        {mainTab === "filters" && (
          <FiltersTab
            filters={filters} isJobRunning={isRunning}
            currentJobFilterId={job?.filterId}
            onAdd={addFilter} onRemove={removeFilter} onRun={handleRunFilter}
            me={me}
          />
        )}

        {mainTab === "database" && (
          <VehicleDatabaseTab
            key={dbRefreshKey}
            me={me}
            onOpenItem={handleOpenDbItem}
            filters={filters}
          />
        )}
      </div>

      <BackgroundJobOverlay job={job} onCancel={cancelJob} />
    </div>
  );
}
