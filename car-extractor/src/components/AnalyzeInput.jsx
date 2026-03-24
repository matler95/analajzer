export default function AnalyzeInput({ portal, url, setUrl, loading, run }) {
  return (
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
        {portal !== "unknown" && <div className={`portal-chip ${portal}`}>{portal.toUpperCase()}.PL</div>}
        <button className="go-btn" onClick={run} disabled={loading || !url.trim()}>
          {loading ? "···" : "ANALIZUJ"}
        </button>
      </div>
      <div className="hint">
        Obsługiwane: otomoto.pl <span className="hint-dot">·</span> olx.pl
        <span className="hint-dot">·</span> Działa przez r.jina.ai — bez klucza API
      </div>
    </div>
  );
}
