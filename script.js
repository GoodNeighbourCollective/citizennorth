/* ============================================================
   CITIZEN NORTH — Interactive Layer
   ============================================================ */

(() => {
  'use strict';

  const qs  = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ──────────────────────────────────────────────────────────
     CUSTOM CURSOR — only on project image hover
  ────────────────────────────────────────────────────────── */
  const cursor = qs('#cursor');

  if (cursor && window.matchMedia('(pointer: fine)').matches) {
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top  = e.clientY + 'px';
    }, { passive: true });

    qsa('.work-thumb, .work-page-thumb').forEach(el => {
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
    document.body.classList.add('nav-is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    navOpen = false;
    navToggle.classList.remove('nav-is-open');
    navOverlay.classList.remove('nav-is-open');
    logo && logo.classList.remove('nav-is-open');
    document.body.classList.remove('nav-is-open');
    document.body.style.overflow = '';
  }

  navToggle.addEventListener('click', () => navOpen ? closeNav() : openNav());
  qsa('[data-close-nav]').forEach(link => link.addEventListener('click', closeNav));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && navOpen) closeNav(); });

  /* ──────────────────────────────────────────────────────────
     HEADER AUTO-HIDE
  ────────────────────────────────────────────────────────── */
  let lastScrollY = 0, ticking = false;

  function handleScroll() {
    const y = window.scrollY;
    if (header) {
      // Hide on scroll down past 120px
      header.classList.toggle('is-hidden', y > lastScrollY && y > 120);
      // Add glass bg once scrolled past hero so text stays readable on white
      header.classList.toggle('is-scrolled', y > (window.innerHeight * 0.75));
    }
    lastScrollY = y;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(handleScroll); ticking = true; }
  }, { passive: true });

  /* ──────────────────────────────────────────────────────────
     HERO ENTRANCE
  ────────────────────────────────────────────────────────── */
  window.addEventListener('load', () => {
    qsa('.split-word').forEach((word, i) => {
      setTimeout(() => word.classList.add('is-revealed'), 200 + i * 180);
    });
    const heroSub = qs('.hero-sub p');
    if (heroSub) setTimeout(() => heroSub.classList.add('is-revealed'), 750);

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
    '.services-top',
    '.contact-heading',
    '.contact-actions',
    '.project-meta',
    '.work-page-item',
    '.service-row',
    '.work-item',
  ];

  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  revealSelectors.forEach(sel => qsa(sel).forEach(el => revealObs.observe(el)));

  /* ──────────────────────────────────────────────────────────
     SERVICES — sticky image switcher
     Hover a service row → matching image fades in
  ────────────────────────────────────────────────────────── */
  const serviceRows = qsa('.service-row');
  const svcImgs     = qsa('.svc-img');

  if (serviceRows.length && svcImgs.length) {
    function activateSvc(index) {
      svcImgs.forEach((img, i) => {
        img.classList.toggle('is-active', i === index);
      });
    }

    serviceRows.forEach((row) => {
      const idx = parseInt(row.dataset.svc, 10);
      row.addEventListener('mouseenter', () => activateSvc(idx));
    });

    // Reset to first image when mouse leaves the whole services section
    const servicesSection = qs('#services');
    if (servicesSection) {
      servicesSection.addEventListener('mouseleave', () => activateSvc(0));
    }
  }

  /* ──────────────────────────────────────────────────────────
     TESTIMONIALS CAROUSEL
  ────────────────────────────────────────────────────────── */
  const testimonialsSection = qs('#testimonialsSection');

  if (testimonialsSection && window.matchMedia('(pointer: fine)').matches) {
    const slides  = qsa('.testimonial-slide', testimonialsSection);
    const dots    = qsa('.t-dot', testimonialsSection);
    const tCursor = qs('#testimonialsCursor');
    let current   = 0;
    const total   = slides.length;

    function goTo(idx) {
      const next = ((idx % total) + total) % total;
      const prev = ((current - 1) + total) % total;
      current = next;

      slides.forEach((slide, i) => {
        slide.classList.remove('is-active', 'is-prev', 'is-next');
        if (i === current)                         slide.classList.add('is-active');
        else if (i === ((current - 1 + total) % total)) slide.classList.add('is-prev');
        else if (i === ((current + 1) % total))    slide.classList.add('is-next');
      });

      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === current));
    }

    // Dot clicks
    dots.forEach(dot => {
      dot.addEventListener('click', () => goTo(parseInt(dot.dataset.index, 10)));
    });

    // Mouse tracking — show NEXT bubble on right half, normal on left
    testimonialsSection.addEventListener('mousemove', (e) => {
      if (!tCursor) return;
      tCursor.style.left = e.clientX + 'px';
      tCursor.style.top  = e.clientY + 'px';
      const rect = testimonialsSection.getBoundingClientRect();
      const inRightHalf = (e.clientX - rect.left) > rect.width * 0.5;
      tCursor.classList.toggle('is-visible', inRightHalf);
    });

    testimonialsSection.addEventListener('mouseleave', () => {
      tCursor && tCursor.classList.remove('is-visible');
    });

    // Click right half → next, left half → prev
    testimonialsSection.addEventListener('click', (e) => {
      // Ignore dot clicks
      if (e.target.classList.contains('t-dot')) return;
      const rect = testimonialsSection.getBoundingClientRect();
      if ((e.clientX - rect.left) > rect.width * 0.5) goTo(current + 1);
      else goTo(current - 1);
    });
  }

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
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - 80,
        behavior: 'smooth'
      });
    });
  });

})();
