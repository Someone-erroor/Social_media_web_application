import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === 'node_modules' || file === '.next' || file === '.git') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (/\.(js|jsx|json|md|css)$/.test(file)) {
      results.push(fullPath);
    }
  }
  return results;
}

const patterns = [
  /preview/i,
  /exploration/i
];

const files = walk('./client/app').concat(walk('./client/components'));
for (const f of files) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, idx) => {
    patterns.forEach((p) => {
      if (p.test(line)) {
        console.log(`${f}:${idx + 1}: ${line.trim()}`);
      }
    });
  });
}
