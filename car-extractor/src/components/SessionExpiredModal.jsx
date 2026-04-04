/**
 * SessionExpiredModal — shown when the JWT access token expires and the
 * refresh token is also gone. Gives the user a clear explanation and an
 * inline re-login form so they can resume right where they left off.
 *
 * The modal is a faux-viewport div (not position:fixed) so it contributes
 * layout height — required for correct rendering in iframe sandboxes.
 */
export default function SessionExpiredModal({ onLogin, onDismiss, authEmail, setAuthEmail, authPass, setAuthPass, authErr, login }) {
  const handleKeyDown = (e) => { if (e.key === "Enter") handleLogin(); };

  const handleLogin = async () => {
    const ok = await login();
    if (ok) onLogin?.();
  };

  return (
    <div className="sess-backdrop">
      <div className="sess-modal" role="alertdialog" aria-modal="true" aria-labelledby="sess-title">
        <div className="sess-icon" aria-hidden="true">⏱</div>

        <div className="sess-title" id="sess-title">Sesja wygasła</div>
        <div className="sess-desc">
          Twój token logowania wygasł. Zaloguj się ponownie — wszystkie niezapisane dane w widoku pozostaną na miejscu.
        </div>

        <div className="sess-form">
          <input
            type="email"
            className="verify-input"
            placeholder="Email"
            value={authEmail}
            onChange={e => setAuthEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="username"
            autoFocus
          />
          <input
            type="password"
            className="verify-input"
            placeholder="Hasło"
            value={authPass}
            onChange={e => setAuthPass(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="current-password"
          />
        </div>

        {authErr && <div className="verify-err">{authErr}</div>}

        <div className="sess-actions">
          <button type="button" className="verify-btn" onClick={handleLogin}>
            Zaloguj ponownie
          </button>
          <button type="button" className="auth-bar-btn" onClick={onDismiss}>
            Pomiń
          </button>
        </div>
      </div>
    </div>
  );
}
