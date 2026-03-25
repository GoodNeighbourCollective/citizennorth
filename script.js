/* ============================================================
   CITIZEN NORTH — Interactive Layer
   ============================================================ */

(() => {
  'use strict';

  const qs  = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ──────────────────────────────────────────────────────────
     CUSTOM CURSOR — only activates on project image hover
  ────────────────────────────────────────────────────────── */
  const cursor = qs('#cursor');

  if (cursor && window.matchMedia('(pointer: fine)').matches) {
    let cx = 0, cy = 0;

    // Track mouse at all times so cursor is in position before it appears
    document.addEventListener('mousemove', (e) => {
      cx = e.clientX;
      cy = e.clientY;
      cursor.style.left = cx + 'px';
      cursor.style.top  = cy + 'px';
    }, { passive: true });

    // Only show cursor circle when hovering project thumbs
    const thumbs = qsa('.work-thumb, .work-page-thumb');
    thumbs.forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-active'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));
    });
  } else if (cursor) {
    cursor.style.display = 'none';
  }

  /* ──────────────────────────────────────────────────────────
     NAVIGATION
  ────────────────────────────────────────────────────────── */
  const header     = qs('#header');
  const navToggle  = qs('#navToggle');
  const navOverlay = qs('#navOverlay');
  const logo       = qs('#logo');
  if (!navToggle) return;

  let navOpen = false;

  function openNav() {
    navOpen = true;
    navToggle.classList.add('nav-is-open');
    navOverlay.classList.add('nav-is-open');
    logo && logo.classList.add('nav-is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    navOpen = false;
    navToggle.classList.remove('nav-is-open');
    navOverlay.classList.remove('nav-is-open');
    logo && logo.classList.remove('nav-is-open');
    document.body.style.overflow = '';
  }

  navToggle.addEventListener('click', () => navOpen ? closeNav() : openNav());

  qsa('[data-close-nav]').forEach(link => link.addEventListener('click', closeNav));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navOpen) closeNav();
  });

  /* ──────────────────────────────────────────────────────────
     HEADER: AUTO-HIDE ON SCROLL DOWN
  ────────────────────────────────────────────────────────── */
  let lastScrollY = 0, ticking = false;

  function handleScroll() {
    const y = window.scrollY;
    if (header) {
      if (y > lastScrollY && y > 120) {
        header.classList.add('is-hidden');
      } else {
        header.classList.remove('is-hidden');
      }
    }
    lastScrollY = y;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(handleScroll); ticking = true; }
  }, { passive: true });

  /* ──────────────────────────────────────────────────────────
     HERO ENTRANCE (homepage)
  ────────────────────────────────────────────────────────── */
  window.addEventListener('load', () => {
    qsa('.split-word').forEach((word, i) => {
      setTimeout(() => word.classList.add('is-revealed'), 200 + i * 180);
    });
    const heroSub = qs('.hero-sub p');
    if (heroSub) setTimeout(() => heroSub.classList.add('is-revealed'), 750);

    // Project page hero
    const projectTitle   = qs('.project-title');
    const projectTagline = qs('.project-tagline');
    if (projectTitle)   setTimeout(() => projectTitle.classList.add('is-revealed'), 200);
    if (projectTagline) setTimeout(() => projectTagline.classList.add('is-revealed'), 500);
  });

  /* ──────────────────────────────────────────────────────────
     SCROLL REVEALS
  ────────────────────────────────────────────────────────── */
  const revealSelectors = [
    '.js-reveal',
    '.js-reveal-fade',
    '.js-reveal-up',
    '.work-header',
    '.clients-label',
    '.services-heading-wrap',
    '.contact-heading',
    '.contact-actions',
    '.project-meta',
    '.work-page-item',
    '.service-item',
    '.work-item',
  ];

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  revealSelectors.forEach(sel => {
    qsa(sel).forEach(el => observer.observe(el));
  });

  /* ──────────────────────────────────────────────────────────
     SMOOTH ANCHOR SCROLL
  ────────────────────────────────────────────────────────── */
  qsa('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    });
  });

})();
