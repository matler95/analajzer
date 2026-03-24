/**
 * SkeletonResult — pulsing placeholder that mirrors the shape of ResultCard.
 * Rendered while fetchPage() is in flight so users see the layout before data arrives.
 */
export default function SkeletonResult() {
  return (
    <div className="skeleton-result" aria-busy="true" aria-label="Ładowanie ogłoszenia…">

      {/* Hero */}
      <div className="skeleton-hero">
        <div className="skeleton skeleton-hero-img" />
        <div className="skeleton-hero-body">
          <div className="skeleton-hero-info">
            {/* source label */}
            <div className="skeleton" style={{ width: 80, height: 9 }} />
            {/* brand */}
            <div className="skeleton" style={{ width: 120, height: 14 }} />
            {/* model */}
            <div className="skeleton" style={{ width: 220, height: 42, marginTop: 2 }} />
            {/* variant */}
            <div className="skeleton" style={{ width: 140, height: 11, marginTop: 2 }} />
          </div>
          <div className="skeleton-hero-price">
            <div className="skeleton" style={{ width: 160, height: 40 }} />
            <div className="skeleton" style={{ width: 80, height: 9, marginTop: 4 }} />
          </div>
        </div>
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
