import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { apiFetch } from "../api.js";
import {
  normalizeLicensePlate, normalizeVin, normalizeDateForCepik,
  isValidLicensePlate, isValidVin,
} from "../utils/normalize.js";
import UndoToast, { UNDO_DURATION_MS } from "./UndoToast.jsx";
import DbStatsPanel from "./DbStatsPanel.jsx";
import PriceSparkline from "./PriceSparkline.jsx";
import PriceHistogram from "./PriceHistogram.jsx";
import BulkActionBar from "./BulkActionBar.jsx";
import CompareDrawer from "./CompareDrawer.jsx";
import { useExport } from "../hooks/useExport.js";
import { useVehicleDbPrefs, SORT_OPTIONS, sortRows } from "../hooks/useVehicleDbPrefs.js";

const COLLAPSED_KEY = "analajzer_vdb_collapsed_v1";
function loadCollapsedState() { try { return JSON.parse(localStorage.getItem(COLLAPSED_KEY) || "{}"); } catch { return {}; } }
function saveCollapsedState(s) { try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify(s)); } catch { /**/ } }

function getCepikStatus(row) {
  const ver = row.verification;
  if (ver) { if (ver.warning_count > 0) return "issues"; if (ver.ok_count > 0) return "ok"; return "check"; }
  const s = row.snapshot_json || {};
  const plate = row.manual_license_plate || s.licensePlate;
  const vin   = row.manual_vin           || s.vin;
  const fr    = row.manual_first_registration || s.firstRegistration;
  return (plate && isValidLicensePlate(normalizeLicensePlate(plate))
       && vin   && isValidVin(normalizeVin(vin))
       && fr    && /^\d{4}-\d{2}-\d{2}$/.test(normalizeDateForCepik(fr))) ? "pending" : "no_data";
}

function getMissingFields(row) {
  const s = row.snapshot_json || {};
  const missing = [];
  if (!(row.manual_license_plate || s.licensePlate) || !isValidLicensePlate(normalizeLicensePlate(row.manual_license_plate || s.licensePlate || ""))) missing.push("nr rej.");
  if (!(row.manual_vin           || s.vin)           || !isValidVin(normalizeVin(row.manual_vin || s.vin || "")))                                     missing.push("VIN");
  const fr = row.manual_first_registration || s.firstRegistration;
  if (!fr || !/^\d{4}-\d{2}-\d{2}$/.test(normalizeDateForCepik(fr || ""))) missing.push("data 1. rej.");
  return missing;
}

function computeGroupStats(rows) {
  const prices   = rows.map(r => r.snapshot_json?.price).filter(v => v > 0);
  const mileages = rows.map(r => r.snapshot_json?.mileage).filter(v => v > 0);
  const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
  const med = arr => { if (!arr.length) return null; const s = [...arr].sort((a,b)=>a-b); const m=Math.floor(s.length/2); return s.length%2?s[m]:Math.round((s[m-1]+s[m])/2); };
  return { count: rows.length, avgPrice: avg(prices), medPrice: med(prices), minPrice: prices.length?Math.min(...prices):null, maxPrice: prices.length?Math.max(...prices):null, avgMileage: avg(mileages), prices };
}

function getDealBadge(row, stats) {
  if (!stats) return null;
  const price = row.snapshot_json?.price, mileage = row.snapshot_json?.mileage;
  if (!price && !mileage) return null;
  const ps = price   && stats.medPrice   ? (stats.medPrice - price)   / stats.medPrice   : 0;
  const ms = mileage && stats.avgMileage ? (stats.avgMileage - mileage) / stats.avgMileage : 0;
  const sc = ps * 0.6 + ms * 0.4;
  if (sc > 0.15)  return { cls: "deal-badge--great",  label: "Okazja",        icon: "🔥" };
  if (sc > 0.05)  return { cls: "deal-badge--good",   label: "Dobra cena",    icon: "✓"  };
  if (sc < -0.15) return { cls: "deal-badge--pricey", label: "Powyżej rynku", icon: "↑"  };
  return null;
}

const fmt = n => (n == null ? "—" : Number(n).toLocaleString("pl-PL"));

function getImgFp(u) {
  if (!u) return null;
  try { let x=u.split("?")[0].split(";")[0].replace(/\/+$/,""); const m=x.match(/\/([a-f0-9\-]{30,}(?:\/[^/]+)?)$/); return m?m[1].toLowerCase():x.split("/").filter(Boolean).slice(-2).join("/").toLowerCase(); }
  catch { return null; }
}

/* ── StatusBadge ── */
function StatusBadge({ status }) {
  const M = { ok:{cls:"vdb-badge--ok",icon:"✓",label:"CEPiK OK"}, issues:{cls:"vdb-badge--issues",icon:"⚠",label:"Uwagi"}, check:{cls:"vdb-badge--check",icon:"?",label:"Sprawdź"}, no_data:{cls:"vdb-badge--nodata",icon:"–",label:"Brak danych"}, pending:{cls:"vdb-badge--pending",icon:"○",label:"Nie zwerif."} };
  const {cls,icon,label} = M[status]||M.no_data;
  return <span className={`vdb-badge ${cls}`}><span className="vdb-badge-icon">{icon}</span>{label}</span>;
}

