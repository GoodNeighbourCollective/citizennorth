// Citizen North — in-page layout editor. Loaded only by tools/layout-server.mjs.
(() => {
  const layouts = [...document.querySelectorAll('[data-layout]')];
  document.documentElement.classList.add('le-on');

  let page = decodeURIComponent(location.pathname.replace(/^\//, ''));
  if (!page || page.endsWith('/')) page += 'index.html';   // folder URLs: /work/fairmont-mayakoba/

  let dirty = false;
  let dragged = null;

  // ---------- toolbar ----------
  const bar = document.createElement('div');
  bar.className = 'le-bar';
  bar.innerHTML = layouts.length
    ? `<strong>Layout mode</strong>
       <span class="le-hint">Drag photos to reorder · pick a size · add from the tray</span>
       <span class="le-status" aria-live="polite"></span>
       <button type="button" class="le-btn" data-act="tray">Photo tray</button>
       <button type="button" class="le-btn" data-act="reset">Discard changes</button>
       <button type="button" class="le-btn le-btn--primary" data-act="save" disabled>Save layout</button>`
    : `<strong>Layout mode</strong><span class="le-hint">Nothing on this page can be arranged yet.</span>`;
  document.body.appendChild(bar);
  const status = bar.querySelector('.le-status');
  const saveBtn = bar.querySelector('[data-act="save"]');

  const setDirty = (v) => {
    dirty = v;
    if (saveBtn) saveBtn.disabled = !v;
    if (status) status.textContent = v ? 'Unsaved changes' : '';
  };
  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  // ---------- tray of photos not yet on the page ----------
  const tray = document.createElement('aside');
  tray.className = 'le-tray';
  tray.setAttribute('aria-label', 'Photos not on this page');
  tray.innerHTML = '<div class="le-tray-head"><strong>Photo tray</strong><button type="button" class="le-btn" data-act="tray">Close</button></div><div class="le-tray-body"></div>';
  document.body.appendChild(tray);
  const trayBody = tray.querySelector('.le-tray-body');

  const fileOf = (src) => decodeURIComponent((src || '').split('?')[0].split('/').pop());

  async function fillTray() {
    trayBody.innerHTML = '';
    for (const box of layouts) {
      const dir = box.dataset.imagesDir;
      if (!dir) continue;
      const siteDir = new URL(dir + '/', location.href).pathname;
      const { files } = await (await fetch('/__layout/images?dir=' + encodeURIComponent(siteDir))).json();
      const used = new Set([...box.querySelectorAll('img')].map((i) => fileOf(i.getAttribute('src'))));
      const free = files.filter((f) => !used.has(f));
      const group = document.createElement('section');
      group.innerHTML = `<h4>${box.dataset.layout} <span>${free.length} unused in ${dir}</span></h4>`;
      if (!free.length) group.insertAdjacentHTML('beforeend', '<p class="le-empty">Every photo in this folder is on the page. Drop more files into the folder and reopen the tray.</p>');
      for (const f of free) {
        const src = `${dir}/${f}`;
        const t = document.createElement('button');
        t.type = 'button';
        t.className = 'le-thumb';
        t.draggable = true;
        t.title = `Add ${f}`;
        t.innerHTML = `<img src="${src}" alt=""><span>${f}</span>`;
        t.addEventListener('click', () => { addPhoto(box, src); t.remove(); });
        t.addEventListener('dragstart', (e) => { dragged = { box, src, thumb: t }; e.dataTransfer.effectAllowed = 'copy'; });
        group.appendChild(t);
      }
      trayBody.appendChild(group);
    }
  }

  function addPhoto(box, src, before = null) {
    // id from the file name, minus the folder's own prefix (fairmont-mayakoba-riviera-maya-pool → img-riviera-maya-pool)
    const folder = (box.dataset.imagesDir || '').split('/').pop();
    let base = fileOf(src).replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (folder && base.startsWith(folder + '-')) base = base.slice(folder.length + 1);
    let id = 'img-' + base.slice(0, 48);
    while (document.querySelector(`[data-block="${id}"]`)) id += '-2';
    const isGallery = box.classList.contains('gallery-grid');
    const el = document.createElement('figure');
    el.className = isGallery ? 'gallery-item' : 'lb-item';
    el.dataset.block = id;
    el.dataset.new = src;
    if (!isGallery) el.dataset.size = 'half';
    el.innerHTML = `<img ${isGallery ? 'class="gallery-img" ' : ''}src="${src}" alt="">`;
    box.insertBefore(el, before);
    decorate(box, el);
    setDirty(true);
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ---------- per-block controls ----------
  function sizesFor(box, el) {
    if (box.dataset.sizes === 'none' || el.classList.contains('lb-text')) return [];
    return (box.dataset.sizes || 'full,half,third').split(',');
  }

  function decorate(box, el) {
    el.classList.add('le-block');
    el.draggable = true;
    const ctl = document.createElement('div');
    ctl.className = 'le-ctl';
    const sizes = sizesFor(box, el);
    ctl.innerHTML =
      `<span class="le-grip" aria-hidden="true">⠿</span>` +
      `<button type="button" data-move="-1" aria-label="Move earlier">←</button>` +
      `<button type="button" data-move="1" aria-label="Move later">→</button>` +
      sizes.map((s) => `<button type="button" data-size-btn="${s}" aria-pressed="${el.dataset.size === s}">${s[0].toUpperCase() + s.slice(1)}</button>`).join('') +
      (el.tagName === 'FIGURE' ? `<button type="button" data-remove aria-label="Remove from page">✕</button>` : '');
    el.prepend(ctl);

    ctl.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      e.preventDefault(); e.stopPropagation();
      if (b.dataset.move) {
        const sib = b.dataset.move === '1' ? el.nextElementSibling : el.previousElementSibling;
        if (sib && sib.classList.contains('le-block')) {
          b.dataset.move === '1' ? sib.after(el) : sib.before(el);
          setDirty(true);
        }
      } else if (b.dataset.sizeBtn) {
        el.dataset.size = b.dataset.sizeBtn;
        ctl.querySelectorAll('[data-size-btn]').forEach((x) => x.setAttribute('aria-pressed', x === b));
        setDirty(true);
      } else if ('remove' in b.dataset) {
        el.remove();
        setDirty(true);
        if (tray.classList.contains('is-open')) fillTray();
      }
    });

    el.addEventListener('dragstart', (e) => {
      if (e.target !== el) return;
      dragged = { box, el };
      el.classList.add('le-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', el.dataset.block);
    });
    el.addEventListener('dragend', () => { el.classList.remove('le-dragging'); clearMarks(); dragged = null; });
  }

  const clearMarks = () => document.querySelectorAll('.le-before,.le-after').forEach((n) => n.classList.remove('le-before', 'le-after'));

  for (const box of layouts) {
    [...box.children].filter((c) => c.dataset.block).forEach((el) => decorate(box, el));

    box.addEventListener('dragover', (e) => {
      if (!dragged || dragged.box !== box) return;
      e.preventDefault();
      const target = e.target.closest('.le-block');
      clearMarks();
      if (!target || target === dragged.el) return;
      const r = target.getBoundingClientRect();
      const after = r.width > box.clientWidth * 0.8 ? e.clientY > r.top + r.height / 2 : e.clientX > r.left + r.width / 2;
      target.classList.add(after ? 'le-after' : 'le-before');
    });
    box.addEventListener('drop', (e) => {
      if (!dragged || dragged.box !== box) return;
      e.preventDefault();
      const target = box.querySelector('.le-before, .le-after');
      const ref = target ? (target.classList.contains('le-after') ? target.nextElementSibling : target) : null;
      if (dragged.el) box.insertBefore(dragged.el, ref);
      else if (dragged.src) { addPhoto(box, dragged.src, ref); dragged.thumb?.remove(); }
      clearMarks();
      setDirty(true);
    });
    // links inside arrangeable blocks do nothing while editing
    box.addEventListener('click', (e) => { if (e.target.closest('a') && !e.target.closest('.le-ctl')) e.preventDefault(); }, true);
  }

  // ---------- toolbar actions ----------
  bar.addEventListener('click', async (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'tray') { tray.classList.toggle('is-open'); if (tray.classList.contains('is-open')) fillTray(); }
    if (act === 'reset') { if (!dirty || confirm('Discard your unsaved layout changes?')) { dirty = false; location.reload(); } }
    if (act === 'save') {
      saveBtn.disabled = true;
      status.textContent = 'Saving…';
      const payload = {
        page,
        layouts: layouts.map((box) => ({
          name: box.dataset.layout,
          blocks: [...box.children].filter((c) => c.dataset.block).map((el) => ({
            id: el.dataset.block,
            size: el.dataset.size,
            ...(el.dataset.new ? { src: el.dataset.new.replace(/^\/+/, ''), alt: '' } : {}),
          })),
        })),
      };
      try {
        const r = await fetch('/__layout/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || r.statusText);
        layouts.forEach((box) => box.querySelectorAll('[data-new]').forEach((n) => delete n.dataset.new));
        setDirty(false);
        status.textContent = `Saved to ${page}`;
      } catch (err) {
        status.textContent = 'Save failed: ' + err.message;
        saveBtn.disabled = false;
      }
    }
  });
  tray.addEventListener('click', (e) => { if (e.target.closest('[data-act="tray"]')) tray.classList.remove('is-open'); });

})();
