import { useEffect } from "react";
import { SHORTCUT_DEFINITIONS } from "../hooks/useKeyboardShortcuts.js";

/**
 * KeyboardHelpModal — displayed when user presses ?.
 * Rendered as a centred overlay (not fixed position — uses a faux viewport wrapper
 * so it contributes layout height in the iframe sandbox).
 */
export default function KeyboardHelpModal({ open, onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape" || e.key === "?") onClose(); };
    if (open) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="kbd-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Skróty klawiszowe">
      <div className="kbd-modal" onClick={e => e.stopPropagation()}>
        <div className="kbd-modal-header">
          <div className="kbd-modal-title">Skróty klawiszowe</div>
          <button type="button" className="drawer-close" onClick={onClose}>✕</button>
        </div>
        <div className="kbd-modal-body">
          {SHORTCUT_DEFINITIONS.map(({ key, label }) => (
            <div key={key} className="kbd-row">
              <div className="kbd-label">{label}</div>
              <div className="kbd-keys">
                {key.split("or").map((k, i) => (
                  <span key={i}>
                    {i > 0 && <span className="kbd-or">or</span>}
                    <kbd className="kbd-chip">{k.trim()}</kbd>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="kbd-modal-footer">
          Naciśnij <kbd className="kbd-chip">?</kbd> lub <kbd className="kbd-chip">Esc</kbd> aby zamknąć
        </div>
      </div>
    </div>
  );
}
