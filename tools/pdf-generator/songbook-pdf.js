// songbook-pdf.js — create songs.pdf for every parsable song
// -----------------------------------------------------------------------------
// npm install chordsheetjs puppeteer   (project‑local)
// package.json must include: "type": "module"
//
// DEBUG FLAG — true so we always get a 5‑song HTML preview
const PREVIEW_HTML = true;
// -----------------------------------------------------------------------------

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import ChordSheetJS from 'chordsheetjs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const { ChordProParser, HtmlDivFormatter } = ChordSheetJS;
const parser    = new ChordProParser();
const formatter = new HtmlDivFormatter();

/* helpers */
const fixUnknownTags = s =>
  s.replace(/\{x\s*:/gi, '{comment:')
   .replace(/\{x([ \t])/gi, '{comment$1');

const stripMeta = s =>
  s.replace(/\{(?:title|subtitle|artist|album|key|tempo|capo|year|time|composer|lyricist|author)[^}]*}/gi,'')
   .replace(/\{(?:title|subtitle|artist|album|key|tempo|capo|year|time|composer|lyricist|author)\s+[^}]*}/gi,'');

function logParseError(song, err, src){
  const loc = err.location?.start ?? {line:'?',column:'?'};
  const ln  = src.split('\n')[loc.line-1] ?? '';
  const ptr = ' '.repeat(Math.max(loc.column-1,0)) + '▲';
  console.warn(`\n⚠︎  Parse error in “${song.Song__c}” (line ${loc.line}, col ${loc.column})`);
  console.warn(`    ${ln}`);
  console.warn(`    ${ptr}`);
  console.warn(`    ${err.message}`);
}

function buildSection(song, idx){
  let raw = (song.ChordPro_Content__c || '').trim();
  if(!raw) return null;
  raw = stripMeta(fixUnknownTags(raw)).replace(/\r\n/g,'\n').replace(/\r/g,'\n');
  try{
    let html = formatter.format(parser.parse(raw));
    html = html.replace(/<h[12][^>]*>[^<]*<\/h[12]>/gi,'');
    html = html.replace(/<div class="lyrics">\s+/g,'<div class="lyrics">');
    return `\n<section class="song">\n  <h1>${idx}. ${song.Artist__c ?? ''} — ${song.Song__c ?? 'Untitled'}</h1>\n  ${html}\n</section>`;
  }catch(err){ logParseError(song,err,raw); return null; }
}

(async()=>{
  const DATA = path.resolve(__dirname, '..', '..', 'data', 'song__c.json');
  const rows = JSON.parse(fs.readFileSync(DATA,'utf8')).records ?? [];
  const sections=[]; let good=0;
  for(const r of rows){ const s=buildSection(r,good+1); if(s){sections.push(s);good++;} }
  if(!good){ console.error('❌  No parsable songs.'); process.exit(1); }
  const body = sections.join('\n');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${good} songs</title><style>
  body{font-family:Arial,sans-serif;margin:40px;font-size:18pt}
  section.song{page-break-after:always;margin-bottom:38px}
  .row{display:flex;align-items:flex-end}
  .column{display:inline-flex;flex-direction:column;justify-content:flex-end}
  .column+.column{margin-left:.1em}
  .chord:empty{display:block;height:1.2em}
  .chord{font-weight:bold;color:#d33;margin-bottom:2px;white-space:pre}
  .lyrics{white-space:pre}
  h1{font-size:28pt;margin:0 0 14px}
  </style></head><body>${body}</body></html>`;

  if(PREVIEW_HTML){
    const preview = sections.slice(0,5).join('\n');
    fs.writeFileSync('songs.html', html.replace(body, preview),'utf8');
    console.log('📝  songs.html written (first 5 songs)');
  }

  const browser = await puppeteer.launch({headless:'new'});
  const page = await browser.newPage();
  await page.setContent(html,{waitUntil:'networkidle0'});
  await page.pdf({path:'songs.pdf',format:'A4',printBackground:true,margin:{top:'15mm',bottom:'18mm',left:'15mm',right:'15mm'}});
  await browser.close();
  console.log(`✅  songs.pdf created with ${good} song(s)`);
})();
