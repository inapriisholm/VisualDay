import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';
import { CARD_BG, CARD_COLORS, THEMES } from '../constants/themes';
import { DAYS } from '../constants/days';
import { ROUTINE_TEMPLATES } from '../constants/routines';
import { EMOJI_PICKER } from '../data/emojipicker';
import { SCLERA_BASE, SCLERA_ALL_NAMES } from '../data/sclera';
import { generatePictogram, uid } from '../utils/helpers';

// ─── CARD EDITOR OVERLAY ──────────────────────────────────────────────────────
export function CardEditorOverlay({ theme, card, onSave, onDelete, onClose, isNew }) {
  const acc  = theme ? theme.accent : "#5B21B6";
  const grad = theme ? theme.grad : "linear-gradient(135deg,#7C3AED,#4F46E5)";
  const [label, setLabel]     = useState(card?.label || "");
  const [emoji, setEmoji]     = useState(card?.emoji || "🏠");
  const [aiSvg, setAiSvg]     = useState(card?.svg || null);
  const [aiInput, setAiInput] = useState(label || "");
  const [loading, setLoading] = useState(false);
  const [tab, setTab]         = useState("emoji");
  const [emojiSearch, setEmojiSearch] = useState("");

  const previewBg = CARD_BG;

  const generate = async () => {
    if (!aiInput.trim()) return;
    setLoading(true);
    try {
      const res = await generatePictogram(aiInput.trim());
      if (res) { setAiSvg(res.svg); if (!label) setLabel(res.label || aiInput.trim()); }
    } catch {}
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,8,64,0.55)", zIndex: 600, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#FFFFFF", borderRadius: "28px 28px 0 0",
        width: "100%", maxWidth: 430,
        padding: "20px 20px 48px", maxHeight: "92vh", overflowY: "auto",
        boxShadow: "0 -8px 40px rgba(26,8,64,0.25)",
      }}>
        <div style={{ width: 40, height: 5, background: `${acc}40`, borderRadius: 99, margin: "0 auto 16px" }} />
        <div style={{ fontSize: 20, fontWeight: 900, color: "#1A0840", fontFamily: "'Nunito', sans-serif", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name={isNew ? "plus" : "edit"} size={20} color="#1A0840" />
          {isNew ? "Nyt kort" : "Rediger kort"}
        </div>

        {/* Preview + label */}
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <div style={{ width: 76, height: 84, background: previewBg, borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <div style={{ position: "absolute", top: 9, right: 11, width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,0.65)" }} />
              {aiSvg
                ? <div style={{ lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: aiSvg.replace(/<svg/, '<svg width="52" height="52"') }} />
                : <span style={{ fontSize: 34 }}>{emoji}</span>}
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#1A1410", fontFamily: "'Nunito', sans-serif", textAlign: "center", maxWidth: 84 }}>{label || "—"}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "#6A5A50", fontFamily: "'Nunito', sans-serif", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Navn</div>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Hvad hedder aktiviteten?"
              style={{ width: "100%", background: `${acc}12`, border: "2px solid #DDD0F0", borderRadius: 12, padding: "10px 14px", fontSize: 15, color: "#1A0840", outline: "none", fontFamily: "'Nunito', sans-serif", fontWeight: 700, boxSizing: "border-box", marginBottom: 12 }}
            />
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", background: `${acc}12`, borderRadius: 14, padding: 4, marginBottom: 16 }}>
          {[["emoji", "Standard"], ["ai", "Lav en ny"]].map(([id, lbl]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: "10px 0", borderRadius: 10,
              background: tab === id ? "#FFFFFF" : "transparent",
              color: tab === id ? "#1A0840" : "#6A5A50",
              border: "none", cursor: "pointer",
              fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 13,
              boxShadow: tab === id ? "0 2px 6px rgba(0,0,0,0.1)" : "none",
            }}>{lbl}</button>
          ))}
        </div>

        {/* Emoji tab */}
        {tab === "emoji" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 8 }}>
            {EMOJI_PICKER.map(em => (
              <button key={em} onClick={() => { setEmoji(em); setAiSvg(null); }} style={{
                fontSize: 24, padding: "6px 2px", background: emoji === em && !aiSvg ? `${acc}40` : "transparent",
                border: emoji === em && !aiSvg ? "2px solid #4A18A0" : "2px solid transparent",
                borderRadius: 10, cursor: "pointer",
              }}>{em}</button>
            ))}
          </div>
        )}

        {/* AI tab */}
        {tab === "ai" && (
          <>
            <div style={{ display: "flex", gap: 8, background: `${acc}12`, borderRadius: 14, padding: "6px 6px 6px 14px", border: "2px solid #DDD0F0", marginBottom: 12 }}>
              <input value={aiInput} onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && generate()}
                placeholder="Beskriv billedet…"
                style={{ flex: 1, background: "transparent", border: "none", fontSize: 14, color: "#1A0840", outline: "none", fontFamily: "'Nunito', sans-serif", fontWeight: 600 }}
              />
              <button onClick={generate} disabled={loading || !aiInput.trim()} style={{
                padding: "10px 14px", borderRadius: 10,
                background: loading || !aiInput.trim() ? `${acc}40` : acc,
                color: loading || !aiInput.trim() ? "#6A5A50" : "#FFFFFF",
                border: "none", cursor: "pointer", fontSize: 13, fontWeight: 800, fontFamily: "'Nunito', sans-serif"
              }}>{loading ? "⏳" : "Tegn"}</button>
            </div>
            {loading && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 10 }}>
                  {["#F5922A","#E8657A","#4BAD6A"].map((c, i) => (
                    <div key={i} style={{ width: 16, height: 16, borderRadius: "50%", background: c, animation: `bb 0.7s ease-in-out ${i*0.14}s infinite alternate` }} />
                  ))}
                </div>
                <style>{`@keyframes bb { from { transform:translateY(0) } to { transform:translateY(-10px) } }`}</style>
                <div style={{ fontSize: 13, color: "#6A5A50", fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>Tegner…</div>
              </div>
            )}
            {aiSvg && !loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 14, background: `${acc}12`, borderRadius: 14, padding: "12px 16px" }}>
                <div style={{ width: 60, height: 60, background: CARD_BG, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div style={{ lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: aiSvg.replace(/<svg/, '<svg width="38" height="38"') }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#1A0840", fontFamily: "'Nunito', sans-serif", marginBottom: 4 }}>Tegning klar! ✓</div>
                  <button onClick={() => setAiSvg(null)} style={{ background: "none", border: "none", color: "#6A5A50", fontSize: 12, cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 600, padding: 0, textDecoration: "underline" }}>Fjern og brug emoji</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          {!isNew && onDelete && (
            <button onClick={() => { onDelete(); onClose(); }} style={{
              padding: "14px 16px", background: "transparent", border: "2px solid #DDD0F0",
              borderRadius: 16, color: "#C41830", cursor: "pointer",
              fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 13
            }}><Icon name="trash" size={15} color="#C41830" style={{marginRight:5}} />Slet</button>
          )}
          <button onClick={onClose} style={{
            flex: 1, padding: "14px 0", background: "transparent",
            border: "2px solid #DDD0F0", borderRadius: 16,
            fontSize: 14, color: "#6A5A50", cursor: "pointer",
            fontFamily: "'Nunito', sans-serif", fontWeight: 800
          }}>Annuller</button>
          <button
            disabled={!label.trim()}
            onClick={() => { onSave({ emoji, label: label.trim(), svg: aiSvg || null }); onClose(); }}
            style={{
              flex: 2, padding: "14px 0",
              background: label.trim() ? acc : `${acc}40`,
              color: label.trim() ? "#FFFFFF" : "#6A5A50",
              border: "none", borderRadius: 16,
              fontSize: 15, cursor: label.trim() ? "pointer" : "not-allowed",
              fontFamily: "'Nunito', sans-serif", fontWeight: 900
            }}>Gem kort</button>
        </div>
      </div>
    </div>
  );
}

// ─── ADD TO DAY OVERLAY ───────────────────────────────────────────────────────
export function AddToDayOverlay({ picto, onAdd, onClose, theme, week }) {
  const [added, setAdded] = useState(null);
  const acc = theme.accent;

  const handleAdd = (dayShort) => {
    setAdded(dayShort);
    onAdd(dayShort);
    setTimeout(onClose, 700);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,8,64,0.5)", zIndex: 550, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#FFFFFF", borderRadius: "28px 28px 0 0",
        width: "100%", maxWidth: 430, padding: "20px 20px 44px",
        boxShadow: "0 -8px 40px rgba(26,8,64,0.2)",
      }}>
        <div style={{ width: 40, height: 5, background: "#DDD0F0", borderRadius: 99, margin: "0 auto 18px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
          <div style={{ width: 56, height: 60, background: CARD_BG, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0, position: "relative" }}>
            <div style={{ position: "absolute", top: 6, right: 8, width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.65)" }} />
            {picto.emoji}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#1A0840", fontFamily: "'Nunito', sans-serif" }}>{picto.label}</div>
            <div style={{ fontSize: 13, color: "#6A5A50", fontFamily: "'Nunito', sans-serif" }}>Vælg hvilken dag du vil tilføje den til</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {DAYS.map(d => {
            const count = (week[d.short] || []).length;
            const isAdded = added === d.short;
            return (
              <button key={d.short} onClick={() => handleAdd(d.short)} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 18px",
                background: isAdded ? acc : "#F4F0F8",
                border: isAdded ? `2px solid ${acc}` : "2px solid #DDD0F0",
                borderRadius: 16,
                cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 14,
                color: isAdded ? "#FFFFFF" : "#1A0840",
                transition: "all 0.18s ease",
              }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {isAdded ? <span style={{ fontSize: 16 }}>✓</span> : <span style={{ fontSize: 14 }}>{d.emoji}</span>}
                  {d.full}
                </span>
                {!isAdded && count > 0 && (
                  <span style={{ fontSize: 11, color: "#6A5A50", fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>
                    {count} aktivitet{count !== 1 ? "er" : ""}
                  </span>
                )}
                {isAdded && (
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>Tilføjet!</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── GENERATE OVERLAY ────────────────────────────────────────────────────────
export function GenerateOverlay({ onAdd, onClose, theme }) {
  const [input, setInput]       = useState("");
  const [label, setLabel]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState(null);

  const generate = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await generatePictogram(input.trim());
      if (res) { setResult(res); setLabel(res.label || input.trim()); }
      else setError("Prøv igen med en anden beskrivelse");
    } catch { setError("Noget gik galt"); }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,8,64,0.5)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#FFFFFF", borderRadius: "28px 28px 0 0", width: "100%", maxWidth: 430, padding: "20px 20px 48px", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 -8px 40px rgba(26,8,64,0.2)" }}>
        <div style={{ width: 40, height: 5, background: "#DDD0F0", borderRadius: 99, margin: "0 auto 20px" }} />
        <div style={{ fontSize: 20, fontWeight: 900, color: "#1A0840", fontFamily: "'Nunito', sans-serif", marginBottom: 4 }}>Find med AI</div>
        <div style={{ fontSize: 13, color: "#6A5A50", fontFamily: "'Nunito', sans-serif", marginBottom: 16 }}>Beskriv aktiviteten — AI finder det bedste emoji</div>
        <div style={{ display: "flex", gap: 8, background: "#F4F0F8", borderRadius: 14, padding: "6px 6px 6px 14px", border: "2px solid #DDD0F0", marginBottom: 12 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && generate()} placeholder="fx. hoppe på trampolin…"
            style={{ flex: 1, background: "transparent", border: "none", fontSize: 14, color: "#1A0840", outline: "none", fontFamily: "'Nunito', sans-serif", fontWeight: 600 }} />
          <button onClick={generate} disabled={loading || !input.trim()} style={{ padding: "10px 16px", borderRadius: 10, background: loading || !input.trim() ? "#DDD0F0" : theme.accent, color: loading || !input.trim() ? "#6A5A50" : "#FFFFFF", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 800, fontFamily: "'Nunito', sans-serif" }}>{loading ? "⏳" : "Find!"}</button>
        </div>
        {loading && <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            {["#F5922A","#E8657A","#4BAD6A"].map((c,i) => <div key={i} style={{ width: 16, height: 16, borderRadius: "50%", background: c, animation: `bb 0.7s ease-in-out ${i*0.14}s infinite alternate` }} />)}
          </div>
          <style>{`@keyframes bb{from{transform:translateY(0)}to{transform:translateY(-10px)}}`}</style>
          <div style={{ fontSize: 13, color: "#6A5A50", fontFamily: "'Nunito', sans-serif", fontWeight: 700, marginTop: 10 }}>Søger…</div>
        </div>}
        {error && <div style={{ background: "#FEE8EC", borderRadius: 12, padding: "10px 14px", color: "#901840", fontFamily: "'Nunito', sans-serif", fontWeight: 600, fontSize: 13, marginBottom: 12 }}>{error}</div>}
        {result && !loading && <>
          <div style={{ display: "flex", gap: 14, alignItems: "center", background: "#F4F0F8", borderRadius: 16, padding: "12px 14px", marginBottom: 14 }}>
            <div style={{ width: 64, height: 72, background: CARD_BG, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
              <div style={{ position: "absolute", top: 8, right: 10, width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.65)" }} />
              {result.svg
                ? <div style={{ lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: result.svg.replace(/<svg/, '<svg width="44" height="44"') }} />
                : <span style={{ fontSize: 36 }}>{result.emoji}</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "#6A5A50", fontFamily: "'Nunito', sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Navn på kortet:</div>
              <input value={label} onChange={e => setLabel(e.target.value)} style={{ width: "100%", background: "#FFFFFF", border: "2px solid #DDD0F0", borderRadius: 10, padding: "8px 12px", fontSize: 14, color: "#1A0840", outline: "none", fontFamily: "'Nunito', sans-serif", fontWeight: 700, boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={generate} style={{ flex: 1, padding: "13px 0", background: "transparent", border: "2px solid #DDD0F0", borderRadius: 14, fontSize: 13, color: "#6A5A50", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 800 }}>🔄 Prøv igen</button>
            <button onClick={() => { onAdd({ id: uid(), label: label || input, emoji: "🖼️", svg: result?.svg || null }); onClose(); }} style={{ flex: 2, padding: "13px 0", background: theme.accent, border: "none", borderRadius: 14, fontSize: 14, color: "#FFFFFF", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 900 }}>✓ Brug dette!</button>
          </div>
        </>}
      </div>
    </div>
  );
}

// ─── SYMBOL SEARCH OVERLAY ───────────────────────────────────────────────────
export function SymbolSearchOverlay({ onSelect, onClose, theme }) {
  const acc = theme.accent;
  const grad = theme.grad;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current && inputRef.current.focus(), 120);
  }, []);

  const doSearch = async (q) => {
    if (!q.trim()) return;
    setLoading(true); setSearched(true); setResults([]); setSelected(null);
    try {
      const term = q.toLowerCase().trim();
      const matches = SCLERA_ALL_NAMES.filter(name => name.toLowerCase().includes(term)).slice(0, 24);
      const normalized = matches.map(name => ({
        id: name.replace(/\s+/g, "_"),
        name: name,
        image_url: SCLERA_BASE + encodeURIComponent(name + " 1.svg"),
      }));
      setResults(normalized);
    } catch { setResults([]); }
    setLoading(false);
  };

  const pickSymbol = (sym) => setSelected(sym);

  const confirm = () => {
    if (!selected) return;
    onSelect({
      id: "sclera_" + (selected.id || Math.random().toString(36).slice(2)),
      label: selected.name || "Aktivitet",
      emoji: "🖼️",
      svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><image href="${selected.image_url}" width="100" height="100" preserveAspectRatio="xMidYMid meet"/></svg>`,
      sclera_url: selected.image_url,
    });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,8,50,0.55)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#FAFAF8", borderRadius: "28px 28px 0 0", width: "100%", maxWidth: 430, maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 -12px 48px rgba(20,8,50,0.22)" }}>
        <div style={{ width: 40, height: 5, background: "#DDD0F0", borderRadius: 99, margin: "14px auto 0" }} />
        <div style={{ padding: "14px 20px 0" }}>
          <div style={{ fontSize: 18, fontWeight: 900, fontFamily: "'Nunito', sans-serif", color: "#1A1410", marginBottom: 12 }}>Søg Sclera-symboler</div>
          <div style={{ display: "flex", gap: 10 }}>
            <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch(query)}
              placeholder="fx. home, eat, school, swim…"
              style={{ flex: 1, padding: "13px 16px", background: "#FFFFFF", border: `2.5px solid ${acc}40`, borderRadius: 999, fontSize: 15, fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: "#1A1410", outline: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }} />
            <button onClick={() => doSearch(query)} style={{ width: 50, height: 50, borderRadius: 999, background: grad, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${acc}50`, flexShrink: 0 }}>
              <Icon name="plus" size={22} color="#FFFFFF" />
            </button>
          </div>
          <div style={{ fontSize: 10, color: "#9A8A90", fontFamily: "'Nunito', sans-serif", fontWeight: 700, marginTop: 6, marginBottom: 14 }}>Søg på dansk · fx: hjem, spise, skole, sove, svømme</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
          {loading && <div style={{ textAlign: "center", padding: "32px 0", color: acc, fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 14 }}>Søger…</div>}
          {!loading && searched && results.length === 0 && <div style={{ textAlign: "center", padding: "32px 0", color: "#9A8A90", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 13 }}>Ingen resultater — prøv et andet ord</div>}
          {!loading && !searched && <div style={{ textAlign: "center", padding: "24px 0 0", color: "#9A8A90", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 12 }}>Skriv et ord og tryk søg</div>}
          {results.length > 0 && (
            <>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#9A8A90", fontFamily: "'Nunito', sans-serif", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>{results.length} resultater · Tryk for at vælge</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {results.map((sym) => {
                  const isSel = selected && selected.id === sym.id;
                  return (
                    <div key={sym.id} onClick={() => pickSymbol(sym)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      <div style={{
                        width: "100%", aspectRatio: "1", background: "#000000", borderRadius: 18, overflow: "hidden",
                        border: isSel ? `3px solid ${acc}` : "3px solid transparent",
                        boxShadow: isSel ? `0 0 0 3px ${acc}40, 0 6px 18px rgba(0,0,0,0.18)` : "0 3px 10px rgba(0,0,0,0.12)",
                        transform: isSel ? "scale(1.08)" : "scale(1)", transition: "all 0.18s cubic-bezier(0.34,1.4,0.64,1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <img src={sym.image_url} alt={sym.name} style={{ width: "90%", height: "90%", objectFit: "contain" }} loading="lazy" />
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 800, color: isSel ? acc : "#6A5A50", fontFamily: "'Nunito', sans-serif", textAlign: "center", lineHeight: 1.2, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sym.name}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
        {selected && (
          <div style={{ padding: "12px 20px 36px", borderTop: "1.5px solid #EEE8F0", background: "#FFFFFF", display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 54, height: 54, background: "#000000", borderRadius: 14, overflow: "hidden", flexShrink: 0 }}>
              <img src={selected.image_url} alt={selected.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#1A1410", fontFamily: "'Nunito', sans-serif" }}>{selected.name}</div>
              <div style={{ fontSize: 11, color: "#9A8A90", fontFamily: "'Nunito', sans-serif", fontWeight: 700, marginTop: 2 }}>Tryk for at tilføje</div>
            </div>
            <button onClick={confirm} style={{ padding: "13px 24px", background: grad, border: "none", borderRadius: 999, color: "#FFFFFF", fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 15, cursor: "pointer", boxShadow: `0 4px 12px ${acc}50`, flexShrink: 0 }}>Tilføj ✓</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SHARE OVERLAY ───────────────────────────────────────────────────────────
export function ShareOverlay({ shareUrl, pin, onClose, theme }) {
  const acc = theme.accent;
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const copyLink = () => { navigator.clipboard.writeText(shareUrl).then(() => { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); }); };
  const copyPin = () => { navigator.clipboard.writeText(pin).then(() => { setCopiedPin(true); setTimeout(() => setCopiedPin(false), 2000); }); };
  const shortUrl = shareUrl.length > 40 ? shareUrl.slice(0, 38) + "…" : shareUrl;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,8,64,0.5)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#FFFFFF", borderRadius: "28px 28px 0 0", width: "100%", maxWidth: 430, padding: "24px 20px 48px", boxShadow: "0 -8px 40px rgba(26,8,64,0.2)" }}>
        <div style={{ width: 40, height: 5, background: "#DDD0F0", borderRadius: 99, margin: "0 auto 20px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: acc + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="share" size={22} color={acc} /></div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#1A0840", fontFamily: "'Nunito', sans-serif", lineHeight: 1 }}>Del med partner</div>
            <div style={{ fontSize: 12, color: "#6A5A50", fontFamily: "'Nunito', sans-serif", marginTop: 3 }}>Vælg hvordan du vil dele ugeplanen</div>
          </div>
        </div>
        {/* Link */}
        <div style={{ background: "#F8F4FF", borderRadius: 20, padding: "16px", marginBottom: 12, border: "1.5px solid #E0D8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>🔗</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#1A0840", fontFamily: "'Nunito', sans-serif" }}>Delelink</div>
              <div style={{ fontSize: 11, color: "#6A5A50", fontFamily: "'Nunito', sans-serif" }}>Partner åbner linket i browser</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, background: "#FFFFFF", borderRadius: 10, padding: "9px 12px", fontSize: 12, color: "#6A5880", fontFamily: "monospace", border: "1.5px solid #E0D8F0", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{shortUrl}</div>
            <button onClick={copyLink} style={{ flexShrink: 0, padding: "9px 16px", borderRadius: 10, border: "none", cursor: "pointer", background: copiedLink ? "#22C55E" : acc, color: "#FFF", fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 13, transition: "background 0.2s" }}>{copiedLink ? "✓" : "Kopiér"}</button>
          </div>
        </div>
        {/* PIN */}
        <div style={{ background: "#F8F4FF", borderRadius: 20, padding: "16px", border: "1.5px solid #E0D8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>🔢</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#1A0840", fontFamily: "'Nunito', sans-serif" }}>PIN-kode</div>
              <div style={{ fontSize: 11, color: "#6A5A50", fontFamily: "'Nunito', sans-serif" }}>Partner indtaster koden i appen</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", gap: 6, flex: 1, justifyContent: "center" }}>
              {pin.split("").map((d, i) => (
                <div key={i} style={{ width: 44, height: 52, background: "#FFFFFF", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 900, color: acc, fontFamily: "'Nunito', sans-serif", border: `2px solid ${acc}33` }}>{d}</div>
              ))}
            </div>
            <button onClick={copyPin} style={{ flexShrink: 0, padding: "9px 16px", borderRadius: 10, border: "none", cursor: "pointer", background: copiedPin ? "#22C55E" : acc, color: "#FFF", fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 13, transition: "background 0.2s" }}>{copiedPin ? "✓" : "Kopiér"}</button>
          </div>
          <div style={{ fontSize: 11, color: "#8A7A90", fontFamily: "'Nunito', sans-serif", textAlign: "center", marginTop: 10 }}>Koden ændres automatisk når ugeplanen opdateres</div>
        </div>
      </div>
    </div>
  );
}

// ─── TIMER OVERLAY ───────────────────────────────────────────────────────────
export function TimerOverlay({ timerLeft, timerSecs, timerRunning, onStart, onPause, onReset, onClose, onSetTime, theme }) {
  const acc = theme.accent;
  const frac = timerLeft / timerSecs;
  const mins = Math.floor(timerLeft / 60);
  const secs = timerLeft % 60;
  const R = 80, C = 2 * Math.PI * R;
  const dash = C * frac;
  const PRESETS = [
    { label: "5 min",  secs: 300 },
    { label: "10 min", secs: 600 },
    { label: "15 min", secs: 900 },
    { label: "20 min", secs: 1200 },
    { label: "30 min", secs: 1800 },
  ];
  const isDone = timerLeft === 0;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,8,64,0.55)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#FFFFFF", borderRadius: "28px 28px 0 0", width: "100%", maxWidth: 430, padding: "24px 24px 52px", boxShadow: "0 -8px 40px rgba(26,8,64,0.2)" }}>
        <div style={{ width: 40, height: 5, background: "#DDD0F0", borderRadius: 99, margin: "0 auto 20px" }} />
        <div style={{ fontSize: 18, fontWeight: 900, color: "#1A0840", fontFamily: "'Nunito', sans-serif", textAlign: "center", marginBottom: 24 }}>{isDone ? "⏰ Tid!" : "Timer"}</div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <div style={{ position: "relative", width: 200, height: 200 }}>
            <svg width="200" height="200" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="100" cy="100" r={R} fill="none" stroke="#EDE4FA" strokeWidth="12" />
              <circle cx="100" cy="100" r={R} fill="none" stroke={isDone ? "#22C55E" : acc} strokeWidth="12" strokeDasharray={`${dash} ${C}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.5s ease" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: isDone ? 28 : 42, fontWeight: 900, color: isDone ? "#22C55E" : "#1A0840", fontFamily: "'Nunito', sans-serif", lineHeight: 1 }}>
                {isDone ? "Klaret! 🎉" : `${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`}
              </span>
              {!isDone && <span style={{ fontSize: 12, color: "#8A7A90", fontFamily: "'Nunito', sans-serif", marginTop: 4 }}>minutter tilbage</span>}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <button onClick={onReset} style={{ flex: 1, padding: "13px 0", background: "#F0EBF8", border: "none", borderRadius: 999, color: "#6A5880", fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>Nulstil</button>
          <button onClick={timerRunning ? onPause : () => onStart(timerSecs)} style={{ flex: 2, padding: "13px 0", background: isDone ? "#22C55E" : acc, border: "none", borderRadius: 999, color: "#FFFFFF", fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 16, cursor: "pointer", boxShadow: `0 4px 16px ${acc}55` }}>{isDone ? "Igen!" : timerRunning ? "⏸ Pause" : "▶ Start"}</button>
        </div>
        <div style={{ fontSize: 11, color: "#6A5A50", fontFamily: "'Nunito', sans-serif", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Vælg tid</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {PRESETS.map(p => (
            <button key={p.secs} onClick={() => onSetTime(p.secs)} style={{ padding: "8px 14px", borderRadius: 999, border: `2px solid ${timerSecs === p.secs ? acc : "#E0D8F0"}`, background: timerSecs === p.secs ? acc + "18" : "#F8F4FF", color: timerSecs === p.secs ? acc : "#6A5880", fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>{p.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ROUTINE OVERLAY ─────────────────────────────────────────────────────────
export function RoutineOverlay({ onApply, onClose, theme }) {
  const acc = theme.accent;
  const [selected, setSelected] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);
  const template = selected ? ROUTINE_TEMPLATES.find(r => r.id === selected) : null;
  const toggleDay = (d) => setSelectedDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,8,64,0.5)", zIndex: 450, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#FFFFFF", borderRadius: "28px 28px 0 0", width: "100%", maxWidth: 430, padding: "20px 20px 48px", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 -8px 40px rgba(26,8,64,0.2)" }}>
        <div style={{ width: 40, height: 5, background: "#DDD0F0", borderRadius: 99, margin: "0 auto 18px" }} />
        {!template ? (
          <>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#1A0840", fontFamily: "'Nunito', sans-serif", marginBottom: 4 }}>Rutineskabeloner</div>
            <div style={{ fontSize: 13, color: "#6A5A50", fontFamily: "'Nunito', sans-serif", marginBottom: 20 }}>Vælg en færdig rutine og tilpas den til jeres hverdag</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {ROUTINE_TEMPLATES.map(r => (
                <div key={r.id} onClick={() => setSelected(r.id)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 18px", background: "#F8F4FF", borderRadius: 20, cursor: "pointer", border: "2px solid transparent", transition: "all 0.15s" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: r.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>{r.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#1A0840", fontFamily: "'Nunito', sans-serif" }}>{r.label}</div>
                    <div style={{ fontSize: 12, color: "#6A5A50", fontFamily: "'Nunito', sans-serif", marginTop: 2 }}>{r.desc}</div>
                    <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                      {r.cards.map(c => (
                        <span key={c.id} style={{ fontSize: 11, background: r.color + "18", color: r.color, borderRadius: 6, padding: "2px 7px", fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>{c.emoji} {c.label}</span>
                      ))}
                    </div>
                  </div>
                  <span style={{ fontSize: 20, color: "#8A7A90" }}>›</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <button onClick={() => { setSelected(null); setSelectedDays([]); }} style={{ background: "none", border: "none", color: acc, fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 14, cursor: "pointer", padding: 0, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>‹ Tilbage</button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: template.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{template.emoji}</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#1A0840", fontFamily: "'Nunito', sans-serif" }}>{template.label}</div>
                <div style={{ fontSize: 12, color: "#6A5A50", fontFamily: "'Nunito', sans-serif" }}>{template.cards.length} aktiviteter</div>
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#6A5A50", fontFamily: "'Nunito', sans-serif", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10, marginTop: 18 }}>Tilføj til hvilke dage?</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 20 }}>
              {DAYS.map(d => (
                <button key={d.short} onClick={() => toggleDay(d.short)} style={{ padding: "8px 0", borderRadius: 12, border: `2px solid ${selectedDays.includes(d.short) ? acc : "#E0D8F0"}`, background: selectedDays.includes(d.short) ? acc : "#F8F4FF", color: selectedDays.includes(d.short) ? "#FFF" : "#6A5880", fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 10, cursor: "pointer", transition: "all 0.15s" }}>{d.short}</button>
              ))}
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#6A5A50", fontFamily: "'Nunito', sans-serif", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Aktiviteter i rutinen</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {template.cards.map(c => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#F8F4FF", borderRadius: 14 }}>
                  <span style={{ fontSize: 22 }}>{c.emoji}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1A0840", fontFamily: "'Nunito', sans-serif" }}>{c.label}</span>
                </div>
              ))}
            </div>
            <button onClick={() => { if (selectedDays.length > 0) { onApply(template, selectedDays); onClose(); } }} style={{ width: "100%", padding: "16px 0", background: selectedDays.length > 0 ? acc : "#D0CCC8", border: "none", borderRadius: 999, color: "#FFFFFF", fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 16, cursor: selectedDays.length > 0 ? "pointer" : "not-allowed", boxShadow: selectedDays.length > 0 ? `0 4px 16px ${acc}55` : "none", transition: "all 0.2s" }}>
              {selectedDays.length === 0 ? "Vælg mindst én dag" : `Tilføj til ${selectedDays.length} dag${selectedDays.length !== 1 ? "e" : ""} →`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── BANK OVERLAY ─────────────────────────────────────────────────────────────
export function BankOverlay({ library, onSelect, onClose, onOpenGenerate, onOpenSclera, theme, grayscale, scleraIcons }) {
  const acc = theme.accent;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,8,64,0.45)", zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#FFFFFF", borderRadius: "28px 28px 0 0", width: "100%", maxWidth: 430, padding: "20px 16px 44px", maxHeight: "76vh", overflowY: "auto", boxShadow: "0 -8px 40px rgba(26,8,64,0.2)" }}>
        <div style={{ width: 40, height: 5, background: "#DDD0F0", borderRadius: 99, margin: "0 auto 18px" }} />
        <div style={{ fontSize: 11, color: "#6A5A50", fontFamily: "'Nunito', sans-serif", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>Vælg fra biblioteket</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {library.map((p) => {
            const scleraUrl = grayscale && ((scleraIcons && scleraIcons[p.id]) || p.sclera_url);
            const bg = scleraUrl ? "#000000" : (grayscale ? "#F5F0EB" : CARD_BG);
            return (
              <div key={p.id} onClick={() => { onSelect(p); onClose(); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer" }}>
                <div style={{ width: 60, height: 60, background: bg, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, position: "relative", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", border: grayscale && !scleraUrl ? "1.5px solid #D0CCC8" : "none" }}>
                  {!grayscale && <div style={{ position: "absolute", top: 7, right: 9, width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.65)" }} />}
                  {scleraUrl ? <img src={scleraUrl} alt={p.label} style={{ width: 44, height: 44, objectFit: "contain" }} /> : <span>{p.emoji}</span>}
                </div>
                <span style={{ fontSize: 10, color: "#6A5A50", fontFamily: "'Nunito', sans-serif", fontWeight: 700, textAlign: "center" }}>{p.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
