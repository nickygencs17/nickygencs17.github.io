/* Navigation behavior cleanup: accessibility, performance, no globals */
'use strict';

(() => {
  const nav = document.getElementById('myTopnav');
  const menuToggle = document.getElementById('menuToggle');
  if (!nav) return;

  const closeMobileNav = () => {
    nav.classList.remove('responsive');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
  };

  // Toggle mobile menu
  if (menuToggle) {
    menuToggle.addEventListener('click', (e) => {
      e.preventDefault();
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      const next = !expanded;
      menuToggle.setAttribute('aria-expanded', String(next));
      nav.classList.toggle('responsive', next);
    });

    // Keyboard support for toggle
    menuToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        menuToggle.click();
      }
    });
  }

  // Close mobile nav when any nav link is clicked
  const navLinks = nav.querySelectorAll('a:not(.icon)');
  navLinks.forEach((a) => {
    a.addEventListener('click', () => {
      closeMobileNav();
    });
  });

  // Show/hide nav on scroll with rAF to reduce layout thrashing
  let navVisible = false;

  const applyVisibility = (visible) => {
    if (visible) {
      nav.style.visibility = 'visible';
      nav.style.opacity = '1';
    } else {
      nav.style.visibility = 'hidden';
      nav.style.opacity = '0';
    }
    nav.style.transition = 'visibility 0.5s, opacity 0.5s linear';
  };

  const updateNavVisibility = () => {
    const threshold = Math.max(window.innerHeight - 200, 0);
    const shouldShow = window.pageYOffset >= threshold;
    if (shouldShow !== navVisible) {
      navVisible = shouldShow;
      applyVisibility(navVisible);
    }
  };

  // Initialize state on load
  updateNavVisibility();

  // Accessibility: if nav or its children receive focus (keyboard nav), ensure nav is visible
  nav.addEventListener('focusin', () => {
    navVisible = true;
    applyVisibility(true);
  });

  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateNavVisibility();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'resize',
    () => {
      updateNavVisibility();
    },
    { passive: true }
  );

  // Close menu with Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobileNav();
  });

  // Scroll spy: highlight nav link for visible section
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
      link.setAttribute('aria-current', 'true');
    }
  };

  const observedSections = Array.from(document.querySelectorAll('main section[id]'))
    .filter(sec => linkById.has(sec.id));

  if (observedSections.length) {
    // Use a central band so the active link switches when the section reaches the middle of the viewport
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      });
    }, {
      root: null,
      rootMargin: '-50% 0px -50% 0px',
      threshold: 0
    });

    observedSections.forEach(sec => io.observe(sec));

    // Set initial active based on current scroll position on load
    const onLoadSet = () => {
      const current = observedSections.find(sec => {
        const r = sec.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const center = vh / 2;
        return r.top <= center && r.bottom >= center;
      });
      setActive((current && current.id) || (linkById.has('home') ? 'home' : observedSections[0].id));
    };
    window.requestAnimationFrame(onLoadSet);

    // Immediate visual feedback when clicking a nav link
    sectionLinks.forEach(a => {
      a.addEventListener('click', () => {
        const id = a.getAttribute('href')?.replace('#', '') || '';
        if (id) setActive(id);
      });
    });

    // Ensure last section activates when reaching page bottom (IO may not fire if the last section can't reach the viewport center)
    const activateLastIfAtBottom = () => {
      const doc = document.documentElement;
      const atBottom = Math.ceil(window.innerHeight + window.scrollY) >= Math.floor(doc.scrollHeight - 1);
      if (atBottom) {
        const last = observedSections[observedSections.length - 1];
        if (last) setActive(last.id);
      }
    };

    // Throttle with rAF similar to other scroll work
    let tickingSpyBottom = false;
    window.addEventListener(
      'scroll',
      () => {
        if (!tickingSpyBottom) {
          window.requestAnimationFrame(() => {
            activateLastIfAtBottom();
            tickingSpyBottom = false;
          });
          tickingSpyBottom = true;
        }
      },
      { passive: true }
    );

    // Re-evaluate on resize and once on load as well
    window.addEventListener('resize', activateLastIfAtBottom, { passive: true });
    window.requestAnimationFrame(activateLastIfAtBottom);
  }
})();
