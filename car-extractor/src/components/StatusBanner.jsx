export default function StatusBanner({ notice }) {
  if (!notice) return null;
  return (
    <div className={`status-banner ${notice.kind === "error" ? "error" : ""}`.trim()}>
      {notice.msg}
    </div>
  );
}
