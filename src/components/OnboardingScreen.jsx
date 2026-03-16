import React, { useState } from 'react';
import { Calendar, CheckSquare, BookOpen, RefreshCw, Sliders, ArrowLeft, ArrowRight, Send } from 'react-feather';
import { THEMES } from '../constants/themes';
import { CHILD_EMOJIS } from '../constants/emojis';

const TAB_GUIDE = [
  { FeatherIcon: Calendar,    label: "Uge",       desc: "Hele ugens overblik med alle dage" },
  { FeatherIcon: CheckSquare, label: "Dag",       desc: "Detaljeret dagsplan med afkrydsning" },
  { FeatherIcon: BookOpen,    label: "Bibliotek", desc: "Alle aktivitets-kort samlet" },
  { FeatherIcon: RefreshCw,   label: "Rutiner",   desc: "Morgen, eftermiddag & aften" },
  { FeatherIcon: Sliders,     label: "Tema",      desc: "Farver, piktogrammer & print" },
];

export default function OnboardingScreen({ onDone, isAddingChild = false }) {
  const STEPS = [
    ...(!isAddingChild ? [{ id: "welcome", emoji: "👋", title: "Velkommen til\nUgeplan!", desc: "En visuel ugeplan der hjælper børn med at forstå og mestre hverdagens aktiviteter.", cta: "Kom i gang" }] : []),
    { id: "name",   emoji: "🌟", title: isAddingChild ? "Nyt barn" : "Hvad hedder barnet?", desc: "Giv barnet et navn.", cta: "Næste", input: true },
    { id: "avatar", emoji: "🎭", title: "Vælg et ikon",  desc: "Så er det nemt at skifte mellem børn.", cta: "Næste", avatar: true },
    { id: "theme",  emoji: "🎨", title: "Vælg et tema",  desc: "Du kan altid ændre det igen.", cta: "Næste", themes: true },
    ...(!isAddingChild ? [{ id: "guide", emoji: "🗺️", title: "Her er din app", desc: "5 faner — alt hvad du behøver.", cta: "Start planlægning", guide: true }] : [{ id: "done_add", emoji: "✅", title: "Klar!", desc: "Barnets ugeplan er oprettet.", cta: "Åbn ugeplan" }]),
  ];
  const [step, setStep] = useState(0);
  const [childName, setChildName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(CHILD_EMOJIS[0]);
  const [selectedTheme, setSelectedTheme] = useState("lyng");
  const current = STEPS[step];
  const theme = THEMES.find(t => t.id === selectedTheme);
  const acc = theme.accent;
  const grad = theme.grad;
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onDone({ childName: childName.trim() || "Barn", themeId: selectedTheme, avatar: selectedAvatar });
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: theme.bg,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "space-between",
      fontFamily: "'Nunito', sans-serif",
      padding: "0 0 40px",
      maxWidth: 430, margin: "0 auto",
    }}>
      {/* Progress dots */}
      <div style={{ display: "flex", gap: 8, paddingTop: 56, paddingBottom: 0 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 24 : 8, height: 8,
            borderRadius: 999,
            background: i === step ? acc : `${acc}40`,
            transition: "all 0.35s cubic-bezier(0.34,1.2,0.64,1)",
          }} />
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px", width: "100%", boxSizing: "border-box", gap: 0 }}>

        {/* Emoji / illustration */}
        {!current.guide && !current.avatar && !current.themes && (
          <div style={{
            fontSize: 80, lineHeight: 1, marginBottom: 28,
            filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.10))",
            animation: "obPop 0.5s cubic-bezier(0.34,1.56,0.64,1)",
          }}>
            {current.id === "done_add" ? selectedAvatar : current.emoji}
          </div>
        )}

        {/* Title */}
        <div style={{
          fontSize: current.guide ? 26 : 32,
          fontWeight: 900, color: "#1A0840",
          textAlign: "center", lineHeight: 1.2,
          marginBottom: 12, whiteSpace: "pre-line",
          letterSpacing: -0.5,
        }}>
          {current.id === "name" && childName ? `Hej, ${childName}! 👋` : current.title}
        </div>

        {/* Desc */}
        <div style={{ fontSize: 16, color: "#6A5A70", textAlign: "center", lineHeight: 1.5, marginBottom: 32, fontWeight: 600 }}>
          {current.desc}
        </div>

        {/* Name input */}
        {current.input && (
          <input
            autoFocus
            placeholder="F.eks. Emma eller Lucas"
            value={childName}
            onChange={e => setChildName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleNext()}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "16px 20px", fontSize: 20, fontWeight: 800,
              fontFamily: "'Nunito', sans-serif", color: "#1A0840",
              background: "#FFFFFF", border: `2.5px solid ${acc}`,
              borderRadius: 20, outline: "none", textAlign: "center",
              boxShadow: `0 4px 20px ${acc}25`,
            }}
          />
        )}

        {/* Theme picker */}
        {current.themes && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", width: "100%" }}>
            {THEMES.map(t => (
              <button key={t.id} onClick={() => setSelectedTheme(t.id)} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                background: selectedTheme === t.id ? t.accent : "#FFFFFF",
                border: `2.5px solid ${selectedTheme === t.id ? t.accent : "transparent"}`,
                borderRadius: 20, padding: "14px 20px", cursor: "pointer",
                boxShadow: selectedTheme === t.id ? `0 6px 20px ${t.accent}50` : "0 2px 10px rgba(0,0,0,0.08)",
                transition: "all 0.25s cubic-bezier(0.34,1.2,0.64,1)",
                transform: selectedTheme === t.id ? "scale(1.08)" : "scale(1)",
              }}>
                <span style={{ fontSize: 30 }}>{t.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: selectedTheme === t.id ? "#FFFFFF" : "#1A0840", fontFamily: "'Nunito', sans-serif" }}>{t.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Avatar picker */}
        {current.avatar && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", width: "100%" }}>
            {CHILD_EMOJIS.map(em => (
              <button key={em} onClick={() => setSelectedAvatar(em)} style={{
                width: 60, height: 60, fontSize: 32,
                background: selectedAvatar === em ? acc : "#FFFFFF",
                border: `2.5px solid ${selectedAvatar === em ? acc : "transparent"}`,
                borderRadius: 18, cursor: "pointer",
                boxShadow: selectedAvatar === em ? `0 6px 20px ${acc}50` : "0 2px 10px rgba(0,0,0,0.08)",
                transition: "all 0.22s cubic-bezier(0.34,1.2,0.64,1)",
                transform: selectedAvatar === em ? "scale(1.12)" : "scale(1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{em}</button>
            ))}
          </div>
        )}

        {/* Tab guide */}
        {current.guide && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
            {TAB_GUIDE.map((item, i) => (
              <div key={item.icon} style={{
                display: "flex", alignItems: "center", gap: 14,
                background: "#FFFFFF", borderRadius: 18, padding: "13px 16px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
                animation: `obSlide 0.4s ${i * 0.07}s both cubic-bezier(0.34,1.2,0.64,1)`,
              }}>
                <div style={{ width: 42, height: 42, borderRadius: 14, background: grad, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 12px ${acc}40` }}>
                  <item.FeatherIcon size={20} color="#FFFFFF" strokeWidth={2.2} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#1A0840" }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: "#8A7A90", fontWeight: 600 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA button */}
      <div style={{ width: "100%", padding: "0 28px", boxSizing: "border-box" }}>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} style={{
            width: "100%", padding: "14px", marginBottom: 10,
            background: "transparent", border: "none",
            fontFamily: "'Nunito', sans-serif", fontWeight: 800, fontSize: 15,
            color: acc, cursor: "pointer",
          }}>
            <ArrowLeft size={16} strokeWidth={2.5} style={{ marginRight: 4 }} /> Tilbage
          </button>
        )}
        <button onClick={handleNext} style={{
          width: "100%", padding: "18px",
          background: grad, border: "none",
          borderRadius: 999, cursor: "pointer",
          fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 18,
          color: "#FFFFFF", boxShadow: `0 8px 28px ${acc}55`,
          transition: "transform 0.15s",
          letterSpacing: 0.2,
        }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {current.cta}
            {isLast ? <Send size={18} strokeWidth={2.5} /> : <ArrowRight size={18} strokeWidth={2.5} />}
          </span>
        </button>
      </div>
    </div>
  );
}
