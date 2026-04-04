/**
 * SearchEmptyState — shown on the Search tab when no listing has been loaded yet.
 * Explains the four-step workflow so first-time users understand what the app does
 * before they paste a URL.
 */
export default function SearchEmptyState() {
  return (
    <div className="ses-wrap" aria-label="Jak korzystać z aplikacji">

      {/* Brand mark */}
      <div className="ses-brand">
        <div className="ses-hex" aria-hidden="true">VX</div>
        <div>
          <div className="ses-brand-name">Vehicle Extractor</div>
          <div className="ses-brand-tagline">Weryfikator ogłoszeń motoryzacyjnych</div>
        </div>
      </div>

      {/* Four-step workflow */}
      <div className="ses-flow" role="list" aria-label="Kroki weryfikacji">

        <div className="ses-flow-step" role="listitem">
          <div className="ses-flow-num" aria-hidden="true">01</div>
          <div className="ses-flow-body">
            <div className="ses-flow-label">Wklej URL ogłoszenia</div>
            <div className="ses-flow-hint">otomoto.pl lub olx.pl</div>
          </div>
        </div>

        <div className="ses-flow-arrow" aria-hidden="true">→</div>

        <div className="ses-flow-step" role="listitem">
          <div className="ses-flow-num" aria-hidden="true">02</div>
          <div className="ses-flow-body">
            <div className="ses-flow-label">Uzupełnij identyfikatory</div>
            <div className="ses-flow-hint">tablice, VIN, data 1. rej.</div>
          </div>
        </div>

        <div className="ses-flow-arrow" aria-hidden="true">→</div>

        <div className="ses-flow-step" role="listitem">
          <div className="ses-flow-num" aria-hidden="true">03</div>
          <div className="ses-flow-body">
            <div className="ses-flow-label">Zweryfikuj w CEPiK</div>
            <div className="ses-flow-hint">moj.gov.pl · historia pojazdu</div>
          </div>
        </div>

        <div className="ses-flow-arrow" aria-hidden="true">→</div>

        <div className="ses-flow-step" role="listitem">
          <div className="ses-flow-num" aria-hidden="true">04</div>
          <div className="ses-flow-body">
            <div className="ses-flow-label">Zapisz w bazie</div>
            <div className="ses-flow-hint">śledź ceny · wykrywaj archiwum</div>
          </div>
        </div>
      </div>

      {/* Supported portals */}
      <div className="ses-portals">
        <div className="ses-portal ses-portal--oto">
          <span className="ses-portal-dot" style={{ background: "#ff6b35" }} aria-hidden="true" />
          otomoto.pl
        </div>
        <div className="ses-portal ses-portal--olx">
          <span className="ses-portal-dot" style={{ background: "#00b140" }} aria-hidden="true" />
          olx.pl
        </div>
      </div>

      <div className="ses-cta">
        Wklej adres URL powyżej i naciśnij <kbd>Enter</kbd> lub kliknij <strong>ANALIZUJ</strong>
      </div>
    </div>
  );
}
