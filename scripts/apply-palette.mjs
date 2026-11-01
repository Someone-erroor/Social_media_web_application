import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.resolve(__dirname, '../client');

const REPLACEMENTS = [
  // Backgrounds
  { from: /\bbg-indigo-600\b/g, to: 'bg-[#16B8C8]' },
  { from: /\bbg-indigo-700\b/g, to: 'bg-[#087F8A]' },
  { from: /\bbg-indigo-500\b/g, to: 'bg-[#16B8C8]' },
  { from: /\bbg-indigo-50\b/g, to: 'bg-cyan-50' },
  { from: /\bbg-indigo-100\b/g, to: 'bg-cyan-100' },
  { from: /\bhover:bg-indigo-50\b/g, to: 'hover:bg-cyan-50' },
  { from: /\bhover:bg-indigo-100\b/g, to: 'hover:bg-cyan-100' },
  { from: /\bhover:bg-indigo-600\b/g, to: 'hover:bg-[#16B8C8]' },
  { from: /\bhover:bg-indigo-700\b/g, to: 'hover:bg-[#087F8A]' },
  { from: /\bactive:bg-indigo-700\b/g, to: 'active:bg-[#087F8A]' },
  { from: /\bactive:bg-indigo-800\b/g, to: 'active:bg-[#06656e]' },

  // Text
  { from: /\btext-indigo-600\b/g, to: 'text-[#087F8A]' },
  { from: /\btext-indigo-700\b/g, to: 'text-[#087F8A]' },
  { from: /\btext-indigo-800\b/g, to: 'text-[#087F8A]' },
  { from: /\btext-indigo-900\b/g, to: 'text-[#172126]' },
  { from: /\btext-indigo-500\b/g, to: 'text-[#16B8C8]' },
  { from: /\btext-indigo-400\b/g, to: 'text-[#16B8C8]' },
  { from: /\bhover:text-indigo-600\b/g, to: 'hover:text-[#087F8A]' },
  { from: /\bhover:text-indigo-700\b/g, to: 'hover:text-[#06656e]' },
  { from: /\bhover:text-indigo-500\b/g, to: 'hover:text-[#16B8C8]' },
  { from: /\bgroup-hover:text-indigo-600\b/g, to: 'group-hover:text-[#087F8A]' },

  // Borders
  { from: /\bborder-indigo-100\b/g, to: 'border-cyan-100' },
  { from: /\bborder-indigo-200\b/g, to: 'border-cyan-200' },
  { from: /\bborder-indigo-300\b/g, to: 'border-cyan-300' },
  { from: /\bborder-indigo-500\b/g, to: 'border-[#16B8C8]' },
  { from: /\bborder-indigo-600\b/g, to: 'border-[#087F8A]' },
  { from: /\bfocus:border-indigo-500\b/g, to: 'focus:border-[#16B8C8]' },
  { from: /\bfocus:border-indigo-600\b/g, to: 'focus:border-[#16B8C8]' },

  // Rings & Focus
  { from: /\bfocus:ring-indigo-500\b/g, to: 'focus:ring-[#16B8C8]' },
  { from: /\bfocus:ring-indigo-600\b/g, to: 'focus:ring-[#16B8C8]' },
  { from: /\bhover:ring-indigo-500\b/g, to: 'hover:ring-[#16B8C8]' },
  { from: /\bring-indigo-500\b/g, to: 'ring-[#16B8C8]' },

  // Gradients & Purples
  { from: /\bfrom-indigo-600\b/g, to: 'from-[#16B8C8]' },
  { from: /\bto-purple-600\b/g, to: 'to-[#087F8A]' },
  { from: /\bto-purple-700\b/g, to: 'to-[#172126]' },
  { from: /\bfrom-indigo-500\b/g, to: 'from-[#16B8C8]' },
  { from: /\bto-purple-500\b/g, to: 'to-[#087F8A]' },
  { from: /\bfrom-indigo-50\b/g, to: 'from-cyan-50' },
  { from: /\bto-purple-50\b/g, to: 'to-teal-50' },
  { from: /\bbg-purple-50\b/g, to: 'bg-[#FF725E]/10' },
  { from: /\btext-purple-600\b/g, to: 'text-[#FF725E]' },
  { from: /\btext-purple-700\b/g, to: 'text-[#FF725E]' },

  // Spinners & Extra Borders
  { from: /\bborder-t-indigo-600\b/g, to: 'border-t-[#16B8C8]' },
  { from: /\bborder-t-indigo-500\b/g, to: 'border-t-[#16B8C8]' },
  { from: /\bborder-indigo-400\/30\b/g, to: 'border-[#16B8C8]/30' },
  { from: /\bbg-indigo-950\/80\b/g, to: 'bg-[#172126]' },
  { from: /\bborder-indigo-800\/50\b/g, to: 'border-[#252E34]' },

  // Gradient accents & text
  { from: /via-purple-600 to-pink-600/g, to: 'via-[#087F8A] to-[#FF725E]' },
  { from: /via-purple-500\/10 to-pink-500\/10/g, to: 'via-[#087F8A]/10 to-[#FF725E]/10' },
  { from: /via-purple-500 to-pink-500/g, to: 'via-[#087F8A] to-[#FF725E]' },
  { from: /from-indigo-700 via-indigo-800 to-slate-900/g, to: 'from-[#172126] via-[#252E34] to-[#172126]' },
  { from: /\btext-indigo-200\b/g, to: 'text-cyan-200' },

  // AI & Assistant purples
  { from: /\bborder-purple-600\b/g, to: 'border-[#FF725E]' },
  { from: /\bborder-purple-500\b/g, to: 'border-[#FF725E]' },
  { from: /\bborder-purple-200\b/g, to: 'border-[#FF725E]/30' },
  { from: /\bborder-purple-100\b/g, to: 'border-[#FF725E]/20' },
  { from: /\btext-purple-500\b/g, to: 'text-[#FF725E]' },
  { from: /\btext-purple-900\b/g, to: 'text-[#172126]' },
  { from: /\btext-purple-950\b/g, to: 'text-[#172126]' },
  { from: /\bbg-purple-600\b/g, to: 'bg-[#FF725E]' },
  { from: /\bbg-purple-700\b/g, to: 'bg-[#e05a47]' },
  { from: /\bhover:bg-purple-700\b/g, to: 'hover:bg-[#e05a47]' },
  { from: /\bbg-purple-100\b/g, to: 'bg-[#FF725E]/15' },
  { from: /\bfocus:border-purple-500\b/g, to: 'focus:border-[#16B8C8]' },
  { from: /\bfocus:ring-purple-400\b/g, to: 'focus:ring-[#16B8C8]' },
  { from: /from-purple-50\/70 via-indigo-50\/50 to-white/g, to: 'from-[#FF725E]/5 via-cyan-50/40 to-white' },
  { from: /border-purple-200\/80/g, to: 'border-[#FF725E]/30' },
  { from: /border-purple-100\/80/g, to: 'border-[#FF725E]/20' },
  { from: /border-purple-200\/60/g, to: 'border-[#FF725E]/20' },
  { from: /hover:bg-purple-100\/60/g, to: 'hover:bg-[#FF725E]/10' },
  { from: /bg-purple-100\/70/g, to: 'bg-[#FF725E]/20' },
  { from: /bg-purple-100\/40/g, to: 'bg-[#FF725E]/10' },
  { from: /bg-\[#FF725E\]\/10\/70/g, to: 'bg-[#FF725E]/10' }
];

function walk(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '.next' && entry.name !== 'node_modules') {
        files = files.concat(walk(fullPath));
      }
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

let modifiedCount = 0;
let totalReplacements = 0;

const files = walk(clientDir);
console.log(`Auditing ${files.length} JavaScript files in client/...`);

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  let fileChanges = 0;

  for (const r of REPLACEMENTS) {
    const matches = newContent.match(r.from);
    if (matches) {
      fileChanges += matches.length;
      newContent = newContent.replace(r.from, r.to);
    }
  }

  if (fileChanges > 0) {
    fs.writeFileSync(file, newContent, 'utf8');
    modifiedCount++;
    totalReplacements += fileChanges;
    console.log(`✓ Updated ${path.relative(clientDir, file)} (${fileChanges} replacements)`);
  }
}

console.log(`\n====================================================`);
console.log(`Applied Looply Colour Palette:`);
console.log(`Modified files: ${modifiedCount}`);
console.log(`Total replacements: ${totalReplacements}`);
console.log(`====================================================\n`);
