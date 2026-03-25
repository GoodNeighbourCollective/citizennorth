/* ============================================================
   CITIZEN NORTH — Interactive Layer
   ============================================================ */

(() => {
  'use strict';

  /* ── Utils ─────────────────────────────────────────────── */
  const qs  = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ──────────────────────────────────────────────────────────
     CUSTOM CURSOR
  ────────────────────────────────────────────────────────── */
  const cursor = qs('#cursor');

  if (cursor && window.matchMedia('(pointer: fine)').matches) {
    let cx = 0, cy = 0;

    document.addEventListener('mousemove', (e) => {
      cx = e.clientX;
      cy = e.clientY;
      cursor.style.left = cx + 'px';
      cursor.style.top  = cy + 'px';
      cursor.classList.add('is-visible');
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      cursor.classList.remove('is-visible');
    });

    // Hover effect on interactive elements
    const hoverTargets = qsa('.work-item, .cta-btn, .pill-btn, .nav-link, .contact-email');
    hoverTargets.forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hovering'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hovering'));
    });

    // Hide cursor when over nav toggle (has its own feel)
    const navToggle = qs('#navToggle');
    if (navToggle) {
      navToggle.addEventListener('mouseenter', () => cursor.classList.add('is-hidden'));
      navToggle.addEventListener('mouseleave', () => cursor.classList.remove('is-hidden'));
    }
  } else if (cursor) {
    // Touch device — remove cursor element
    cursor.style.display = 'none';
  }

  /* ──────────────────────────────────────────────────────────
     NAVIGATION
  ────────────────────────────────────────────────────────── */
  const header     = qs('#header');
  const navToggle  = qs('#navToggle');
  const navOverlay = qs('#navOverlay');
  const logo       = qs('#logo');
  let navOpen = false;

  function openNav() {
    navOpen = true;
    navToggle.classList.add('nav-is-open');
    navOverlay.classList.add('nav-is-open');
    logo.classList.add('nav-is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    navOpen = false;
    navToggle.classList.remove('nav-is-open');
    navOverlay.classList.remove('nav-is-open');
    logo.classList.remove('nav-is-open');
    document.body.style.overflow = '';
  }

  navToggle.addEventListener('click', () => navOpen ? closeNav() : openNav());

  // Close on nav link click
  qsa('[data-close-nav]').forEach(link => {
    link.addEventListener('click', closeNav);
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navOpen) closeNav();
  });

  /* ──────────────────────────────────────────────────────────
     HEADER: AUTO-HIDE ON SCROLL DOWN
  ────────────────────────────────────────────────────────── */
  let lastScrollY = 0;
  let ticking = false;

  function handleScroll() {
    const y = window.scrollY;
    if (y > lastScrollY && y > 120) {
      header.classList.add('is-hidden');
    } else {
      header.classList.remove('is-hidden');
    }
    lastScrollY = y;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(handleScroll);
      ticking = true;
    }
  }, { passive: true });

  /* ──────────────────────────────────────────────────────────
     HERO ENTRANCE ANIMATIONS (on load)
  ────────────────────────────────────────────────────────── */
  window.addEventListener('load', () => {
    const words = qsa('.split-word');
    words.forEach((word, i) => {
      setTimeout(() => {
        word.classList.add('is-revealed');
      }, 200 + i * 180);
    });

    const heroSub = qs('.hero-sub p');
    if (heroSub) {
      setTimeout(() => heroSub.classList.add('is-revealed'), 750);
    }
  });

  /* ──────────────────────────────────────────────────────────
     SCROLL REVEAL (IntersectionObserver)
  ────────────────────────────────────────────────────────── */
  const revealMap = [
    // selector → threshold
    { sel: '.js-reveal',      threshold: 0.12 },
    { sel: '.js-reveal-fade', threshold: 0.15 },
    { sel: '.js-reveal-up',   threshold: 0.12 },
    { sel: '.work-header',    threshold: 0.15 },
    { sel: '.clients-label',  threshold: 0.15 },
    { sel: '.services-heading-wrap', threshold: 0.1 },
    { sel: '.contact-heading',threshold: 0.1  },
    { sel: '.contact-actions',threshold: 0.1  },
  ];

  revealMap.forEach(({ sel, threshold }) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold, rootMargin: '0px 0px -40px 0px' });

    qsa(sel).forEach(el => observer.observe(el));
  });

  /* ──────────────────────────────────────────────────────────
     WORK ITEMS & SERVICE ITEMS (staggered reveal)
  ────────────────────────────────────────────────────────── */
  const staggerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        staggerObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

  qsa('.work-item, .service-item').forEach(el => staggerObserver.observe(el));

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
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

})();
