// Worldwide map: places each city from its <li data-lat data-lon>, draws a line from the hub
// to every other city, runs a pulse along each line, and keeps each city's local time.
(() => {
  const map = document.querySelector('[data-world]');
  if (!map) return;

  // The dotted map (images/world-dots.svg) is equirectangular: lon -180..180, lat 78..-58.
  const W = 1000, H = 377.78, LAT_TOP = 78, LAT_SPAN = 136;
  const toXY = (lat, lon) => [((lon + 180) / 360) * W, ((LAT_TOP - lat) / LAT_SPAN) * H];

  const svg = map.querySelector('.world-lines');
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cities = [...map.querySelectorAll('.world-cities li')].map((li) => {
    const lat = parseFloat(li.dataset.lat), lon = parseFloat(li.dataset.lon);
    const [x, y] = toXY(lat, lon);
    li.style.left = `${(x / W) * 100}%`;
    li.style.top = `${(y / H) * 100}%`;
    const name = li.textContent.trim();
    li.textContent = '';
    li.innerHTML = `<span class="city-dot" aria-hidden="true"></span><span class="city-label"><span class="city-name">${name}</span><time class="city-time"></time></span>`;
    li.classList.add(`city--${li.dataset.kind || 'base'}`, `label--${li.dataset.label || 'right'}`);
    if (li.dataset.labelPhone) li.classList.add(`phone-label--${li.dataset.labelPhone}`);
    return { li, name, x, y, tz: li.dataset.tz };
  });

  // Lines from the hub to every other city: a curve that bows upward, longer trips bow more.
  const hub = cities.find((c) => c.name === map.dataset.hub) || cities[0];
  cities.filter((c) => c !== hub).forEach((c, i) => {
    const dx = c.x - hub.x, dy = c.y - hub.y, dist = Math.hypot(dx, dy);
    const mx = (hub.x + c.x) / 2, my = (hub.y + c.y) / 2 - Math.max(8, dist * 0.35);
    const d = `M${hub.x.toFixed(1)} ${hub.y.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`;
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('pathLength', '1');
    path.setAttribute('class', 'world-line');
    path.style.setProperty('--i', i);
    svg.appendChild(path);
    if (reduce) return;
    // a pulse travelling hub → city, staggered so they don't move in lockstep
    const dot = document.createElementNS(NS, 'circle');
    dot.setAttribute('r', '2.6');
    dot.setAttribute('opacity', '0');   // hidden until its first run starts
    dot.setAttribute('class', 'world-pulse');
    const anim = document.createElementNS(NS, 'animateMotion');
    anim.setAttribute('dur', `${(2.6 + dist / 220).toFixed(2)}s`);
    anim.setAttribute('begin', `${(1.2 + i * 0.55).toFixed(2)}s`);
    anim.setAttribute('repeatCount', 'indefinite');
    anim.setAttribute('path', d);
    anim.setAttribute('keyPoints', '0;1');
    anim.setAttribute('keyTimes', '0;1');
    anim.setAttribute('calcMode', 'spline');
    anim.setAttribute('keySplines', '.45 0 .25 1');
    dot.appendChild(anim);
    const show = document.createElementNS(NS, 'set');
    show.setAttribute('attributeName', 'opacity');
    show.setAttribute('to', '1');
    show.setAttribute('begin', anim.getAttribute('begin'));
    show.setAttribute('fill', 'freeze');
    dot.appendChild(show);
    svg.appendChild(dot);
  });

  // Local time in every city, refreshed each half minute.
  const fmt = new Map();
  const tick = () => {
    const now = new Date();
    cities.forEach((c) => {
      if (!c.tz) return;
      if (!fmt.has(c.tz)) fmt.set(c.tz, new Intl.DateTimeFormat('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: c.tz }));
      const t = c.li.querySelector('.city-time');
      t.textContent = fmt.get(c.tz).format(now);
      t.dateTime = now.toISOString();
    });
  };
  tick();
  setInterval(tick, 30000);

  // Draw the lines once the map is on screen; run pulses only while it is visible.
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) map.classList.add('is-on');
      if (!reduce && !map.classList.contains('is-paused')) e.isIntersecting ? svg.unpauseAnimations() : svg.pauseAnimations();
    });
  }, { threshold: 0.25 });
  io.observe(map);

  // Anything that keeps moving gets a pause control.
  const btn = map.querySelector('.world-pause');
  if (reduce) { btn.hidden = true; map.classList.add('is-on'); return; }
  btn.addEventListener('click', () => {
    const paused = map.classList.toggle('is-paused');
    paused ? svg.pauseAnimations() : svg.unpauseAnimations();
    btn.setAttribute('aria-pressed', String(paused));
    btn.textContent = paused ? 'Play' : 'Pause';
  });
})();
