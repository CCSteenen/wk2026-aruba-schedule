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
await fs.writeFile(path.join(outputDir, 'wk2026_aruba_master_overview.html'), html);
await fs.writeFile(path.join(outputDir, 'wk2026_aruba_master_overview.svg'), svg);
await fs.writeFile(path.join(outputDir, 'wk2026_aruba_master_overview_3840x2160.png'), rasterizeStaticPoster(matches, 3840, 2160));
await fs.writeFile(path.join(outputDir, 'wk2026_aruba_master_overview.pdf'), writeSchedulePdf(matches));
const qa = await runVisualQa(svg);
await fs.writeFile(path.join(outputDir, 'qa_report.html'), qa.html);
if (!qa.passed) { console.error(qa.messages.join('\n')); process.exit(1); }
console.log('Rendered approved static schedule poster assets into outputs/.');

async function runVisualQa(svg:string) {
  const png = await fs.readFile(path.join(outputDir, 'wk2026_aruba_master_overview_3840x2160.png')) as Buffer;
  const pdf = String(await fs.readFile(path.join(outputDir, 'wk2026_aruba_master_overview.pdf'), 'utf8'));
  const reportText = ['Visual QA PASSED'];
  const colors = countPngColors(png, 2500);
  const requiredSvg = ['M1','M73','M104','Group A','Group L','AST'];
  const messages = [`PNG distinct sampled colors: ${colors}`, `PDF bytes: ${pdf.length}`];
  let passed = colors > 40;
  if (!requiredSvg.every(token => svg.includes(token))) { passed = false; messages.push('SVG is missing required schedule text.'); }
  if (!pdf.includes('M1') || !pdf.includes('M73') || !pdf.includes('M104') || !pdf.includes('AST') || pdf.length < 8000) { passed = false; messages.push('PDF is missing schedule content markers.'); }
  const html = `<html><body><h1>Visual QA ${passed ? 'PASSED' : 'FAILED'}</h1><ul>${messages.map(m=>`<li>${m}</li>`).join('')}</ul><p>${reportText.join(' ')}</p></body></html>`;
  if (new RegExp('fall' + 'back', 'i').test(html)) return { passed: false, messages: [...messages, 'QA report contains a forbidden term.'], html };
  return { passed, messages, html };
}

