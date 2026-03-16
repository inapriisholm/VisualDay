import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { CARD_BG } from '../constants/themes';
import { DAYS } from '../constants/days';
import { ROUTINE_TEMPLATES } from '../constants/routines';

// ─── PRINT CARD ───────────────────────────────────────────────────────────────
export function PrintCard({ card, size = 90, grayscale, scleraUrl, theme }) {
  const bg   = theme ? theme.bg : CARD_BG;
  const done = card.done;
  const sz   = Math.round(size * 0.68);
  return (
    <div style={{ width: size, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, pageBreakInside: "avoid" }}>
      <div style={{
        width: size, height: Math.round(size * 1.1),
        background: done ? "#D8D4D0" : (grayscale ? "#000000" : bg),
        borderRadius: Math.round(size * 0.22), border: "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden", boxSizing: "border-box",
      }}>
        {!grayscale && !done && <div style={{ position: "absolute", top: "10%", right: "12%", width: "10%", height: "10%", borderRadius: "50%", background: "rgba(255,255,255,0.7)" }} />}
        {(scleraUrl || card.sclera_url)
          ? <img src={scleraUrl || card.sclera_url} alt={card.label} style={{ width: sz, height: sz, objectFit: "contain", opacity: done ? 0.4 : 1 }} />
          : card.svg
            ? <div style={{ lineHeight: 0, filter: done ? "grayscale(1) opacity(0.5)" : grayscale ? "grayscale(1) brightness(3)" : "none" }}
                dangerouslySetInnerHTML={{ __html: card.svg.replace(/<svg/, `<svg width="${sz}" height="${sz}"`) }} />
            : <span style={{ fontSize: Math.round(size * 0.44), lineHeight: 1, filter: done ? "grayscale(1) opacity(0.5)" : grayscale ? "grayscale(1) brightness(3)" : "none" }}>{card.emoji}</span>
        }
      </div>
      <span style={{ fontSize: Math.round(size * 0.135), fontWeight: 800, color: done ? "#888" : "#1A1410", fontFamily: "'Nunito', sans-serif", textAlign: "center", lineHeight: 1.2, maxWidth: size + 8, wordBreak: "break-word" }}>{card.label}</span>
    </div>
  );
}