/* ── InlineField ── */
function InlineField({ label, value, fieldKey, onSave }) {
  const [editing,setEditing]=useState(false); const [draft,setDraft]=useState(""); const [err,setErr]=useState(null);
  const norm = useCallback(v=>{ if(!v)return""; if(fieldKey==="vin")return normalizeVin(v); if(fieldKey==="licensePlate")return normalizeLicensePlate(v); if(fieldKey==="firstRegistration")return normalizeDateForCepik(v); return String(v).trim(); },[fieldKey]);
  const valid = useCallback(v=>{ if(!v)return"empty"; if(fieldKey==="vin")return isValidVin(v)?"ok":"invalid"; if(fieldKey==="licensePlate")return isValidLicensePlate(v)?"ok":"invalid"; if(fieldKey==="firstRegistration")return/^\d{4}-\d{2}-\d{2}$/.test(v)?"ok":"invalid"; return"ok"; },[fieldKey]);
  const dv=value?norm(value):null; const ds=valid(dv||"");
  const save=async()=>{ const n=norm(draft); if(draft&&valid(n||draft)==="invalid"){setErr("Niepoprawna wartość");return;} const r=await onSave(n||null); if(r?.error){setErr(r.error);return;} setEditing(false); };
  return (
    <div className="vdb-field">
      <div className="vdb-field-lbl">{label}</div>
      {editing ? (
        <div className="vdb-field-edit-wrap">
          <input className="vdb-field-input" value={draft} onChange={e=>{setDraft(e.target.value);setErr(null);}} {...(fieldKey==="firstRegistration"?{type:"date"}:{})} maxLength={fieldKey==="vin"?17:20} autoFocus onKeyDown={e=>{if(e.key==="Enter")save();if(e.key==="Escape")setEditing(false);}} placeholder={fieldKey==="vin"?"17 znaków":fieldKey==="licensePlate"?"np. WX12345":""} />
          <div className="vdb-field-btns"><button type="button" className="vdb-field-btn-save" onClick={save}>Zapisz</button><button type="button" className="vdb-field-btn-cancel" onClick={()=>setEditing(false)}>Anuluj</button></div>
          {err&&<div className="vdb-field-err">{err}</div>}
        </div>
      ) : (
        <button type="button" className={`vdb-field-val vdb-field-val--${dv?ds:"nil"}`} onClick={()=>{setDraft(dv||"");setErr(null);setEditing(true);}}>
          <span className="vdb-field-text">{dv||"kliknij aby uzupełnić"}</span>
          <span className="vdb-field-indicator">{dv&&ds==="ok"&&<span className="vdb-fi-ok">✓</span>}{dv&&ds==="invalid"&&<span className="vdb-fi-warn">⚠</span>}<span className="vdb-fi-edit">✎</span></span>
        </button>
      )}
    </div>
  );
}

/* ── NoteWidget ── */
function NoteWidget({ vehicleId, note, onSave }) {
  const [open,setOpen]=useState(false); const [draft,setDraft]=useState(note??"");
  const save=()=>{ onSave(vehicleId,draft); setOpen(false); };
  if(!open) return (
    <button type="button" className={`note-toggle ${note?"note-toggle--has":""}`} onClick={e=>{e.stopPropagation();setDraft(note??"");setOpen(true);}} title={note?`Notatka: ${note}`:"Dodaj notatkę"}>
      {note?"📝":"✎"}
    </button>
  );
  return (
    <div className="note-editor" onClick={e=>e.stopPropagation()}>
      <textarea className="note-textarea" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Twoja notatka…" autoFocus rows={3} onKeyDown={e=>{if(e.key==="Enter"&&e.ctrlKey)save();if(e.key==="Escape")setOpen(false);}} />
      <div className="note-actions">
        <button type="button" className="vdb-field-btn-save"   onClick={save}>Zapisz</button>
        <button type="button" className="vdb-field-btn-cancel" onClick={()=>setOpen(false)}>Anuluj</button>
        {note&&<button type="button" className="note-clear-btn" onClick={()=>{onSave(vehicleId,"");setOpen(false);}}>Usuń</button>}
      </div>
    </div>
  );
}

