export default function AuthModal({
  showAuthModal,
  setShowAuthModal,
  authEmail,
  setAuthEmail,
  authPass,
  setAuthPass,
  authErr,
  login,
  register,
}) {
  if (!showAuthModal) return null;
  return (
    <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setShowAuthModal(false)} type="button">
          ✕
        </button>
        <div className="modal-header">Logowanie</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <input
            type="email"
            placeholder="Email"
            value={authEmail}
            onChange={e => setAuthEmail(e.target.value)}
            className="id-input"
            autoComplete="username"
            onKeyDown={e => e.key === "Enter" && login()}
          />
          <input
            type="password"
            placeholder="Hasło"
            value={authPass}
            onChange={e => setAuthPass(e.target.value)}
            className="id-input"
            autoComplete="current-password"
            onKeyDown={e => e.key === "Enter" && login()}
          />
          {authErr && <div className="err"><span className="err-ico">⚠</span>{authErr}</div>}
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" className="act-btn primary" onClick={login} style={{ flex: 1 }}>
              Loguj
            </button>
            <button type="button" className="act-btn" onClick={register} style={{ flex: 1 }}>
              Rejestracja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
