export const ROUTINE_TEMPLATES = [
  {
    id: "morgen",
    label: "Morgenrutine",
    emoji: "🌅",
    desc: "Ro til en god start på dagen",
    color: "#F59E0B",
    cards: [
      { id: "vaagne",      emoji: "😴", label: "Stå op" },
      { id: "toilet_m",   emoji: "🚽", label: "Toilet" },
      { id: "toej",       emoji: "👕", label: "Tøj på" },
      { id: "morgenmad",  emoji: "🥣", label: "Morgenmad", tags: ["morgen", "grød", "cornflakes", "müsli"] },
      { id: "taender_m",  emoji: "🪥", label: "Børste tænder" },
      { id: "taske",      emoji: "🎒", label: "Pakke taske" },
      { id: "overtøj",    emoji: "🧥", label: "Sko & jakke" },
    ]
  },
  {
    id: "efterskole",
    label: "Fra skole/børnehave",
    emoji: "🏠",
    desc: "Tryg overgang fra institution til hjem",
    color: "#10B981",
    cards: [
      { id: "hjem_ank",   emoji: "🚪", label: "Kom hjem" },
      { id: "toej_af",    emoji: "👟", label: "Sko & tøj af" },
      { id: "taske_ud",   emoji: "🎒", label: "Pak taske ud" },
      { id: "haender",    emoji: "🧼", label: "Vaske hænder" },
      { id: "snack",      emoji: "🍎", label: "Eftermiddagsmad" },
      { id: "leg",        emoji: "🧸", label: "Fri leg", tags: ["lege", "fri leg", "fantasileg", "rollespil"] },
      { id: "lektier",    emoji: "📚", label: "Lektier" },
    ]
  },
  {
    id: "aften",
    label: "Aftenrutine",
    emoji: "🌙",
    desc: "Rolig overgang til søvn",
    color: "#6366F1",
    cards: [
      { id: "aftensmad",  emoji: "🍽️", label: "Aftensmad", tags: ["aftensmad", "middag", "dinner", "familiemiddag"] },
      { id: "bad",        emoji: "🚿", label: "Bad", tags: ["brusebad", "vask", "hygiejne"] },
      { id: "nattøj",     emoji: "🩲", label: "Nattøj på" },
      { id: "taender_a",  emoji: "🪥", label: "Børste tænder" },
      { id: "laese",      emoji: "📖", label: "Godnathistorie" },
      { id: "sengetid",   emoji: "🌙", label: "Godnat", tags: ["godnat", "nat", "sove", "sovetid"] },
    ]
  },
];