/* ── VehicleCard ── */
function VehicleCard({ row, dups=[], onOpen, onDelete, onPatch, onVerify, stats, verifyBusy, pendingDelete, selected, onToggleSelect, compareIds, inCompare, onToggleCompare, viewMode, note, onSaveNote, viewed, onMarkViewed }) {
  const [expanded,setExpanded]=useState(false); const [delConfirm,setDelConfirm]=useState(false);
  const s=row.snapshot_json||{}, url=row.listing_url||s.listingUrl||"", isOlx=url.includes("olx.pl");
  const hasOto=!isOlx||dups.some(d=>!(d.listing_url||"").includes("olx.pl"));
  const hasOlx=isOlx ||dups.some(d=> (d.listing_url||"").includes("olx.pl"));
  const isBoth=hasOto&&hasOlx;
  const portalLabel=isBoth?"OTO+OLX":isOlx?"OLX":"Otomoto";
  const portalCls=isBoth?"ft-portal-tag--both":isOlx?"ft-portal-tag--olx":"ft-portal-tag--otomoto";
  const img=s.images?.[0], title=[s.brand,s.model].filter(Boolean).join(" ")||"Pojazd";
  const cepikStatus=getCepikStatus(row), missing=cepikStatus==="no_data"?getMissingFields(row):[];
  const dealBadge=getDealBadge(row,stats);
  const isNew=s.__isNew===true, isArchived=s.__archived===true, priceDiff=s.__priceDiff, priceHist=s.__priceHistory||[];
  const effPlate=row.manual_license_plate??s.licensePlate??null;
  const effVin=row.manual_vin??s.vin??null;
  const effFr=row.manual_first_registration??s.firstRegistration??null;
  const canVerify=Boolean(effPlate&&isValidLicensePlate(normalizeLicensePlate(effPlate))&&effVin&&isValidVin(normalizeVin(effVin))&&effFr&&/^\d{4}-\d{2}-\d{2}$/.test(normalizeDateForCepik(effFr)));
  const specParts=[s.year,s.mileage?`${fmt(s.mileage)} km`:null,s.fuelType,s.transmission].filter(Boolean);
  const saveField=useCallback(async(k,v)=>await onPatch(row.id,k,v),[onPatch,row.id]);
  const handleDel=useCallback(()=>{ if(!delConfirm){setDelConfirm(true);setTimeout(()=>setDelConfirm(false),2500);return;} onDelete(row.id); },[delConfirm,onDelete,row.id]);
  const handleOpen=useCallback(()=>{ onMarkViewed?.(row.id); onOpen(row.id); },[onOpen,onMarkViewed,row.id]);

  const checkboxEl = onToggleSelect && (
    <div className="vdbc-checkbox-wrap vdbc-checkbox-wrap--compact" onClick={e=>{e.stopPropagation();onToggleSelect(row.id);}}>
      <div className={`vdbc-checkbox ${selected?"vdbc-checkbox--checked":""}`}>{selected&&"✓"}</div>
    </div>
  );

  /* COMPACT */
  if (viewMode==="compact") return (
    <div className={["vdbc-compact",selected?"vdbc-compact--selected":"",pendingDelete?"vdbc--pending-delete":"",viewed?"vdbc-compact--viewed":"",isNew?"vdbc-compact--new":"",isArchived?"vdbc-compact--archived":""].filter(Boolean).join(" ")}>
      {checkboxEl}
      <div className="vdbc-compact-thumb">{img?<img src={img} alt="" className="vdbc-compact-img" loading="lazy"/>:<div className="vdbc-compact-img-empty">VX</div>}{isNew&&<span className="vdbc-flag vdbc-flag--new" style={{fontSize:6}}>NEW</span>}</div>
      <div className="vdbc-compact-info"><span className="vdbc-compact-title">{title}</span><span className="vdbc-compact-specs">{specParts.join(" · ")}</span></div>
      <div className="vdbc-compact-badges"><StatusBadge status={cepikStatus}/>{dealBadge&&<span className={`vdbc-deal ${dealBadge.cls}`}>{dealBadge.icon}</span>}<span className={`ft-portal-tag ${portalCls}`} style={{fontSize:8,padding:"1px 5px"}}>{portalLabel}</span></div>
      <div className="vdbc-compact-price">{s.price&&<><span className="vdbc-compact-price-val">{fmt(s.price)}</span><span className="vdbc-compact-price-cur"> PLN</span>{priceDiff!=null&&<span className={`vdbc-diff ${priceDiff<0?"vdbc-diff--down":"vdbc-diff--up"}`} style={{fontSize:9,marginLeft:4}}>{priceDiff<0?"▼":"▲"}{fmt(Math.abs(priceDiff))}</span>}</>}</div>
      <div className="vdbc-compact-actions" onClick={e=>e.stopPropagation()}>
        <NoteWidget vehicleId={row.id} note={note} onSave={onSaveNote}/>
        {onToggleCompare&&<button type="button" className={`vdbc-compare-btn ${inCompare?"vdbc-compare-btn--active":""}`} onClick={()=>onToggleCompare(row.id)} title="Porównaj">⇌</button>}
        <button type="button" className="vdbc-btn vdbc-btn--open" style={{padding:"4px 10px",fontSize:10}} onClick={handleOpen}>↗</button>
        <button type="button" className={`vdbc-btn vdbc-btn--del ${delConfirm?"vdbc-btn--confirm":""}`} style={{padding:"4px 8px",fontSize:10}} onClick={handleDel} disabled={pendingDelete}>🗑</button>
      </div>
    </div>
  );

  /* GRID */
  if (viewMode==="grid") return (
    <div className={["vdbc-grid-card",selected?"vdbc-grid-card--selected":"",pendingDelete?"vdbc--pending-delete":"",inCompare?"vdbc-grid-card--compare":"",viewed?"vdbc-grid-card--viewed":""].filter(Boolean).join(" ")}>
      <div className="vdbc-grid-img-wrap" onClick={handleOpen}>
        {img?<img src={img} alt="" className="vdbc-grid-img" loading="lazy"/>:<div className="vdbc-grid-img-empty">VX</div>}
        <div className="vdbc-grid-overlay"/>
        <div className="vdbc-grid-top-row">
          {onToggleSelect&&<div className={`vdbc-checkbox vdbc-checkbox--grid`} style={{border:selected?"1px solid var(--amber)":"1px solid rgba(255,255,255,.4)"}} onClick={e=>{e.stopPropagation();onToggleSelect(row.id);}}>{selected&&<span style={{color:"#000",fontWeight:700}}>✓</span>}</div>}
          {isNew&&<span className="vdbc-flag vdbc-flag--new" style={{position:"static"}}>NOWY</span>}
        </div>
        <div className="vdbc-grid-price-overlay">{s.price&&<span>{fmt(s.price)}<span style={{fontSize:10,opacity:.7}}> PLN</span></span>}</div>
      </div>
      <div className="vdbc-grid-info">
        <div className="vdbc-grid-title">{title}</div>
        <div className="vdbc-grid-specs">{specParts.slice(0,3).join(" · ")}</div>
        {note&&<div className="vdbc-note-preview" style={{fontSize:9,marginTop:2}}>📝 {note}</div>}
        <div className="vdbc-grid-pills"><StatusBadge status={cepikStatus}/>{dealBadge&&<span className={`vdbc-deal ${dealBadge.cls}`}>{dealBadge.icon} {dealBadge.label}</span>}</div>
        <div className="vdbc-grid-actions" onClick={e=>e.stopPropagation()}>
          {onToggleCompare&&<button type="button" className={`vdbc-compare-btn ${inCompare?"vdbc-compare-btn--active":""}`} onClick={()=>onToggleCompare(row.id)} title="Porównaj">⇌</button>}
          <NoteWidget vehicleId={row.id} note={note} onSave={onSaveNote}/>
          <button type="button" className={`vdbc-btn vdbc-btn--del ${delConfirm?"vdbc-btn--confirm":""}`} style={{padding:"4px 8px",fontSize:10}} onClick={handleDel} disabled={pendingDelete}>🗑</button>
        </div>
      </div>
    </div>
  );

  /* LIST (default) */
  return (
    <div className={["vdbc",expanded?"vdbc--open":"",isArchived?"vdbc--archived":"",isNew?"vdbc--new":"",pendingDelete?"vdbc--pending-delete":"",selected?"vdbc--selected":"",viewed?"vdbc--viewed":""].filter(Boolean).join(" ")}>
      <div className="vdbc-hdr" onClick={()=>{setExpanded(v=>!v);onMarkViewed?.(row.id);}} role="button" tabIndex={0} onKeyDown={e=>e.key==="Enter"&&setExpanded(v=>!v)}>
        {checkboxEl}
        <div className="vdbc-thumb">{img?<img src={img} alt="" className="vdbc-img" loading="lazy"/>:<div className="vdbc-img-empty">VX</div>}{isNew&&<span className="vdbc-flag vdbc-flag--new">NOWY</span>}{isArchived&&<span className="vdbc-flag vdbc-flag--arch">ARCH.</span>}{pendingDelete&&<span className="vdbc-flag vdbc-flag--deleting">USUWA…</span>}</div>
        <div className="vdbc-info">
          <div className="vdbc-title">{title}{viewed&&<span className="vdbc-viewed-dot" title="Oglądany"/>}</div>
          {specParts.length>0&&<div className="vdbc-spec-line">{specParts.join(" · ")}</div>}
          {s.__filterName&&<div className="vdbc-filter-tag">{s.__filterName}</div>}
          {note&&<div className="vdbc-note-preview">📝 {note}</div>}
          <div className="vdbc-pills"><StatusBadge status={cepikStatus}/>{dealBadge&&<span className={`vdbc-deal ${dealBadge.cls}`}>{dealBadge.icon} {dealBadge.label}</span>}<span className={`ft-portal-tag ${portalCls}`}>{portalLabel}</span></div>
        </div>
        <div className="vdbc-aside" onClick={e=>e.stopPropagation()}>
          {s.price!=null&&(
            <div className="vdbc-price-block">
              <div className="vdbc-price">{fmt(s.price)}<span className="vdbc-cur"> {s.currency||"PLN"}</span></div>
              {priceDiff!=null&&<div className={`vdbc-diff ${priceDiff<0?"vdbc-diff--down":"vdbc-diff--up"}`}>{priceDiff<0?"▼":"▲"} {fmt(Math.abs(priceDiff))} PLN</div>}
              {priceHist.length>0&&<PriceSparkline priceHistory={priceHist} currentPrice={s.price}/>}
            </div>
          )}
          <div className="vdbc-actions">
            {onToggleCompare&&<button type="button" className={`vdbc-compare-btn ${inCompare?"vdbc-compare-btn--active":""}`} onClick={()=>onToggleCompare(row.id)} title={inCompare?"Usuń z porównania":"Dodaj do porównania"}>⇌</button>}
            <NoteWidget vehicleId={row.id} note={note} onSave={onSaveNote}/>
            <button type="button" className="vdbc-btn vdbc-btn--open" onClick={handleOpen}>↗ Otwórz</button>
            <button type="button" className={`vdbc-btn vdbc-btn--del ${delConfirm?"vdbc-btn--confirm":""}`} onClick={handleDel} disabled={pendingDelete}>{delConfirm?"Na pewno?":"🗑"}</button>
          </div>
        </div>
        <div className="vdbc-chevron" aria-hidden="true">{expanded?"▲":"▼"}</div>
      </div>

      {expanded&&(
        <div className="vdbc-body">
          {s.images?.length>1&&<div className="vdbc-imgstrip">{s.images.slice(0,8).map((u,i)=><img key={i} src={u} alt="" className="vdbc-strip-img" loading="lazy"/>)}</div>}
          {(() => {
            const specItems=[{lbl:"Rok",val:s.year},{lbl:"Przebieg",val:s.mileage?`${fmt(s.mileage)} km`:null},{lbl:"Moc",val:s.enginePower?`${s.enginePower} KM`:null},{lbl:"Pojemność",val:s.engineDisplacement?`${fmt(s.engineDisplacement)} cm³`:null},{lbl:"Paliwo",val:s.fuelType},{lbl:"Skrzynia",val:s.transmission},{lbl:"Napęd",val:s.drivetrain},{lbl:"Nadwozie",val:s.bodyType},{lbl:"Kraj",val:s.countryOfOrigin},{lbl:"Generacja",val:s.generation}].filter(x=>x.val!=null&&x.val!=="");
            return specItems.length>0&&<div className="vdbc-specs">{specItems.map(({lbl,val})=><div key={lbl} className="vdbc-spec"><div className="vdbc-spec-lbl">{lbl}</div><div className="vdbc-spec-val">{val}</div></div>)}</div>;
          })()}
          {priceHist.length>0&&<div className="vdbc-section"><div className="vdbc-section-hdr">Historia ceny</div><div className="vdbc-price-chain">{[...priceHist,{price:s.price,recordedAt:null}].map((ph,i,arr)=><div key={i} className={`vdbc-chain-item ${i===arr.length-1?"vdbc-chain-item--now":""}`}><span className="vdbc-chain-price">{fmt(ph.price)} PLN</span><span className="vdbc-chain-date">{ph.recordedAt?new Date(ph.recordedAt).toLocaleDateString("pl-PL"):"teraz"}</span></div>)}</div></div>}
          <div className="vdbc-section vdbc-cepik-section">
            <div className="vdbc-section-hdr">Weryfikacja CEPiK{missing.length>0&&<span className="vdbc-missing-tag">brakuje: {missing.join(", ")}</span>}{cepikStatus==="ok"&&<span className="vdbc-verified-tag">✓ Zweryfikowany</span>}{cepikStatus==="issues"&&<span className="vdbc-issues-tag">⚠ Rozbieżności</span>}</div>
            <div className="vdbc-fields">
              <InlineField label="Nr rejestracyjny" value={effPlate} fieldKey="licensePlate" onSave={v=>saveField("manual_license_plate",v)}/>
              <InlineField label="VIN" value={effVin} fieldKey="vin" onSave={v=>saveField("manual_vin",v)}/>
              <InlineField label="Data 1. rejestracji" value={effFr} fieldKey="firstRegistration" onSave={v=>saveField("manual_first_registration",v)}/>
            </div>
            <div className="vdbc-verify-row">
              <button type="button" className={`vdbc-verify-btn ${!canVerify||verifyBusy?"vdbc-verify-btn--disabled":""}`} disabled={!canVerify||verifyBusy} onClick={()=>canVerify&&!verifyBusy&&onVerify(row)}>{verifyBusy?"⏳ Weryfikuję…":"🔎 Weryfikuj w CEPiK"}</button>
              {!canVerify&&missing.length>0&&<span className="vdbc-verify-hint">Uzupełnij: {missing.join(", ")}</span>}
            </div>
            {row.verification&&<div className="vdbc-ver-summary"><span className="vdbc-ver-ok">✓ {row.verification.ok_count} zgodnych</span>{row.verification.warning_count>0&&<span className="vdbc-ver-warn">⚠ {row.verification.warning_count} rozbieżności</span>}{row.verification.created_at&&<span className="vdbc-ver-date">{new Date(row.verification.created_at).toLocaleDateString("pl-PL")}</span>}</div>}
          </div>
          <div className="vdbc-section" style={{background:"var(--card)"}}>
            <div className="vdbc-section-hdr">Notatka</div>
            <NoteWidget vehicleId={row.id} note={note} onSave={onSaveNote}/>
          </div>
          {(s.seller||s.location)&&<div className="vdbc-meta-footer">{s.seller&&<span>👤 {s.seller}</span>}{s.location&&<span>📍 {s.location}</span>}</div>}
          {dups.length>0&&<div className="vdbc-dup-section"><div className="vdbc-dup-title">Ogłoszenia na innych portalach</div><div className="vdbc-dup-links"><a href={url} target="_blank" rel="noreferrer" className={`vdbc-dup-link ${isOlx?"vdbc-dup-link--olx":"vdbc-dup-link--oto"}`}><span className="vdbc-dup-link-dot"/>{isOlx?"OLX":"Otomoto"}<span className="vdbc-dup-link-arr">↗</span></a>{dups.map(d=>{const du=d.listing_url||"";const dOlx=du.includes("olx.pl");return<a key={d.id} href={du} target="_blank" rel="noreferrer" className={`vdbc-dup-link ${dOlx?"vdbc-dup-link--olx":"vdbc-dup-link--oto"}`}><span className="vdbc-dup-link-dot"/>{dOlx?"OLX":"Otomoto"}<span className="vdbc-dup-link-arr">↗</span></a>;})}</div></div>}
        </div>
      )}
    </div>
  );
}

