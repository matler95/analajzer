import { useEffect, useState } from "react";

const UNDO_DURATION_MS = 5000;

/**
 * UndoToast — rendered when items are in the "pending delete" queue.
 * Each toast has a live countdown bar so users know how long they have.
 *
 * Props:
 *   stack:    [{ id, label }]  — items pending deletion
 *   onUndo:   (id) => void     — called when user clicks Cofnij
 */
export default function UndoToast({ stack, onUndo }) {
  if (!stack.length) return null;

  return (
    <div className="undo-stack" role="region" aria-live="polite" aria-label="Kolejka usuwania">
      {stack.slice(-3).map(item => (
        <UndoItem key={item.id} item={item} onUndo={onUndo} duration={UNDO_DURATION_MS} />
      ))}
    </div>
  );
}

function UndoItem({ item, onUndo, duration }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const elapsed = now - start;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(pct);
      if (pct > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  return (
    <div className="undo-toast">
      <div className="undo-toast-progress" style={{ width: `${progress}%` }} aria-hidden="true" />
      <div className="undo-toast-content">
        <span className="undo-toast-label">
          Usunięto: <strong>{item.label}</strong>
        </span>
        <button
          type="button"
          className="undo-toast-btn"
          onClick={() => onUndo(item.id)}
        >
          Cofnij
        </button>
      </div>
    </div>
  );
}

export { UNDO_DURATION_MS };
