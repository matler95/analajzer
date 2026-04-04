import { useEffect } from "react";

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pl-PL", {
      day: "2-digit", month: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

/**
 * ScanHistoryDrawer — slides in from the right, lists past scan runs.
 * Opened from BackgroundJobOverlay after job completes, or via keyboard shortcut.
 */
export default function ScanHistoryDrawer({ open, onClose, scanHistory, onClear }) {
  // Close on Escape
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  return (
    <>
      <div className={`drawer-overlay ${open ? "open" : ""}`} onClick={onClose} />
      <div className={`scan-hist-drawer ${open ? "open" : ""}`} role="dialog" aria-label="Historia skanowań">
        <div className="drawer-header">
          <div className="drawer-title">Historia skanowań</div>
          <div style={{ display: "flex", gap: 8 }}>
            {scanHistory.length > 0 && (
              <button type="button" className="scan-hist-clear-btn" onClick={onClear} title="Wyczyść historię">
                🗑
              </button>
            )}
            <button type="button" className="drawer-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="drawer-body">
          {scanHistory.length === 0 ? (
            <div className="note">Brak zapisanych skanowań. Historia jest uzupełniana automatycznie po każdym zakończonym skanie.</div>
          ) : (
            scanHistory.map(run => {
              const hasActivity = run.newCount > 0 || run.archivedCount > 0 || run.priceChanges > 0;
              return (
                <div key={run.id} className="scan-hist-row">
                  <div className="scan-hist-row-header">
                    <div className="scan-hist-filter-name">{run.filterName}</div>
                    <div className="scan-hist-date">{formatDateTime(run.completedAt)}</div>
                  </div>

                  <div className="scan-hist-stats">
                    <span className="scan-hist-stat">
                      <span className="scan-hist-stat-val">{run.processedCount}</span>
                      <span className="scan-hist-stat-lbl"> przejrzanych</span>
                    </span>
                    {run.newCount > 0 && (
                      <span className="scan-hist-stat scan-hist-stat--new">
                        +{run.newCount} nowych
                      </span>
                    )}
                    {run.archivedCount > 0 && (
                      <span className="scan-hist-stat scan-hist-stat--arch">
                        {run.archivedCount} archiw.
                      </span>
                    )}
                    {run.priceChanges > 0 && (
                      <span className="scan-hist-stat scan-hist-stat--price">
                        {run.priceChanges} zmian cen
                      </span>
                    )}
                    {!hasActivity && (
                      <span className="scan-hist-stat scan-hist-stat--none">brak zmian</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
