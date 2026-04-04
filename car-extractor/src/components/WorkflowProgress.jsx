import { isValidVin, isValidLicensePlate, normalizeDateForCepik, normalizeVin, normalizeLicensePlate } from "../utils/normalize.js";

/**
 * WorkflowProgress — compact 4-step indicator that shows "you are here"
 * in the analyze → fill → verify → save pipeline.
 * Renders between the URL input and the result card.
 */
export default function WorkflowProgress({ data, cepik, savedSearchId }) {
  if (!data) return null;

  const vinOk = data.vin && isValidVin(normalizeVin(data.vin));
  const plateOk = data.licensePlate && isValidLicensePlate(normalizeLicensePlate(data.licensePlate));
  const dateOk = data.firstRegistration && /^\d{4}-\d{2}-\d{2}$/.test(normalizeDateForCepik(data.firstRegistration));
  const identifiersOk = vinOk && plateOk && dateOk;

  const steps = [
    {
      key: "analyzed",
      label: "Przeanalizowano",
      hint: data.brand ? `${data.brand} ${data.model ?? ""}`.trim() : "dane pobrane",
      done: true, // component only renders when data exists
    },
    {
      key: "identifiers",
      label: "Identyfikatory",
      hint: identifiersOk
        ? "VIN · tablice · data ✓"
        : [
            !vinOk && "VIN",
            !plateOk && "tablice",
            !dateOk && "data rej.",
          ].filter(Boolean).join(", ") + " — brakuje",
      done: identifiersOk,
      warn: !identifiersOk,
    },
    {
      key: "cepik",
      label: "CEPiK",
      hint: cepik
        ? (() => {
            const warns = cepik.comparison?.checks?.filter(c => c.status === "warning").length ?? 0;
            return warns > 0 ? `${warns} rozbieżności` : "wszystko zgodne";
          })()
        : "oczekuje na weryfikację",
      done: Boolean(cepik),
    },
    {
      key: "saved",
      label: "Zapisano",
      hint: savedSearchId ? `ID #${savedSearchId}` : "niezapisano jeszcze",
      done: Boolean(savedSearchId),
    },
  ];

  // First non-done step = current active step
  const firstPendingIdx = steps.findIndex(s => !s.done);

  return (
    <div className="wfp-wrap" role="progressbar" aria-label="Postęp weryfikacji">
      {steps.map((step, i) => {
        const isActive = i === firstPendingIdx;
        const cls = step.done
          ? "wfp-step wfp-step--done"
          : isActive
          ? `wfp-step wfp-step--active${step.warn ? " wfp-step--warn" : ""}`
          : "wfp-step wfp-step--pending";

        return (
          <div key={step.key} className={cls}>
            <div className="wfp-dot" aria-hidden="true">
              {step.done ? "✓" : i + 1}
            </div>
            <div className="wfp-body">
              <div className="wfp-label">{step.label}</div>
              <div className="wfp-hint">{step.hint}</div>
            </div>
            {i < steps.length - 1 && (
              <div className={`wfp-line ${step.done ? "wfp-line--done" : ""}`} aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
}