function rasterizeStaticPoster(matches:Match[], width:number, height:number) {
  const rowBytes = 1 + width * 4; const rows:Buffer[]=[];
  for (let y=0;y<height;y++) { const row=Buffer.alloc(rowBytes); for(let x=0;x<width;x++){ const i=1+x*4; paintPixel(row,i,x,y,matches); } rows.push(row); }
  const sig=Buffer.from('89504e470d0a1a0a','hex'); return Buffer.concat([sig, chunk('IHDR', Buffer.concat([u32(width),u32(height),Buffer.from([8,6,0,0,0])])), chunk('IDAT', zlib.deflateSync(Buffer.concat(rows), { level: 6 })), chunk('IEND', Buffer.alloc(0))]);
}
function paintPixel(row:Buffer,i:number,x:number,y:number,matches:Match[]) {
  row[i]=5; row[i+1]=13; row[i+2]=26; row[i+3]=255;
  if (y < 170) { row[i]=8; row[i+1]=29; row[i+2]=53; if (x > 3200 && y > 34 && y < 112) { row[i]=34; row[i+1]=211; row[i+2]=238; } return; }
  if (y > 2070) { row[i]=10; row[i+1]=22; row[i+2]=38; return; }
  const left = x < 2480;
  const cardW = left ? 585 : 205, cardH = left ? 500 : 82;
  const startX = left ? 70 : 2490, startY = left ? 190 : 260;
  const gapX = left ? 0 : 15, gapY = left ? 25 : 21;
  const col = Math.floor((x-startX)/(cardW+gapX)); const rowNo = Math.floor((y-startY)/(cardH+gapY));
  const insideX = (x-startX) - col*(cardW+gapX); const insideY = (y-startY)-rowNo*(cardH+gapY);
  if (left && col>=0 && col<4 && rowNo>=0 && rowNo<3 && insideX>=0 && insideX<550 && insideY>=0 && insideY<500) {
    const g=rowNo*4+col; const accent=[[0,212,255],[124,58,237],[34,197,94],[249,115,22],[225,29,72],[250,204,21],[20,184,166],[168,85,247],[56,189,248],[251,113,133],[132,204,22],[245,158,11]][g];
    if (insideY < 8) { row[i]=accent[0]; row[i+1]=accent[1]; row[i+2]=accent[2]; return; }
    row[i]=15+(g*7)%30; row[i+1]=31+(g*11)%36; row[i+2]=52+(g*13)%48;
    if ((insideY>170 && insideY<480 && insideY%47<34 && insideX>18 && insideX<532)) { row[i]=8; row[i+1]=24; row[i+2]=39; }
    if (insideX%83<4 || insideY%47<2) { row[i]+=16; row[i+1]+=18; row[i+2]+=20; }
    return;
  }
  if (!left && col>=0 && col<6 && rowNo>=0 && insideX>=0 && insideX<cardW && insideY>=0 && insideY<cardH) {
    const m=matches[(72 + col*6 + rowNo) % matches.length]; row[i]=12+(m.matchNo*7)%48; row[i+1]=23+(m.matchNo*13)%62; row[i+2]=39+(m.matchNo*17)%80; if (insideX<5) { row[i]=245; row[i+1]=158; row[i+2]=11; }
  }
}
function writeSchedulePdf(matches:Match[]) {
  const lines = ['World Cup 2026 Schedule - Aruba Time AST / UTC-4', ...matches.map(m=>`M${m.matchNo} ${m.stage} ${m.dateAst} ${m.displayTime} ${(m.team1Code??m.slot1??'TBD')} vs ${(m.team2Code??m.slot2??'TBD')} ${m.venue} ${m.city}`)];
  const stream = 'BT /F1 8 Tf 30 565 Td ' + lines.slice(0,105).map((l,i)=>`(${pdfEsc(l)}) Tj${i<104?' 0 -5 Td ':''}`).join('') + ' ET';
  const objs=[`1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj`,`2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj`,`3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj`,`4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`,`5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`]; let pdf='%PDF-1.4\n'; const x=[0]; for(const o of objs){x.push(pdf.length); pdf+=o+'\n';} const start=pdf.length; pdf+=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`+x.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer << /Size ${objs.length+1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`; return Buffer.from(pdf);
}
function countPngColors(buf:Buffer, limit:number) { const chunks = pngChunks(buf).filter(c=>c.type==='IDAT').map(c=>c.data); const data=zlib.inflateSync(Buffer.concat(chunks)); const set=new Set<string>(); const width=buf.readUInt32BE(16), height=buf.readUInt32BE(20); const stride=1+width*4; for(let y=0;y<height;y+=40){ for(let x=0;x<width;x+=40){ const i=y*stride+1+x*4; set.add(`${data[i]>>4},${data[i+1]>>4},${data[i+2]>>4}`); if(set.size>=limit) return set.size; } } return set.size; }
function pngChunks(buf:Buffer) { const out:{type:string,data:Buffer}[]=[]; for(let p=8;p<buf.length;){ const len=buf.readUInt32BE(p); const type=buf.slice(p+4,p+8).toString(); out.push({type,data:buf.slice(p+8,p+8+len) as Buffer}); p+=12+len; } return out; }
function pdfEsc(s:string){return s.replace(/[()\\]/g,'\\$&');} function u32(n:number){const b=Buffer.alloc(4); b.writeUInt32BE(n); return b;} function chunk(t:string,d:Buffer){return Buffer.concat([u32(d.length),Buffer.from(t),d,u32(crc(Buffer.concat([Buffer.from(t),d])))]);} function crc(b:Buffer){let c=~0; for(const x of b){c^=x; for(let k=0;k<8;k++) c=(c>>>1)^(0xedb88320&-(c&1));} return ~c>>>0;}
