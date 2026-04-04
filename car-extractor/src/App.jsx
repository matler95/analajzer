import { useEffect, useState, useCallback, useRef } from "react";
import "./styles/app.css";
import "./styles/additions.css";
import "./styles/phase-enhancements.css";
import "./styles/phase-enhancements-p4-7.css";
import "./styles/phase-enhancements-p8-10.css";
import "./styles/phase-vdb-improvements.css";

import { useAuth } from "./hooks/useAuth.js";
import { useSearch } from "./hooks/useSearch.js";
import { useCepik } from "./hooks/useCepik.js";
import { useHistory } from "./hooks/useHistory.js";
import { useFilters } from "./hooks/useFilters.js";
import { useBackgroundJob } from "./hooks/useBackgroundJob.js";
import { useScanHistory } from "./hooks/useScanHistory.js";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts.js";
import { useSessionGuard } from "./hooks/useSessionGuard.js";
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
import SearchEmptyState from "./components/SearchEmptyState.jsx";
import WorkflowProgress from "./components/WorkflowProgress.jsx";
import ScanHistoryDrawer from "./components/ScanHistoryDrawer.jsx";
import KeyboardHelpModal from "./components/KeyboardHelpModal.jsx";
import SessionExpiredModal from "./components/SessionExpiredModal.jsx";

const MAIN_TABS = [
  { key: "search",   label: "Wyszukaj"     },
  { key: "filters",  label: "Filtry"        },
  { key: "database", label: "Baza pojazdów" },
];

