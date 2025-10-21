// Build Quick Guide: consolidate Markdown into a single public HTML page and remove extra .md files
// Usage: node tools/build-quick-guide.js

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CLIENT_DIR = path.join(ROOT, 'client');
const PUBLIC_DIR = path.join(CLIENT_DIR, 'public');
const OUTPUT_KB = path.join(PUBLIC_DIR, 'knowledge-base.html');
const OUTPUT_QG = path.join(PUBLIC_DIR, 'quick-guide.html');
const KEEP_MD = new Set(['README.md']);

const REDACT_PATTERNS = [
  /DEFAULT_ADMIN_PASSWORD\s*=.*$/gim,
  /DEFAULT_USER_PASSWORD\s*=.*$/gim,
  /JWT_SECRET\s*=.*$/gim,
  /MONGO_URI\s*=.*$/gim,
  /EMAIL_USER\s*=.*$/gim,
  /EMAIL_PASS\s*=.*$/gim,
  /EMAIL_HOST\s*=.*$/gim,
  /EMAIL_PORT\s*=.*$/gim,
  /CLIENT_URL\s*=.*$/gim,
  /APP_URL\s*=.*$/gim,
  /SHOPIFY_API_KEY\s*=.*$/gim,
  /SHOPIFY_API_SECRET\s*=.*$/gim,
];

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue;
      out = walk(p, out);
    } else if (e.isFile() && e.name.toLowerCase().endsWith('.md')) {
      out.push(p);
    }
  }
  return out;
}

function readAndScrub(file) {
  let content = fs.readFileSync(file, 'utf8');
  for (const re of REDACT_PATTERNS) {
    content = content.replace(re, (m) => m.split('=')[0] + '= [REDACTED]');
  }
  // Also redact inline secrets patterns
  content = content.replace(/(password|secret|token|key)\s*[:=]\s*[^\s\n]+/gim, '$1: [REDACTED]');
  return content;
}

function mdToBasicHtml(md) {
  // Minimal markdown to HTML conversion (headings, code blocks, lists, paragraphs)
  let html = md;
  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, (m, p1) => `<pre><code>${escapeHtml(p1)}</code></pre>`);
  // Headings
  html = html.replace(/^######\s*(.*)$/gm, '<h6>$1</h6>')
             .replace(/^#####\s*(.*)$/gm, '<h5>$1</h5>')
             .replace(/^####\s*(.*)$/gm, '<h4>$1</h4>')
             .replace(/^###\s*(.*)$/gm, '<h3>$1</h3>')
             .replace(/^##\s*(.*)$/gm, '<h2>$1</h2>')
             .replace(/^#\s*(.*)$/gm, '<h1>$1</h1>');
  // Lists
  html = html.replace(/^\-\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>\n${m}\n</ul>`);
  // Bold/Italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1<\/a>');
  // Paragraphs (simple)
  html = html.replace(/^(?!<h\d|<ul|<li|<pre|<code|<\/)(.+)$/gm, '<p>$1</p>');
  return html;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
}

function buildHtmlPage(title, sections) {
  const toc = sections
    .map(
      (s, i) =>
        `<li><a href="#sec-${i}" class="block px-2 py-1 rounded hover:bg-slate-800">${escapeHtml(
          s.title,
        )}</a></li>`,
    )
    .join('\n');

  const bodyHtml = sections
    .map(
      (s, i) =>
        `<section id="sec-${i}" class="mb-10"><h2>${escapeHtml(s.title)}</h2>${mdToBasicHtml(
          s.content,
        )}</section>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
  :root{--bg:#0b1220;--muted:#e5e7eb;--panel:#0d1b2a;--border:#1f2937;--accent:#38bdf8}
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,Helvetica,Arial,sans-serif;background:var(--bg);color:var(--muted);line-height:1.65;margin:0}
  header{position:sticky;top:0;background:rgba(13,27,42,.9);backdrop-filter:blur(6px);border-bottom:1px solid var(--border);z-index:10}
  .wrap{display:flex;gap:1.5rem}
  aside{width:280px;max-height:calc(100vh - 64px);position:sticky;top:64px;overflow:auto;border-right:1px solid var(--border);padding:1rem;background:#0b1526}
  main{flex:1;min-width:0;padding:1.5rem}
  h1{color:#fff;margin:0}
  h2,h3,h4{color:#fff;margin-top:1.5rem}
  a{color:#38bdf8}
  pre{background:#111827;border:1px solid var(--border);padding:1rem;border-radius:.5rem;overflow:auto}
  code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace}
  ul{padding-left:1.25rem}
  .notice{background:#0b3b4f;border-left:4px solid var(--accent);padding:.75rem 1rem;border-radius:.25rem;margin:1rem 0}
  .search{display:flex;gap:.5rem;align-items:center}
  .search input{flex:1;background:#0f1e33;border:1px solid var(--border);color:#e5e7eb;border-radius:.5rem;padding:.6rem .8rem}
  .toc{list-style:none;margin:0;padding:0}
  .toc li{margin:.25rem 0}
  .muted{color:#9ca3af}
</style>
</head>
<body>
<header>
  <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;">
    <h1>${title}</h1>
    <div class="search">
      <input id="kb-search" type="search" placeholder="Search knowledge base..." />
      <button id="kb-clear" style="background:#1f2937;color:#e5e7eb;border:1px solid #374151;border-radius:.5rem;padding:.5rem .75rem">Clear</button>
    </div>
  </div>
  <div class="notice" style="margin:0 1.25rem 1rem 1.25rem;">Consolidated knowledge base. Sensitive values are redacted.</div>
  </header>
<div class="wrap">
  <aside>
    <div class="muted" style="margin-bottom:.5rem;">Contents</div>
    <ul class="toc">${toc}</ul>
  </aside>
  <main>
    ${bodyHtml}
  </main>
</div>
<script>
  const input = document.getElementById('kb-search');
  const clearBtn = document.getElementById('kb-clear');
  function norm(s){return (s||'').toLowerCase()}
  function filter(){
    const q = norm(input.value);
    const secs = document.querySelectorAll('section');
    secs.forEach(sec=>{
      const visible = q.length<2 || norm(sec.textContent).includes(q);
      sec.style.display = visible? 'block':'none';
    });
  }
  input?.addEventListener('input', filter);
  clearBtn?.addEventListener('click', ()=>{input.value='';filter();});
</script>
</body>
</html>`;
}

function run() {
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  const mdFiles = walk(ROOT).filter((p) => {
    // Exclude node_modules and keep only project docs (exclude dependency readmes)
    if (p.includes(path.sep + 'node_modules' + path.sep)) return false;
    return true;
  });

  const toInclude = mdFiles.filter((p) => path.basename(p) !== 'README.md');

  const sections = toInclude.map((file) => {
    const rel = path.relative(ROOT, file);
    const content = readAndScrub(file);
    return { title: rel, content };
  });

  const html = buildHtmlPage('EcomManager Knowledge Base', sections);
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_KB, html, 'utf8');
  fs.writeFileSync(OUTPUT_QG, html, 'utf8');
  console.log(`✅ Knowledge Base generated at: ${path.relative(ROOT, OUTPUT_KB)} (alias: ${path.relative(ROOT, OUTPUT_QG)})`);

  // Remove unnecessary md files (keep only root README.md)
  for (const file of toInclude) {
    try {
      fs.unlinkSync(file);
      console.log(`🗑️ Removed ${path.relative(ROOT, file)}`);
    } catch (e) {
      console.warn(`⚠️ Could not remove ${file}:`, e.message);
    }
  }
}

run();
