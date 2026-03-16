import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Constants
import { THEMES, CARD_BG, CARD_BG_DONE, CARD_BG_GRAY } from './constants/themes';
import { DAYS } from './constants/days';
import { ROUTINE_TEMPLATES } from './constants/routines';

// Data
import { SCLERA_INLINE } from './data/sclera';
import { PRESET_LIBRARY } from './data/library';

// Helpers
import { uid, initWeek, makeCard, loadProfiles, saveProfiles, makeProfile } from './utils/helpers';

// Components
import Icon from './components/Icon';
import PictoCard from './components/PictoCard';
import GrayscaleEmoji from './components/GrayscaleEmoji';
import { BW_SYMBOLS } from './data/bwSymbols';
import OnboardingScreen from './components/OnboardingScreen';
import { PrintOverlay, RoutinePrintOverlay } from './components/PrintComponents';
import {
  CardEditorOverlay,
  AddToDayOverlay,
  GenerateOverlay,
  SymbolSearchOverlay,
  ShareOverlay,
  TimerOverlay,
  RoutineOverlay,
  BankOverlay,
} from './components/Overlays';

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  // ── Multi-profile state ──
  const [profiles, setProfiles] = useState(() => {
    const saved = loadProfiles();
    return saved && saved.length > 0 ? saved : null;
  });
  const [activeProfileId, setActiveProfileId] = useState(() => {
    try { return localStorage.getItem("ugeplan_active") || null; } catch { return null; }
  });
  const [addingChild, setAddingChild] = useState(false);

  // Derived active profile
  const activeProfile = profiles && profiles.find(p => p.id === activeProfileId) || profiles?.[0] || null;

  // Per-profile week — stored inside profile object, supports multiple weeks by offset
  const [weekOffset, setWeekOffset] = useState(0);
  const getWeeks = (p) => p?.weeks || (p?.week ? { 0: p.week } : { 0: initWeek() });
  const week = getWeeks(activeProfile)[weekOffset] || initWeek();
  const setWeek = (updater) => {
    setProfiles(prev => {
      const next = prev.map(p => {
        if (p.id !== activeProfile.id) return p;
        const currentWeeks = getWeeks(p);
        const currentWeek = currentWeeks[weekOffset] || initWeek();
        const newWeek = typeof updater === "function" ? updater(currentWeek) : updater;
        return { ...p, weeks: { ...currentWeeks, [weekOffset]: newWeek } };
      });
      saveProfiles(next);
      return next;
    });
  };

  const childName = activeProfile?.name || "";

  // Per-profile: library, grayscale, showLabels
  const library = activeProfile?.library || PRESET_LIBRARY;
  const setLibrary = (updater) => {
    setProfiles(prev => {
      const next = prev.map(p => {
        if (p.id !== activeProfile.id) return p;
        const cur = p.library || PRESET_LIBRARY;
        return { ...p, library: typeof updater === "function" ? updater(cur) : updater };
      });
      saveProfiles(next);
      return next;
    });
  };

  const grayscale = activeProfile?.grayscale ?? false;
  const setGrayscale = (val) => {
    setProfiles(prev => {
      const next = prev.map(p => p.id !== activeProfile.id ? p : { ...p, grayscale: typeof val === "function" ? val(p.grayscale ?? false) : val });
      saveProfiles(next);
      return next;
    });
  };

  const showLabels = activeProfile?.showLabels ?? true;
  const setShowLabels = (val) => {
    setProfiles(prev => {
      const next = prev.map(p => p.id !== activeProfile.id ? p : { ...p, showLabels: typeof val === "function" ? val(p.showLabels ?? true) : val });
      saveProfiles(next);
      return next;
    });
  };

  const [themeId, setThemeId]     = useState(() => activeProfile?.themeId || "lyng");
  const [showRoutines, setShowRoutines] = useState(false);
  const [showTimer, setShowTimer]       = useState(false);
  const [timerSecs, setTimerSecs]       = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerLeft, setTimerLeft]       = useState(300);
  const [showShare, setShowShare]       = useState(false);
  const [tab, setTab]             = useState("week");
  const [focusDay, setFocusDay]   = useState("Man");
  const [bankFor, setBankFor]     = useState(null);
  const [generateFor, setGenerateFor] = useState(null);
  const [editMode, setEditMode]   = useState(false);
  const [dragSrc, setDragSrc]     = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [dayDragSrc, setDayDragSrc]   = useState(null);
  const [dayDropTarget, setDayDropTarget] = useState(null);
  const [dayDropFlash, setDayDropFlash]   = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [addingToDay, setAddingToDay] = useState(null);
  const [selectedCards, setSelectedCards] = useState([]);
  const [libFilter, setLibFilter] = useState("alle");
  const [libSearch, setLibSearch] = useState("");
  const [editLabelCard, setEditLabelCard] = useState(null);
  const [libGenResult, setLibGenResult] = useState(null);
  const [libGenLoading, setLibGenLoading] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showRoutinePrint, setShowRoutinePrint] = useState(false);
  const [showSymbolSearch, setShowSymbolSearch] = useState(false);
  const [deleteConfirmProfile, setDeleteConfirmProfile] = useState(null);
  const [scleraIcons, setScleraIcons] = useState({});
  const [daySwipeStart, setDaySwipeStart] = useState(null);
  const [weekSwipeStart, setWeekSwipeStart] = useState(null);
  const fileInputRef = useRef(null);
  const [scleraLoading, setScleraLoading] = useState(false);

  const theme    = THEMES.find(t => t.id === themeId);
  const acc      = theme.accent;
  const grad     = theme.grad;
  const activeBg = theme.bg;
  const cardRow  = "rgba(255,255,255,0.75)";
  const todayIdx = [6, 0, 1, 2, 3, 4, 5][new Date().getDay()]; // JS: 0=søn → DAYS: 0=man

  // Beregn mandagens dato for den viste uge, tilpas weekOffset
  const weekDates = (() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - todayIdx + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  })();

  // ── Library operations ──
  const saveToLibrary = (picto, original) => {
    if (original) {
      setLibrary(prev => prev.map(p => p.id === original.id ? { ...p, ...picto } : p));
      setWeek(prev => {
        const next = {};
        DAYS.forEach(d => {
          next[d.short] = (prev[d.short] || []).map(c =>
            c.id === original.id ? { ...c, ...picto } : c
          );
        });
        return next;
      });
    } else {
      const newPicto = { id: uid(), ...picto };
      setLibrary(prev => [newPicto, ...prev]);
    }
  };
  const deleteFromLibrary = (id) => setLibrary(prev => prev.filter(p => p.id !== id));

  // ── Week operations ──
  const addCard = (day, p) => setWeek(prev => ({ ...prev, [day]: [...prev[day], makeCard(p)] }));
  const removeCard = (day, u) => setWeek(prev => ({ ...prev, [day]: prev[day].filter(c => c.uid !== u) }));
  const toggleDone = (day, u) => setWeek(prev => ({ ...prev, [day]: prev[day].map(c => c.uid === u ? { ...c, done: !c.done } : c) }));

  // Load inline Sclera SVG icons
  useEffect(() => {
    setScleraIcons(SCLERA_INLINE);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!timerRunning) return;
    if (timerLeft <= 0) { setTimerRunning(false); return; }
    const t = setTimeout(() => setTimerLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timerRunning, timerLeft]);

  const startTimer = (secs) => { setTimerSecs(secs); setTimerLeft(secs); setTimerRunning(true); setShowTimer(true); };
  const resetTimer = () => { setTimerRunning(false); setTimerLeft(timerSecs); };

  // Share plan
  const getShareUrl = () => {
    try {
      const data = JSON.stringify({ week, theme: theme.id });
      const b64 = btoa(unescape(encodeURIComponent(data)));
      return window.location.origin + window.location.pathname + '?plan=' + b64;
    } catch { return window.location.href; }
  };
  const sharePIN = Math.abs(JSON.stringify(week).split('').reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0) % 9000 + 1000).toString();

  // ── Week drag handlers ──
  const onDragStart = (day, idx) => setDragSrc({ day, idx });
  const onDragOver  = (e, day, idx) => { e.preventDefault(); setDropTarget({ day, idx }); };
  const onDragEnd   = () => { setDragSrc(null); setDropTarget(null); };
  const onDrop = (e, tDay, tIdx) => {
    e.preventDefault(); if (!dragSrc) return;
    setWeek(prev => {
      const next = {}; DAYS.forEach(d => { next[d.short] = [...prev[d.short]]; });
      const [moved] = next[dragSrc.day].splice(dragSrc.idx, 1);
      next[tDay].splice(tIdx, 0, moved); return next;
    });
    setDragSrc(null); setDropTarget(null);
  };
  const onDropCol = (e, day) => {
    e.preventDefault(); if (!dragSrc || dragSrc.day === day) { setDragSrc(null); setDropTarget(null); return; }
    setWeek(prev => {
      const next = {}; DAYS.forEach(d => { next[d.short] = [...prev[d.short]]; });
      const [moved] = next[dragSrc.day].splice(dragSrc.idx, 1);
      next[day].push(moved); return next;
    });
    setDragSrc(null); setDropTarget(null);
  };

  // ── Day drag handlers ──
  const onDayDragStart = (idx) => setDayDragSrc(idx);
  const onDayDragEnd   = () => { setDayDragSrc(null); setDayDropTarget(null); };
  const onDayDragOver  = (e, idx) => { e.preventDefault(); setDayDropTarget(idx); };
  const onDayDrop = (e, tIdx) => {
    e.preventDefault();
    if (dayDragSrc === null || dayDragSrc === tIdx) { setDayDragSrc(null); setDayDropTarget(null); return; }
    setWeek(prev => {
      const cards = [...prev[focusDay]];
      const [moved] = cards.splice(dayDragSrc, 1);
      cards.splice(tIdx, 0, moved);
      return { ...prev, [focusDay]: cards };
    });
    setDayDropFlash(tIdx);
    setTimeout(() => setDayDropFlash(null), 350);
    setDayDragSrc(null); setDayDropTarget(null);
  };

  // ── AI Library Card Generation ──
  const generateLibCard = async (query) => {
    setLibGenLoading(true);
    setLibGenResult(null);
    const svgBg  = grayscale ? "#000000" : theme.bg;
    const svgAcc = grayscale ? "#FFFFFF" : acc;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 800,
          messages: [{
            role: "user",
            content: `Tegn et simpelt SVG piktogram af "${query}" til børn (alder 4-10).

Regler:
- viewBox="0 0 100 100"
- Maks 12 SVG-elementer (rect, circle, ellipse, path, polygon, line)
- Tykke streger (stroke-width 4-7), stroke-linecap="round", stroke-linejoin="round"
- Brug disse to farver: baggrundsfarve="${svgBg}" og accentfarve="${svgAcc}"
- Baggrund: <rect width="100" height="100" fill="${svgBg}"/>
- Figuren tegnes med fill="${svgAcc}" og evt. stroke="${svgAcc}"
- Genkendelig silhouet, ikke for detaljeret, barnlig og glad stil
- Svar KUN med JSON (ingen markdown):
{"label":"${query}","svg":"<svg viewBox=\\"0 0 100 100\\" xmlns=\\"http://www.w3.org/2000/svg\\">...</svg>"}`
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      const match = text.match(/\{[\s\S]*"svg"\s*:\s*"[\s\S]*?"\s*\}/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          setLibGenResult({ label: parsed.label, svg: parsed.svg, emoji: "🖼️" });
        } catch(e) {
          const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/);
          if (svgMatch) setLibGenResult({ label: query, svg: svgMatch[0], emoji: "🖼️" });
        }
      }
    } catch(e) {}
    setLibGenLoading(false);
  };

  const saveLabel = (picto, newLabel) => {
    if (!newLabel.trim()) return;
    setLibrary(prev => prev.map(p => p.id === picto.id ? { ...p, label: newLabel.trim() } : p));
    setEditLabelCard(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').substring(0, 30) || "Billede";
      const newCard = { id: "img_" + Date.now(), label: name, emoji: "🖼️", imageUrl: ev.target.result };
      setLibrary(prev => [newCard, ...prev]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Sync per-profile UI state when active profile changes
  useEffect(() => {
    if (activeProfile?.themeId) setThemeId(activeProfile.themeId);
    setWeekOffset(0);
  }, [activeProfile?.id]);

  // Save theme change back to profile
  const handleSetThemeId = (tid) => {
    setThemeId(tid);
    if (activeProfile) {
      setProfiles(prev => {
        const next = prev.map(p => p.id === activeProfile.id ? { ...p, themeId: tid } : p);
        saveProfiles(next);
        return next;
      });
    }
  };

  // ── Onboarding ──
  if (!profiles) {
    return (
      <OnboardingScreen onDone={({ childName: name, themeId: tid, avatar }) => {
        const profile = makeProfile(name || "Barn", tid, avatar);
        const newProfiles = [profile];
        setProfiles(newProfiles);
        setActiveProfileId(profile.id);
        setThemeId(tid);
        saveProfiles(newProfiles);
        try { localStorage.setItem("ugeplan_active", profile.id); } catch {}
      }} />
    );
  }

  if (addingChild) {
    return (
      <OnboardingScreen isAddingChild onDone={({ childName: name, themeId: tid, avatar }) => {
        const profile = makeProfile(name || "Barn", tid, avatar);
        const newProfiles = [...profiles, profile];
        setProfiles(newProfiles);
        setActiveProfileId(profile.id);
        setThemeId(tid);
        setAddingChild(false);
        saveProfiles(newProfiles);
        try { localStorage.setItem("ugeplan_active", profile.id); } catch {}
      }} />
    );
  }

  // ── Delt profil-strip (vises øverst i alle views) ──────────────────────────
  const profileStrip = profiles && profiles.length > 0 && (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
      {profiles.map(p => (
        <button key={p.id} onClick={() => { setActiveProfileId(p.id); setWeekOffset(0); try { localStorage.setItem("ugeplan_active", p.id); } catch {} }} style={{
          display: "flex", alignItems: "center", gap: 5,
          background: p.id === activeProfile?.id ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.22)",
          border: p.id === activeProfile?.id ? "none" : "1.5px solid rgba(255,255,255,0.35)",
          borderRadius: 999, padding: "8px 14px 8px 9px",
          minHeight: 36,
          cursor: "pointer", transition: "all 0.2s cubic-bezier(0.34,1.2,0.64,1)",
          boxShadow: p.id === activeProfile?.id ? "0 3px 10px rgba(0,0,0,0.15)" : "none",
        }}>
          <span style={{ fontSize: 16 }}>{p.avatar || "🦁"}</span>
          <span style={{ fontSize: 12, fontWeight: 900, fontFamily: "'Nunito', sans-serif", color: p.id === activeProfile?.id ? acc : "#FFFFFF" }}>{p.name}</span>
        </button>
      ))}
      <button onClick={() => setAddingChild(true)} style={{
        display: "flex", alignItems: "center", gap: 4,
        background: "rgba(255,255,255,0.12)", border: "1.5px dashed rgba(255,255,255,0.45)",
        borderRadius: 999, padding: "8px 13px 8px 10px",
        minHeight: 36,
        cursor: "pointer", color: "#FFFFFF",
        fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 12,
      }}>
        <span style={{ fontSize: 14 }}>+</span> Tilføj
      </button>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // ── WEEK VIEW ─────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  const renderWeek = () => (
    <div
      style={{ paddingBottom: "calc(100px + env(safe-area-inset-bottom, 0px))" }}
      onTouchStart={e => setWeekSwipeStart(e.touches[0].clientX)}
      onTouchEnd={e => {
        if (weekSwipeStart === null) return;
        const dx = e.changedTouches[0].clientX - weekSwipeStart;
        if (Math.abs(dx) > 60) { if (dx < 0) setWeekOffset(o => o + 1); else setWeekOffset(o => o - 1); }
        setWeekSwipeStart(null);
      }}
    >
      <div className="header-gradient" style={{ background: grad, padding: "20px 18px 16px", borderRadius: "0 0 28px 28px" }}>

        {/* ── Række 1: Titel + primær handling ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#FFFFFF", fontFamily: "'Nunito', sans-serif", lineHeight: 1, letterSpacing: -0.5 }}>
            {childName ? `${childName}s Ugeplan` : "Ugeplan"}
          </div>
          <button onClick={() => setEditMode(!editMode)} style={{
            background: editMode ? "#FFFFFF" : "rgba(255,255,255,0.22)",
            backdropFilter: "blur(8px)", color: editMode ? acc : "#FFFFFF",
            border: "none", borderRadius: 999, padding: "10px 18px",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
            fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 14,
            boxShadow: editMode ? `0 4px 16px rgba(0,0,0,0.18)` : "0 2px 8px rgba(0,0,0,0.15)",
            flexShrink: 0,
          }}>
            <Icon name={editMode ? "check" : "edit"} size={16} color={editMode ? acc : "#FFFFFF"} />
            {editMode ? "Færdig" : "Rediger"}
          </button>
        </div>

        {/* ── Række 2: Sekundære handlinger ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button onClick={() => setShowLabels(v => !v)} style={{
            flex: 1, background: showLabels ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.10)",
            border: `1.5px solid ${showLabels ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)"}`,
            color: "#FFFFFF", borderRadius: 12, padding: "9px 8px",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 12,
            opacity: showLabels ? 1 : 0.65,
          }}>
            <span style={{ fontSize: 13 }}>Aa</span> Label
          </button>
          <button onClick={() => setShowShare(true)} style={{
            flex: 1, background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)",
            color: "#FFFFFF", borderRadius: 12, padding: "9px 8px",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 12,
          }}>
            <Icon name="share" size={15} color="#FFFFFF" /> Del plan
          </button>
          <button onClick={() => setShowPrint(true)} style={{
            flex: 1, background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)",
            color: "#FFFFFF", borderRadius: 12, padding: "9px 8px",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 12,
          }}>
            <Icon name="print" size={15} color="#FFFFFF" /> Udskriv
          </button>
        </div>

        {/* ── Række 3: Uge-navigation ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <button onClick={() => setWeekOffset(o => o - 1)} style={{
            background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.3)",
            borderRadius: 12, width: 44, height: 44, cursor: "pointer", color: "#FFFFFF",
            fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>‹</button>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "8px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#FFFFFF", fontFamily: "'Nunito', sans-serif" }}>
              {weekOffset === 0 ? "Denne uge" : weekOffset === 1 ? "Næste uge" : weekOffset === -1 ? "Forrige uge" : weekOffset > 0 ? `Om ${weekOffset} uger` : `${Math.abs(weekOffset)} uger siden`}
            </div>
            {editMode && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontFamily: "'Nunito', sans-serif", fontWeight: 600, marginTop: 1 }}>Træk kort for at flytte dem</div>}
          </div>
          <button onClick={() => setWeekOffset(o => o + 1)} style={{
            background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.3)",
            borderRadius: 12, width: 44, height: 44, cursor: "pointer", color: "#FFFFFF",
            fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>›</button>
        </div>


      </div>
      <div style={{ background: activeBg, minHeight: 300, marginTop: -4 }}>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }} onTouchStart={e => e.stopPropagation()} onTouchEnd={e => e.stopPropagation()}>
          <div style={{ display: "flex", minWidth: DAYS.length * 108 + 16, padding: "16px 8px 8px" }}>
            {DAYS.map((day, di) => {
              const cards = week[day.short] || [];
              const isToday = di === todayIdx;
              const isDragOver = dragSrc !== null && dropTarget?.day === day.short;
              return (
                <div key={day.short} onDragOver={e => onDragOver(e, day.short, cards.length)} onDrop={e => onDropCol(e, day.short)} style={{
                  flex: "0 0 100px", width: 100, borderRadius: 24, padding: "0 4px 12px",
                  background: isDragOver ? `${acc}18` : isToday ? "rgba(255,255,255,0.65)" : "transparent",
                  boxShadow: isDragOver ? `0 0 0 2px ${acc}, 0 8px 24px ${acc}20` : isToday ? "0 8px 24px rgba(0,0,0,0.10)" : "none",
                  border: "none", transition: "background 0.15s, box-shadow 0.15s",
                }}>
                  <div className="tappable" onClick={() => { setFocusDay(day.short); setTab("day"); }} style={{ textAlign: "center", padding: "10px 4px 8px" }}>
                    <div style={{ fontSize: 11, fontWeight: 900, fontFamily: "'Nunito', sans-serif", color: isToday ? acc : "#6A5880", letterSpacing: 0.5, textTransform: "uppercase" }}>{day.short}</div>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", margin: "4px auto 0",
                      background: isToday ? acc : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "'Nunito', sans-serif", color: isToday ? "#FFFFFF" : "#8A7A90" }}>
                        {weekDates[di].getDate()}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    {cards.map((card, idx) => (
                      <div key={card.uid} onDragOver={e => { e.stopPropagation(); onDragOver(e, day.short, idx); }} onDrop={e => { e.stopPropagation(); onDrop(e, day.short, idx); }} style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
                        {dropTarget?.day === day.short && dropTarget?.idx === idx && (
                          <div style={{ position: "absolute", top: -7, left: 2, right: 2, height: 3, background: acc, borderRadius: 99, zIndex: 5, boxShadow: `0 0 6px ${acc}` }} />
                        )}
                        <PictoCard card={card} small grayscale={grayscale} showLabel={showLabels} dragging={dragSrc?.day === day.short && dragSrc?.idx === idx} onDragStart={() => onDragStart(day.short, idx)} onDragEnd={onDragEnd} accent={acc} scleraUrl={scleraIcons[card.id]} onToggle={() => toggleDone(day.short, card.uid)} onRemove={editMode ? () => removeCard(day.short, card.uid) : null} />
                      </div>
                    ))}
                    <button onClick={() => setBankFor(day.short)} style={{ width: 64, height: cards.length === 0 ? 60 : 40, borderRadius: 18, background: cards.length === 0 ? `${acc}18` : "rgba(255,255,255,0.8)", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, transition: "all 0.18s cubic-bezier(0.34,1.4,0.64,1)", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
                      <Icon name="plus" size={cards.length === 0 ? 22 : 14} color={acc} />
                      {cards.length === 0 && <span style={{ fontSize: 10, fontWeight: 900, color: acc, fontFamily: "'Nunito', sans-serif", lineHeight: 1 }}>Tilføj</span>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // ── DAY VIEW ──────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  const renderDay = () => {
    const day   = DAYS.find(d => d.short === focusDay);
    const cards = week[focusDay] || [];
    const done  = cards.filter(c => c.done).length;
    const dayIdx = DAYS.findIndex(d => d.short === focusDay);
    return (
      <div
        style={{ paddingBottom: "calc(100px + env(safe-area-inset-bottom, 0px))" }}
        onTouchStart={e => setDaySwipeStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })}
        onTouchEnd={e => {
          if (!daySwipeStart) return;
          const dx = e.changedTouches[0].clientX - daySwipeStart.x;
          const dy = Math.abs(e.changedTouches[0].clientY - daySwipeStart.y);
          if (Math.abs(dx) > 60 && dy < 80) {
            if (dx < 0 && dayIdx < DAYS.length - 1) setFocusDay(DAYS[dayIdx + 1].short);
            else if (dx > 0 && dayIdx > 0) setFocusDay(DAYS[dayIdx - 1].short);
          }
          setDaySwipeStart(null);
        }}
      >
        <div className="header-gradient" style={{ background: grad, padding: "16px 18px 18px", borderRadius: "0 0 28px 28px" }}>
          {profileStrip}

          {/* ── Funktionsknapper under profil-strip ── */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button onClick={() => setShowPrint(true)} style={{
              flex: 1, background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)",
              color: "#FFFFFF", borderRadius: 12, padding: "9px 8px",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 12,
            }}>
              <Icon name="print" size={15} color="#FFFFFF" /> Udskriv
            </button>
            <button onClick={() => setShowShare(true)} style={{
              flex: 1, background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.3)",
              color: "#FFFFFF", borderRadius: 12, padding: "9px 8px",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 12,
            }}>
              <Icon name="share" size={15} color="#FFFFFF" /> Del plan
            </button>
          </div>

          {/* ── Række 1: Dag-vælger strip ── */}
          <div className="snap-strip" style={{ display: "flex", gap: 5, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
            {DAYS.map(d => {
              const dayCards = week[d.short] || [];
              const dayDone = dayCards.filter(c => c.done).length;
              const isActive = d.short === focusDay;
              return (
                <button key={d.short} onClick={() => setFocusDay(d.short)} style={{
                  flexShrink: 0, padding: "8px 13px",
                  background: isActive ? "#FFFFFF" : "rgba(255,255,255,0.18)",
                  color: isActive ? acc : "#FFFFFF",
                  borderRadius: 12, border: isActive ? "none" : "1.5px solid rgba(255,255,255,0.3)",
                  cursor: "pointer", fontSize: 12, fontWeight: 900,
                  fontFamily: "'Nunito', sans-serif",
                  boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  minWidth: 44, minHeight: 44, justifyContent: "center",
                }}>
                  <span>{d.short}</span>
                  {dayCards.length > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, opacity: isActive ? 0.7 : 0.55 }}>
                      {dayDone}/{dayCards.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Række 2: Dag-titel + primær handling ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {dayIdx > 0 && (
                <button onClick={() => setFocusDay(DAYS[dayIdx - 1].short)} style={{
                  background: "rgba(255,255,255,0.18)", border: "none", borderRadius: 10,
                  width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#FFFFFF", fontSize: 18, cursor: "pointer", flexShrink: 0,
                }}>‹</button>
              )}
              <div>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#FFFFFF", fontFamily: "'Nunito', sans-serif", letterSpacing: -0.5, lineHeight: 1 }}>{day.full} {day.emoji}</div>
              </div>
              {dayIdx < DAYS.length - 1 && (
                <button onClick={() => setFocusDay(DAYS[dayIdx + 1].short)} style={{
                  background: "rgba(255,255,255,0.18)", border: "none", borderRadius: 10,
                  width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#FFFFFF", fontSize: 18, cursor: "pointer", flexShrink: 0,
                }}>›</button>
              )}
            </div>
            <button onClick={() => setEditMode(!editMode)} style={{
              background: editMode ? "#FFFFFF" : "rgba(255,255,255,0.22)",
              backdropFilter: "blur(8px)", color: editMode ? acc : "#FFFFFF",
              border: "none", borderRadius: 999, padding: "10px 18px",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
              fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 14,
              boxShadow: editMode ? "0 4px 16px rgba(0,0,0,0.18)" : "0 2px 8px rgba(0,0,0,0.15)",
              flexShrink: 0,
            }}>
              <Icon name={editMode ? "check" : "edit"} size={16} color={editMode ? acc : "#FFFFFF"} />
              {editMode ? "Færdig" : "Rediger"}
            </button>
          </div>

          {/* Hjælpetekst i redigeringstilstand */}
          {editMode && (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontFamily: "'Nunito', sans-serif", fontWeight: 600, marginTop: 8, textAlign: "center" }}>
              Tryk på et kort for at fjerne det
            </div>
          )}
        </div>
        <div style={{ background: activeBg, padding: "20px 0 20px", minHeight: 200 }}>
          {cards.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px 20px", color: "#8A7A90", fontFamily: "'Nunito', sans-serif" }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Ingen aktiviteter endnu</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Tryk + for at tilføje</div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: cards.length === 0 ? "0 18px 8px" : "16px 18px 8px" }}>
            {cards.map((card, idx) => {
              const isDragging = dayDragSrc === idx;
              const isDropTarget = dayDropTarget === idx && dayDragSrc !== null && dayDragSrc !== idx;
              const isFlashing = dayDropFlash === idx;
              return (
                <div key={card.uid}
                  draggable
                  onDragStart={() => onDayDragStart(idx)}
                  onDragEnd={onDayDragEnd}
                  onDragOver={e => onDayDragOver(e, idx)}
                  onDrop={e => onDayDrop(e, idx)}
                  className="card-row"
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    background: isDropTarget ? `${acc}12` : isFlashing ? `${acc}28` : card.done ? "rgba(255,255,255,0.35)" : cardRow,
                    borderRadius: 20, padding: "10px 14px",
                    opacity: isDragging ? 0.4 : card.done ? 0.65 : 1,
                    transform: isDropTarget ? "translateY(-2px) scale(1.01)" : isDragging ? "scale(0.97)" : "scale(1)",
                    boxShadow: isDropTarget ? `0 4px 16px ${acc}30, 0 0 0 2px ${acc}` : isFlashing ? `0 0 0 2px ${acc}80` : "0 2px 6px rgba(0,0,0,0.05)",
                    transition: "opacity 0.12s, transform 0.12s, box-shadow 0.12s, background 0.12s",
                    cursor: isDragging ? "grabbing" : "grab",
                    borderLeft: isDropTarget ? `3px solid ${acc}` : "3px solid transparent",
                  }}>
                  {/* Drag handle */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, flexShrink: 0, opacity: 0.3, cursor: "grab", padding: "0 2px" }}>
                    {[0,1,2].map(i => <div key={i} style={{ display: "flex", gap: 3 }}>{[0,1].map(j => <div key={j} style={{ width: 3, height: 3, borderRadius: "50%", background: "#1A0840" }} />)}</div>)}
                  </div>
                  <PictoCard card={card} grayscale={grayscale} accent={acc} scleraUrl={scleraIcons[card.id]} onToggle={() => toggleDone(focusDay, card.uid)} onRemove={editMode ? () => removeCard(focusDay, card.uid) : null} dragging={isDragging} onDragStart={() => onDayDragStart(idx)} onDragEnd={onDayDragEnd} />
                  <span style={{ flex: 1, fontSize: 18, fontWeight: 800, color: card.done ? "#9A9090" : "#1A1410", fontFamily: "'Nunito', sans-serif", textDecoration: card.done ? "line-through" : "none", transition: "color 0.2s", letterSpacing: -0.2 }}>{card.label}</span>
                  {card.done && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: acc,
                      borderRadius: 999, padding: "6px 14px",
                      boxShadow: `0 3px 12px ${acc}60`,
                      flexShrink: 0,
                      animation: "doneOverlay 0.35s cubic-bezier(0.34,1.56,0.64,1)",
                    }}>
                      <Icon name="check" size={16} color="#FFFFFF" />
                      <span style={{ fontSize: 12, fontWeight: 900, color: "#FFFFFF", fontFamily: "'Nunito', sans-serif" }}>Klaret!</span>
                    </div>
                  )}
                </div>
              );
            })}
            {/* Add activity button */}
            <button onClick={() => setBankFor(focusDay)} style={{
              display: "flex", alignItems: "center", gap: 14,
              background: "#FFFFFF", border: "none",
              borderRadius: 24, padding: "14px 20px", cursor: "pointer",
              color: acc, fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 16,
              marginTop: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            }}>
              <div style={{ width: 42, height: 42, borderRadius: 14, background: grad, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 10px ${acc}50` }}>
                <Icon name="plus" size={22} color="#FFFFFF" />
              </div>
              <span>Tilføj aktivitet</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // ── LIBRARY VIEW ──────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  const renderLibrary = () => {
    const presetIds = new Set(PRESET_LIBRARY.map(p => p.id));
    const myCards   = library.filter(p => !presetIds.has(p.id));
    const q = libSearch.trim().toLowerCase();

    // In grayscale mode: BW folder symbols are the primary library
    const bwFiltered = q
      ? BW_SYMBOLS.filter(s => s.label.toLowerCase().includes(q))
      : BW_SYMBOLS;
    const myFiltered = q
      ? myCards.filter(p => p.label.toLowerCase().includes(q) || (p.tags || []).some(t => t.toLowerCase().includes(q)))
      : myCards;

    // Color mode: existing library
    const baseCards = libFilter === "mine" ? myCards : library;
    const colorCards = q
      ? baseCards.filter(p => p.label.toLowerCase().includes(q) || (p.tags || []).some(t => t.toLowerCase().includes(q)))
      : baseCards;

    // What to show in the grid
    const showCards = grayscale
      ? (libFilter === "mine" ? myFiltered : bwFiltered)
      : colorCards;

    return (
      <div style={{ paddingBottom: "calc(100px + env(safe-area-inset-bottom, 0px))" }}>
        <div className="header-gradient" style={{ background: grad, padding: "22px 20px 20px", borderRadius: "0 0 28px 28px" }}>
          {profileStrip}
          <div style={{ fontSize: 24, fontWeight: 900, color: "#FFFFFF", fontFamily: "'Nunito', sans-serif", lineHeight: 1, marginBottom: 2, letterSpacing: -0.5 }}>Bibliotek</div>
          <div style={{ fontSize: 13, color: "#FFFFFF", fontFamily: "'Nunito', sans-serif", fontWeight: 600 }}>{library.length} kort · {myCards.length} egne</div>
        </div>

        <div style={{ background: activeBg, padding: "16px 18px 24px" }}>
          {/* Library actions: new card + upload image */}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <button onClick={() => setEditingCard({ picto: { emoji: "⭐", label: "" }, isNew: true })} title="Lav eget kort" style={{
              height: 54, background: "#FFFFFF", border: "none", borderRadius: 16, color: acc,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "0 18px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.10)", flexShrink: 0,
              fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 13,
            }}>
              <Icon name="edit" size={18} color={acc} />
              Tegn selv
            </button>
            <button onClick={() => fileInputRef.current?.click()} title="Upload billede" style={{
              height: 54, background: "#FFFFFF", border: "none", borderRadius: 16, color: "#6A5A50",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "0 18px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.10)", flexShrink: 0,
              fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 13,
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6A5A50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
              </svg>
              Upload billede
            </button>
          </div>

          {/* Filter tabs */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.7)", borderRadius: 999, padding: 4, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            {[["alle", grayscale ? `Sort/hvid (${BW_SYMBOLS.length})` : `Alle (${library.length})`], ["mine", `Mine (${myCards.length})`]].map(([id, lbl]) => (
              <button key={id} onClick={() => setLibFilter(id)} style={{
                flex: 1, padding: "10px 0", borderRadius: 999,
                background: libFilter === id ? acc : "transparent",
                color: libFilter === id ? "#FFFFFF" : "#6A5A50",
                border: "none", cursor: "pointer",
                fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 13,
                boxShadow: libFilter === id ? `0 4px 10px ${acc}40` : "none",
                transition: "all 0.2s cubic-bezier(0.34,1.2,0.64,1)",
              }}>{lbl}</button>
            ))}
          </div>

          {/* Search bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.85)", borderRadius: 16, padding: "10px 16px", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6A5A50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input value={libSearch} onChange={e => { setLibSearch(e.target.value); setLibGenResult(null); }} placeholder="Søg i bibliotek…" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14, fontWeight: 600, color: "#1A0840", fontFamily: "'Nunito', sans-serif" }} />
            {libSearch && (
              <button onClick={() => setLibSearch("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#6A5A50", display: "flex", alignItems: "center" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>

          {/* Empty search — offer AI generation + upload */}
          {libSearch && showCards.length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 8px 16px", fontFamily: "'Nunito', sans-serif" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#1A0840", marginBottom: 4 }}>Ingen kort for "{libSearch}"</div>
              <div style={{ fontSize: 13, color: "#6A5A50", marginBottom: 20 }}>Opret et nyt kort automatisk eller upload et billede</div>
              {!libGenResult && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
                  <button onClick={() => generateLibCard(libSearch)} disabled={libGenLoading} style={{
                    background: libGenLoading ? "#EEE" : acc,
                    color: libGenLoading ? "#AAA" : "#FFF",
                    border: "none", borderRadius: 999,
                    padding: "14px 28px", fontSize: 14, fontWeight: 900,
                    cursor: libGenLoading ? "default" : "pointer",
                    display: "inline-flex", alignItems: "center", gap: 10,
                    boxShadow: libGenLoading ? "none" : `0 4px 16px ${acc}50`,
                    fontFamily: "'Nunito', sans-serif", width: "100%", justifyContent: "center",
                  }}>
                    {libGenLoading
                      ? <><div style={{ width: 18, height: 18, borderRadius: "50%", border: "3px solid #CCC", borderTopColor: "#888", animation: "spin 0.8s linear infinite" }} /> Tegner ikon…</>
                      : <><Icon name="ai" size={18} color="#FFF" /> AI tegner "{libSearch}"</>
                    }
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} style={{
                    background: "#FFFFFF", color: "#374151", border: "1.5px solid #E5E7EB",
                    borderRadius: 999, padding: "13px 28px", fontSize: 14, fontWeight: 800,
                    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 10,
                    fontFamily: "'Nunito', sans-serif", width: "100%", justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
                    </svg>
                    Upload dit eget billede
                  </button>
                </div>
              )}
              {libGenResult && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 90, height: 100, background: grayscale ? "#000000" : (libGenResult.svg ? theme.bg : CARD_BG), borderRadius: 28, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.12)", fontSize: 46, overflow: "hidden" }}>
                    {libGenResult.svg
                      ? <div style={{ lineHeight: 0, filter: grayscale ? "grayscale(1) brightness(3)" : "none" }} dangerouslySetInnerHTML={{ __html: libGenResult.svg.replace(/<svg/, '<svg width="90" height="100"') }} />
                      : <span style={{ filter: grayscale ? "grayscale(1) brightness(3)" : "none" }}>{libGenResult.emoji}</span>
                    }
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#1A0840" }}>{libGenResult.label}</div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => {
                      const newCard = { id: "custom_" + Date.now(), emoji: libGenResult.svg ? "🖼️" : libGenResult.emoji, label: libGenResult.label, svg: libGenResult.svg || null };
                      setLibrary(prev => [...prev, newCard]);
                      setLibSearch("");
                      setLibGenResult(null);
                    }} style={{ background: acc, color: "#FFF", border: "none", borderRadius: 999, padding: "11px 22px", fontSize: 13, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, boxShadow: `0 4px 14px ${acc}50`, fontFamily: "'Nunito', sans-serif" }}>
                      <Icon name="plus" size={16} color="#FFF" /> Tilføj til bibliotek
                    </button>
                    <button onClick={() => generateLibCard(libSearch)} style={{ background: "rgba(0,0,0,0.06)", color: "#1A0840", border: "none", borderRadius: 999, padding: "11px 18px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>Prøv igen</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty "mine" */}
          {libFilter === "mine" && myCards.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#6A5A50", fontFamily: "'Nunito', sans-serif" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>Ingen egne kort endnu</div>
              <div style={{ fontSize: 13 }}>Tryk "Nyt kort" for at lave dit første</div>
            </div>
          )}

          {/* Card grid */}
          {showCards.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, paddingBottom: selectedCards.length > 0 ? 100 : 0 }}>
              {showCards.map(picto => {
                const isCustom = !presetIds.has(picto.id);
                const isSelected = selectedCards.includes(picto.id);
                return (
                  <div key={picto.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ position: "relative" }}>
                      <div
                        onClick={() => {
                          if (editMode) return;
                          setSelectedCards(prev =>
                            prev.includes(picto.id) ? prev.filter(id => id !== picto.id) : [...prev, picto.id]
                          );
                        }}
                        onContextMenu={e => { e.preventDefault(); setEditLabelCard({ picto, tempLabel: picto.label }); }}
                        onPointerDown={(() => { let t; return e => { t = setTimeout(() => setEditLabelCard({ picto, tempLabel: picto.label }), 600); e.currentTarget._lpt = t; }; })()}
                        onPointerUp={e => clearTimeout(e.currentTarget._lpt)}
                        onPointerLeave={e => clearTimeout(e.currentTarget._lpt)}
                        style={{
                          width: 80, height: 88, background: grayscale ? "#000000" : CARD_BG, borderRadius: 26,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", position: "relative",
                          border: isSelected ? `3px solid ${acc}` : "3px solid transparent",
                          boxShadow: isSelected ? `0 0 0 4px ${acc}30, 0 4px 14px rgba(0,0,0,0.10)` : "0 4px 14px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)",
                          transform: isSelected ? "scale(1.06)" : "scale(1)",
                          transition: "all 0.18s cubic-bezier(0.34,1.56,0.64,1)",
                        }}
                      >
                        {!isSelected && <div style={{ position: "absolute", top: 9, right: 11, width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,0.65)" }} />}
                        {isSelected && (
                          <div style={{ position: "absolute", top: -10, right: -10, width: 24, height: 24, borderRadius: "50%", background: acc, border: "2px solid #FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5, boxShadow: `0 2px 8px ${acc}60` }}>
                            <Icon name="check" size={13} color="#FFFFFF" />
                          </div>
                        )}
                        {/* Card content — handles bwSymbolPath, sclera, svg, imageUrl, emoji in both modes */}
                        {picto.bwSymbolPath && grayscale
                          ? <img src={picto.bwSymbolPath} alt={picto.label} style={{ width: 60, height: 60, objectFit: "contain" }} />
                          : scleraLoading && grayscale
                            ? <div style={{ width: 44, height: 44, borderRadius: 8, background: "rgba(255,255,255,0.25)", animation: "pulse 1.2s ease-in-out infinite" }} />
                            : (scleraIcons[picto.id] || picto.sclera_url) && grayscale
                              ? <img src={scleraIcons[picto.id] || picto.sclera_url} alt={picto.label} style={{ width: 50, height: 50, objectFit: "contain" }} />
                              : picto.imageUrl
                                ? <img src={picto.imageUrl} alt={picto.label} style={{ width: 60, height: 68, objectFit: "cover", borderRadius: 12, filter: grayscale ? "grayscale(1) contrast(1.1)" : "none" }} />
                                : picto.svg
                                  ? <div style={{ lineHeight: 0, filter: grayscale ? "grayscale(1) brightness(3)" : "none" }} dangerouslySetInnerHTML={{ __html: picto.svg.replace(/<svg/, `<svg width="56" height="56"`) }} />
                                  : grayscale
                                    ? <GrayscaleEmoji emoji={picto.emoji} size={44} />
                                    : <span style={{ fontSize: 36 }}>{picto.emoji}</span>
                        }
                      </div>
                      {editMode && <>
                        <button onClick={() => setEditingCard({ picto, isNew: false })} style={{ position: "absolute", top: -8, left: -8, width: 28, height: 28, borderRadius: "50%", background: "#4A18A0", border: "2px solid #FFFFFF", color: "#FFFFFF", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, zIndex: 10 }}><Icon name="edit" size={13} color="#FFFFFF" /></button>
                        {isCustom && (
                          <button onClick={() => deleteFromLibrary(picto.id)} style={{ position: "absolute", top: -8, right: -8, width: 28, height: 28, borderRadius: "50%", background: "#C41830", border: "2px solid #FFFFFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}><Icon name="close" size={13} color="#FFFFFF" /></button>
                        )}
                      </>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 3, maxWidth: 90, cursor: "default" }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: isSelected ? acc : "#1A1410", fontFamily: "'Nunito', sans-serif", textAlign: "center", lineHeight: 1.2, transition: "color 0.15s" }}>{picto.label}</span>
                      <button onClick={e => { e.stopPropagation(); setEditLabelCard({ picto, tempLabel: picto.label }); }} title="Rediger navn" style={{ flexShrink: 0, background: "none", border: "none", padding: 1, cursor: "pointer", opacity: 0.4, display: "flex", alignItems: "center" }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1A1410" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                      </button>
                    </div>
                    {isCustom && !isSelected && <span style={{ fontSize: 10, color: acc, fontFamily: "'Nunito', sans-serif", fontWeight: 700, background: `${acc}22`, borderRadius: 6, padding: "2px 6px" }}>Mit kort</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Floating add bar */}
          {selectedCards.length > 0 && (
            <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: 398, zIndex: 300, animation: "slideUp 0.25s cubic-bezier(0.34,1.4,0.64,1)" }}>
              <div style={{ background: "#FFFFFF", borderRadius: 24, padding: "14px 16px", boxShadow: "0 8px 32px rgba(26,8,64,0.22), 0 2px 8px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#1A0840", fontFamily: "'Nunito', sans-serif" }}>{selectedCards.length} kort valgt</div>
                  <div style={{ fontSize: 11, color: "#6A5A50", fontFamily: "'Nunito', sans-serif", marginTop: 1 }}>Vælg hvilken dag</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    {DAYS.map(d => (
                      <button key={d.short} onClick={() => {
                        const pictos = showCards.filter(p => selectedCards.includes(p.id));
                        pictos.forEach(p => addCard(d.short, p));
                        setSelectedCards([]);
                      }} style={{ padding: "9px 14px", borderRadius: 999, background: acc, border: "none", color: "#FFFFFF", fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 12, cursor: "pointer", boxShadow: `0 2px 8px ${acc}40`, minHeight: 36 }}>
                        {d.short}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => setSelectedCards([])} style={{ width: 36, height: 36, borderRadius: "50%", background: "#F0EBF8", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="close" size={16} color="#6A5880" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // ── ROUTINES VIEW ─────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  const renderRoutines = () => (
    <div style={{ paddingBottom: 100 }}>
      <div className="header-gradient" style={{ background: grad, padding: "22px 20px 20px", borderRadius: "0 0 28px 28px" }}>
        {profileStrip}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#FFFFFF", fontFamily: "'Nunito', sans-serif", letterSpacing: -0.5 }}>Rutiner</div>
            <div style={{ fontSize: 13, color: "#FFFFFF", fontFamily: "'Nunito', sans-serif", fontWeight: 600, marginTop: 2 }}>Skabeloner og timer til hverdagen</div>
          </div>
          <button onClick={() => setShowRoutinePrint(true)} style={{ background: "rgba(255,255,255,0.22)", backdropFilter: "blur(8px)", border: "none", borderRadius: 999, padding: "9px 16px", color: "#FFFFFF", fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
            <Icon name="print" size={16} color="#FFFFFF" /> Print strimler
          </button>
        </div>
      </div>
      <div style={{ background: activeBg, padding: "20px 18px 24px" }}>
        {/* Rutiner — direkte adgang */}
        <div className="tappable" onClick={() => setShowRoutines(true)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", background: "#FFFFFF", borderRadius: 20, boxShadow: "0 3px 12px rgba(0,0,0,0.08)", marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: `${acc}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 26 }}>🔄</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#1A0840", fontFamily: "'Nunito', sans-serif" }}>Rutineskabeloner</div>
            <div style={{ fontSize: 12, color: "#6A5A50", fontFamily: "'Nunito', sans-serif", marginTop: 1 }}>Morgen, eftermiddag og aften</div>
          </div>
          <span style={{ fontSize: 20, color: "#C0B8D0" }}>›</span>
        </div>

        {/* Timer */}
        <div style={{ fontSize: 11, color: "#6A5A50", fontFamily: "'Nunito', sans-serif", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 }}>Time Timer</div>
        <div className="tappable" onClick={() => setShowTimer(true)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", background: "#FFFFFF", borderRadius: 20, boxShadow: "0 3px 12px rgba(0,0,0,0.08)" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: timerRunning ? acc + "22" : "#F0EBF8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
            <svg width="56" height="56" style={{ position: "absolute", transform: "rotate(-90deg)" }}>
              <circle cx="28" cy="28" r="22" fill="none" stroke="#E0D8F0" strokeWidth="4" />
              <circle cx="28" cy="28" r="22" fill="none" stroke={timerLeft === 0 ? "#22C55E" : acc} strokeWidth="4"
                strokeDasharray={`${(timerLeft / timerSecs) * 138} 138`} strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 11, fontWeight: 900, color: acc, fontFamily: "'Nunito', sans-serif", zIndex: 1 }}>
              {timerRunning ? `${Math.floor(timerLeft/60)}:${String(timerLeft%60).padStart(2,"0")}` : "⏱"}
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#1A0840", fontFamily: "'Nunito', sans-serif" }}>
              {timerRunning ? "Timer kører..." : timerLeft === 0 ? "Tid! 🎉" : "Start timer"}
            </div>
            <div style={{ fontSize: 12, color: "#6A5A50", fontFamily: "'Nunito', sans-serif", marginTop: 1 }}>
              {timerRunning ? `${Math.floor(timerLeft/60)} min tilbage` : "Vælg 5–30 minutter"}
            </div>
          </div>
          <span style={{ fontSize: 20, color: "#C0B8D0" }}>›</span>
        </div>

        {/* Share */}
        <div style={{ fontSize: 11, color: "#6A5A50", fontFamily: "'Nunito', sans-serif", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14, marginTop: 28 }}>Del med partner</div>
        <div className="tappable" onClick={() => setShowShare(true)} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", background: "#FFFFFF", borderRadius: 20, boxShadow: "0 3px 12px rgba(0,0,0,0.08)" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "#F0EBF8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>👥</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#1A0840", fontFamily: "'Nunito', sans-serif" }}>Del ugeplanen</div>
            <div style={{ fontSize: 12, color: "#6A5A50", fontFamily: "'Nunito', sans-serif", marginTop: 1 }}>Via delelink eller PIN-kode til din partner</div>
          </div>
          <span style={{ fontSize: 20, color: "#C0B8D0" }}>›</span>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // ── SETTINGS VIEW ─────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  const renderTheme = () => (
    <div style={{ paddingBottom: 100 }}>
      <div className="header-gradient" style={{ background: grad, padding: "22px 20px 20px", borderRadius: "0 0 28px 28px" }}>
        {profileStrip}
        <div style={{ fontSize: 24, fontWeight: 900, color: "#FFFFFF", fontFamily: "'Nunito', sans-serif", letterSpacing: -0.5 }}>Udseende</div>
        <div style={{ fontSize: 13, color: "#FFFFFF", fontFamily: "'Nunito', sans-serif", fontWeight: 600, marginTop: 2 }}>Tilpas til barnets tryghedszone</div>
      </div>
      <div style={{ background: activeBg, padding: "16px 18px 24px" }}>
        {/* Background theme */}
        <div style={{ background: "#FFFFFF", borderRadius: 24, padding: "20px", marginBottom: 14, boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#1A0840", fontFamily: "'Nunito', sans-serif", marginBottom: 4 }}>Baggrundsfarve</div>
          <div style={{ fontSize: 12, color: "#6A5A50", fontFamily: "'Nunito', sans-serif", marginBottom: 18 }}>Vælg det tema der føles roligst</div>
          <div style={{ display: "flex", gap: 12, justifyContent: "space-between" }}>
            {THEMES.map(th => (
              <button key={th.id} onClick={() => handleSetThemeId(th.id)} style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                background: "transparent", border: "none", cursor: "pointer", padding: 0,
              }}>
                <div style={{
                  width: "100%", aspectRatio: "1", borderRadius: 18,
                  background: th.bg,
                  border: th.id === themeId ? `3.5px solid ${th.accent}` : "3px solid rgba(0,0,0,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transform: th.id === themeId ? "scale(1.1)" : "scale(1)",
                  transition: "transform 0.18s, box-shadow 0.18s",
                  boxShadow: th.id === themeId ? `0 6px 16px ${th.accent}40` : "none",
                  overflow: "hidden", position: "relative",
                }}>
                  <span style={{ fontSize: 32, lineHeight: 1 }}>{th.icon}</span>
                  {th.id === themeId && <div style={{ position: "absolute", bottom: 5, right: 5, width: 16, height: 16, borderRadius: "50%", background: th.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}><Icon name="check" size={10} color="#FFFFFF" /></div>}
                </div>
                <span style={{ fontSize: 11, fontWeight: 900, color: th.id === themeId ? th.accent : "#6A5A50", fontFamily: "'Nunito', sans-serif" }}>{th.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pictogram mode */}
        <div style={{ background: "#FFFFFF", borderRadius: 24, padding: "20px", boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#1A0840", fontFamily: "'Nunito', sans-serif", marginBottom: 4 }}>Piktogramtilstand</div>
          <div style={{ fontSize: 12, color: "#6A5A50", fontFamily: "'Nunito', sans-serif", marginBottom: 16 }}>Farver eller høj sort/hvid kontrast</div>
          <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
            <button onClick={() => setGrayscale(false)} style={{
              flex: 1, padding: "16px 0", borderRadius: 16, cursor: "pointer",
              background: !grayscale ? grad : "rgba(0,0,0,0.04)",
              color: !grayscale ? "#FFFFFF" : "#6A5A50",
              border: "none",
              boxShadow: !grayscale ? `0 4px 12px ${acc}50` : "none",
              fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 14,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
            }}>
              <div style={{ display: "flex", gap: 6 }}>
                {["#F5922A","#E8657A","#4BAD6A","#F5C842"].map(c => (
                  <div key={c} style={{ width: 18, height: 18, borderRadius: 6, background: c }} />
                ))}
              </div>
              Farverig
            </button>
            <button onClick={() => setGrayscale(true)} style={{
              flex: 1, padding: "16px 0", borderRadius: 16, cursor: "pointer",
              background: grayscale ? "#000000" : "rgba(0,0,0,0.04)",
              color: grayscale ? "#FFFFFF" : "#6A5A50",
              border: "none",
              boxShadow: grayscale ? "0 4px 12px rgba(0,0,0,0.3)" : "none",
              fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 14,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
            }}>
              <div style={{ display: "flex", gap: 6 }}>
                {["#FFFFFF","#FFFFFF","#FFFFFF","#FFFFFF"].map((c,i) => (
                  <div key={i} style={{ width: 18, height: 18, borderRadius: 6, background: c, border: "2px solid #1A1410" }} />
                ))}
              </div>
              Sort/hvid
            </button>
          </div>

          {/* Live preview */}
          <div style={{ background: activeBg, borderRadius: 14, padding: "14px 10px" }}>
            <div style={{ fontSize: 11, color: "#6A5A50", fontFamily: "'Nunito', sans-serif", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12, textAlign: "center" }}>Forhåndsvisning</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              {[
                { id: "hjem",     emoji: "🏠", label: "Hjemme" },
                { id: "skole",    emoji: "🎒", label: "Skole" },
                { id: "leg",      emoji: "🧸", label: "Leg" },
                { id: "sengetid", emoji: "🌙", label: "Sengetid" },
              ].map((item) => {
                const bg = grayscale ? "#000000" : CARD_BG;
                return (
                  <div key={item.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 56, height: 62, borderRadius: 18, background: bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", boxShadow: "0 2px 8px rgba(0,0,0,0.10)" }}>
                      {!grayscale && <div style={{ position: "absolute", top: 7, right: 9, width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.65)" }} />}
                      {grayscale && scleraIcons[item.id]
                        ? <img src={scleraIcons[item.id]} alt={item.label} style={{ width: 46, height: 46, objectFit: "contain" }} />
                        : <span style={{ fontSize: 26, filter: grayscale ? "grayscale(1) brightness(3)" : "none" }}>{item.emoji}</span>
                      }
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#6A5A50", fontFamily: "'Nunito', sans-serif" }}>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Profile management */}
        <div style={{ background: "#FFFFFF", borderRadius: 24, padding: "20px", marginTop: 14, boxShadow: "0 4px 16px rgba(0,0,0,0.07)" }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#1A0840", fontFamily: "'Nunito', sans-serif", marginBottom: 4 }}>Børns ugeplaner</div>
          <div style={{ fontSize: 12, color: "#6A5A50", fontFamily: "'Nunito', sans-serif", marginBottom: 14 }}>Skift mellem børn eller tilføj et nyt</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {(profiles || []).map(p => (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: p.id === activeProfile?.id ? `${acc}15` : "#F8F4FF",
                borderRadius: 16, padding: "12px 14px",
                border: p.id === activeProfile?.id ? `2px solid ${acc}` : "2px solid transparent",
              }}>
                <span style={{ fontSize: 28 }}>{p.avatar || "🦁"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#1A0840", fontFamily: "'Nunito', sans-serif" }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "#8A7A90", fontFamily: "'Nunito', sans-serif", fontWeight: 600 }}>{THEMES.find(t => t.id === p.themeId)?.label || "Lyng"} tema</div>
                </div>
                {p.id !== activeProfile?.id && (
                  <button onClick={() => { setActiveProfileId(p.id); try { localStorage.setItem("ugeplan_active", p.id); } catch {} }} style={{
                    background: acc, color: "#FFFFFF", border: "none", borderRadius: 999,
                    padding: "7px 14px", fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 12,
                    cursor: "pointer", boxShadow: `0 3px 10px ${acc}40`,
                  }}>Skift til</button>
                )}
                {p.id === activeProfile?.id && (
                  <div style={{ fontSize: 11, fontWeight: 800, color: acc, fontFamily: "'Nunito', sans-serif" }}>Aktiv ✓</div>
                )}
                {(profiles || []).length > 1 && (
                  <button onClick={() => setDeleteConfirmProfile(p)} style={{
                    background: "#FFE4E4", color: "#DC2626", border: "none", borderRadius: 999,
                    width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", fontSize: 14, flexShrink: 0,
                    transition: "transform 0.12s, box-shadow 0.12s",
                    boxShadow: "0 2px 8px rgba(220,38,38,0.18)",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.15)"; e.currentTarget.style.background = "#DC2626"; e.currentTarget.style.color = "#FFF"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "#FFE4E4"; e.currentTarget.style.color = "#DC2626"; }}
                    title="Slet profil"
                  >
                    <Icon name="close" size={14} color="currentColor" />
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => setAddingChild(true)} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: `${acc}15`, border: `2px dashed ${acc}60`,
              borderRadius: 16, padding: "12px 14px", cursor: "pointer",
              fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 14, color: acc,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: grad, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 3px 10px ${acc}40` }}>
                <span style={{ fontSize: 20, color: "#FFFFFF" }}>+</span>
              </div>
              Tilføj et barn
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // ── MAIN RENDER ───────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100dvh", background: activeBg }}>
      <div style={{ overflowY: "auto", height: "calc(100dvh - 84px - env(safe-area-inset-bottom, 0px))", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}>
        {tab === "week"     && renderWeek()}
        {tab === "day"      && renderDay()}
        {tab === "library"  && renderLibrary()}
        {tab === "routines" && renderRoutines()}
        {tab === "theme"    && renderTheme()}
      </div>

      {/* Tab bar — floating pill */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, zIndex: 200, padding: "0 12px", paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
        <div style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: 999, padding: "6px 6px", display: "flex", alignItems: "center", justifyContent: "space-around", boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)" }}>
          {[
            { id: "week",     icon: "week",     label: "Uge" },
            { id: "day",      icon: "day",      label: "Dag" },
            { id: "library",  icon: "library",  label: "Bibliotek" },
            { id: "routines", icon: "routines", label: "Rutiner" },
            { id: "theme",    icon: "theme",    label: "Tema" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              background: tab === t.id ? grad : "transparent",
              border: "none", cursor: "pointer", flex: 1,
              padding: "10px 4px 8px", borderRadius: 999,
              boxShadow: tab === t.id ? `0 4px 14px ${acc}50` : "none",
              transition: "all 0.22s cubic-bezier(0.34,1.3,0.64,1)",
            }}>
              <Icon name={t.icon} size={22} color={tab === t.id ? "#FFFFFF" : "#8A7A90"} />
              <span style={{ fontSize: 10, color: tab === t.id ? "#FFFFFF" : "#8A7A90", fontFamily: "'Nunito', sans-serif", fontWeight: 900 }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Label edit overlay */}
      {editLabelCard && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,8,64,0.55)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px", backdropFilter: "blur(6px)" }}
          onClick={() => setEditLabelCard(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#FFFFFF", borderRadius: 28, padding: "28px 24px 24px", width: "100%", maxWidth: 360, boxShadow: "0 12px 48px rgba(26,8,64,0.25)" }}>
            <div style={{ fontSize: 56, textAlign: "center", marginBottom: 8 }}>{editLabelCard.picto.emoji}</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#1A0840", fontFamily: "'Nunito', sans-serif", textAlign: "center", marginBottom: 20 }}>Rediger navn</div>
            <input
              autoFocus
              value={editLabelCard.tempLabel}
              onChange={e => setEditLabelCard(prev => ({ ...prev, tempLabel: e.target.value }))}
              onKeyDown={e => { if (e.key === "Enter") saveLabel(editLabelCard.picto, editLabelCard.tempLabel); if (e.key === "Escape") setEditLabelCard(null); }}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "14px 16px", fontSize: 18, fontWeight: 800,
                fontFamily: "'Nunito', sans-serif", color: "#1A0840",
                background: "#F8F4FF", border: `2.5px solid ${acc}`,
                borderRadius: 16, outline: "none", textAlign: "center",
                marginBottom: 16,
              }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setEditLabelCard(null)} style={{ flex: 1, padding: "13px 0", background: "#F0EBF8", border: "none", borderRadius: 999, fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 14, color: "#6A5880", cursor: "pointer" }}>Annuller</button>
              <button onClick={() => saveLabel(editLabelCard.picto, editLabelCard.tempLabel)} style={{ flex: 2, padding: "13px 0", background: acc, border: "none", borderRadius: 999, fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 14, color: "#FFF", cursor: "pointer", boxShadow: `0 4px 16px ${acc}50` }}>Gem navn</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Overlays ── */}
      {showRoutinePrint && (
        <RoutinePrintOverlay routines={ROUTINE_TEMPLATES} theme={theme} grayscale={grayscale} onClose={() => setShowRoutinePrint(false)} />
      )}
      {showRoutines && (
        <RoutineOverlay theme={theme} grayscale={grayscale} onApply={(template, days) => {
          days.forEach(day => { template.cards.forEach(c => addCard(day, { ...c, uid: undefined })); });
        }} onClose={() => setShowRoutines(false)} />
      )}
      {showTimer && (
        <TimerOverlay timerLeft={timerLeft} timerSecs={timerSecs} timerRunning={timerRunning}
          onStart={startTimer} onPause={() => setTimerRunning(false)} onReset={resetTimer}
          onSetTime={(s) => { setTimerSecs(s); setTimerLeft(s); setTimerRunning(false); }}
          onClose={() => setShowTimer(false)} theme={theme} />
      )}
      {showShare && (
        <ShareOverlay shareUrl={getShareUrl()} pin={sharePIN} onClose={() => setShowShare(false)} theme={theme} />
      )}
      {bankFor && (
        <BankOverlay library={library} onSelect={p => addCard(bankFor, p)} onClose={() => setBankFor(null)}
          onOpenGenerate={() => { setBankFor(null); setGenerateFor(bankFor); }}
          onOpenSclera={() => { setBankFor(null); setShowSymbolSearch(true); }}
          theme={theme} grayscale={grayscale} scleraIcons={scleraIcons} />
      )}
      {showSymbolSearch && grayscale && (
        <SymbolSearchOverlay theme={theme} onSelect={p => {
          const newPicto = { id: p.id || ("sclera_" + Date.now()), ...p };
          setLibrary(prev => [newPicto, ...prev]);
          if (bankFor) addCard(bankFor, newPicto);
        }} onClose={() => setShowSymbolSearch(false)} />
      )}
      {generateFor && (
        <GenerateOverlay onAdd={picto => {
          const newPicto = { id: uid(), ...picto };
          setLibrary(prev => [newPicto, ...prev]);
          if (generateFor !== "__lib" && generateFor !== "__standalone") addCard(generateFor, newPicto);
        }} onClose={() => setGenerateFor(null)} theme={theme} />
      )}
      {editingCard && (
        <CardEditorOverlay card={editingCard.picto} isNew={editingCard.isNew} theme={theme}
          onSave={data => saveToLibrary(data, editingCard.isNew ? null : editingCard.picto)}
          onDelete={editingCard.isNew ? null : () => deleteFromLibrary(editingCard.picto.id)}
          onClose={() => setEditingCard(null)} />
      )}
      {addingToDay && (
        <AddToDayOverlay picto={addingToDay} week={week} onAdd={day => addCard(day, addingToDay)}
          onClose={() => setAddingToDay(null)} theme={theme} />
      )}
      {showPrint && (
        <PrintOverlay week={week} theme={theme} grayscale={grayscale} focusDay={focusDay}
          scleraIcons={scleraIcons} onClose={() => setShowPrint(false)} />
      )}

      {/* Delete profile confirmation modal */}
      {deleteConfirmProfile && (
        <div
          onClick={() => setDeleteConfirmProfile(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 2000,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 24px",
            animation: "fadeIn 0.18s ease",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#FFFFFF", borderRadius: 28,
              padding: "28px 24px 20px",
              width: "100%", maxWidth: 360,
              boxShadow: "0 24px 64px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.12)",
              animation: "cardPop 0.25s cubic-bezier(0.34,1.4,0.64,1)",
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            {/* Icon */}
            <div style={{
              width: 56, height: 56, borderRadius: 20,
              background: "#FEE2E2", display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 18,
            }}>
              <Icon name="close" size={26} color="#DC2626" />
            </div>

            {/* Title */}
            <div style={{ fontSize: 20, fontWeight: 900, color: "#1A0840", marginBottom: 8, lineHeight: 1.2 }}>
              Slet {deleteConfirmProfile.name}s profil?
            </div>

            {/* Body */}
            <div style={{ fontSize: 14, color: "#6A5A70", fontWeight: 600, lineHeight: 1.5, marginBottom: 24 }}>
              Al data for <strong>{deleteConfirmProfile.name}</strong> — ugeplan, bibliotek og rutiner — slettes permanent. Dette kan ikke fortrydes.
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDeleteConfirmProfile(null)}
                style={{
                  flex: 1, padding: "13px", border: "none", borderRadius: 14,
                  background: "#F3F4F6", color: "#374151",
                  fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 15,
                  cursor: "pointer", transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#E5E7EB"}
                onMouseLeave={e => e.currentTarget.style.background = "#F3F4F6"}
              >
                Annuller
              </button>
              <button
                onClick={() => {
                  const next = profiles.filter(x => x.id !== deleteConfirmProfile.id);
                  setProfiles(next);
                  saveProfiles(next);
                  if (deleteConfirmProfile.id === activeProfileId) {
                    setActiveProfileId(next[0]?.id || null);
                    try { localStorage.setItem("ugeplan_active", next[0]?.id || ""); } catch {}
                  }
                  setDeleteConfirmProfile(null);
                }}
                style={{
                  flex: 1, padding: "13px", border: "none", borderRadius: 14,
                  background: "#DC2626", color: "#FFFFFF",
                  fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 15,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(220,38,38,0.4)",
                  transition: "background 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#B91C1C"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(220,38,38,0.5)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#DC2626"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(220,38,38,0.4)"; }}
              >
                Slet profil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
