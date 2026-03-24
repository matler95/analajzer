/**
 * SkeletonResult — pulsing placeholder that mirrors the shape of ResultCard with hero v2.
 */
export default function SkeletonResult() {
  return (
    <div className="skeleton-result" aria-busy="true" aria-label="Ładowanie ogłoszenia…">

      {/* Hero v2 — full-bleed image area */}
      <div className="skeleton skeleton-hero-img" style={{ borderRadius: "4px 4px 0 0", border: "1px solid var(--border2)" }} />

      {/* Thumbnail strip */}
      <div style={{
        display: "flex",
        gap: 2,
        padding: 4,
        background: "var(--card2)",
        border: "1px solid var(--border2)",
        borderTop: "none",
      }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="skeleton" style={{ width: 72, height: 48, flexShrink: 0, borderRadius: 2 }} />
        ))}
      </div>

      {/* Tabs */}
      <div className="skeleton-tabs">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton skeleton-tab" />
        ))}
      </div>

      {/* Specs grid */}
      <div className="skeleton-specs">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="skeleton-spec">
            <div className="skeleton" style={{ width: "55%", height: 9 }} />
            <div className="skeleton" style={{ width: "75%", height: 16 }} />
          </div>
        ))}
      </div>

      {/* Verify panel */}
      <div className="skeleton-verify">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="skeleton" style={{ width: 160, height: 11 }} />
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ width: 8, height: 8, borderRadius: "50%" }} />
            ))}
          </div>
        </div>
        <div className="skeleton-verify-fields">
          {[1, 2, 3].map(i => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="skeleton" style={{ width: "60%", height: 9 }} />
              <div className="skeleton" style={{ width: "100%", height: 38 }} />
            </div>
          ))}
        </div>
        <div className="skeleton" style={{ width: 160, height: 38, borderRadius: 4 }} />
      </div>

      {/* Action bar */}
      <div className="skeleton-action-bar">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton skeleton-action-btn" />
        ))}
        <div style={{ flex: 1 }} />
        <div className="skeleton" style={{ width: 120, height: "100%", minHeight: 42 }} />
      </div>

    </div>
  );
}
