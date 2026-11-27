#!/usr/bin/env node
// Citizen North — local layout editor
// Run:  npm run layout   (then open http://localhost:4321)
// Serves the site, adds the editor to every page, and writes your arrangement
// back into the page's HTML when you press Save. Nothing here is deployed:
// the published site only ever sees the saved HTML.

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 4321;
const TOOLS = path.join(ROOT, 'tools');
const IMG_EXT = /\.(jpe?g|png|webp|avif|gif)$/i;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain',
};

// Resolve a site path and refuse anything outside the site folder.
function inside(rel) {
  const p = path.resolve(ROOT, '.' + path.posix.normalize('/' + decodeURIComponent(rel)));
  if (p !== ROOT && !p.startsWith(ROOT + path.sep)) throw Object.assign(new Error('outside site'), { code: 403 });
  return p;
}

const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// HTML for a photo added from the tray, matching the kind of gallery it lands in.
function newBlock(kind, id, size, src, alt, indent) {
  const i = indent;
  if (kind === 'gallery') {
    return `${i}<!-- block:${id} -->\n${i}<figure class="gallery-item" data-block="${id}">\n${i}  <img\n${i}    class="gallery-img"\n${i}    src="${escAttr(src)}"\n${i}    data-full="${escAttr(src)}"\n${i}    alt="${escAttr(alt)}"\n${i}    loading="lazy">\n${i}</figure>`;
  }
  return `${i}<!-- block:${id} -->\n${i}<figure class="lb-item js-reveal-up" data-block="${id}" data-size="${size}">\n${i}  <img src="${escAttr(src)}" alt="${escAttr(alt)}" loading="lazy">\n${i}</figure>`;
}

// Rewrite the blocks between <!-- layout:NAME --> and <!-- /layout:NAME --> in the given order.
function applyLayout(html, name, blocks) {
  const startRe = new RegExp(`<!-- layout:${name}\\b[^\\n]*-->\\n`);
  const sm = startRe.exec(html);
  const endTag = `<!-- /layout:${name} -->`;
  const end = html.indexOf(endTag);
  if (!sm || end < 0) throw new Error(`layout "${name}" not found in page`);
  const regionStart = sm.index + sm[0].length;
  const region = html.slice(regionStart, end);
  const firstBlock = region.indexOf('<!-- block:');
  const closeAt = region.lastIndexOf('</div>');
  if (firstBlock < 0 || closeAt < firstBlock) throw new Error(`layout "${name}" has no blocks`);
  const head = region.slice(0, region.lastIndexOf('\n', firstBlock) + 1);
  const tail = region.slice(region.lastIndexOf('\n', closeAt) + 1);
  const indent = region.slice(region.lastIndexOf('\n', firstBlock) + 1, firstBlock);
  const kind = /class="gallery-grid"/.test(head) ? 'gallery' : 'grid';

  const body = region.slice(head.length, region.length - tail.length);
  const chunks = new Map();
  for (const part of body.split(/\n(?=[ \t]*<!-- block:)/)) {
    const m = /<!-- block:([\w-]+) -->/.exec(part);
    if (m) chunks.set(m[1], part.replace(/\s+$/, ''));
  }

  const seen = new Set();
  const out = blocks.map((b) => {
    if (!/^[\w-]+$/.test(b.id)) throw new Error(`bad block id ${b.id}`);
    if (seen.has(b.id)) throw new Error(`block ${b.id} listed twice`);
    seen.add(b.id);
    let chunk = chunks.get(b.id);
    if (!chunk) {
      if (!b.src) throw new Error(`unknown block ${b.id}`);
      return newBlock(kind, b.id, b.size || 'half', b.src, b.alt || '', indent);
    }
    if (b.size && /^[a-z]+$/.test(b.size)) {
      chunk = chunk.replace(new RegExp(`(data-block="${b.id}"[^>]*?data-size=")[a-z]+(")`), `$1${b.size}$2`);
    }
    return chunk;
  });
  // Text blocks can never be dropped by the editor; keep any that went missing at the end.
  for (const [id, chunk] of chunks) if (!seen.has(id) && id.startsWith('text-')) out.push(chunk);

  return html.slice(0, regionStart) + head + out.join('\n\n') + '\n' + tail + html.slice(end);
}

async function readBody(req) {
  let data = '';
  for await (const c of req) { data += c; if (data.length > 2e6) throw new Error('request too large'); }
  return JSON.parse(data || '{}');
}

const send = (res, code, body, type = 'application/json') => {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (url.pathname === '/__layout/editor.js' || url.pathname === '/__layout/editor.css') {
      const f = path.join(TOOLS, url.pathname.endsWith('.js') ? 'layout-editor.js' : 'layout-editor.css');
      return send(res, 200, await fs.readFile(f), TYPES[path.extname(f)]);
    }

    if (url.pathname === '/__layout/images') {
      const dir = inside(url.searchParams.get('dir') || '');
      let files = [];
      try { files = (await fs.readdir(dir)).filter((f) => IMG_EXT.test(f)).sort(); } catch {}
      return send(res, 200, { files });
    }

    if (url.pathname === '/__layout/save' && req.method === 'POST') {
      const { page, layouts } = await readBody(req);
      const file = inside(page);
      if (!file.endsWith('.html')) throw new Error('can only save .html pages');
      let html = await fs.readFile(file, 'utf8');
      for (const l of layouts) {
        if (!/^[\w-]+$/.test(l.name)) throw new Error('bad layout name');
        html = applyLayout(html, l.name, l.blocks);
      }
      await fs.writeFile(file, html);
      console.log(`saved ${page} (${layouts.map((l) => l.name).join(', ')})`);
      return send(res, 200, { ok: true });
    }

    let file = inside(url.pathname);
    if ((await fs.stat(file).catch(() => null))?.isDirectory()) {
      // folder URLs need a trailing slash so relative links resolve, as on GitHub Pages
      if (!url.pathname.endsWith('/')) { res.writeHead(301, { Location: url.pathname + '/' + url.search }); return res.end(); }
      file = path.join(file, 'index.html');
    }
    const buf = await fs.readFile(file);
    const ext = path.extname(file).toLowerCase();
    if (ext === '.html') {
      const html = buf.toString('utf8').replace(
        '</body>',
        '<link rel="stylesheet" href="/__layout/editor.css">\n<script src="/__layout/editor.js" defer></script>\n</body>',
      );
      return send(res, 200, html, TYPES['.html']);
    }
    return send(res, 200, buf, TYPES[ext] || 'application/octet-stream');
  } catch (e) {
    const code = e.code === 'ENOENT' ? 404 : e.code === 403 ? 403 : 400;
    if (code === 400) console.error(e.message);
    return send(res, code, { error: e.message });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\nCitizen North layout editor → http://localhost:${PORT}\n`);
  console.log('Drag photos to reorder, use the size buttons, then press Save.');
  console.log('Saved changes go straight into the HTML files. Ctrl+C to stop.\n');
});
