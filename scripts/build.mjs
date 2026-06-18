import fs from 'node:fs/promises';
import path from 'node:path';

const staticFiles = ['index.html'];
const sourceFiles = ['src/app.js', 'src/styles.css'];
const dataFiles = ['data/matches.json', 'data/bracket_paths.json'];

async function copyInto(outDir, file) {
  await fs.mkdir(path.join(outDir, path.dirname(file)), { recursive: true });
  await fs.copyFile(file, path.join(outDir, file));
}

async function buildDist() {
  await fs.rm('dist', { recursive: true, force: true });
  await buildStaticApp('dist');
}

async function buildDocsPreview() {
  await fs.rm('docs/index.html', { force: true });
  await fs.rm('docs/src', { recursive: true, force: true });
  await fs.rm('docs/data', { recursive: true, force: true });
  await buildStaticApp('docs');
  await fs.writeFile('docs/.nojekyll', '');
}

async function buildStaticApp(outDir) {
  for (const file of staticFiles) await copyInto(outDir, file);
  for (const file of sourceFiles) await copyInto(outDir, file);
  for (const file of dataFiles) await copyInto(outDir, file);
}

await buildDist();
await buildDocsPreview();

console.log('Built static app into dist/ and docs/.');
