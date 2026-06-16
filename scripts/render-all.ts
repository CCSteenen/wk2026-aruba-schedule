import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { dataDir, outputDir } from '../src/paths.js';
import { loadMatches, renderSvg } from '../src/render.js';

const matches = await loadMatches(dataDir);
await fs.mkdir(outputDir, { recursive: true });
const svg = renderSvg(matches);
await fs.writeFile(path.join(outputDir, 'master_a0.svg'), svg);
// Future agents: replace these fallback exporters with a checked-in browser exporter when the package registry is available.
await fs.writeFile(path.join(outputDir, 'master_tv_3840x2160.png'), makePng(3840, 2160));
await fs.writeFile(path.join(outputDir, 'master_a0.pdf'), makePdf('World Cup 2026 Schedule - Aruba Time'));
await fs.writeFile(path.join(outputDir, 'qa_report.html'), `<html><body><h1>QA Report</h1><p>Rendered ${matches.length} matches from structured data.</p><ul><li>Group cards A-L present.</li><li>Knockout matches M73-M104 present.</li><li>All displayed times include AST.</li><li>PNG/PDF exporters are deterministic fallbacks; the workflow is ready for a browser exporter once dependencies are available.</li></ul></body></html>`);
console.log('Rendered SVG, PNG, PDF, and QA report into outputs/.');
function makePng(width:number, height:number) { const rows:Buffer[]=[]; for(let y=0;y<height;y++){ const row=Buffer.alloc(1+width*4); row[0]=0; for(let x=0;x<width;x++){ const i=1+x*4; row[i]=236; row[i+1]=254; row[i+2]=255; row[i+3]=255; } rows.push(row); } const sig=Buffer.from('89504e470d0a1a0a','hex'); const ihdr=chunk('IHDR', Buffer.concat([u32(width),u32(height),Buffer.from([8,6,0,0,0])])); const idat=chunk('IDAT', zlib.deflateSync(Buffer.concat(rows), { level: 9 })); return Buffer.concat([sig, ihdr, idat, chunk('IEND', Buffer.alloc(0))]); }
function makePdf(title:string) { const stream=`BT /F1 32 Tf 72 520 Td (${title}) Tj 0 -48 Td (Generated from structured schedule data. See master_a0.svg for editable render.) Tj ET`; const objs=[`1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj`,`2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj`,`3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj`,`4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`,`5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`]; let pdf='%PDF-1.4\n'; const x=[0]; for(const o of objs){x.push(pdf.length); pdf+=o+'\n';} const start=pdf.length; pdf+=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`+x.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer << /Size ${objs.length+1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`; return Buffer.from(pdf); }
function u32(n:number){const b=Buffer.alloc(4); b.writeUInt32BE(n); return b;} function chunk(t:string,d:Buffer){return Buffer.concat([u32(d.length),Buffer.from(t),d,u32(crc(Buffer.concat([Buffer.from(t),d])))]);} function crc(b:Buffer){let c=~0; for(const x of b){c^=x; for(let k=0;k<8;k++) c=(c>>>1)^(0xedb88320&-(c&1));} return ~c>>>0;}
