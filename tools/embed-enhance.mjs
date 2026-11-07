// Adds an "embedded" layer to each demo HTML so it reads well inside the Confluence iframe:
//  - detects framing (or ?embed=1) and sets <html class="embedded">
//  - tighter paddings, narrower side navigation, horizontal nav chips when the frame is narrow
//  - a floating "Open full screen" button linking to the demo in its own tab
// Edits the source-of-truth files in place (idempotent, marker comment) and copies them into this repo.
// usage: node tools/embed-enhance.mjs
import fs from "node:fs";
import path from "node:path";

const HOME = "C:/Users/AliMammadov";
const SF = `${HOME}/Projects/prospectus-salesforce`;
const REPO = `${HOME}/Projects/pro-demos`;
const MARK = "<!-- embed-enhance v1 -->";

const common = {
  js: `(function(){var f=false;try{f=window.self!==window.top}catch(e){f=true}
var q=location.search;if(q.indexOf('embed=0')>-1)f=false;if(q.indexOf('embed=1')>-1)f=true;
if(!f)return;document.documentElement.classList.add('embedded');
document.addEventListener('DOMContentLoaded',function(){var a=document.createElement('a');a.className='embed-fs';
a.href=location.origin+location.pathname+location.hash;a.target='_blank';a.rel='noopener';a.title='Open this demo in its own tab';
a.textContent='Open full screen \\u2197';document.body.appendChild(a);});})();`,
  css: `html.embedded .embed-fs{position:fixed;right:12px;bottom:12px;z-index:9999;background:#0052cc;color:#fff;font:600 12px/1 "Segoe UI",system-ui,sans-serif;padding:9px 12px;border-radius:999px;text-decoration:none;box-shadow:0 2px 10px rgba(0,0,0,.28);opacity:.92}
html.embedded .embed-fs:hover{opacity:1;background:#0747a6}
html.embedded{scrollbar-width:thin}`,
};

const demos = [
  {
    src: `${SF}/docs/security/pro-access-model/demo/index.html`,
    mirrors: [`${HOME}/Desktop/Org-Architecture-2026-11-06/Org-Architecture-Demo.html`],
    out: `${REPO}/org-architecture/index.html`,
    css: `html.embedded header{padding:8px 16px;gap:12px}
html.embedded header h1{font-size:17px}
html.embedded header .sub{font-size:12px}
html.embedded .wrap{grid-template-columns:230px 1fr}
html.embedded nav a{padding:6px 16px;font-size:13.5px}
html.embedded main{padding:18px 22px 70px;max-width:none}
@media (max-width:1000px){
 html.embedded .wrap{grid-template-columns:1fr}
 html.embedded nav{display:flex;flex-wrap:wrap;gap:4px 6px;padding:8px 10px;position:sticky;top:52px;z-index:4;border-right:0;border-bottom:1px solid var(--line);max-height:none}
 html.embedded nav .t{width:100%;padding:4px 2px 0;margin:0}
 html.embedded nav .hint{display:none}
 html.embedded nav a{padding:4px 10px;border:1px solid var(--line);border-left:1px solid var(--line);border-radius:999px;font-size:12.5px}
 html.embedded main{padding:14px 14px 70px}
}`,
  },
  {
    src: `${HOME}/Desktop/Correspondence-Letters-Demo-2026-11-06.html`,
    mirrors: [],
    out: `${REPO}/correspondence-letters/index.html`,
    css: `html.embedded .top{padding:8px 14px;gap:10px}
html.embedded .top .ttl h1{font-size:16px}
html.embedded .top .ttl p{font-size:11.5px}
html.embedded .app{grid-template-columns:240px 1fr;gap:12px;padding:10px 12px 24px;max-width:none}
html.embedded .rail{top:58px;max-height:calc(100vh - 70px)}
@media (max-width:980px){
 html.embedded .app{grid-template-columns:1fr}
 html.embedded .rail{display:flex;flex-wrap:nowrap;overflow-x:auto;gap:6px;position:sticky;top:58px;z-index:10;background:var(--bg);padding:6px 0;max-height:none}
 html.embedded .rail>*{flex:0 0 230px}
 html.embedded .rail h4{display:none}
}`,
  },
  {
    src: `${SF}/docs/analysis/2026-11-06-prodemo-relationship-model/staff-to-doctor-demo.html`,
    mirrors: [],
    out: `${REPO}/staff-to-doctor/index.html`,
    css: `html.embedded header{padding:8px 16px;gap:12px}
html.embedded header h1{font-size:17px}
html.embedded header .sub{font-size:12px}
html.embedded .wrap{grid-template-columns:230px 1fr}
html.embedded nav a{padding:6px 16px;font-size:13.5px}
html.embedded main{padding:18px 22px 70px;max-width:none}
@media (max-width:1000px){
 html.embedded .wrap{grid-template-columns:1fr}
 html.embedded nav{display:flex;flex-wrap:wrap;gap:4px 6px;padding:8px 10px;position:sticky;top:52px;z-index:4;border-right:0;border-bottom:1px solid var(--line);max-height:none}
 html.embedded nav .t{width:100%;padding:4px 2px 0;margin:0}
 html.embedded nav .hint{display:none}
 html.embedded nav a{padding:4px 10px;border:1px solid var(--line);border-left:1px solid var(--line);border-radius:999px;font-size:12.5px}
 html.embedded main{padding:14px 14px 70px}
}`,
  },
  {
    src: `${SF}/docs/td-2280/product-replacement-journey-demo.html`,
    mirrors: [],
    out: `${REPO}/product-replacement/index.html`,
    css: `html.embedded .wrap{max-width:none;padding:0 18px}
html.embedded .bar .wrap{min-height:46px;gap:10px}
html.embedded .hero{padding:18px 0 6px}
html.embedded .hero h1{font-size:1.7rem}
html.embedded body{font-size:15px}`,
  },
];

function inject(html, css) {
  const block = `${MARK}<style id="embed-css">${common.css}\n${css}</style><script id="embed-js">${common.js}</script>`;
  if (html.includes(MARK)) html = html.replace(/<!-- embed-enhance v1 --><style id="embed-css">[\s\S]*?<\/style><script id="embed-js">[\s\S]*?<\/script>/, block);
  else {
    const i = html.search(/<\/head>/i);
    if (i < 0) throw new Error("no </head>");
    html = html.slice(0, i) + block + "\n" + html.slice(i);
  }
  return html;
}

for (const d of demos) {
  const before = fs.readFileSync(d.src, "utf8");
  const after = inject(before, d.css);
  fs.writeFileSync(d.src, after);
  for (const m of d.mirrors) fs.writeFileSync(m, after);
  fs.mkdirSync(path.dirname(d.out), { recursive: true });
  fs.writeFileSync(d.out, after);
  console.log(`${path.basename(path.dirname(d.out))}: ${before.length} -> ${after.length} chars${before.includes(MARK) ? " (re-applied)" : ""}; mirrors ${d.mirrors.length}`);
}
