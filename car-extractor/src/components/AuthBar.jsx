import { useState } from "react";

export default function AuthBar({ me, authEmail, setAuthEmail, authPass, setAuthPass, authErr, login, register, logout, onHistoryToggle, historyOpen }) {
  const [expanded, setExpanded] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") login();
  };

  if (me) {
    return (
      <div className="auth-bar">
        <div className="auth-bar-user">
          <span>Zalogowano: <strong>{me.email}</strong></span>
        </div>
        <button
          type="button"
          className={`auth-drawer-toggle ${historyOpen ? "active" : ""}`}
          onClick={onHistoryToggle}
          title="Historia wyszukiwań"
        >
          ☰ HISTORIA
        </button>
        <button type="button" className="auth-bar-btn danger" onClick={logout}>
          Wyloguj
        </button>
      </div>
    );
  }

  if (!expanded) {
    return (
      <div className="auth-bar">
        <button type="button" className="auth-bar-btn" onClick={() => setExpanded(true)}>
          Zaloguj się
        </button>
      </div>
    );
  }

  return (
    <div className="auth-bar">
      <div className="auth-bar-form">
        <input
          type="email"
          placeholder="Email"
          value={authEmail}
          onChange={e => setAuthEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="Hasło"
          value={authPass}
          onChange={e => setAuthPass(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="current-password"
        />
        {authErr && <span className="auth-bar-err">{authErr}</span>}
        <button type="button" className="auth-bar-btn primary" onClick={login}>Loguj</button>
        <button type="button" className="auth-bar-btn" onClick={register}>Rejestracja</button>
        <button type="button" className="auth-bar-btn" onClick={() => setExpanded(false)}>✕</button>
      </div>
    </div>
  );
}