export default function App() {
  const [historyOpen,      setHistoryOpen]     = useState(false);
  const [scanHistOpen,     setScanHistOpen]    = useState(false);
  const [helpOpen,         setHelpOpen]        = useState(false);
  const [mainTab,          setMainTab]         = useState("search");
  const [dbRefreshKey,     setDbRefreshKey]    = useState(0);
  const [uxNoticeGlobal,   setUxNoticeGlobal]  = useState(null);
  const [openedFromSource, setOpenedFromSource]= useState(null);
  const [sessionExpired,   setSessionExpired]  = useState(false);
  const urlInputRef = useRef(null);

  // ─── Auth ─────────────────────────────────────────────────
  const {
    me, authEmail, setAuthEmail, authPass, setAuthPass, authErr,
    login, register, logout, refreshMe,
  } = useAuth();

  // ─── Session guard ────────────────────────────────────────
  useSessionGuard({ onExpired: useCallback(() => setSessionExpired(true), []) });

  // ─── Search ───────────────────────────────────────────────
  const {
    url, setUrl, loading, data, setData, error,
    portal, savedSearchId, setSavedSearchId,
    saveBusy, saveMsg, setSaveMsg,
    cepik, setCepik, vinLoading, run, updateField,
  } = useSearch({ me });

  // ─── CEPiK ────────────────────────────────────────────────
  const { cepikLoading, cepikErr, setCepikErr, verifyGov } = useCepik({
    me, data, savedSearchId,
    onVerified: (result) => { setCepik(result); setSaveMsg(null); },
  });

  // ─── History ──────────────────────────────────────────────
  const {
    history, histLoading, histVerifyBusy, uxNotice, setUxNotice,
    loadHistory, deleteHistoryItem, patchHistoryItem, verifyHistoryItem, openHistoryItem,
  } = useHistory({ me });

  useEffect(() => { if (historyOpen && me) loadHistory(); }, [historyOpen, me, loadHistory]);

  // ─── Filters ──────────────────────────────────────────────
  const { filters, addFilter, removeFilter, updateFilter, markFilterRun } = useFilters();

  // ─── Scan history ─────────────────────────────────────────
  const { scanHistory, addScanRun, clearScanHistory } = useScanHistory();

  // ─── Background Job ───────────────────────────────────────
  const { job, isRunning, startJob, cancelJob } = useBackgroundJob({
    me,
    onJobComplete: useCallback((stats) => {
      setDbRefreshKey(k => k + 1);
      if (stats.filterId) markFilterRun(stats.filterId, stats);
      const filterName = filters.find(f => f.id === stats.filterId)?.name ?? "Skan";
      addScanRun({ ...stats, filterName });
      const parts = [];
      if (stats.newCount      > 0) parts.push(`${stats.newCount} nowych`);
      if (stats.archivedCount > 0) parts.push(`${stats.archivedCount} archiwalnych`);
      if (stats.priceChanges  > 0) parts.push(`${stats.priceChanges} zmian cen`);
      if (parts.length) {
        setUxNoticeGlobal({ msg: `Skanowanie zakończone: ${parts.join(", ")}` });
        setTimeout(() => setUxNoticeGlobal(null), 8000);
      }
    }, [markFilterRun, addScanRun, filters]),
  });

  // ─── Keyboard shortcuts ───────────────────────────────────
  useKeyboardShortcuts({
    onFocusUrl:      useCallback(() => { setMainTab("search"); urlInputRef.current?.focus(); }, []),
    onSave:          useCallback(() => { if (data && me) saveManualToDb({}); }, [data, me]),
    onRun:           useCallback(() => { if (url.trim() && !loading) handleRun(); }, [url, loading]),
    onTabSwitch:     useCallback((key) => setMainTab(key), []),
    onToggleHelp:    useCallback(() => setHelpOpen(v => !v), []),
    onToggleHistory: useCallback(() => setHistoryOpen(v => !v), []),
  });

  // ─── Run ──────────────────────────────────────────────────
  const handleRun = useCallback(() => { setOpenedFromSource(null); run(); }, [run]);

  // ─── Save ─────────────────────────────────────────────────
  const saveManualToDb = useCallback(async ({ cepikResult } = {}) => {
    if (!data || !me) return;
    const normUrl = data.listingUrl;
    const snap = {
      ...stripDebug(data),
      __source: "manual", __isNew: false, __archived: false,
      __firstSeenAt: new Date().toISOString(),
      __lastSeenAt:  new Date().toISOString(),
    };
    try {
      const existRes = await apiFetch(`/searches/lookup/by-url?listing_url=${encodeURIComponent(normUrl)}`);
      if (existRes.ok) {
        const existRow = await existRes.json();
        if (existRow?.id && existRow.snapshot_json?.__source === "auto") {
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
        manual_vin:                data.vin               || null,
        manual_first_registration: data.firstRegistration || null,
        manual_license_plate:      data.licensePlate       || null,
        latest_verification: cepikResult ? {
          technicalData:    cepikResult.technicalData    || {},
          odometerReadings: cepikResult.odometerReadings || [],
          events:           cepikResult.events           || [],
          comparison:       cepikResult.comparison       || null,
          meta:             cepikResult.meta             || {},
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

  // ─── Open helpers ─────────────────────────────────────────
  const applyOpenedRecord = useCallback((row, source) => {
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
    setOpenedFromSource(source);
    setMainTab("search");
  }, [setData, setSavedSearchId, setCepik, setCepikErr, setSaveMsg]);

  const handleOpenHistoryItem = useCallback(async (id) => {
    const row = await openHistoryItem(id);
    if (!row) return;
    applyOpenedRecord(row, "history");
    setHistoryOpen(false);
  }, [openHistoryItem, applyOpenedRecord]);

  const handleOpenDbItem = useCallback(async (id) => {
    const row = await openHistoryItem(id);
    if (!row) return;
    applyOpenedRecord(row, "database");
    setSaveMsg("Otworzono z bazy pojazdów");
  }, [openHistoryItem, applyOpenedRecord, setSaveMsg]);

  const handleDeleteHistoryItem = useCallback(async (id) => {
    const deletedId = await deleteHistoryItem(id);
    if (deletedId && savedSearchId === deletedId) {
      setSavedSearchId(null); setData(null); setCepik(null); setOpenedFromSource(null);
    }
    await loadHistory();
    setDbRefreshKey(k => k + 1);
  }, [deleteHistoryItem, savedSearchId, setSavedSearchId, setData, setCepik, loadHistory]);

  const handleRunFilter    = useCallback((f) => { if (!isRunning) startJob(f); }, [isRunning, startJob]);
  const handleBackToSource = useCallback(() => {
    if (openedFromSource === "database") setMainTab("database");
    else if (openedFromSource === "history") setHistoryOpen(true);
    setOpenedFromSource(null);
  }, [openedFromSource]);

  const combinedNotice = uxNotice || uxNoticeGlobal || null;

  return (
    <div className="app">
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

      <nav className="main-nav">
        {MAIN_TABS.map(tab => (
          <button key={tab.key} type="button"
            className={`main-nav-tab ${mainTab === tab.key ? "main-nav-tab--active" : ""}`}
            onClick={() => setMainTab(tab.key)}
          >
            {tab.label}
            {tab.key === "database" && isRunning && (
              <span className="main-nav-badge main-nav-badge--running" title="Skanowanie w toku" />
            )}
          </button>
        ))}
        <button type="button" className="main-nav-help-btn" onClick={() => setHelpOpen(true)} title="Skróty klawiszowe (?)">?</button>
      </nav>

      <HistoryDrawer
        open={historyOpen} onClose={() => setHistoryOpen(false)}
        history={history} histLoading={histLoading} histVerifyBusy={histVerifyBusy} me={me}
        onOpenItem={handleOpenHistoryItem} onDeleteItem={handleDeleteHistoryItem}
        onPatchItem={patchHistoryItem} onVerifyItem={verifyHistoryItem}
      />

      <ScanHistoryDrawer
        open={scanHistOpen} onClose={() => setScanHistOpen(false)}
        scanHistory={scanHistory} onClear={clearScanHistory}
      />

      <KeyboardHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      {sessionExpired && (
        <SessionExpiredModal
          authEmail={authEmail} setAuthEmail={setAuthEmail}
          authPass={authPass}   setAuthPass={setAuthPass}
          authErr={authErr} login={login}
          onLogin={async () => { setSessionExpired(false); await refreshMe(); }}
          onDismiss={() => setSessionExpired(false)}
        />
      )}

      <div className="main">
        {mainTab === "search" && (
          <>
            <StatusBanner notice={combinedNotice} />
            {openedFromSource && data && (
              <button type="button" className="back-to-source-btn" onClick={handleBackToSource}>
                ← {openedFromSource === "database" ? "Wróć do bazy pojazdów" : "Wróć do historii"}
              </button>
            )}
            <div className="input-area">
              <div className="section-label">URL ogłoszenia</div>
              <div className="input-wrap">
                <input ref={urlInputRef} className="url-in"
                  placeholder="https://www.otomoto.pl/osobowe/oferta/..."
                  value={url} onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !loading && handleRun()} />
                {portal !== "unknown" && (
                  <div className={`portal-chip ${portal}`}>{portal.toUpperCase()}.PL</div>
                )}
                <button type="button" className="go-btn" onClick={handleRun} disabled={loading || !url.trim()}>
                  {loading ? "···" : "ANALIZUJ"}
                </button>
              </div>
              <div className="hint">
                Obsługiwane: otomoto.pl <span className="hint-dot">·</span> olx.pl
                <span className="hint-dot">·</span> Działa przez r.jina.ai
                <span className="hint-dot">·</span>
                <button type="button" className="hint-kbd-btn" onClick={() => setHelpOpen(true)}>skróty klawiszowe</button>
              </div>
            </div>
            <WorkflowProgress data={data} cepik={cepik} savedSearchId={savedSearchId} />
            {loading && <SkeletonResult />}
            {error && (
              <div className="err">
                <span className="err-ico">⚠</span>
                <div><strong>Błąd</strong> — {error}</div>
              </div>
            )}
            {!loading && !data && !error && <SearchEmptyState />}
            {data && (
              <ResultCard
                data={data} cepik={cepik}
                savedSearchId={savedSearchId} saveMsg={saveMsg} saveBusy={saveBusy}
                me={me} cepikLoading={cepikLoading} cepikErr={cepikErr} vinLoading={vinLoading}
                onUpdateField={updateField} onVerify={verifyGov} onSave={saveManualToDb}
              />
            )}
          </>
        )}

        {mainTab === "filters" && (
          <FiltersTab
            filters={filters} isJobRunning={isRunning} currentJobFilterId={job?.filterId}
            onAdd={addFilter} onRemove={removeFilter} onUpdate={updateFilter}
            onRun={handleRunFilter} me={me}
          />
        )}

        {mainTab === "database" && (
          <VehicleDatabaseTab key={dbRefreshKey} me={me} onOpenItem={handleOpenDbItem} filters={filters} />
        )}
      </div>

      <BackgroundJobOverlay job={job} onCancel={cancelJob} onViewHistory={() => setScanHistOpen(true)} />
    </div>
  );
}
