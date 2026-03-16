import { DAYS } from '../constants/days';
import { PRESET_LIBRARY } from '../data/library';
import { CHILD_EMOJIS } from '../constants/emojis';

export function uid() { return Math.random().toString(36).slice(2, 8); }

export function makeCard(picto) {
  return { uid: uid(), id: picto.id, emoji: picto.emoji, label: picto.label, svg: picto.svg ?? null, imageUrl: picto.imageUrl ?? null, bwSymbolPath: picto.bwSymbolPath ?? null, done: false };
}

const INIT_WEEK = {
  Man:  ["hjem","skole","bad","leg"],
  Tirs: ["hjem","skole","bad","tv"],
  Ons:  ["hjem","skole","svømning","bad"],
  Tors: ["hjem","skole","bad","ro"],
  Fre:  ["hjem","skole","bil","bad"],
  Lør:  ["bil","venner","bad"],
  Søn:  ["spil","ro","sengetid"],
};

export function initWeek() {
  const w = {};
  Object.entries(INIT_WEEK).forEach(([day, ids]) => {
    w[day] = ids.map(id => makeCard(PRESET_LIBRARY.find(p => p.id === id)));
  });
  return w;
}

// ─── AI ───────────────────────────────────────────────────────────────────────
// Returns { svg, label } — AI draws an organic children's illustration
export async function generatePictogram(description) {
  const STYLE = `ILLUSTRATION STYLE — follow exactly:
- Organic, slightly wobbly outlines (not perfect geometry) — like drawn by a loving hand
- stroke="#2A1A0E" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" on ALL shapes
- 2-3 flat pastel fill colors per illustration (pick warm cheerful palette, e.g. #F5A98A #FDDCB5 #7EC8A4 #A8D8EA #F7D488 #C9A4DC)
- One small white circle (opacity="0.75") near top-right of the main shape — the "shine" highlight
- Chunky and simple — max 10 shapes, readable at 64px
- viewBox="0 0 100 100", NO background rect
- NO text, NO fine details, NO thin lines`;

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 1400,
      messages: [{ role: "user", content:
        `You are illustrating pictogram cards for a children's visual schedule app (used by autistic children age 4–10).

${STYLE}

Draw a pictogram for: "${description}"

EXAMPLE — for "house": a chunky slightly-lopsided rect body (#FDDCB5), a rounded triangle roof (#F5A98A), a small door rect (#C9956A), a tiny square window (#A8D8EA), and one white circle highlight on the roof.

Return ONLY the raw SVG. Start with <svg viewBox="0 0 100 100" and end with </svg>. No markdown, no explanation, nothing else.`
      }]
    })
  });
  const d = await r.json();
  const t = d.content?.find(b => b.type === "text")?.text || "";
  const m = t.match(/<svg[\s\S]*?<\/svg>/i);
  if (!m) return null;
  // Extract a short label from the description
  const labelR = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001", max_tokens: 30,
      messages: [{ role: "user", content: `Give a 1-2 word Danish label for: "${description}". Reply with ONLY the label, nothing else.` }]
    })
  });
  const ld = await labelR.json();
  const label = ld.content?.find(b => b.type === "text")?.text?.trim() || description;
  return { svg: m[0], label };
}

// ─── PROFILE HELPERS ─────────────────────────────────────────────────────────

export function newProfileId() {
  return "p_" + Math.random().toString(36).slice(2, 9);
}

export function loadProfiles() {
  try {
    const raw = localStorage.getItem("ugeplan_profiles");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveProfiles(profiles) {
  try { localStorage.setItem("ugeplan_profiles", JSON.stringify(profiles)); } catch {}
}

export function makeProfile(name, themeId, avatar) {
  return { id: newProfileId(), name, themeId, avatar: avatar || CHILD_EMOJIS[0], week: initWeek() };
}