/* ── GroupStats ── */
function GroupStats({ stats, filter }) {
  if (!stats||stats.count===0) return null;
  const metrics=[{lbl:"Śr. cena",val:stats.avgPrice?`${fmt(stats.avgPrice)} PLN`:null},{lbl:"Mediana",val:stats.medPrice?`${fmt(stats.medPrice)} PLN`:null},{lbl:"Śr. przebieg",val:stats.avgMileage?`${fmt(stats.avgMileage)} km`:null},{lbl:"Szt.",val:String(stats.count)}].filter(m=>m.val);
  return (
    <div className="vdb-stats-bar">
      {metrics.map(m=><div key={m.lbl} className="vdb-stats-item"><div className="vdb-stats-val">{m.val}</div><div className="vdb-stats-lbl">{m.lbl}</div></div>)}
      {filter?.lastRunAt&&<div className="vdb-stats-item vdb-stats-item--ts"><div className="vdb-stats-val">{new Date(filter.lastRunAt).toLocaleString("pl-PL",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</div><div className="vdb-stats-lbl">Ostatni skan</div></div>}
      {stats.prices?.length>=3&&<div className="vdb-stats-item vdb-stats-item--hist"><PriceHistogram prices={stats.prices}/></div>}
    </div>
  );
}

/* ── ViewModeToggle ── */
function ViewModeToggle({ mode, onChange }) {
  return (
    <div className="vdb-view-toggle" role="group" aria-label="Tryb widoku">
      {[{key:"list",icon:"☰",title:"Lista"},{key:"compact",icon:"▤",title:"Kompakt"},{key:"grid",icon:"⊞",title:"Siatka"}].map(({key,icon,title})=>(
        <button key={key} type="button" className={`vdb-view-btn ${mode===key?"vdb-view-btn--active":""}`} onClick={()=>onChange(key)} title={title}>{icon}</button>
      ))}
    </div>
  );
}

/* ── FilterGroup ── */
function FilterGroup({ groupKey, items, filter, collapsed, onToggle, onOpen, onDelete, onPatch, onVerify, verifyBusy, pendingDeleteIds, selectedIds, onToggleSelect, compareIds, onToggleCompare, viewMode, sortKey, onSortChange, notes, onSaveNote, viewedIds, onMarkViewed, onRunScan, isJobRunning }) {
  const stats  = useMemo(()=>computeGroupStats(items),[items]);
  const sorted = useMemo(()=>sortRows(items,sortKey),[items,sortKey]);

  const newCount=items.filter(r=>r.snapshot_json?.__isNew).length;
  const archivedCount=items.filter(r=>r.snapshot_json?.__archived).length;
  const issuesCount=items.filter(r=>getCepikStatus(r)==="issues").length;
  const displayName=groupKey==="__manual"?"Ręczne wyszukiwanie":groupKey==="__none"?"Bez filtru":groupKey;

  const dedupedItems = useMemo(()=>{
    const fpMap=new Map(), noFp=[];
    for (const row of sorted){const fp=getImgFp(row.snapshot_json?.images?.[0]);if(!fp){noFp.push(row);continue;}if(!fpMap.has(fp))fpMap.set(fp,[]);fpMap.get(fp).push(row);}
    const sc=r=>{let s=0;if(r.verification?.ok_count>0)s+=1000;if(r.manual_vin||r.snapshot_json?.vin)s+=100;if(!(r.listing_url||"").includes("olx.pl"))s+=10;return s;};
    const res=[];
    for(const[,rows]of fpMap){const s=[...rows].sort((a,b)=>sc(b)-sc(a));res.push({primary:s[0],dups:s.slice(1)});}
    for(const row of noFp)res.push({primary:row,dups:[]});
    return res;
  },[sorted]);

  const mergedCount=dedupedItems.reduce((n,d)=>n+d.dups.length,0);

  return (
    <div className={`vdb-group ${collapsed?"vdb-group--collapsed":""}`}>
      <div className="vdb-group-hdr vdb-group-hdr--sticky" onClick={onToggle}>
        <span className="vdb-group-chevron">{collapsed?"▶":"▼"}</span>
        <span className="vdb-group-name">{displayName}</span>
        <span className="vdb-group-count">{items.length}</span>
        {mergedCount>0&&<span className="vdb-gbadge vdb-gbadge--merged" title={`${mergedCount} duplikatów`}>{mergedCount}×2</span>}
        <div className="vdb-group-badges">
          {newCount>0&&<span className="vdb-gbadge vdb-gbadge--new">{newCount} nowych</span>}
          {archivedCount>0&&<span className="vdb-gbadge vdb-gbadge--arch">{archivedCount} archiwum</span>}
          {issuesCount>0&&<span className="vdb-gbadge vdb-gbadge--issues">{issuesCount} uwag</span>}
        </div>
        {!collapsed&&(
          <select className="vdb-sort-select" value={sortKey||"newest"}
            onClick={e=>e.stopPropagation()} onChange={e=>{e.stopPropagation();onSortChange(groupKey,e.target.value);}} title="Sortuj grupę">
            {SORT_OPTIONS.map(o=><option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        )}
        {filter&&!collapsed&&(
          <button type="button" className="vdb-group-scan-btn" onClick={e=>{e.stopPropagation();onRunScan?.(filter);}} disabled={isJobRunning} title={`Skanuj „${filter.name}"`}>▶</button>
        )}
        {collapsed&&stats.avgPrice&&<div className="vdb-group-collapsed-meta">śr. {fmt(stats.avgPrice)} PLN · {fmt(stats.avgMileage)} km</div>}
      </div>
      {!collapsed&&(
        <>
          <GroupStats stats={stats} filter={filter}/>
          <div className={`vdb-card-list ${viewMode==="grid"?"vdb-card-list--grid":""}`}>
            {dedupedItems.map(({primary,dups:dr})=>(
              <VehicleCard key={primary.id} row={primary} dups={dr}
                onOpen={onOpen} onDelete={onDelete} onPatch={onPatch} onVerify={onVerify}
                stats={stats} verifyBusy={verifyBusy[primary.id]}
                pendingDelete={pendingDeleteIds.has(primary.id)}
                selected={selectedIds?.has(primary.id)} onToggleSelect={onToggleSelect}
                compareIds={compareIds} inCompare={compareIds?.has(primary.id)} onToggleCompare={onToggleCompare}
                viewMode={viewMode} note={notes?.[primary.id]??null} onSaveNote={onSaveNote}
                viewed={viewedIds?.has(primary.id)} onMarkViewed={onMarkViewed}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════ MAIN EXPORT ══════════════ */
export default function VehicleDatabaseTab({ me, onOpenItem, filters=[], onRunFilter }) {
  const [vehicles,setVehicles]=useState([]);
  const [loading,setLoading]=useState(false);
  const [filterStatus,setFilterStatus]=useState("all");
  const [searchQuery,setSearchQuery]=useState("");
  const [verifyBusy,setVerifyBusy]=useState({});
  const [batchVerifyBusy,setBatchVerifyBusy]=useState(false);
  const [selectedIds,setSelectedIds]=useState(new Set());
  const [compareIds,setCompareIds]=useState(new Set());
  const [collapsedGroups,setCollapsedGroups]=useState(loadCollapsedState);
  const [undoStack,setUndoStack]=useState([]);
  const pendingTimersRef=useRef({});
  const pendingDeleteIds=useMemo(()=>new Set(undoStack.map(u=>u.id)),[undoStack]);

  const {viewMode,setViewMode,sortByGroup,setSortForGroup,notes,setNote,viewedIds,markViewed,clearViewed}=useVehicleDbPrefs();
  const {exportCsv,exportJson}=useExport();

  const loadVehicles=useCallback(async()=>{ if(!me)return; setLoading(true); try{const r=await apiFetch("/searches");if(r.ok)setVehicles(await r.json());}finally{setLoading(false);} },[me]);
  useEffect(()=>{loadVehicles();},[loadVehicles]);
  useEffect(()=>()=>{Object.values(pendingTimersRef.current).forEach(clearTimeout);},[]);

  const handleToggleSelect=useCallback(id=>{setSelectedIds(prev=>{const n=new Set(prev);if(n.has(id))n.delete(id);else n.add(id);return n;});},[]);
  const handleToggleCompare=useCallback(id=>{setCompareIds(prev=>{const n=new Set(prev);if(n.has(id)){n.delete(id);}else if(n.size<3){n.add(id);}return n;});},[]);
  const toggleGroup=useCallback(key=>{setCollapsedGroups(prev=>{const n={...prev,[key]:!prev[key]};saveCollapsedState(n);return n;});},[]);

  const handleDelete=useCallback(id=>{
    const row=vehicles.find(v=>v.id===id);if(!row)return;
    const s=row.snapshot_json||{};
    const label=[s.brand,s.model,s.year].filter(Boolean).join(" ")||"Pojazd";
    setUndoStack(prev=>[...prev.filter(u=>u.id!==id),{id,label}]);
    const t=setTimeout(async()=>{await apiFetch(`/searches/${id}`,{method:"DELETE"});setVehicles(prev=>prev.filter(v=>v.id!==id));setUndoStack(prev=>prev.filter(u=>u.id!==id));delete pendingTimersRef.current[id];},UNDO_DURATION_MS);
    pendingTimersRef.current[id]=t;
  },[vehicles]);

  const handleUndoDelete=useCallback(id=>{const t=pendingTimersRef.current[id];if(t){clearTimeout(t);delete pendingTimersRef.current[id];}setUndoStack(prev=>prev.filter(u=>u.id!==id));},[]);

  const handlePatch=useCallback(async(id,key,val)=>{
    const r=await apiFetch(`/searches/${id}`,{method:"PATCH",body:{[key]:val}});
    if(!r.ok){const j=await r.json().catch(()=>({}));return{error:j.detail||"Nie udało się zapisać"};}
    const u=await apiFetch(`/searches/${id}`);if(u.ok){const row=await u.json();setVehicles(prev=>prev.map(v=>v.id===id?row:v));}
    return{ok:true};
  },[]);

  const handleVerify=useCallback(async row=>{
    const s=row.snapshot_json||{};
    const plate=normalizeLicensePlate(row.manual_license_plate||s.licensePlate||"");
    const vin=normalizeVin(row.manual_vin||s.vin||"");
    const fr=normalizeDateForCepik(row.manual_first_registration||s.firstRegistration||"");
    setVerifyBusy(b=>({...b,[row.id]:true}));
    try{const r=await apiFetch("/cepik/verify",{method:"POST",body:{search_id:row.id,registration_number:plate,vin_number:vin,first_registration_date:fr,listing_snapshot:s,force_refresh:false}});if(r.ok){const u=await apiFetch(`/searches/${row.id}`);if(u.ok){const ur=await u.json();setVehicles(prev=>prev.map(v=>v.id===row.id?ur:v));}}}finally{setVerifyBusy(b=>({...b,[row.id]:false}));}
  },[]);

  const filtered=useMemo(()=>{
    let l=vehicles.filter(v=>!pendingDeleteIds.has(v.id));
    if(searchQuery.trim()){const q=searchQuery.toLowerCase();l=l.filter(v=>{const s=v.snapshot_json||{};return[s.brand,s.model,s.year,s.__filterName].filter(Boolean).join(" ").toLowerCase().includes(q);});}
    if(filterStatus!=="all")l=l.filter(v=>getCepikStatus(v)===filterStatus);
    return l;
  },[vehicles,filterStatus,searchQuery,pendingDeleteIds]);

  const handleSelectAll=useCallback(()=>setSelectedIds(new Set(filtered.map(v=>v.id))),[filtered]);
  const handleClearSelection=useCallback(()=>setSelectedIds(new Set()),[]);

  const verifiableSelectedIds=useMemo(()=>filtered.filter(v=>selectedIds.has(v.id)).filter(v=>{const s=v.snapshot_json||{};const pl=v.manual_license_plate||s.licensePlate;const vi=v.manual_vin||s.vin;const fr=v.manual_first_registration||s.firstRegistration;return pl&&isValidLicensePlate(normalizeLicensePlate(pl))&&vi&&isValidVin(normalizeVin(vi))&&fr&&/^\d{4}-\d{2}-\d{2}$/.test(normalizeDateForCepik(fr));}).map(v=>v.id),[filtered,selectedIds]);

  const handleBatchDelete=useCallback(()=>{[...selectedIds].forEach(id=>handleDelete(id));setSelectedIds(new Set());},[selectedIds,handleDelete]);
  const handleBatchVerify=useCallback(async()=>{if(!verifiableSelectedIds.length)return;setBatchVerifyBusy(true);for(const id of verifiableSelectedIds){const row=vehicles.find(v=>v.id===id);if(row)await handleVerify(row);await new Promise(r=>setTimeout(r,800));}setBatchVerifyBusy(false);setSelectedIds(new Set());},[verifiableSelectedIds,vehicles,handleVerify]);

  const grouped=useMemo(()=>{
    const g={};for(const v of filtered){const src=v.snapshot_json?.__source;const key=src==="manual"?"__manual":(v.snapshot_json?.__filterName||"__none");if(!g[key])g[key]=[];g[key].push(v);}
    return Object.entries(g).sort(([a],[b])=>{if(a==="__manual")return 1;if(b==="__manual")return-1;if(a==="__none")return 1;if(b==="__none")return-1;return a.localeCompare(b,"pl");});
  },[filtered]);

  const counts=useMemo(()=>{const c={ok:0,issues:0,check:0,no_data:0,pending:0};for(const v of vehicles){const s=getCepikStatus(v);c[s]=(c[s]||0)+1;}return c;},[vehicles]);
  const newCount=useMemo(()=>vehicles.filter(v=>v.snapshot_json?.__isNew).length,[vehicles]);
  const archivedCount=useMemo(()=>vehicles.filter(v=>v.snapshot_json?.__archived).length,[vehicles]);
  const compareVehicles=useMemo(()=>vehicles.filter(v=>compareIds.has(v.id)),[vehicles,compareIds]);

  if(!me) return (
    <div className="vdb-tab"><div className="vdb-login-gate"><div className="vdb-login-icon">🔒</div><div className="vdb-login-title">Zaloguj się</div><div className="vdb-login-desc">Baza pojazdów wymaga konta.</div></div></div>
  );

  return (
    <div className="vdb-tab">
      {/* Header */}
      <div className="vdb-header">
        <div className="vdb-header-left">
          <div className="section-label">Baza pojazdów</div>
          <div className="vdb-total">
            {vehicles.length} pojazdów
            {newCount>0&&<span className="vdb-total-new"> · {newCount} nowych</span>}
            {archivedCount>0&&<span className="vdb-total-arch"> · {archivedCount} archiwum</span>}
            {viewedIds.size>0&&<button type="button" className="vdb-clear-viewed-btn" onClick={clearViewed} title="Wyczyść oznaczenie obejrzanych"> · {viewedIds.size} obejrz. ✕</button>}
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <ViewModeToggle mode={viewMode} onChange={setViewMode}/>
          {vehicles.length>0&&<><button type="button" className="vdb-export-btn" onClick={()=>exportCsv(vehicles)} title="Eksportuj CSV">⬇ CSV</button><button type="button" className="vdb-export-btn" onClick={()=>exportJson(vehicles)} title="Eksportuj JSON">⬇ JSON</button></>}
          {grouped.length>1&&<button type="button" className="vdb-refresh-btn" onClick={()=>{const all=grouped.every(([k])=>collapsedGroups[k]);const n={};grouped.forEach(([k])=>{n[k]=!all;});setCollapsedGroups(n);saveCollapsedState(n);}} title={grouped.every(([k])=>collapsedGroups[k])?"Rozwiń wszystkie":"Zwiń wszystkie"}>{grouped.every(([k])=>collapsedGroups[k])?"⊞":"⊟"}</button>}
          <button type="button" className="vdb-refresh-btn" onClick={loadVehicles} disabled={loading} title="Odśwież"><span className={loading?"vdb-refresh-spin":""}>↻</span>{loading?"Ładuję…":"Odśwież"}</button>
        </div>
      </div>

      {vehicles.length>0&&<DbStatsPanel vehicles={vehicles}/>}

      {vehicles.length>0&&(
        <div className="vdb-controls">
          <div className="vdb-search-wrap">
            <span className="vdb-search-ico">🔍</span>
            <input className="vdb-search" placeholder="Szukaj marki, modelu, filtru…" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>
            {searchQuery&&<button type="button" className="vdb-search-clear" onClick={()=>setSearchQuery("")}>✕</button>}
          </div>
          <div className="vdb-status-pills">
            {[{key:"all",label:"Wszystkie",val:vehicles.length},{key:"ok",label:"✓ OK",val:counts.ok,show:counts.ok>0},{key:"issues",label:"⚠ Uwagi",val:counts.issues,show:counts.issues>0},{key:"pending",label:"○ Nie zwerif.",val:counts.pending,show:counts.pending>0},{key:"no_data",label:"– Brak danych",val:counts.no_data,show:counts.no_data>0}].filter(p=>p.show!==false).map(({key,label,val})=>(
              <button key={key} type="button" className={`vdb-pill vdb-pill--${key} ${filterStatus===key?"vdb-pill--active":""}`} onClick={()=>setFilterStatus(key)}>{label}<span className="vdb-pill-count">{val}</span></button>
            ))}
          </div>
        </div>
      )}

      {loading&&vehicles.length===0?(<div className="vdb-loading"><div className="vdb-loading-spin"/><span>Ładowanie bazy pojazdów…</span></div>)
      :vehicles.length===0?(<div className="vdb-empty"><div className="vdb-empty-ico">🚗</div><div className="vdb-empty-title">Baza pojazdów jest pusta</div><div className="vdb-empty-desc">Przejdź do zakładki <strong>Filtry</strong>, skonfiguruj wyszukiwanie i uruchom skanowanie.</div></div>)
      :filtered.length===0?(<div className="vdb-empty"><div className="vdb-empty-title">Brak wyników</div><div className="vdb-empty-desc">Zmień filtry lub wyczyść wyszukiwanie.</div></div>)
      :(
        <div className="vdb-groups">
          {grouped.map(([groupKey,items])=>{
            const mf=filters.find(f=>f.name===groupKey);
            return <FilterGroup key={groupKey} groupKey={groupKey} items={items} filter={mf} collapsed={!!collapsedGroups[groupKey]} onToggle={()=>toggleGroup(groupKey)} onOpen={onOpenItem} onDelete={handleDelete} onPatch={handlePatch} onVerify={handleVerify} verifyBusy={verifyBusy} pendingDeleteIds={pendingDeleteIds} selectedIds={selectedIds} onToggleSelect={handleToggleSelect} compareIds={compareIds} onToggleCompare={handleToggleCompare} viewMode={viewMode} sortKey={sortByGroup[groupKey]||"newest"} onSortChange={setSortForGroup} notes={notes} onSaveNote={setNote} viewedIds={viewedIds} onMarkViewed={markViewed} onRunScan={onRunFilter} isJobRunning={false}/>;
          })}
        </div>
      )}

      {compareIds.size>0&&<CompareDrawer vehicles={compareVehicles} onClose={()=>setCompareIds(new Set())} onRemove={id=>setCompareIds(prev=>{const n=new Set(prev);n.delete(id);return n;})} onOpen={id=>{onOpenItem?.(id);setCompareIds(new Set());}}/>}

      <BulkActionBar selectedIds={selectedIds} totalVisible={filtered.length} verifiableIds={verifiableSelectedIds} verifyBusy={batchVerifyBusy} onSelectAll={handleSelectAll} onClearAll={handleClearSelection} onBatchDelete={handleBatchDelete} onBatchVerify={handleBatchVerify}/>
      <UndoToast stack={undoStack} onUndo={handleUndoDelete}/>
    </div>
  );
}
