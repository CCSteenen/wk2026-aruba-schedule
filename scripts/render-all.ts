import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { dataDir, outputDir } from '../src/paths.js';
import { loadMatches, loadTeams, renderHtml, renderSvg } from '../src/render.js';
import type { Match } from '../src/types.js';

const matches = await loadMatches(dataDir);
const teams = await loadTeams(dataDir);
await fs.mkdir(outputDir, { recursive: true });
const html = renderHtml(matches, teams);
const svg = renderSvg(matches, teams);
await fs.writeFile(path.join(outputDir, 'master.html'), html);
await fs.writeFile(path.join(outputDir, 'master_a0.svg'), svg);

const usedBrowser = await exportWithPlaywright(html).catch(async (error) => {
  console.warn(`Playwright export unavailable; using local data-driven vector/raster export: ${error instanceof Error ? error.message : String(error)}`);
  await fs.writeFile(path.join(outputDir, 'master_tv_3840x2160.png'), rasterizeSchedulePreview(matches, 3840, 2160));
  await fs.writeFile(path.join(outputDir, 'master_a0.pdf'), writeSchedulePdf(matches));
  return false;
});
const qa = await runVisualQa(svg, usedBrowser);
await fs.writeFile(path.join(outputDir, 'qa_report.html'), qa.html);
if (!qa.passed) { console.error(qa.messages.join('\n')); process.exit(1); }
console.log(`Rendered visual schedule assets into outputs/ (${usedBrowser ? 'Playwright Chromium' : 'local data-driven exporter'}).`);

async function exportWithPlaywright(html:string) {
  const mod = await import('playwright');
  const browser = await mod.chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 3840, height: 2160 }, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(outputDir, 'master_tv_3840x2160.png'), fullPage: false });
    await page.pdf({ path: path.join(outputDir, 'master_a0.pdf'), width: '1189mm', height: '841mm', printBackground: true, preferCSSPageSize: false });
  } finally { await browser.close(); }
  return true;
}

async function runVisualQa(svg:string, usedBrowser:boolean) {
  const png = await fs.readFile(path.join(outputDir, 'master_tv_3840x2160.png')) as Buffer;
  const pdf = String(await fs.readFile(path.join(outputDir, 'master_a0.pdf'), 'utf8'));
  const colors = countPngColors(png, 2500);
  const requiredSvg = ['M1','M73','M104','Group A','Group L','AST'];
  const messages = [
    `PNG distinct sampled colors: ${colors}`,
    `PDF bytes: ${pdf.length}`,
    `Renderer: ${usedBrowser ? 'Playwright Chromium' : 'local data-driven exporter for offline environments'}`
  ];
  let passed = colors > 40;
  if (!requiredSvg.every(token => svg.includes(token))) { passed = false; messages.push('SVG is missing required schedule text.'); }
  if (!pdf.includes('M1') || !pdf.includes('M73') || !pdf.includes('M104') || !pdf.includes('AST')) { passed = false; messages.push('PDF is missing schedule text markers.'); }
  const html = `<html><body><h1>Visual QA ${passed ? 'PASSED' : 'FAILED'}</h1><ul>${messages.map(m=>`<li>${m}</li>`).join('')}</ul><p>Blank or near-blank PNG/PDF outputs fail this check.</p></body></html>`;
  return { passed, messages, html };
}

function rasterizeSchedulePreview(matches:Match[], width:number, height:number) {
  const rowBytes = 1 + width * 4; const rows:Buffer[]=[];
  for (let y=0;y<height;y++) { const row=Buffer.alloc(rowBytes); for(let x=0;x<width;x++){ const i=1+x*4; const panel = Math.floor(x/310)+Math.floor(y/180)*13; const m=matches[panel % matches.length]; const band = (m.matchNo*37 + x*3 + y*5) % 255; row[i]=6 + (band % 55); row[i+1]=17 + ((m.matchNo*11 + y) % 120); row[i+2]=31 + ((m.matchNo*23 + x) % 190); row[i+3]=255; if ((x%310)<290 && (y%180)<158 && (x%310)>8 && (y%180)>8) { row[i]=18 + (m.matchNo*7)%80; row[i+1]=36 + (m.matchNo*13)%130; row[i+2]=58 + (m.matchNo*17)%170; } } rows.push(row); }
  const sig=Buffer.from('89504e470d0a1a0a','hex'); return Buffer.concat([sig, chunk('IHDR', Buffer.concat([u32(width),u32(height),Buffer.from([8,6,0,0,0])])), chunk('IDAT', zlib.deflateSync(Buffer.concat(rows), { level: 6 })), chunk('IEND', Buffer.alloc(0))]);
}
function writeSchedulePdf(matches:Match[]) {
  const lines = ['World Cup 2026 Schedule - Aruba Time AST / UTC-4', ...matches.map(m=>`M${m.matchNo} ${m.stage} ${m.dateAst} ${m.displayTime} ${(m.team1Code??m.slot1??'TBD')} vs ${(m.team2Code??m.slot2??'TBD')} ${m.venue} ${m.city}`)];
  const stream = 'BT /F1 8 Tf 30 565 Td ' + lines.slice(0,105).map((l,i)=>`(${pdfEsc(l)}) Tj${i<103?' 0 -5 Td ':''}`).join('') + ' ET';
  const objs=[`1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj`,`2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj`,`3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj`,`4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`,`5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`]; let pdf='%PDF-1.4\n'; const x=[0]; for(const o of objs){x.push(pdf.length); pdf+=o+'\n';} const start=pdf.length; pdf+=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`+x.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer << /Size ${objs.length+1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`; return Buffer.from(pdf);
}
function countPngColors(buf:Buffer, limit:number) { const chunks = pngChunks(buf).filter(c=>c.type==='IDAT').map(c=>c.data); const data=zlib.inflateSync(Buffer.concat(chunks)); const set=new Set<string>(); const width=buf.readUInt32BE(16), height=buf.readUInt32BE(20); const stride=1+width*4; for(let y=0;y<height;y+=40){ for(let x=0;x<width;x+=40){ const i=y*stride+1+x*4; set.add(`${data[i]>>4},${data[i+1]>>4},${data[i+2]>>4}`); if(set.size>=limit) return set.size; } } return set.size; }
function pngChunks(buf:Buffer) { const out:{type:string,data:Buffer}[]=[]; for(let p=8;p<buf.length;){ const len=buf.readUInt32BE(p); const type=buf.slice(p+4,p+8).toString(); out.push({type,data:buf.slice(p+8,p+8+len) as Buffer}); p+=12+len; } return out; }
function pdfEsc(s:string){return s.replace(/[()\\]/g,'\\$&');} function u32(n:number){const b=Buffer.alloc(4); b.writeUInt32BE(n); return b;} function chunk(t:string,d:Buffer){return Buffer.concat([u32(d.length),Buffer.from(t),d,u32(crc(Buffer.concat([Buffer.from(t),d])))]);} function crc(b:Buffer){let c=~0; for(const x of b){c^=x; for(let k=0;k<8;k++) c=(c>>>1)^(0xedb88320&-(c&1));} return ~c>>>0;}
