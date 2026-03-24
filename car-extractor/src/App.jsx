import { useEffect, useState } from "react";
import "./styles/app.css";

import { useAuth } from "./hooks/useAuth.js";
import { useSearch } from "./hooks/useSearch.js";
import { useCepik } from "./hooks/useCepik.js";
import { useHistory } from "./hooks/useHistory.js";
import { mergeSearchRecord } from "./utils/normalize.js";

import AuthBar from "./components/AuthBar.jsx";
import HistoryDrawer from "./components/HistoryDrawer.jsx";
import ResultCard from "./components/ResultCard.jsx";
import SkeletonResult from "./components/SkeletonResult.jsx";
import StatusBanner from "./components/StatusBanner.jsx";

export default function App() {
  const [historyOpen, setHistoryOpen] = useState(false);

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

  // Open from history
  const handleOpenHistoryItem = async (id) => {
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
  };

  const handleDeleteHistoryItem = async (id) => {
    const deletedId = await deleteHistoryItem(id);
    if (deletedId && savedSearchId === deletedId) {
      setSavedSearchId(null);
      setData(null);
      setCepik(null);
    }
    await loadHistory();
  };

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

      {/* ─── MAIN ─── */}
      <div className="main">
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

        {/* Skeleton loading — mirrors ResultCard shape */}
        {loading && <SkeletonResult />}

        {/* Error */}
        {error && (
          <div className="err">
            <span className="err-ico">⚠</span>
            <div><strong>Błąd</strong> — {error}</div>
          </div>
        )}

        {/* Result */}
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
            onUpdateField={updateField}
            onVerify={verifyGov}
            onSave={saveSearch}
          />
        )}
      </div>
    </div>
  );
}
