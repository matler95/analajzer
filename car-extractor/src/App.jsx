import { useEffect, useState, useCallback } from "react";
import "./styles/app.css";
import "./styles/additions.css";

import { useAuth } from "./hooks/useAuth.js";
import { useSearch } from "./hooks/useSearch.js";
import { useCepik } from "./hooks/useCepik.js";
import { useHistory } from "./hooks/useHistory.js";
import { useFilters } from "./hooks/useFilters.js";
import { useBackgroundJob } from "./hooks/useBackgroundJob.js";
import { mergeSearchRecord } from "./utils/normalize.js";

import AuthBar from "./components/AuthBar.jsx";
import HistoryDrawer from "./components/HistoryDrawer.jsx";
import ResultCard from "./components/ResultCard.jsx";
import SkeletonResult from "./components/SkeletonResult.jsx";
import StatusBanner from "./components/StatusBanner.jsx";
import FiltersTab from "./components/FiltersTab.jsx";
import VehicleDatabaseTab from "./components/VehicleDatabaseTab.jsx";
import BackgroundJobOverlay from "./components/BackgroundJobOverlay.jsx";

const MAIN_TABS = [
  { key: "search", label: "Wyszukaj" },
  { key: "filters", label: "Filtry" },
  { key: "database", label: "Baza pojazdów" },
];

