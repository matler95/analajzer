export default function StatusBanner({ notice, className = "" }) {
  if (!notice) return null;
  return <div className={`status-banner ${className} ${notice.kind === "error" ? "error" : ""}`.trim()}>{notice.msg}</div>;
}
