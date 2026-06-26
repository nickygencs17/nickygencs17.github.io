/* Navigation behavior cleanup: accessibility, performance, no globals */
'use strict';

(() => {
  const nav = document.getElementById('myTopnav');
  const menuToggle = document.getElementById('menuToggle');
  if (!nav) return;

  const closeMobileNav = (restoreFocus = false) => {
    nav.classList.remove('responsive');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus && menuToggle) menuToggle.focus();
  };

  // Toggle mobile menu
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      const next = !expanded;
      menuToggle.setAttribute('aria-expanded', String(next));
      nav.classList.toggle('responsive', next);
    });
  }

  // Close mobile nav when any nav link is clicked
  const navLinks = nav.querySelectorAll('#primaryNav a');
  navLinks.forEach((a) => {
    a.addEventListener('click', () => {
      closeMobileNav();
    });
  });

  // Close menu with Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('responsive')) {
      closeMobileNav(true);
    }
  });

  // Scroll spy: robust top-edge detection with fixed nav offset
  const sectionLinks = Array.from(document.querySelectorAll('#primaryNav a[href^="#"]'));
  const linkById = new Map(
    sectionLinks
      .map(a => {
        try {
          const id = decodeURIComponent(a.getAttribute('href') || '').replace(/^#/, '');
          return id ? [id, a] : null;
        } catch {
          return null;
        }
      })
      .filter(Boolean)
  );

  const setActive = (id) => {
    sectionLinks.forEach(a => {
      a.classList.remove('active');
      a.removeAttribute('aria-current');
    });
    const link = linkById.get(id);
    if (link) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'location');
    }
  };

  const sections = Array.from(document.querySelectorAll('main section[id]'))
    .filter(sec => linkById.has(sec.id));

  if (sections.length) {
    const getScrollMarginTop = (element) => {
      const value = window.getComputedStyle(element).scrollMarginTop;
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const computeActiveId = () => {
      const doc = document.documentElement;
      // At absolute bottom: force last section active
      const atBottom = Math.ceil(window.innerHeight + window.scrollY) >= Math.floor(doc.scrollHeight - 1);
      if (atBottom) {
        return sections[sections.length - 1].id;
      }
      // Use top-edge with buffer for fixed nav height
      const navH = (nav && nav.getBoundingClientRect().height) || 56;
      let activeId = linkById.has('home') ? 'home' : sections[0].id;
      for (const sec of sections) {
        const buffer = Math.max(navH + 8, getScrollMarginTop(sec) + 1);
        const top = sec.getBoundingClientRect().top - buffer;
        if (top <= 0) activeId = sec.id;
      }
      return activeId;
    };

    const updateActive = () => {
      setActive(computeActiveId());
    };

    // Initial
    window.requestAnimationFrame(updateActive);

    // Immediate visual feedback when clicking a nav link
    sectionLinks.forEach(a => {
      a.addEventListener('click', () => {
        const id = a.getAttribute('href')?.replace('#', '') || '';
        if (id) setActive(id);
      });
    });

    // rAF-throttled scroll/resize handler
    let tickingSpy = false;
    const onScrollOrResize = () => {
      if (!tickingSpy) {
        window.requestAnimationFrame(() => {
          updateActive();
          tickingSpy = false;
        });
        tickingSpy = true;
      }
    };

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
  }
})();