export default function App() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [mainTab, setMainTab] = useState("search");
  const [dbRefreshKey, setDbRefreshKey] = useState(0);

  // ─── Auth ───────────────────────────────────────────────
  const {
    me, authEmail, setAuthEmail, authPass, setAuthPass, authErr,
    login, register, logout,
  } = useAuth();

  // ─── Search ─────────────────────────────────────────────
  const {
    url, setUrl, loading, data, setData, error,
    portal, savedSearchId, setSavedSearchId,
    saveBusy, saveMsg, setSaveMsg,
    cepik, setCepik,
    vinLoading,
    run, saveSearch, updateField,
  } = useSearch({ me });

  // ─── CEPiK ──────────────────────────────────────────────
  const { cepikLoading, cepikErr, setCepikErr, verifyGov, canVerify } = useCepik({
    me,
    data,
    savedSearchId,
    onVerified: (result) => {
      setCepik(result);
      setSaveMsg(null);
    },
  });

  // ─── History ────────────────────────────────────────────
  const {
    history, histLoading, histVerifyBusy,
    uxNotice, setUxNotice,
    loadHistory, deleteHistoryItem, patchHistoryItem,
    verifyHistoryItem, openHistoryItem,
  } = useHistory({ me });

  useEffect(() => {
    if (historyOpen && me) loadHistory();
  }, [historyOpen, me, loadHistory]);

  // ─── Filters ────────────────────────────────────────────
  const { filters, addFilter, removeFilter, updateFilter, markFilterRun } = useFilters();

  // ─── Background Job ─────────────────────────────────────
  const { job, isRunning, startJob, cancelJob } = useBackgroundJob({
    me,
    onJobComplete: useCallback(({ processedCount, filterId }) => {
      setDbRefreshKey(k => k + 1);
      if (filterId) {
        markFilterRun(filterId, processedCount);
      }
    }, [markFilterRun]),
  });

  // ─── Open from history ──────────────────────────────────
  const handleOpenHistoryItem = useCallback(async (id) => {
    const row = await openHistoryItem(id);
    if (!row) return;
    setData(mergeSearchRecord(row));
    setSavedSearchId(row.id);
    setCepik(null);
    setCepikErr(null);
    setSaveMsg(null);
    if (row.latest_verification?.normalized) {
      setCepik({
        technicalData: row.latest_verification.normalized.technicalData || {},
        odometerReadings: row.latest_verification.normalized.odometerReadings || [],
        events: row.latest_verification.normalized.events || [],
        meta: { fromHistory: true, cacheHit: row.latest_verification.cache_hit },
        comparison: row.latest_verification.comparison || null,
      });
    }
    setHistoryOpen(false);
    setMainTab("search");
  }, [openHistoryItem, setData, setSavedSearchId, setCepik, setCepikErr, setSaveMsg]);

  // Open from vehicle database
  const handleOpenDbItem = useCallback(async (id) => {
    const row = await openHistoryItem(id);
    if (!row) return;
    setData(mergeSearchRecord(row));
    setSavedSearchId(row.id);
    setCepik(null);
    setCepikErr(null);
    setSaveMsg(null);
    if (row.latest_verification?.normalized) {
      setCepik({
        technicalData: row.latest_verification.normalized.technicalData || {},
        odometerReadings: row.latest_verification.normalized.odometerReadings || [],
        events: row.latest_verification.normalized.events || [],
        meta: { fromHistory: true, cacheHit: row.latest_verification.cache_hit },
        comparison: row.latest_verification.comparison || null,
      });
    }
    setMainTab("search");
    setSaveMsg("Otworzono z bazy pojazdów");
  }, [openHistoryItem, setData, setSavedSearchId, setCepik, setCepikErr, setSaveMsg]);

  const handleDeleteHistoryItem = useCallback(async (id) => {
    const deletedId = await deleteHistoryItem(id);
    if (deletedId && savedSearchId === deletedId) {
      setSavedSearchId(null);
      setData(null);
      setCepik(null);
    }
    await loadHistory();
  }, [deleteHistoryItem, savedSearchId, setSavedSearchId, setData, setCepik, loadHistory]);

  // ─── Run filter job ──────────────────────────────────────
  const handleRunFilter = useCallback((filter) => {
    if (isRunning) return;
    startJob(filter);
  }, [isRunning, startJob]);

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
          me={me}
          authEmail={authEmail}
          setAuthEmail={setAuthEmail}
          authPass={authPass}
          setAuthPass={setAuthPass}
          authErr={authErr}
          login={login}
          register={register}
          logout={logout}
          onHistoryToggle={() => setHistoryOpen(o => !o)}
          historyOpen={historyOpen}
        />
      </header>

      {/* ─── MAIN NAVIGATION ─── */}
      <nav className="main-nav">
        {MAIN_TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
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
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        histLoading={histLoading}
        histVerifyBusy={histVerifyBusy}
        me={me}
        onOpenItem={handleOpenHistoryItem}
        onDeleteItem={handleDeleteHistoryItem}
        onPatchItem={patchHistoryItem}
        onVerifyItem={verifyHistoryItem}
      />

      {/* ─── MAIN CONTENT ─── */}
      <div className="main">

        {/* ══ SEARCH TAB ══════════════════════════════════════ */}
        {mainTab === "search" && (
          <>
            <StatusBanner notice={uxNotice} />

            {/* URL Input */}
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
                <button
                  type="button"
                  className="go-btn"
                  onClick={run}
                  disabled={loading || !url.trim()}
                >
                  {loading ? "···" : "ANALIZUJ"}
                </button>
              </div>
              <div className="hint">
                Obsługiwane: otomoto.pl <span className="hint-dot">·</span> olx.pl
                <span className="hint-dot">·</span> Działa przez r.jina.ai — bez klucza API
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
                data={data}
                cepik={cepik}
                savedSearchId={savedSearchId}
                saveMsg={saveMsg}
                saveBusy={saveBusy}
                me={me}
                cepikLoading={cepikLoading}
                cepikErr={cepikErr}
                vinLoading={vinLoading}
                onUpdateField={updateField}
                onVerify={verifyGov}
                onSave={saveSearch}
              />
            )}
          </>
        )}

        {/* ══ FILTERS TAB ════════════════════════════════════ */}
        {mainTab === "filters" && (
          <FiltersTab
            filters={filters}
            isJobRunning={isRunning}
            currentJobFilterId={job?.filterId}
            onAdd={addFilter}
            onRemove={removeFilter}
            onRun={handleRunFilter}
            me={me}
          />
        )}

        {/* ══ DATABASE TAB ════════════════════════════════════ */}
        {mainTab === "database" && (
          <VehicleDatabaseTab
            key={dbRefreshKey}
            me={me}
            onOpenItem={handleOpenDbItem}
          />
        )}

      </div>

      {/* ─── BACKGROUND JOB OVERLAY ─── */}
      <BackgroundJobOverlay job={job} onCancel={cancelJob} />
    </div>
  );
}
