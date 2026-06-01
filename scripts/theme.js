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
  const label = toggle?.querySelector('[data-theme-label]');
  const icon = toggle?.querySelector('[data-theme-icon]');
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

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
      toggle.setAttribute('aria-checked', String(nextTheme === 'light'));
    }

    if (label) {
      label.textContent = nextTheme === 'light' ? 'Light' : 'Dark';
    }

    if (icon) {
      icon.textContent = ICON[nextTheme];
    }
  };

  applyTheme(getStoredTheme() || 'dark');

  if (toggle) {
    toggle.addEventListener('click', () => {
      const currentTheme = root.dataset.theme === 'light' ? 'light' : 'dark';
      const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(nextTheme);
      persistTheme(nextTheme);
    });
  }
})();
