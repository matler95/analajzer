import { useMemo } from "react";

function extractShortName(url) {
  if (!url) return null;
  try {
    const path = new URL(url).pathname;
    const parts = path.split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    // Remove trailing hash ID (e.g. -ID123456789) from otomoto slugs
    return last.replace(/-ID\d+$/, "").replace(/-/g, " ").slice(0, 40) || null;
  } catch {
    return url.slice(-40);
  }
}

export default function BackgroundJobOverlay({ job, onCancel }) {
  const progress = useMemo(() => {
    if (!job || job.total === 0) return 0;
    return Math.round((job.processed / job.total) * 100);
  }, [job]);

  const shortName = useMemo(() => extractShortName(job?.current), [job?.current]);

  if (!job) return null;

  return (
    <div className="bgjob-overlay" role="status" aria-live="polite">
      <div className="bgjob-header">
        <div className="bgjob-spinner" aria-hidden="true" />
        <div className="bgjob-title">
          <div className="bgjob-label">SKANOWANIE W TLE</div>
          <div className="bgjob-name">{job.filterName}</div>
        </div>
      </div>

      {job.phase === "scraping" ? (
        <div className="bgjob-phase">Pobieranie listy ogłoszeń…</div>
      ) : (
        <>
          <div className="bgjob-progress-wrap">
            <div className="bgjob-progress-bar">
              <div className="bgjob-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="bgjob-progress-text">{progress}%</div>
          </div>

          <div className="bgjob-stats-row">
            <span className="bgjob-stat">
              <span className="bgjob-stat-val">{job.processed}</span>
              <span className="bgjob-stat-lbl">/{job.total}</span>
            </span>
            {job.skipped > 0 && (
              <span className="bgjob-stat bgjob-stat-skip" title="Pominięto istniejące">
                ↷ {job.skipped}
              </span>
            )}
            {job.cepikVerified > 0 && (
              <span className="bgjob-stat bgjob-stat-cepik" title="Zweryfikowano CEPiK">
                ✓ {job.cepikVerified}
              </span>
            )}
          </div>

          {shortName && (
            <div className="bgjob-current" title={job.current}>
              {shortName}
            </div>
          )}

          {job.errors?.length > 0 && (
            <div className="bgjob-errors">
              ⚠ {job.errors[job.errors.length - 1]}
            </div>
          )}
        </>
      )}

      <button
        type="button"
        className="bgjob-cancel"
        onClick={onCancel}
        title="Anuluj skanowanie"
      >
        Anuluj
      </button>
    </div>
  );
}