// ─── PRINT WEEK LAYOUT ────────────────────────────────────────────────────────
export function PrintWeekLayout({ week, selectedDays, theme, grayscale, title }) {
  const acc = theme.accent;
  const days = DAYS.filter(d => selectedDays.includes(d.short));
  const maxCards = Math.max(1, ...days.map(d => (week[d.short] || []).length));
  const CARD = days.length <= 3 ? 110 : days.length <= 5 ? 90 : 74;

  return (
    <div style={{ width: "297mm", minHeight: "210mm", background: "#FFFFFF", fontFamily: "'Nunito', sans-serif", padding: "8mm 8mm 6mm", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4mm", paddingBottom: "3mm", borderBottom: `3px solid ${acc}` }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: acc }}>{title || "Ugeplan"}</div>
        <div style={{ fontSize: 11, color: "#AAA", fontWeight: 600 }}>{new Date().toLocaleDateString("da-DK", { year: "numeric", month: "long" })}</div>
      </div>
      <div style={{ display: "flex", gap: "3mm", flex: 1, alignItems: "flex-start" }}>
        {days.map((day, di) => {
          const cards = week[day.short] || [];
          return (
            <div key={day.short} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2.5mm", borderRight: di < days.length - 1 ? `1px solid ${acc}40` : "none", paddingRight: di < days.length - 1 ? "3mm" : 0 }}>
              <div style={{ background: acc, borderRadius: 10, padding: "4px 0", textAlign: "center" }}>
                <div style={{ fontSize: Math.max(11, CARD * 0.16), fontWeight: 900, color: "#FFFFFF" }}>{day.short}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2.5mm", alignItems: "center" }}>
                {cards.map(card => <PrintCard key={card.uid} card={card} size={CARD} grayscale={grayscale} theme={theme} />)}
                {Array.from({ length: Math.max(0, maxCards - cards.length) }).map((_, i) => (
                  <div key={i} style={{ width: CARD, height: Math.round(CARD * 1.1), borderRadius: Math.round(CARD * 0.22), border: "1.5px dashed #DDD" }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: "3mm", fontSize: 8, color: "#CCC", textAlign: "center" }}>Lavet med Ugeplan-appen</div>
    </div>
  );
}

// ─── PRINT DAY LAYOUT ─────────────────────────────────────────────────────────
export function PrintDayLayout({ week, selectedDays, theme, grayscale, title }) {
  const acc = theme.accent;
  const days = DAYS.filter(d => selectedDays.includes(d.short));
  const isMulti = days.length > 1;
  const CARD = isMulti ? Math.max(60, Math.floor(170 / days.length)) : 100;
  const cols = isMulti ? days.length : 3;

  return (
    <div style={{ width: "210mm", minHeight: "297mm", background: "#FFFFFF", fontFamily: "'Nunito', sans-serif", padding: "8mm 8mm 6mm", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <div style={{ background: acc, borderRadius: 12, padding: isMulti ? "8px 14px" : "10px 18px 12px", marginBottom: "5mm" }}>
        {isMulti ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#FFFFFF" }}>{title || "Dagsplan"}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{days.map(d => d.short).join(" · ")}</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#FFFFFF" }}>{days[0]?.full} {days[0]?.emoji}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 600, marginTop: 2 }}>{title || "Dagsplan"}</div>
          </>
        )}
      </div>
      {isMulti ? (
        <div style={{ display: "flex", gap: "4mm", flex: 1, alignItems: "flex-start" }}>
          {days.map(day => {
            const cards = week[day.short] || [];
            return (
              <div key={day.short} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3mm" }}>
                <div style={{ background: acc, borderRadius: 8, padding: "4px 0", textAlign: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#FFFFFF" }}>{day.short}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "3mm", alignItems: "center" }}>
                  {cards.map(card => <PrintCard key={card.uid} card={card} size={CARD} grayscale={grayscale} theme={theme} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "5mm", flex: 1, alignContent: "start" }}>
          {(week[days[0]?.short] || []).map(card => (
            <div key={card.uid} style={{ display: "flex", justifyContent: "center" }}>
              <PrintCard card={card} size={CARD} grayscale={grayscale} theme={theme} />
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: "3mm", fontSize: 8, color: "#CCC", textAlign: "center" }}>Lavet med Ugeplan-appen</div>
    </div>
  );
}

// ─── PRINT OVERLAY ────────────────────────────────────────────────────────────
export function PrintOverlay({ week, theme, grayscale, focusDay, scleraIcons, onClose }) {
  const acc = theme.accent;
  const daysWithCards = DAYS.filter(d => (week[d.short] || []).length > 0).map(d => d.short);
  const initDays = daysWithCards.length > 0 ? daysWithCards : [focusDay];
  const [selectedDays, setSelectedDays] = useState(initDays);
  const [orientation, setOrientation] = useState(initDays.length > 4 ? "landscape" : "portrait");
  const [bw, setBw] = useState(grayscale);
  const [title, setTitle] = useState("");
  const [isPrinting, setPrinting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const toggleDay = (short) => {
    setSelectedDays(prev => {
      const next = prev.includes(short) ? prev.filter(d => d !== short) : [...prev, short];
      if (next.length === 0) return prev;
      if (next.length > 4 && orientation === "portrait") setOrientation("landscape");
      if (next.length <= 4 && orientation === "landscape") setOrientation("portrait");
      return next;
    });
  };

  const isLandscape = orientation === "landscape";
  const PREVIEW_W = isLandscape ? 297 : 210;
  const PREVIEW_H = isLandscape ? 210 : 297;
  const PREVIEW_AREA = 370;
  const PREVIEW_AREA_H = 280;
  const scaleW = PREVIEW_AREA / (PREVIEW_W * 3.7795);
  const scaleH = PREVIEW_AREA_H / (PREVIEW_H * 3.7795);
  const scale = Math.min(scaleW, scaleH);
  const previewPxW = PREVIEW_W * 3.7795 * scale;
  const previewPxH = PREVIEW_H * 3.7795 * scale;

  const doPrint = () => {
    setPrinting(true);
    setTimeout(() => { window.print(); setPrinting(false); }, 120);
  };

  const sortedSelected = DAYS.filter(d => selectedDays.includes(d.short)).map(d => d.short);

  return (
    <>
      <div id="print-root" style={{ display: "none" }}>
        {isLandscape
          ? <PrintWeekLayout week={week} selectedDays={sortedSelected} theme={theme} grayscale={bw} title={title} />
          : <PrintDayLayout week={week} selectedDays={sortedSelected} theme={theme} grayscale={bw} title={title} />
        }
      </div>
      <div style={{ position: "fixed", inset: 0, zIndex: 700, background: "#F2EEF8", display: "flex", flexDirection: "column", fontFamily: "'Nunito', sans-serif" }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#FFFFFF", boxShadow: "0 1px 0 rgba(0,0,0,0.07)" }}>
          <button onClick={onClose} style={{ background: "transparent", border: "1.5px solid rgba(0,0,0,0.12)", color: "#1A0840", fontWeight: 800, cursor: "pointer", padding: "7px 14px 7px 10px", borderRadius: 999, display: "flex", alignItems: "center", gap: 5, fontSize: 13 }}>
            <Icon name="close" size={15} color="#1A0840" /> Luk
          </button>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#1A0840", letterSpacing: -0.3 }}>Udskriv ugeplan</div>
          <button onClick={() => setShowSettings(s => !s)} style={{ background: showSettings ? acc : "#F0EBF8", color: showSettings ? "#FFFFFF" : acc, border: "none", borderRadius: 999, fontWeight: 800, cursor: "pointer", padding: "7px 14px 7px 10px", display: "flex", alignItems: "center", gap: 5, fontSize: 13, boxShadow: showSettings ? `0 2px 10px ${acc}50` : "none", transition: "all 0.18s" }}>
            <Icon name="edit" size={15} color={showSettings ? "#FFFFFF" : acc} /> Indstillinger
          </button>
        </div>
        {/* Day selector */}
        <div style={{ background: "#FFFFFF", borderBottom: "1px solid rgba(0,0,0,0.07)", padding: "12px 14px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#9B8FA0", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 10 }}>Inkluderede dage</div>
          <div style={{ display: "flex", gap: 6 }}>
            {DAYS.map(d => {
              const isOn = selectedDays.includes(d.short);
              const count = (week[d.short] || []).length;
              return (
                <button key={d.short} onClick={() => toggleDay(d.short)} style={{
                  flex: 1, padding: "10px 2px 9px", borderRadius: 14,
                  background: isOn ? acc : "#F5F3F8",
                  color: isOn ? "#FFFFFF" : count > 0 ? "#3D2B6B" : "#C4B8D0",
                  border: "none", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 11,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  transition: "all 0.16s cubic-bezier(0.34,1.56,0.64,1)",
                  boxShadow: isOn ? `0 4px 14px ${acc}55, inset 0 1px 0 rgba(255,255,255,0.2)` : "inset 0 1px 0 rgba(255,255,255,0.8)",
                  transform: isOn ? "translateY(-1px)" : "translateY(0)",
                  position: "relative", overflow: "hidden",
                }}>
                  {isOn && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 60%)", borderRadius: "inherit", pointerEvents: "none" }} />}
                  <span style={{ letterSpacing: 0.2 }}>{d.short}</span>
                  <span style={{ minWidth: 18, height: 16, borderRadius: 99, background: isOn ? "rgba(255,255,255,0.22)" : count > 0 ? `${acc}18` : "rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px", fontSize: 9, fontWeight: 900, color: isOn ? "rgba(255,255,255,0.9)" : count > 0 ? acc : "#C4B8D0" }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
        {/* Preview */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 12px", overflow: "hidden" }}>
          <div style={{ width: previewPxW, height: previewPxH, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: `${PREVIEW_W * 3.7795}px`, height: `${PREVIEW_H * 3.7795}px` }}>
              {isLandscape
                ? <PrintWeekLayout week={week} selectedDays={sortedSelected} theme={theme} grayscale={bw} title={title} />
                : <PrintDayLayout week={week} selectedDays={sortedSelected} theme={theme} grayscale={bw} title={title} />
              }
            </div>
          </div>
        </div>
        {/* Settings */}
        {showSettings && (
          <div style={{ background: "#FFFFFF", borderRadius: "20px 20px 0 0", padding: "16px 18px 32px", maxHeight: "55vh", overflowY: "auto", boxShadow: "0 -4px 24px rgba(0,0,0,0.10)" }}>
            <div style={{ width: 36, height: 4, background: "#DDD", borderRadius: 99, margin: "0 auto 18px" }} />
            <div style={{ fontSize: 10, color: "#6A5A50", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Papirretning</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {[{ id: "landscape", label: "Vandret", sub: "A4 297×210" }, { id: "portrait", label: "Lodret", sub: "A4 210×297" }].map(o => (
                <button key={o.id} onClick={() => setOrientation(o.id)} style={{ flex: 1, padding: "12px 6px", borderRadius: 12, background: orientation === o.id ? acc : "#F2EEF8", color: orientation === o.id ? "#FFF" : "#1A0840", border: `2px solid ${orientation === o.id ? acc : "transparent"}`, cursor: "pointer", fontWeight: 800, fontSize: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, boxShadow: orientation === o.id ? `0 3px 10px ${acc}40` : "none" }}>
                  <Icon name="print" size={20} color={orientation === o.id ? "#FFF" : acc} style={{ transform: o.id === "landscape" ? "rotate(90deg)" : "none" }} />
                  <span>{o.label}</span><span style={{ fontWeight: 600, fontSize: 10, opacity: 0.65 }}>{o.sub}</span>
                </button>
              ))}
            </div>
            <div style={{ fontSize: 10, color: "#6A5A50", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Farvetilstand</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {[{ val: false, label: "Farver", icon: "theme" }, { val: true, label: "Sort/hvid", icon: "week" }].map(opt => (
                <button key={String(opt.val)} onClick={() => setBw(opt.val)} style={{ flex: 1, padding: "12px 6px", borderRadius: 12, background: bw === opt.val ? (opt.val ? "#000000" : acc) : "#F2EEF8", color: bw === opt.val ? "#FFF" : "#1A0840", border: `2px solid ${bw === opt.val ? (opt.val ? "#000000" : acc) : "transparent"}`, cursor: "pointer", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: bw === opt.val ? "0 3px 10px rgba(0,0,0,0.15)" : "none" }}>
                  <Icon name={opt.icon} size={18} color={bw === opt.val ? "#FFF" : acc} />{opt.label}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 10, color: "#6A5A50", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Overskrift (valgfri)</div>
            <div style={{ background: "#F2EEF8", borderRadius: 12, padding: "4px 6px 4px 14px", border: "2px solid transparent", display: "flex", marginBottom: 4 }}>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="fx. Maddies uge…" style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#1A0840", fontFamily: "'Nunito', sans-serif", fontWeight: 600, padding: "8px 0" }} />
            </div>
          </div>
        )}
        {/* Print button */}
        {!showSettings && (
          <div style={{ padding: "12px 18px 28px", background: "#FFFFFF", boxShadow: "0 -1px 0 rgba(0,0,0,0.07)" }}>
            <button onClick={doPrint} disabled={isPrinting || selectedDays.length === 0} style={{
              width: "100%", padding: "16px 0",
              background: isPrinting || selectedDays.length === 0 ? "#DDD" : acc,
              color: isPrinting || selectedDays.length === 0 ? "#AAA" : "#FFFFFF",
              border: "none", borderRadius: 16, fontSize: 16, fontWeight: 900,
              cursor: isPrinting ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              boxShadow: isPrinting || selectedDays.length === 0 ? "none" : `0 4px 16px ${acc}55`,
            }}>
              <Icon name="print" size={22} color={isPrinting || selectedDays.length === 0 ? "#AAA" : "#FFFFFF"} />
              {isPrinting ? "Gør klar…" : `Udskriv ${selectedDays.length} dag${selectedDays.length !== 1 ? "e" : ""}`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── PRINT ROUTINE LAYOUT ─────────────────────────────────────────────────────
// Renders each routine as a cuttable strip — landscape (default) or portrait
export function PrintRoutineLayout({ routines, theme, grayscale, title, landscape = true }) {
  const acc = theme.accent;
  const bg = grayscale ? "#FFFFFF" : theme.bg;
  const CARD_W = landscape ? 72 : 62;
  const CARD_H = landscape ? 80 : 70;

  return (
    <div style={{ width: landscape ? "297mm" : "210mm", minHeight: landscape ? "210mm" : "297mm", background: "#FFFFFF", padding: "8mm 8mm 6mm", fontFamily: "'Nunito', sans-serif", boxSizing: "border-box" }}>
      {title && (
        <div style={{ fontSize: 18, fontWeight: 900, color: acc, marginBottom: "6mm", letterSpacing: -0.3, borderBottom: `2.5px solid ${acc}`, paddingBottom: "3mm" }}>{title}</div>
      )}
      {routines.map((r, ri) => (
        <div key={r.id}>
          {/* Strip */}
          <div style={{ display: "flex", alignItems: "stretch", border: `2px solid ${grayscale ? "#333" : acc}`, borderRadius: 12, overflow: "hidden", pageBreakInside: "avoid", background: "#FFFFFF" }}>
            {/* Left label */}
            <div style={{ width: 52, flexShrink: 0, background: grayscale ? "#111" : acc, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "8px 4px" }}>
              <span style={{ fontSize: 24 }}>{r.emoji}</span>
              <span style={{ fontSize: 8, fontWeight: 900, color: "#FFFFFF", textAlign: "center", lineHeight: 1.2, wordBreak: "break-word", maxWidth: 46 }}>{r.label}</span>
            </div>
            {/* Steps */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 0, flex: 1, padding: "6px 6px" }}>
              {r.cards.map((card, ci) => (
                <div key={ci} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 5px", pageBreakInside: "avoid" }}>
                  {/* Step number */}
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: grayscale ? "#333" : acc, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, flexShrink: 0 }}>{ci + 1}</div>
                  {/* Card image */}
                  <div style={{ width: CARD_W, height: CARD_H, borderRadius: 10, background: grayscale ? "#000" : bg, display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${grayscale ? "#555" : acc + "40"}`, overflow: "hidden", flexShrink: 0 }}>
                    {card.svg
                      ? <div style={{ lineHeight: 0, filter: grayscale ? "grayscale(1) brightness(3)" : "none" }} dangerouslySetInnerHTML={{ __html: card.svg.replace(/<svg/, `<svg width="${CARD_W - 10}" height="${CARD_H - 10}"`) }} />
                      : <span style={{ fontSize: 30, filter: grayscale ? "grayscale(1) brightness(3)" : "none" }}>{card.emoji}</span>
                    }
                  </div>
                  {/* Label */}
                  <div style={{ fontSize: 9, fontWeight: 800, color: "#1A0840", textAlign: "center", maxWidth: CARD_W + 4, lineHeight: 1.2, wordBreak: "break-word" }}>{card.label}</div>
                  {/* Checkbox */}
                  <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${grayscale ? "#333" : acc}`, background: "transparent", flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
          {/* Cut line between strips */}
          {ri < routines.length - 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "4mm 0", color: "#AAA", fontSize: 9, fontWeight: 700, userSelect: "none" }}>
              <div style={{ flex: 1, borderTop: "1.5px dashed #CCC" }} />
              <span>✂</span>
              <div style={{ flex: 1, borderTop: "1.5px dashed #CCC" }} />
            </div>
          )}
        </div>
      ))}
      <div style={{ marginTop: "6mm", fontSize: 7, color: "#CCC", textAlign: "center" }}>Lavet med Ugeplan-appen</div>
    </div>
  );
}

// ─── ROUTINE PRINT OVERLAY ────────────────────────────────────────────────────
export function RoutinePrintOverlay({ routines, theme, grayscale, onClose }) {
  const acc = theme.accent;
  const [selected, setSelected] = useState(routines.map(r => r.id));
  const [bw, setBw] = useState(grayscale);
  useEffect(() => { setBw(grayscale); }, [grayscale]);
  const [title, setTitle] = useState("");
  const [landscape, setLandscape] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const toggle = (id) => setSelected(prev => prev.includes(id) ? (prev.length > 1 ? prev.filter(x => x !== id) : prev) : [...prev, id]);
  const selectedRoutines = routines.filter(r => selected.includes(r.id));

  const doPrint = () => {
    setIsPrinting(true);
    const printEl = document.getElementById("routine-print-root");
    const styleEl = document.getElementById("routine-page-style") || document.createElement("style");
    styleEl.id = "routine-page-style";
    styleEl.textContent = `@media print { @page { size: A4 ${landscape ? "landscape" : "portrait"}; margin: 0; } }`;
    document.head.appendChild(styleEl);
    if (printEl) printEl.style.display = "block";
    setTimeout(() => {
      window.print();
      if (printEl) printEl.style.display = "none";
      styleEl.remove();
      setIsPrinting(false);
    }, 120);
  };

  return (
    <>
      <div id="routine-print-root" style={{ display: "none" }}>
        <PrintRoutineLayout routines={selectedRoutines} theme={theme} grayscale={bw} title={title} landscape={landscape} />
      </div>
      <div style={{ position: "fixed", inset: 0, zIndex: 700, background: "#F2EEF8", display: "flex", flexDirection: "column", fontFamily: "'Nunito', sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 12px", background: "#FFFFFF", boxShadow: "0 1px 0 rgba(0,0,0,0.07)" }}>
          <button onClick={onClose} style={{ background: "rgba(0,0,0,0.05)", border: "none", color: "#1A0840", fontWeight: 800, cursor: "pointer", padding: "8px 14px 8px 10px", borderRadius: 12, display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
            <Icon name="close" size={18} color="#1A0840" /> Luk
          </button>
          <div style={{ fontSize: 15, fontWeight: 900, color: "#1A0840" }}>Udskriv rutinestrimler</div>
          <div style={{ width: 80 }} />
        </div>
        <div style={{ background: "#FFFFFF", borderBottom: "1px solid rgba(0,0,0,0.07)", padding: "12px 16px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#6A5A50", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>Vælg rutiner</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {routines.map(r => {
              const on = selected.includes(r.id);
              return (
                <button key={r.id} onClick={() => toggle(r.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 14, background: on ? acc + "18" : "#F2EEF8", border: `2px solid ${on ? acc : "transparent"}`, cursor: "pointer", textAlign: "left", boxShadow: on ? `0 2px 8px ${acc}30` : "none", transition: "all 0.15s" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: on ? acc + "30" : "#E8E0F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{r.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "#1A0840", fontFamily: "'Nunito', sans-serif" }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: "#6A5A50", fontFamily: "'Nunito', sans-serif" }}>{r.cards.length} trin</div>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: on ? acc : "transparent", border: `2.5px solid ${on ? acc : "#C0B0D0"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {on && <Icon name="check" size={14} color="#FFF" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ padding: "14px 16px", background: "#FFFFFF", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", gap: 10 }}>
          {[{ val: true, label: "Vandret", sub: "A4 297×210" }, { val: false, label: "Lodret", sub: "A4 210×297" }].map(o => (
            <button key={String(o.val)} onClick={() => setLandscape(o.val)} style={{ flex: 1, padding: "10px 6px", borderRadius: 12, background: landscape === o.val ? acc : "#F2EEF8", color: landscape === o.val ? "#FFF" : "#1A0840", border: `2px solid ${landscape === o.val ? acc : "transparent"}`, cursor: "pointer", fontWeight: 800, fontSize: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, fontFamily: "'Nunito', sans-serif", boxShadow: landscape === o.val ? `0 3px 10px ${acc}40` : "none" }}>
              <span>{o.label}</span>
              <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.75 }}>{o.sub}</span>
            </button>
          ))}
        </div>
        <div style={{ padding: "14px 16px", background: "#FFFFFF", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", gap: 10 }}>
          {[{val:false,label:"Farver",icon:"theme"},{val:true,label:"Sort/hvid",icon:"week"}].map(opt => (
            <button key={String(opt.val)} onClick={() => setBw(opt.val)} style={{ flex: 1, padding: "10px 6px", borderRadius: 12, background: bw === opt.val ? (opt.val ? "#000000" : acc) : "#F2EEF8", color: bw === opt.val ? "#FFF" : "#1A0840", border: `2px solid ${bw === opt.val ? (opt.val ? "#000000" : acc) : "transparent"}`, cursor: "pointer", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "'Nunito', sans-serif" }}>
              <Icon name={opt.icon} size={16} color={bw === opt.val ? "#FFF" : acc} />{opt.label}
            </button>
          ))}
        </div>
        <div style={{ padding: "12px 16px", background: "#FFFFFF", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <div style={{ background: "#F2EEF8", borderRadius: 12, padding: "4px 6px 4px 14px", display: "flex" }}>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Overskrift (valgfri)…" style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 14, color: "#1A0840", fontFamily: "'Nunito', sans-serif", fontWeight: 600, padding: "8px 0" }} />
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "16px", display: "flex", justifyContent: "center" }}>
          {(() => {
            const PW = (landscape ? 297 : 210) * 3.7795;
            const PH = (landscape ? 210 : 297) * 3.7795;
            const availW = Math.min(window.innerWidth - 32, 420);
            const scale = availW / PW;
            return (
              <div style={{ width: availW, height: PH * scale, flexShrink: 0, boxShadow: "0 6px 28px rgba(0,0,0,0.14)", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: PW, height: PH }}>
                  <PrintRoutineLayout routines={selectedRoutines} theme={theme} grayscale={bw} title={title} landscape={landscape} />
                </div>
              </div>
            );
          })()}
        </div>
        <div style={{ padding: "12px 18px 28px", background: "#FFFFFF", boxShadow: "0 -1px 0 rgba(0,0,0,0.07)" }}>
          <button onClick={doPrint} disabled={isPrinting} style={{ width: "100%", padding: "16px 0", background: isPrinting ? "#DDD" : acc, color: isPrinting ? "#AAA" : "#FFFFFF", border: "none", borderRadius: 16, fontSize: 16, fontWeight: 900, cursor: isPrinting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: isPrinting ? "none" : `0 4px 16px ${acc}55`, fontFamily: "'Nunito', sans-serif" }}>
            <Icon name="print" size={22} color={isPrinting ? "#AAA" : "#FFFFFF"} />
            {isPrinting ? "Gør klar…" : `Udskriv ${selected.length} rutine${selected.length !== 1 ? "r" : ""}`}
          </button>
        </div>
      </div>
    </>
  );
}
