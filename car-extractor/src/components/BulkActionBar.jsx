/**
 * BulkActionBar — slides up from the bottom when ≥1 vehicle card is selected.
 * Offers: select-all, batch delete (with undo), batch CEPiK verify.
 *
 * Props:
 *   selectedIds     Set<number>
 *   totalVisible    number  — count of currently visible (filtered) rows
 *   verifiableIds   number[] — subset of selectedIds that have all required fields
 *   verifyBusy      boolean — true while batch verify is running
 *   onSelectAll     () => void
 *   onClearAll      () => void
 *   onBatchDelete   () => void
 *   onBatchVerify   () => void
 */
export default function BulkActionBar({
  selectedIds,
  totalVisible,
  verifiableIds,
  verifyBusy,
  onSelectAll,
  onClearAll,
  onBatchDelete,
  onBatchVerify,
}) {
  const count        = selectedIds.size;
  const verifyCount  = verifiableIds.length;
  const allSelected  = count > 0 && count === totalVisible;

  if (count === 0) return null;

  return (
    <div className="bulk-bar" role="toolbar" aria-label="Akcje grupowe">
      {/* Selection summary */}
      <div className="bulk-bar-count">
        <span className="bulk-bar-num">{count}</span>
        <span className="bulk-bar-lbl"> zaznaczonych</span>
      </div>

      {/* Select/deselect all */}
      <button
        type="button"
        className="bulk-bar-btn bulk-bar-btn--secondary"
        onClick={allSelected ? onClearAll : onSelectAll}
      >
        {allSelected ? "Odznacz wszystkie" : `Zaznacz wszystkie (${totalVisible})`}
      </button>

      <div className="bulk-bar-divider" aria-hidden="true" />

      {/* Batch CEPiK verify */}
      <button
        type="button"
        className="bulk-bar-btn bulk-bar-btn--verify"
        onClick={onBatchVerify}
        disabled={verifyCount === 0 || verifyBusy}
        title={
          verifyCount === 0
            ? "Żaden z zaznaczonych nie ma kompletnych danych do weryfikacji"
            : `Zweryfikuj ${verifyCount} z ${count} zaznaczonych`
        }
      >
        {verifyBusy ? (
          <>
            <span className="bulk-bar-spin" aria-hidden="true" />
            Weryfikuję…
          </>
        ) : (
          `🔎 Weryfikuj CEPiK (${verifyCount})`
        )}
      </button>

      {/* Batch delete */}
      <button
        type="button"
        className="bulk-bar-btn bulk-bar-btn--delete"
        onClick={onBatchDelete}
        title={`Usuń ${count} zaznaczonych`}
      >
        🗑 Usuń ({count})
      </button>

      {/* Dismiss */}
      <button
        type="button"
        className="bulk-bar-btn bulk-bar-btn--close"
        onClick={onClearAll}
        aria-label="Anuluj zaznaczenie"
      >
        ✕
      </button>
    </div>
  );
}
