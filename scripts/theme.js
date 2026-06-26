/* Theme toggle: default dark, persist explicit visitor choice */
'use strict';

(() => {
  const STORAGE_KEY = 'nickygencs17-theme';
  const THEMES = new Set(['dark', 'light']);
  const THEME_COLOR = {
    dark: '#05070a',
    light: '#f8fafc'
  };
  const ICON = {
    dark: '☾',
    light: '☀'
  };

  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  const hero = document.querySelector('.hero');
  const label = toggle?.querySelector('[data-theme-label]');
  const icon = toggle?.querySelector('[data-theme-icon]');
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let heroTransitionTimeout;

  const getStoredTheme = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return THEMES.has(stored) ? stored : null;
    } catch {
      return null;
    }
  };

  const persistTheme = (theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage can be unavailable in private or locked-down browser contexts.
    }
  };

  const applyTheme = (theme) => {
    const nextTheme = THEMES.has(theme) ? theme : 'dark';
    root.dataset.theme = nextTheme;
    root.style.colorScheme = nextTheme;

    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', THEME_COLOR[nextTheme]);
    }

    if (toggle) {
      toggle.setAttribute('aria-label', nextTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    }

    if (label) {
      label.textContent = nextTheme === 'light' ? 'Light' : 'Dark';
    }

    if (icon) {
      icon.textContent = ICON[nextTheme];
    }
  };

  const beginHeroImageTransition = () => {
    if (!hero || prefersReducedMotion.matches) {
      return () => {};
    }

    const heroStyles = window.getComputedStyle(hero);
    hero.style.setProperty('--hero-previous-bg', heroStyles.backgroundImage);
    hero.style.setProperty('--hero-previous-bg-position', heroStyles.backgroundPosition);
    hero.style.setProperty('--hero-previous-bg-size', heroStyles.backgroundSize);
    window.clearTimeout(heroTransitionTimeout);
    hero.classList.remove('is-theme-transitioning', 'is-theme-transitioning--fade');

    // Force the starting opacity to apply before the new theme image is revealed.
    void hero.offsetWidth;
    hero.classList.add('is-theme-transitioning');

    return () => {
      window.requestAnimationFrame(() => {
        hero.classList.add('is-theme-transitioning--fade');
      });

      heroTransitionTimeout = window.setTimeout(() => {
        hero.classList.remove('is-theme-transitioning', 'is-theme-transitioning--fade');
        hero.style.removeProperty('--hero-previous-bg');
        hero.style.removeProperty('--hero-previous-bg-position');
        hero.style.removeProperty('--hero-previous-bg-size');
      }, 700);
    };
  };

  applyTheme(getStoredTheme() || 'dark');

  if (toggle) {
    toggle.addEventListener('click', () => {
      const currentTheme = root.dataset.theme === 'light' ? 'light' : 'dark';
      const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
      const finishHeroImageTransition = beginHeroImageTransition();
      applyTheme(nextTheme);
      finishHeroImageTransition();
      persistTheme(nextTheme);
    });
  }
})();
