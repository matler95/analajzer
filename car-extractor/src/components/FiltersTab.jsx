import { useState } from "react";

function formatDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString("pl-PL", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return null;
  }
}

function FilterCard({ filter, isJobRunning, isThisRunning, onRun, onRemove }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleRemove = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 2500);
      return;
    }
    onRemove(filter.id);
  };

  return (
    <div className={`filter-card ${isThisRunning ? "filter-card--running" : ""}`}>
      <div className="filter-card-body">
        <div className="filter-card-head">
          <div className="filter-card-name">{filter.name}</div>
          <div className="filter-card-pages">
            <span className="filter-card-pages-lbl">Stron:</span>
            <span className="filter-card-pages-val">{filter.maxPages}</span>
          </div>
        </div>

        <div className="filter-card-url" title={filter.searchUrl}>
          {filter.searchUrl || <span style={{ color: "var(--muted)", fontStyle: "italic" }}>Brak URL</span>}
        </div>

        <div className="filter-card-meta">
          {filter.lastRunAt ? (
            <>
              <span className="filter-card-meta-item">
                Ostatnie: <strong>{formatDate(filter.lastRunAt)}</strong>
              </span>
              {filter.lastRunCount != null && (
                <span className="filter-card-meta-item">
                  Znaleziono: <strong>{filter.lastRunCount}</strong>
                </span>
              )}
            </>
          ) : (
            <span className="filter-card-meta-item filter-card-meta-never">
              Nigdy nie uruchomiono
            </span>
          )}
        </div>
      </div>

      <div className="filter-card-actions">
        <button
          type="button"
          className="filter-run-btn"
          onClick={() => onRun(filter)}
          disabled={isJobRunning || !filter.searchUrl}
          title={isJobRunning ? "Inne zadanie jest w toku" : "Uruchom skanowanie"}
        >
          {isThisRunning ? (
            <span className="filter-run-spinner" aria-hidden="true" />
          ) : (
            "▶"
          )}
          <span>{isThisRunning ? "W toku…" : "Uruchom"}</span>
        </button>

        <button
          type="button"
          className={`filter-del-btn ${confirmDelete ? "filter-del-btn--confirm" : ""}`}
          onClick={handleRemove}
          title={confirmDelete ? "Kliknij ponownie, aby potwierdzić" : "Usuń filtr"}
        >
          {confirmDelete ? "Potwierdź ✗" : "🗑"}
        </button>
      </div>
    </div>
  );
}

function AddFilterForm({ onAdd, onClose }) {
  const [name, setName] = useState("");
  const [searchUrl, setSearchUrl] = useState("");
  const [maxPages, setMaxPages] = useState(2);
  const [err, setErr] = useState(null);

  const handleSubmit = () => {
    if (!name.trim()) { setErr("Podaj nazwę filtru"); return; }
    if (!searchUrl.trim()) { setErr("Podaj URL wyszukiwania z otomoto.pl"); return; }
    if (!searchUrl.includes("otomoto.pl")) { setErr("URL musi być adresem otomoto.pl"); return; }
    setErr(null);
    onAdd({ name: name.trim(), searchUrl: searchUrl.trim(), maxPages });
    onClose();
  };

  return (
    <div className="filter-add-form">
      <div className="filter-add-title">Nowy filtr wyszukiwania</div>

      <div className="filter-add-hint">
        Wyszukaj ogłoszenia na{" "}
        <a href="https://www.otomoto.pl/osobowe" target="_blank" rel="noreferrer" style={{ color: "var(--amber)" }}>
          otomoto.pl
        </a>
        , ustaw filtry, skopiuj URL strony i wklej poniżej.
      </div>

      <div className="filter-add-fields">
        <div className="filter-add-field">
          <label className="filter-add-label">Nazwa filtru</label>
          <input
            className="filter-add-input"
            placeholder="np. BMW serii 3, rocznik 2018–2022"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={60}
            autoFocus
          />
        </div>

        <div className="filter-add-field">
          <label className="filter-add-label">URL wyszukiwania otomoto.pl</label>
          <input
            className="filter-add-input"
            placeholder="https://www.otomoto.pl/osobowe/bmw/seria-3?..."
            value={searchUrl}
            onChange={e => setSearchUrl(e.target.value)}
          />
        </div>

        <div className="filter-add-field filter-add-field--sm">
          <label className="filter-add-label">Liczba stron do skanowania</label>
          <div className="filter-pages-row">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                className={`filter-pages-btn ${maxPages === n ? "filter-pages-btn--active" : ""}`}
                onClick={() => setMaxPages(n)}
              >
                {n}
              </button>
            ))}
            <span className="filter-pages-note">≈ {maxPages * 32} ogłoszeń</span>
          </div>
        </div>
      </div>

      {err && <div className="filter-add-err">⚠ {err}</div>}

      <div className="filter-add-footer">
        <button type="button" className="filter-add-submit" onClick={handleSubmit}>
          Dodaj filtr
        </button>
        <button type="button" className="filter-add-cancel" onClick={onClose}>
          Anuluj
        </button>
      </div>
    </div>
  );
}

export default function FiltersTab({ filters, isJobRunning, currentJobFilterId, onAdd, onRemove, onRun, me }) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="filters-tab">
      <div className="filters-tab-header">
        <div className="filters-tab-title-row">
          <div>
            <div className="section-label">Filtry wyszukiwania</div>
            <div className="filters-tab-desc">
              Zdefiniuj wyszukiwania z otomoto.pl — aplikacja automatycznie przeskanuje ogłoszenia, pobierze dane i wykona weryfikację CEPiK.
            </div>
          </div>
          {!showAddForm && (
            <button
              type="button"
              className="filter-new-btn"
              onClick={() => setShowAddForm(true)}
            >
              + Nowy filtr
            </button>
          )}
        </div>
      </div>

      {showAddForm && (
        <AddFilterForm
          onAdd={onAdd}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {!me && (
        <div className="filter-login-note">
          ⚠ Zaloguj się, aby uruchamiać automatyczne skanowanie i zapisywać wyniki.
        </div>
      )}

      {filters.length === 0 && !showAddForm ? (
        <div className="filters-empty">
          <div className="filters-empty-ico">🔍</div>
          <div className="filters-empty-title">Brak zapisanych filtrów</div>
          <div className="filters-empty-desc">
            Kliknij „+ Nowy filtr", aby dodać pierwsze wyszukiwanie.
          </div>
        </div>
      ) : (
        <div className="filter-list">
          {filters.map(f => (
            <FilterCard
              key={f.id}
              filter={f}
              isJobRunning={isJobRunning}
              isThisRunning={isJobRunning && currentJobFilterId === f.id}
              onRun={onRun}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}

      <div className="filter-info-box">
        <div className="filter-info-title">Jak działa automatyczne skanowanie?</div>
        <ol className="filter-info-list">
          <li>Aplikacja otwiera stronę wyników wyszukiwania z otomoto.pl (przez Playwright — wymaga aktywnej sesji).</li>
          <li>Zbiera linki do ogłoszeń z wybranych stron wyników.</li>
          <li>Dla każdego ogłoszenia pobiera dane przez Jina AI i parsuje je.</li>
          <li>Jeśli ogłoszenie zawiera VIN (lub go znajdzie), przeprowadza weryfikację w CEPiK.</li>
          <li>Wyniki trafiają do zakładki „Baza pojazdów".</li>
        </ol>
      </div>
    </div>
  );
}
