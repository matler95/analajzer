import { useMemo, useId } from "react";

function parseReadingDate(s) {
  if (s == null || s === "") return NaN;
  const str = String(s).trim();
  const iso = Date.parse(str);
  if (Number.isFinite(iso)) return iso;
  const m = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (m) {
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return d.getTime();
  }
  return NaN;
}

/** Jak backend compare_listing_cepi / cepik_normalize: spacje, tysiące, zagnieżdżone value. */
export function parseKmFlexible(raw) {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) return Math.round(raw);
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    for (const k of ["value", "amount", "kilometers", "reading", "odometerValue", "mileage"]) {
      if (k in raw) {
        const inner = parseKmFlexible(raw[k]);
        if (inner != null) return inner;
      }
    }
    return null;
  }
  let s = String(raw).replace(/\u00a0/g, " ").trim();
  s = s.replace(/\s*(km|KM)\s*$/i, "");
  const noSpace = s.replace(/\s/g, "");
  if (/^\d{1,3}([.,]\d{3})+$/.test(noSpace)) return parseInt(noSpace.replace(/[.,]/g, ""), 10);
  if (/^\d+([.,]\d+)?$/.test(noSpace)) {
    const n = parseFloat(noSpace.replace(",", "."));
    if (Number.isFinite(n) && n >= 0) return Math.round(n);
  }
  const digits = s.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function getKm(r) {
  const tryKeys = ["mileage", "value", "odometerValue", "reading"];
  for (const k of tryKeys) {
    if (r[k] != null && r[k] !== "") {
      const n = parseKmFlexible(r[k]);
      if (n != null) return n;
    }
  }
  return null;
}

function extractReadingDateRaw(r) {
  const raw = r.raw && typeof r.raw === "object" ? r.raw : {};
  const cands = [
    r.date,
    r.checkDate,
    r.readingDate,
    r.eventDate,
    r.odometerReadingDate,
    r.measurementDate,
    raw.eventDate,
    raw.checkDate,
    raw.readingDate,
    raw.date,
  ];
  for (const c of cands) {
    if (c != null && String(c).trim() !== "") return c;
  }
  return null;
}

/** Zwraca punkty posortowane chronologicznie (najstarszy → najnowszy) lub wg kolejności z API. */
export function buildOdometerPoints(readings) {
  if (!Array.isArray(readings) || readings.length === 0) return [];

  const withMeta = readings.map((r, idx) => {
    const km = getKm(r);
    if (km == null) return null;
    const rawDate = extractReadingDateRaw(r);
    const t = rawDate != null && String(rawDate).trim() !== "" ? parseReadingDate(rawDate) : NaN;
    return { km, t, rawDate, idx };
  }).filter(Boolean);

  if (withMeta.length === 0) return [];

  const dated = withMeta.filter(p => Number.isFinite(p.t));
  const allHaveDates = dated.length === withMeta.length;

  if (allHaveDates && dated.length > 0) {
    const sorted = [...dated].sort((a, b) => a.t - b.t || a.idx - b.idx);
    return withMonotonicPlotTimes(sorted);
  }

  if (dated.length >= 2) {
    const sorted = [...dated].sort((a, b) => a.t - b.t || a.idx - b.idx);
    return withMonotonicPlotTimes(sorted);
  }

  return [...withMeta]
    .sort((a, b) => a.idx - b.idx)
    .map((p, i) => ({
      km: p.km,
      t: i,
      label: `#${i + 1}`,
      indexOnly: true,
      rawDate: p.rawDate,
    }));
}

function formatAxisDate(ms) {
  try {
    return new Date(ms).toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  } catch {
    return "—";
  }
}

/** Kilka odczytów z tą samą datą — rozsuń na osi X (+1 min), żeby linia nie zawaliła się w jeden punkt. */
function withMonotonicPlotTimes(sortedChrono) {
  let prevT = -Infinity;
  return sortedChrono.map(p => {
    const label = formatAxisDate(p.t);
    let t = p.t;
    if (t <= prevT) t = prevT + 60_000;
    prevT = t;
    return { km: p.km, t, label, rawDate: p.rawDate };
  });
}

function pointTooltip(p) {
  const kmStr = `${p.km.toLocaleString("pl-PL")} km`;
  const d = p.rawDate != null && String(p.rawDate).trim() !== "" ? String(p.rawDate).trim() : null;
  if (d) return `${d} · ${kmStr}`;
  if (p.indexOnly) return `Odczyt ${p.label} · ${kmStr}`;
  return `${p.label} · ${kmStr}`;
}

