// This script extracts data from the monolithic planapp-multiprofile.jsx
// into separate module files for the structured project.
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'planapp-multiprofile.jsx'), 'utf8');

// Extract SCLERA_BASE, SCLERA_MAP, SCLERA_INLINE
const scleraBaseMatch = source.match(/const SCLERA_BASE = "([^"]+)";/);
const scleraBase = scleraBaseMatch ? scleraBaseMatch[1] : '';

// Extract SCLERA_MAP - from "const SCLERA_MAP = {" to matching "};"
const scleraMapStart = source.indexOf('const SCLERA_MAP = {');
let braceCount = 0;
let scleraMapEnd = scleraMapStart;
let foundFirst = false;
for (let i = scleraMapStart; i < source.length; i++) {
  if (source[i] === '{') { braceCount++; foundFirst = true; }
  if (source[i] === '}') { braceCount--; }
  if (foundFirst && braceCount === 0) { scleraMapEnd = i + 1; break; }
}
const scleraMapBody = source.substring(scleraMapStart + 'const '.length, scleraMapEnd);

// Extract SCLERA_INLINE
const scleraInlineStart = source.indexOf('const SCLERA_INLINE = {');
braceCount = 0;
let scleraInlineEnd = scleraInlineStart;
foundFirst = false;
for (let i = scleraInlineStart; i < source.length; i++) {
  if (source[i] === '{') { braceCount++; foundFirst = true; }
  if (source[i] === '}') { braceCount--; }
  if (foundFirst && braceCount === 0) { scleraInlineEnd = i + 1; break; }
}
const scleraInlineBody = source.substring(scleraInlineStart + 'const '.length, scleraInlineEnd);

// Extract EMOJI_PICKER
const emojiStart = source.indexOf('const EMOJI_PICKER = [');
braceCount = 0;
let emojiEnd = emojiStart;
foundFirst = false;
for (let i = emojiStart; i < source.length; i++) {
  if (source[i] === '[') { braceCount++; foundFirst = true; }
  if (source[i] === ']') { braceCount--; }
  if (foundFirst && braceCount === 0) { emojiEnd = i + 1; break; }
}
const emojiBody = source.substring(emojiStart + 'const '.length, emojiEnd);

// Extract PRESET_LIBRARY
const presetStart = source.indexOf('const PRESET_LIBRARY = [');
braceCount = 0;
let presetEnd = presetStart;
foundFirst = false;
for (let i = presetStart; i < source.length; i++) {
  if (source[i] === '[') { braceCount++; foundFirst = true; }
  if (source[i] === ']') { braceCount--; }
  if (foundFirst && braceCount === 0) { presetEnd = i + 1; break; }
}
const presetBody = source.substring(presetStart + 'const '.length, presetEnd);

// Extract SCLERA_ALL_NAMES
const allNamesMatch = source.match(/const SCLERA_ALL_NAMES = ([^;]+);/);
const allNamesExpr = allNamesMatch ? allNamesMatch[1] : '[]';

// Write sclera.js
const scleraContent = `export const SCLERA_BASE = "${scleraBase}";

export const ${scleraMapBody};

export const ${scleraInlineBody};

export const SCLERA_ALL_NAMES = ${allNamesExpr};
`;
fs.writeFileSync(path.join(__dirname, 'src', 'data', 'sclera.js'), scleraContent);
console.log('✓ Created src/data/sclera.js');

// Write library.js
const libraryContent = `export const ${presetBody};
`;
fs.writeFileSync(path.join(__dirname, 'src', 'data', 'library.js'), libraryContent);
console.log('✓ Created src/data/library.js');

// Write emojipicker.js
const emojiContent = `export const ${emojiBody};
`;
fs.writeFileSync(path.join(__dirname, 'src', 'data', 'emojipicker.js'), emojiContent);
console.log('✓ Created src/data/emojipicker.js');

console.log('\nDone! Data files extracted successfully.');
