import React from 'react';
import Icon from './Icon';
import { CARD_BG, CARD_BG_DONE, CARD_BG_GRAY } from '../constants/themes';

export default function PictoCard({ card, small, dragging, grayscale, accent, scleraUrl, showLabel, onToggle, onRemove, onEdit, onDragStart, onDragEnd }) {
  const ac = accent || "#5B21B6";
  const W = small ? 60 : 76;
  const H = small ? 66 : 84;
  const R = small ? 18 : 24;
  const emojiSz = small ? 26 : 34;
  const effectiveScleraUrl = grayscale ? (scleraUrl || card.sclera_url) : null;
  const cardBg = card.done ? CARD_BG_DONE : (grayscale ? CARD_BG_GRAY : CARD_BG);

  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} style={{
      position: "relative", width: W, flexShrink: 0,
      cursor: "grab", userSelect: "none",
      opacity: dragging ? 0.2 : 1,
      transform: dragging ? "scale(0.88) rotate(-3deg)" : "scale(1)",
      transition: "opacity 0.15s, transform 0.15s",
      display: "flex", flexDirection: "column", alignItems: "center", gap: small ? 4 : 6,
    }}>
      <div onClick={onToggle} style={{
        width: W, height: H, background: cardBg, borderRadius: R,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: onToggle ? "pointer" : "default", position: "relative",
        border: "none",
        boxSizing: "border-box",
      }}>
        {!card.done && !grayscale && (
          <div style={{ position: "absolute", top: small ? 7 : 9, right: small ? 9 : 11, width: small ? 7 : 9, height: small ? 7 : 9, borderRadius: "50%", background: "rgba(255,255,255,0.65)", pointerEvents: "none" }} />
        )}
        {effectiveScleraUrl
          ? <img src={effectiveScleraUrl} alt={card.label} style={{ width: Math.round(H * 0.88), height: Math.round(H * 0.88), objectFit: "contain" }} />
          : card.svg
            ? <div style={{ filter: card.done ? "grayscale(1) opacity(0.5)" : grayscale ? "grayscale(1) brightness(3)" : "none", lineHeight: 0 }}
                dangerouslySetInnerHTML={{ __html: card.svg.replace(/<svg/, `<svg width="${Math.round(H * 0.7)}" height="${Math.round(H * 0.7)}"`) }} />
            : <span style={{ fontSize: emojiSz, lineHeight: 1, filter: card.done ? "grayscale(1) opacity(0.5)" : grayscale ? "grayscale(1) brightness(3)" : "none" }}>{card.emoji}</span>
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

      {onRemove && <button onClick={e => { e.stopPropagation(); onRemove(); }} style={{ position: "absolute", top: -8, right: -8, width: 22, height: 22, borderRadius: "50%", background: "#C41830", border: "2px solid #FFFFFF", color: "#FFFFFF", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, zIndex: 10 }}><Icon name="close" size={12} color="#FFFFFF" /></button>}
      {onEdit && <button onClick={e => { e.stopPropagation(); onEdit(); }} style={{ position: "absolute", top: -8, left: -8, width: 22, height: 22, borderRadius: "50%", background: "#4A18A0", border: "2px solid #FFFFFF", color: "#FFFFFF", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, zIndex: 10 }}><Icon name="edit" size={11} color="#FFFFFF" /></button>}
      {showLabel && (
        <span style={{ fontSize: small ? 8 : 10, fontWeight: 800, color: card.done ? "#9A9090" : "#1A1410", fontFamily: "'Nunito', sans-serif", textAlign: "center", lineHeight: 1.2, maxWidth: W + 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {card.label}
        </span>
      )}
    </div>
  );
}