function niceYRange(kmMin, kmMax) {
  if (!Number.isFinite(kmMin) || !Number.isFinite(kmMax)) return { lo: 0, hi: 1 };
  if (kmMin === kmMax) {
    const pad = Math.max(kmMin * 0.05, 500);
    return { lo: Math.max(0, kmMin - pad), hi: kmMax + pad };
  }
  const span = kmMax - kmMin;
  const pad = Math.max(span * 0.06, 1000);
  return { lo: Math.max(0, kmMin - pad), hi: kmMax + pad };
}

export default function OdometerChart({ readings }) {
  const fillGradId = useId().replace(/:/g, "");
  const points = useMemo(() => buildOdometerPoints(readings), [readings]);

  const svg = useMemo(() => {
    if (points.length === 0) return null;

    const VB = { w: 440, h: 200 };
    const pad = { l: 54, r: 10, t: 14, b: 36 };
    const plotW = VB.w - pad.l - pad.r;
    const plotH = VB.h - pad.t - pad.b;

    const kms = points.map(p => p.km);
    let kmMin = Math.min(...kms);
    let kmMax = Math.max(...kms);
    const { lo: y0, hi: y1 } = niceYRange(kmMin, kmMax);
    kmMin = y0;
    kmMax = y1;

    const ts = points.map(p => p.t);
    let tMin = Math.min(...ts);
    let tMax = Math.max(...ts);
    if (tMin === tMax) {
      const padT = points[0].indexOnly ? 0.5 : 86400000;
      tMin -= padT;
      tMax += padT;
    }

    const tSpan = tMax - tMin || 1;
    const kmSpan = kmMax - kmMin || 1;
    const xOf = t => pad.l + ((t - tMin) / tSpan) * plotW;
    const yOf = km => pad.t + plotH - ((km - kmMin) / kmSpan) * plotH;

    const linePts = points.map(p => `${xOf(p.t).toFixed(1)},${yOf(p.km).toFixed(1)}`).join(" ");

    const yTicks = 4;
    const yVals = Array.from({ length: yTicks }, (_, i) => kmMin + ((kmMax - kmMin) * i) / (yTicks - 1));

    const xLabelIndices = (() => {
      const n = points.length;
      if (n <= 5) return points.map((_, i) => i);
      const pick = [0, Math.floor(n / 3), Math.floor((2 * n) / 3), n - 1];
      return [...new Set(pick)].sort((a, b) => a - b);
    })();

    return (
      <svg
        className="odo-chart-svg"
        viewBox={`0 0 ${VB.w} ${VB.h}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Wykres przebiegu w czasie na podstawie danych CEPiK"
      >
        <defs>
          <linearGradient id={fillGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffc22a" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#ffc22a" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Siatka pozioma */}
        {yVals.map((yv, i) => {
          const y = yOf(yv);
          return (
            <g key={i}>
              <line
                x1={pad.l}
                y1={y}
                x2={pad.l + plotW}
                y2={y}
                className="odo-chart-grid"
              />
              <text x={pad.l - 6} y={y + 4} textAnchor="end" className="odo-chart-axis-y">
                {Math.round(yv).toLocaleString("pl-PL")}
              </text>
            </g>
          );
        })}

        {/* Obszar pod linią */}
        {points.length >= 2 && (
          <polygon
            className="odo-chart-area"
            points={`${pad.l},${pad.t + plotH} ${linePts} ${xOf(points[points.length - 1].t)},${pad.t + plotH}`}
            fill={`url(#${fillGradId})`}
          />
        )}

        {/* Linia */}
        <polyline className="odo-chart-line" fill="none" points={linePts} />

        {/* Punkty — wartość i data w tooltipcie (natywny <title> SVG) */}
        {points.map((p, i) => {
          const cx = xOf(p.t);
          const cy = yOf(p.km);
          return (
            <g key={i} className="odo-chart-point">
              <title>{pointTooltip(p)}</title>
              <circle cx={cx} cy={cy} r={14} className="odo-chart-hit" />
              <circle cx={cx} cy={cy} r={4} className="odo-chart-dot" />
            </g>
          );
        })}

        {/* Oś X — etykiety */}
        {xLabelIndices.map(idx => {
          const p = points[idx];
          const x = xOf(p.t);
          return (
            <text key={`xlab-${idx}`} x={x} y={VB.h - 14} textAnchor="middle" className="odo-chart-axis-x">
              {p.label}
            </text>
          );
        })}

        <text x={pad.l + plotW / 2} y={VB.h - 2} textAnchor="middle" className="odo-chart-unit">
          data odczytu (CEPiK)
        </text>
      </svg>
    );
  }, [points, fillGradId]);

  if (!svg) return null;

  return (
    <div className="odo-chart-wrap">
      <div className="odo-chart-caption">
        Przebieg w czasie
        <span className="odo-chart-caption-hint"> · najedź na punkt, by zobaczyć datę i km</span>
      </div>
      {svg}
    </div>
  );
}
