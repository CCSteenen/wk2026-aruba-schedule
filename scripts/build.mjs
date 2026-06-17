import fs from 'node:fs/promises';
import path from 'node:path';

await fs.rm('dist', { recursive: true, force: true });
await fs.mkdir('dist/src', { recursive: true });
await fs.mkdir('dist/data', { recursive: true });

for (const file of ['index.html']) {
  await fs.copyFile(file, path.join('dist', file));
}
for (const file of ['src/app.js', 'src/styles.css']) {
  await fs.copyFile(file, path.join('dist', file));
}
for (const file of ['data/matches.json', 'data/bracket_paths.json']) {
  await fs.copyFile(file, path.join('dist', file));
}

console.log('Built static app into dist/.');
