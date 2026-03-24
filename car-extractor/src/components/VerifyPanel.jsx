import { useState } from "react";
import { normalizeLicensePlate, normalizeVin, normalizeDateForCepik, isValidVin, isValidLicensePlate } from "../utils/normalize.js";

function getStepCount(data) {
  let done = 0;
  if ((data?.listingUrl || "").trim()) done++;
  if ((data?.licensePlate || "").trim() || (data?.firstRegistration || "").trim()) done++;
  if ((data?.vin || "").trim()) done++;
  return done;
}

export default function VerifyPanel({ me, data, onUpdateField, onVerify, cepikLoading, cepikErr }) {
  const [pasteMsg, setPasteMsg] = useState(null);

  const plate = data?.licensePlate || "";
  const vin = data?.vin || "";
  const firstReg = data?.firstRegistration || "";

  const missingItems = [];
  if (!me) missingItems.push("logowanie");
  if (!plate.trim()) missingItems.push("numer rej.");
  else if (!isValidLicensePlate(plate)) missingItems.push("numer rej. (4–9 zn., krótkie tablice)");
  if (!vin.trim()) missingItems.push("VIN");
  else if (!isValidVin(vin)) missingItems.push("VIN (17 znaków)");
  if (!normalizeDateForCepik(firstReg)) missingItems.push("data rej.");

  const plateNorm = normalizeLicensePlate(plate);
  const canVerify =
    me && isValidLicensePlate(plate) && isValidVin(vin) && normalizeDateForCepik(firstReg);
  const stepsDone = getStepCount(data);

  const handlePlatePaste = (e) => {
    const pasted = e.clipboardData?.getData("text") ?? "";
    if (pasted) {
      e.preventDefault();
      const n = normalizeLicensePlate(pasted);
      onUpdateField("licensePlate", n);
      setPasteMsg(`"${pasted}" → "${n}"`);
      setTimeout(() => setPasteMsg(null), 2500);
    }
  };

  return (
    <div className="verify-panel">
      <div className="verify-panel-header">
        <div className="verify-panel-title">
          ✓ Weryfikacja CEPiK
        </div>
        <div className="verify-steps" title="Postęp: URL → dane → VIN">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className={`verify-dot ${i < stepsDone ? "done" : i === stepsDone ? "active" : ""}`}
            />
          ))}
        </div>
      </div>

      <div className="verify-fields">
        <div className="verify-field">
          <label className="verify-field-label" htmlFor="verify-plate">Nr rejestracyjny</label>
          <input
            id="verify-plate"
            className={`verify-input ${plate ? "has-value" : ""}`}
            value={plate}
            placeholder="np. WX12345, krótka tablica 4–9 zn."
            maxLength={12}
            onChange={e => onUpdateField("licensePlate", e.target.value)}
            onPaste={handlePlatePaste}
          />
          {plate.trim() && (
            <div className={`validation-msg ${isValidLicensePlate(plate) ? "valid" : "invalid"}`}>
              {plateNorm.length} zn. (4–9, bez spacji) {isValidLicensePlate(plate) ? "✓" : "✗"}
            </div>
          )}
        </div>

        <div className="verify-field">
          <label className="verify-field-label" htmlFor="verify-vin">VIN</label>
          <input
            id="verify-vin"
            className={`verify-input ${vin ? "has-value" : ""}`}
            value={vin}
            placeholder="17 znaków"
            maxLength={17}
            onChange={e => onUpdateField("vin", normalizeVin(e.target.value))}
          />
          {vin && (
            <div className={`validation-msg ${isValidVin(vin) ? "valid" : "invalid"}`}>
              {vin.length}/17 {isValidVin(vin) ? "✓" : "✗"}
            </div>
          )}
        </div>

        <div className="verify-field">
          <label className="verify-field-label" htmlFor="verify-date">Data 1. rejestracji</label>
          <input
            id="verify-date"
            type="date"
            className={`verify-input ${firstReg ? "has-value" : ""}`}
            value={normalizeDateForCepik(firstReg).match(/^\d{4}-\d{2}-\d{2}$/) ? normalizeDateForCepik(firstReg) : ""}
            onChange={e => onUpdateField("firstRegistration", e.target.value)}
          />
        </div>
      </div>

      <div className="verify-actions">
        <button
          type="button"
          className="verify-btn"
          onClick={onVerify}
          disabled={!canVerify || cepikLoading}
        >
          {cepikLoading ? "Weryfikuję…" : "Weryfikuj z gov.pl"}
        </button>
        {!canVerify && missingItems.length > 0 && (
          <div className="verify-hint">
            <span className="verify-hint-arrow">→</span>
            Brakuje: {missingItems.join(", ")}
            {!me && (
              <span style={{ color: "var(--amber)", marginLeft: 4 }}>(zaloguj się)</span>
            )}
          </div>
        )}
      </div>

      {cepikErr && (
        <div className="verify-err">⚠ {cepikErr}</div>
      )}

      {pasteMsg && (
        <div className="paste-toast">✓ Wklejono: {pasteMsg}</div>
      )}
    </div>
  );
}
