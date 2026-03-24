export default function FlowChecklist({ analysisDomain, flowState, data, normalizeDateForCepik, verificationDomain, savedSearchId, FLOW_STAGE }) {
  return (
    <div className="flow-checklist" aria-label="Postęp analizy">
      <span className={`flow-step ${analysisDomain.hasUrl ? "ok" : flowState.stage === FLOW_STAGE.IDLE ? "current" : ""}`}>1. URL</span>
      <span className={`flow-step ${analysisDomain.hasResult ? "ok" : flowState.stage === FLOW_STAGE.ANALYZING || flowState.stage === FLOW_STAGE.URL_READY ? "current" : ""}`}>2. Analiza</span>
      <span className={`flow-step ${data && data.licensePlate && data.vin && normalizeDateForCepik(data.firstRegistration || "") ? "ok" : flowState.stage === FLOW_STAGE.ANALYZED ? "current" : ""}`}>3. Dane do gov</span>
      <span className={`flow-step ${verificationDomain.isVerified ? "ok" : flowState.stage === FLOW_STAGE.READY_TO_VERIFY ? "current" : ""}`}>4. Weryfikacja</span>
      <span className={`flow-step ${savedSearchId ? "ok" : flowState.stage === FLOW_STAGE.VERIFIED ? "current" : ""}`}>5. Historia</span>
    </div>
  );
}
