import { useEffect, useState } from "react";
import {
  normalizeLicensePlate,
  normalizeVin,
  normalizeDateForCepik,
  isValidLicensePlate,
  isValidVin,
} from "../utils/normalize.js";

function getValidationStatus(key, draft) {
  const raw = String(draft ?? "").trim();
  if (!raw) return { status: "empty", msg: "" };

  if (key === "vin") {
    const s = normalizeVin(raw);
    const ok = /^[A-HJ-NPR-Z0-9]{17}$/.test(s);
    return { status: ok ? "valid" : "invalid", msg: `${s.length}/17 ${ok ? "✓" : "✗"}` };
  }
  if (key === "licensePlate") {
    const s = normalizeLicensePlate(raw);
    const ok = isValidLicensePlate(s);
    return {
      status: ok ? "valid" : "invalid",
      msg: ok ? `"${s}" ✓` : "✗ 4–9 znaków (m.in. krótkie tablice)",
    };
  }
  if (key === "firstRegistration") {
    const ok = /^\d{4}-\d{2}-\d{2}$/.test(raw);
    return { status: ok ? "valid" : "invalid", msg: ok ? "✓" : "✗ YYYY-MM-DD" };
  }
  return { status: "empty", msg: "" };
}

function HistField({ label, value, fieldKey, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState(null);
  const [validation, setValidation] = useState(null);

  const startEdit = () => {
    const seed = (() => {
      if (fieldKey === "vin") return normalizeVin(value || "");
      if (fieldKey === "licensePlate") return normalizeLicensePlate(value || "");
      if (fieldKey === "firstRegistration") return normalizeDateForCepik(value || "");
      return value || "";
    })();
    setDraft(seed);
    setErr(null);
    setEditing(true);
  };

  const save = async () => {
    const normalized = (() => {
      if (fieldKey === "vin") return normalizeVin(draft);
      if (fieldKey === "licensePlate") return normalizeLicensePlate(draft);
      if (fieldKey === "firstRegistration") return normalizeDateForCepik(draft);
      return draft.trim();
    })();
    const v = getValidationStatus(fieldKey, normalized || draft);
    if (v.status === "invalid") { setErr("Niepoprawna wartość"); return; }
    const result = await onSave(normalized || null);
    if (result?.error) { setErr(result.error); return; }
    setEditing(false);
  };

  return (
    <div className="hist-field">
      <div className="hist-field-key">{label}</div>
      {editing ? (
        <>
          <input
            value={draft}
            onChange={e => {
              const v = e.target.value;
              setDraft(v);
              setValidation(getValidationStatus(fieldKey, v));
            }}
            onPaste={e => {
              if (fieldKey === "licensePlate") {
                e.preventDefault();
                const p = e.clipboardData?.getData("text") ?? "";
                const n = normalizeLicensePlate(p);
                setDraft(n);
                setValidation(getValidationStatus(fieldKey, n));
              }
            }}
            {...(fieldKey === "firstRegistration" ? { type: "date" } : {})}
            maxLength={fieldKey === "vin" ? 17 : 20}
            autoFocus
          />
          {validation?.msg && (
            <div className={`validation-msg ${validation.status}`}>{validation.msg}</div>
          )}
          <div className="hist-field-edit-actions">
            <button type="button" className="hist-field-edit-btn" onClick={save}>Zapisz</button>
            <button type="button" className="hist-field-edit-btn" onClick={() => setEditing(false)}>Anuluj</button>
          </div>
          {err && <div className="hist-field-edit-err">{err}</div>}
        </>
      ) : (
        <button
          type="button"
          className={`hist-field-val ${!value ? "nil" : ""}`}
          onClick={startEdit}
          title="Kliknij aby edytować"
        >
          <span style={{ opacity: .5, marginRight: 4, fontSize: "10px" }}>✎</span>
          {value || "brak"}
        </button>
      )}
    </div>
  );
}

export default function HistoryDrawer({
  open,
  onClose,
  history,
  histLoading,
  histVerifyBusy,
  me,
  onOpenItem,
  onDeleteItem,
  onPatchItem,
  onVerifyItem,
}) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      <div className={`drawer-overlay ${open ? "open" : ""}`} onClick={onClose} />
      <div className={`history-drawer ${open ? "open" : ""}`} role="dialog" aria-label="Historia wyszukiwań">
        <div className="drawer-header">
          <div className="drawer-title">Historia</div>
          <button type="button" className="drawer-close" onClick={onClose}>✕</button>
        </div>
        <div className="drawer-body">
          {histLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ border: "1px solid var(--border2)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 10, padding: "10px 8px", background: "var(--card2)" }}>
                    <div className="skeleton" style={{ width: 90, height: 56 }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 7, justifyContent: "center" }}>
                      <div className="skeleton" style={{ width: "70%", height: 18 }} />
                      <div className="skeleton" style={{ width: "50%", height: 10 }} />
                      <div className="skeleton" style={{ width: "40%", height: 9 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!me && <div className="note">Zaloguj się, aby zobaczyć historię.</div>}
          {me && !histLoading && history.length === 0 && (
            <div className="note">Brak zapisanych wyszukiwań.</div>
          )}
          {me && history.map(h => {
            const snap = h.snapshot_json || {};
            const img = snap.images?.[0];
            const title = [snap.brand, snap.model, snap.year].filter(Boolean).join(" ") || "Pojazd";
            const ver = h.verification;
            const subtitleParts = [];
            if (snap.engineDisplacement) subtitleParts.push(`${Number(snap.engineDisplacement).toLocaleString("pl-PL")} cm³`);
            if (snap.enginePower) subtitleParts.push(`${snap.enginePower} KM`);
            if (snap.mileage) subtitleParts.push(`${Number(snap.mileage).toLocaleString("pl-PL")} km`);
            const effPlate = h.manual_license_plate ?? snap.licensePlate ?? null;
            const effVin = h.manual_vin ?? snap.vin ?? null;
            const effFirstReg = h.manual_first_registration ?? snap.firstRegistration ?? null;
            const canRowVerify = Boolean(
              me &&
                effPlate &&
                effVin &&
                normalizeDateForCepik(effFirstReg || "") &&
                isValidLicensePlate(effPlate) &&
                isValidVin(effVin),
            );

            return (
              <div key={h.id} className="hist-row">
                <div className="hist-row-top">
                  {img
                    ? <img className="hist-thumb" src={img} alt="" />
                    : <div className="hist-thumb" style={{ background: "var(--border)" }} />
                  }
                  <div className="hist-main">
                    <div className="hist-title">{title}</div>
                    {subtitleParts.length > 0 && (
                      <div className="hist-sub">{subtitleParts.join(" · ")}</div>
                    )}
                    <div className="hist-meta">{new Date(h.created_at).toLocaleString("pl-PL")}</div>
                    <div className="hist-badges">
                      {ver?.status === "ok" && <div className="hist-badge ok">✓ OK</div>}
                      {ver?.status === "warning" && <div className="hist-badge warn">⚠ Uwagi</div>}
                    </div>
                  </div>
                  <div className="hist-actions">
                    <button
                      type="button"
                      className="hist-act primary"
                      disabled={!canRowVerify || histVerifyBusy[h.id]}
                      onClick={() => onVerifyItem(h)}
                      title="Weryfikuj"
                    >
                      {histVerifyBusy[h.id] ? "…" : "🔎"}
                    </button>
                    <button
                      type="button"
                      className="hist-act"
                      onClick={() => onOpenItem(h.id)}
                      title="Otwórz"
                    >
                      ➔
                    </button>
                    <button
                      type="button"
                      className="hist-act danger"
                      onClick={() => onDeleteItem(h.id)}
                      title="Usuń"
                    >
                      🗑
                    </button>
                  </div>
                </div>
                <div className="hist-fields">
                  <HistField
                    label="Tablice"
                    value={effPlate ? normalizeLicensePlate(effPlate) : null}
                    fieldKey="licensePlate"
                    onSave={val => onPatchItem(h.id, "manual_license_plate", val)}
                  />
                  <HistField
                    label="VIN"
                    value={effVin ? normalizeVin(effVin) : null}
                    fieldKey="vin"
                    onSave={val => onPatchItem(h.id, "manual_vin", val)}
                  />
                  <HistField
                    label="1. rej."
                    value={effFirstReg ? normalizeDateForCepik(effFirstReg) : null}
                    fieldKey="firstRegistration"
                    onSave={val => onPatchItem(h.id, "manual_first_registration", val)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
