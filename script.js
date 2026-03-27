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
    const y        = window.scrollY;
    const scrollUp = y < lastScrollY;
    const pastHero = y > window.innerHeight * 0.4;

    if (header) {
      if (y < 80) {
        // Back near the top — restore normal transparent header
        header.classList.remove('is-hidden', 'is-floating', 'is-scrolled');
      } else if (scrollUp && pastHero) {
        // Scrolling UP past hero — show the floating pill
        header.classList.remove('is-hidden');
        header.classList.add('is-floating');
      } else if (!scrollUp) {
        // Scrolling DOWN — hide and drop floating pill
        header.classList.add('is-hidden');
        header.classList.remove('is-floating');
      }
      // Standard glass bg (used when floating is NOT active)
      if (!header.classList.contains('is-floating')) {
        header.classList.toggle('is-scrolled', y > window.innerHeight * 0.75);
      }
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
     TESTIMONIALS CAROUSEL — flex-track approach
     Desktop: slide 48vw, gap 2vw, step 50vw, offset 26vw
             → 24vw of adjacent slide visible ≈ 50% peek
     Mobile:  slide 82vw, gap 2vw, step 84vw, offset 9vw
  ────────────────────────────────────────────────────────── */
  const testimonialsSection = qs('#testimonialsSection');

  if (testimonialsSection) {
    const track   = qs('.testimonials-track',  testimonialsSection);
    const slides  = qsa('.testimonial-slide',  testimonialsSection);
    const dots    = qsa('.t-dot',              testimonialsSection);
    const tCursor = qs('#testimonialsCursor');
    let current   = 0;
    const total   = slides.length;

    function cfg() {
      const mobile = window.innerWidth < 768;
      const SLIDE  = mobile ? 82 : 48;
      const GAP    = 2;
      return { SLIDE, GAP, STEP: SLIDE + GAP, OFFSET: (100 - SLIDE) / 2 };
    }

    function positionTrack(animate) {
      const { STEP, OFFSET } = cfg();
      if (!animate) track.style.transition = 'none';
      track.style.transform = `translateX(${OFFSET - current * STEP}vw)`;
      if (!animate) requestAnimationFrame(() => { track.style.transition = ''; });
    }

    function goTo(idx) {
      current = Math.max(0, Math.min(total - 1, idx));
      positionTrack(true);
      slides.forEach((s, i) => s.classList.toggle('is-active', i === current));
      dots.forEach((d, i)   => d.classList.toggle('is-active', i === current));
    }

    // Set initial position without animation
    positionTrack(false);
    slides[0].classList.add('is-active');

    // Reposition on resize without animation
    window.addEventListener('resize', () => positionTrack(false));

    // Dot clicks
    dots.forEach(dot => {
      dot.addEventListener('click', () => goTo(parseInt(dot.dataset.index, 10)));
    });

    // Mouse tracking — show NEXT/PREV bubble following cursor
    testimonialsSection.addEventListener('mousemove', (e) => {
      if (!tCursor) return;
      tCursor.style.left = e.clientX + 'px';
      tCursor.style.top  = e.clientY + 'px';
      const rect = testimonialsSection.getBoundingClientRect();
      const inRightHalf = (e.clientX - rect.left) > rect.width * 0.5;
      // Only show on edges (not in the centre 30%)
      const pct = (e.clientX - rect.left) / rect.width;
      const showCursor = pct > 0.6 || pct < 0.4;
      tCursor.textContent  = inRightHalf ? 'NEXT' : 'PREV';
      tCursor.classList.toggle('is-visible', showCursor);
    });

    testimonialsSection.addEventListener('mouseleave', () => {
      tCursor && tCursor.classList.remove('is-visible');
    });

    // Click edges to navigate; ignore dots
    testimonialsSection.addEventListener('click', (e) => {
      if (e.target.classList.contains('t-dot')) return;
      const rect = testimonialsSection.getBoundingClientRect();
      if ((e.clientX - rect.left) > rect.width * 0.5) goTo(current + 1);
      else goTo(current - 1);
    });
  }

  /* ──────────────────────────────────────────────────────────
     WORK PAGE — FILTER
  ────────────────────────────────────────────────────────── */
  const filterBtns  = qsa('.work-filter');
  const workItems   = qsa('.work-page-item');
  const filterCount = qs('#filterCount');

  if (filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        const filter = btn.dataset.filter;
        let visible = 0;

        workItems.forEach(item => {
          const cats = (item.dataset.category || '').split(' ');
          const show = filter === 'all' || cats.includes(filter);
          item.classList.toggle('is-hidden', !show);
          if (show) {
            visible++;
            // re-trigger entrance animation
            item.classList.remove('is-revealed');
            requestAnimationFrame(() =>
              requestAnimationFrame(() => item.classList.add('is-revealed'))
            );
          }
        });

        if (filterCount) {
          filterCount.textContent = visible + ' project' + (visible === 1 ? '' : 's');
        }
      });
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

  /* ──────────────────────────────────────────────────────────
     GALLERY LIGHTBOX
     Works on any page that has .gallery-img elements.
  ────────────────────────────────────────────────────────── */
  const lbOverlay = qs('#lbOverlay');
  if (lbOverlay) {
    const lbImg     = qs('#lbImg');
    const lbCounter = qs('#lbCounter');
    const lbClose   = qs('#lbClose');
    const lbPrev    = qs('#lbPrev');
    const lbNext    = qs('#lbNext');

    let images  = [];
    let current = 0;

    function collectImages() {
      images = Array.from(qsa('.gallery-img'));
    }

    function showImage(idx) {
      if (!images.length) return;
      current = ((idx % images.length) + images.length) % images.length;
      const el  = images[current];
      const src = el.dataset.full || el.src;
      lbImg.classList.add('lb-loading');
      const tmp = new Image();
      tmp.onload = () => {
        lbImg.src = src;
        lbImg.alt = el.alt;
        lbImg.classList.remove('lb-loading');
      };
      tmp.src = src;
      lbCounter.textContent = (current + 1) + ' / ' + images.length;
    }

    function openLightbox(idx) {
      collectImages();
      showImage(idx);
      lbOverlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lbOverlay.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    // Open on image click
    document.addEventListener('click', (e) => {
      const img = e.target.closest('.gallery-img');
      if (!img) return;
      collectImages();
      openLightbox(images.indexOf(img));
    });

    lbClose.addEventListener('click', closeLightbox);
    lbPrev.addEventListener('click',  () => showImage(current - 1));
    lbNext.addEventListener('click',  () => showImage(current + 1));

    // Click backdrop to close
    lbOverlay.addEventListener('click', (e) => {
      if (e.target === lbOverlay) closeLightbox();
    });

    // Keyboard — arrows to navigate, Escape to close
    document.addEventListener('keydown', (e) => {
      if (!lbOverlay.classList.contains('is-open')) return;
      if (e.key === 'ArrowLeft')  showImage(current - 1);
      if (e.key === 'ArrowRight') showImage(current + 1);
      if (e.key === 'Escape')     closeLightbox();
    });
  }

})();
