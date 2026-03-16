import React from 'react';
import Icon from './Icon';
import GrayscaleEmoji from './GrayscaleEmoji';
import { CARD_BG, CARD_BG_DONE, CARD_BG_GRAY } from '../constants/themes';

export default function PictoCard({ card, small, dragging, grayscale, accent, scleraUrl, bwSymbolPath, showLabel, onToggle, onRemove, onEdit, onDragStart, onDragEnd }) {
  const ac = accent || "#5B21B6";
  const W = small ? 60 : 76;
  const H = small ? 66 : 84;
  const R = small ? 18 : 24;
  const emojiSz = small ? 26 : 34;
  const effectiveScleraUrl = grayscale ? (scleraUrl || card.sclera_url) : null;
  const effectiveBwPath = grayscale ? (bwSymbolPath || card.bwSymbolPath) : null;
  const cardBg = card.done ? CARD_BG_DONE : (grayscale ? CARD_BG_GRAY : CARD_BG);

  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} style={{
      position: "relative", width: W, flexShrink: 0,
      cursor: dragging ? "grabbing" : "grab", userSelect: "none",
      opacity: dragging ? 0.5 : 1,
      transform: dragging ? "scale(0.92) rotate(-4deg)" : "scale(1)",
      filter: dragging ? "drop-shadow(0 8px 16px rgba(0,0,0,0.25))" : "none",
      transition: "opacity 0.12s, transform 0.12s, filter 0.12s",
      display: "flex", flexDirection: "column", alignItems: "center", gap: small ? 4 : 6,
    }}>
      <div onClick={onToggle} style={{
        width: W, height: H, background: cardBg, borderRadius: R,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: onToggle ? "pointer" : "default", position: "relative",
        border: "none", overflow: "hidden",
        boxSizing: "border-box",
      }}>
        {!card.done && !grayscale && (
          <div style={{ position: "absolute", top: small ? 7 : 9, right: small ? 9 : 11, width: small ? 7 : 9, height: small ? 7 : 9, borderRadius: "50%", background: "rgba(255,255,255,0.65)", pointerEvents: "none" }} />
        )}
        {effectiveBwPath
          ? <img src={effectiveBwPath} alt={card.label} style={{ width: Math.round(H * 0.85), height: Math.round(H * 0.85), objectFit: "contain" }} />
          : effectiveScleraUrl
          ? <img src={effectiveScleraUrl} alt={card.label} style={{ width: Math.round(H * 0.88), height: Math.round(H * 0.88), objectFit: "contain" }} />
          : card.imageUrl
            ? <img src={card.imageUrl} alt={card.label} style={{ width: Math.round(H * 0.88), height: Math.round(H * 0.88), objectFit: "cover", borderRadius: Math.round(R * 0.5), filter: card.done ? "grayscale(1) opacity(0.5)" : grayscale ? "grayscale(1) contrast(1.1)" : "none" }} />
            : card.svg
              ? <div style={{ filter: card.done ? "grayscale(1) opacity(0.5)" : grayscale ? "grayscale(1) brightness(3)" : "none", lineHeight: 0 }}
                  dangerouslySetInnerHTML={{ __html: card.svg.replace(/<svg/, `<svg width="${Math.round(H * 0.7)}" height="${Math.round(H * 0.7)}"`) }} />
              : (grayscale && !card.done)
                  ? <GrayscaleEmoji emoji={card.emoji} size={emojiSz + 4} />
                  : <span style={{ fontSize: emojiSz, lineHeight: 1, filter: card.done ? "grayscale(1) opacity(0.5)" : "none" }}>{card.emoji}</span>
        }
        {card.done && (
          <div style={{
            position: "absolute", inset: 0, borderRadius: R,
            background: `${ac}55`,
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: small ? 2 : 4,
            animation: "doneOverlay 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          }}>
            <div style={{
              width: small ? 28 : 36, height: small ? 28 : 36,
              borderRadius: "50%",
              background: ac,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 3px 12px ${ac}80`,
              animation: "checkPop 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.1s both",
            }}>
              <Icon name="check" size={small ? 18 : 24} color="#FFFFFF" />
            </div>
            {!small && <span style={{ fontSize: 9, fontWeight: 900, color: "#FFFFFF", fontFamily: "'Nunito', sans-serif", letterSpacing: 0.5, textTransform: "uppercase", textShadow: `0 1px 4px ${ac}` }}>Klaret!</span>}
          </div>
        )}
      </div>

      {onRemove && (
        <button onClick={e => { e.stopPropagation(); onRemove(); }} style={{
          position: "absolute", top: -10, right: -10,
          width: 26, height: 26, borderRadius: "50%",
          background: "#D32F2F", border: "2.5px solid #FFFFFF",
          color: "#FFFFFF", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(211,47,47,0.5)",
          zIndex: 10, transition: "transform 0.12s, box-shadow 0.12s",
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.18)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(211,47,47,0.65)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(211,47,47,0.5)"; }}
        >
          <Icon name="close" size={14} color="#FFFFFF" />
        </button>
      )}
      {onEdit && (
        <button onClick={e => { e.stopPropagation(); onEdit(); }} style={{
          position: "absolute", top: -10, left: -10,
          width: 26, height: 26, borderRadius: "50%",
          background: "#5C35B0", border: "2.5px solid #FFFFFF",
          color: "#FFFFFF", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(92,53,176,0.5)",
          zIndex: 10, transition: "transform 0.12s, box-shadow 0.12s",
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.18)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(92,53,176,0.65)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(92,53,176,0.5)"; }}
        >
          <Icon name="edit" size={13} color="#FFFFFF" />
        </button>
      )}
      {showLabel && (
        <span style={{ fontSize: small ? 8 : 10, fontWeight: 800, color: card.done ? "#9A9090" : "#1A1410", fontFamily: "'Nunito', sans-serif", textAlign: "center", lineHeight: 1.2, maxWidth: W + 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {card.label}
        </span>
      )}
    </div>
  );
}
