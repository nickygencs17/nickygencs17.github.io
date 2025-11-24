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
})();
