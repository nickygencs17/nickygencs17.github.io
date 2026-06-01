import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const readProjectFile = (path) => {
  try {
    return readFileSync(new URL(path, import.meta.url), 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return '';
    throw error;
  }
};

const index = readProjectFile('../index.html');
const styles = readProjectFile('../css/style.css');
const themeScript = readProjectFile('../scripts/theme.js');
const navBarScript = readProjectFile('../scripts/navBar.js');
const resumeSource = readProjectFile('../data/NicholasGenco.resume.html');

const createElement = () => {
  const listeners = new Map();
  const attributes = new Map();

  return {
    textContent: '',
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    click() {
      listeners.get('click')?.({ preventDefault() {} });
    },
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    }
  };
};

const runThemeScript = (storedTheme) => {
  const label = createElement();
  const icon = createElement();
  const toggle = {
    ...createElement(),
    querySelector(selector) {
      if (selector === '[data-theme-label]') return label;
      if (selector === '[data-theme-icon]') return icon;
      return null;
    }
  };
  const meta = createElement();
  const root = { dataset: { theme: 'dark' }, style: {} };
  const storage = new Map(storedTheme ? [['nickygencs17-theme', storedTheme]] : []);

  const context = {
    document: {
      documentElement: root,
      getElementById(id) {
        return id === 'themeToggle' ? toggle : null;
      },
      querySelector(selector) {
        return selector === 'meta[name="theme-color"]' ? meta : null;
      }
    },
    localStorage: {
      getItem(key) {
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        storage.set(key, value);
      }
    }
  };

  vm.runInNewContext(themeScript, context);
  return { root, toggle, label, icon, meta, storage };
};

const createNavElement = ({ href, text = '', top = 0, height = 0, scrollMarginTop = '0px' } = {}) => {
  const listeners = new Map();
  const attributes = new Map();
  const classes = new Set();

  if (href) attributes.set('href', href);

  return {
    id: '',
    textContent: text,
    className: '',
    style: {},
    classList: {
      add(name) {
        classes.add(name);
      },
      remove(name) {
        classes.delete(name);
      },
      contains(name) {
        return classes.has(name);
      },
      toggle(name, force) {
        const shouldAdd = force ?? !classes.has(name);
        if (shouldAdd) classes.add(name);
        else classes.delete(name);
        return shouldAdd;
      }
    },
    addEventListener(type, handler) {
      const handlers = listeners.get(type) ?? [];
      handlers.push(handler);
      listeners.set(type, handlers);
    },
    click() {
      for (const handler of listeners.get('click') ?? []) {
        handler({ preventDefault() {} });
      }
    },
    focus() {},
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    getBoundingClientRect() {
      return { top, height };
    },
    querySelectorAll() {
      return [];
    },
    __listeners: listeners,
    __style: { scrollMarginTop }
  };
};

const runNavBarAtSummaryAnchor = () => {
  const homeLink = createNavElement({ href: '#home', text: 'Home' });
  const summaryLink = createNavElement({ href: '#summary', text: 'Summary' });
  const navLinks = [homeLink, summaryLink];
  const homeSection = createNavElement({ top: -648 });
  const summarySection = createNavElement({ top: 72, scrollMarginTop: '72px' });
  homeSection.id = 'home';
  summarySection.id = 'summary';

  const nav = createNavElement({ height: 59 });
  nav.querySelectorAll = (selector) => (selector === '#primaryNav a' ? navLinks : []);
  const menuToggle = createNavElement();
  const windowListeners = new Map();

  const context = {
    document: {
      documentElement: { scrollHeight: 3000 },
      getElementById(id) {
        if (id === 'myTopnav') return nav;
        if (id === 'menuToggle') return menuToggle;
        return null;
      },
      querySelectorAll(selector) {
        if (selector === '#primaryNav a[href^="#"]') return navLinks;
        if (selector === 'main section[id]') return [homeSection, summarySection];
        return [];
      },
      addEventListener() {}
    },
    window: {
      innerHeight: 720,
      scrollY: 648,
      requestAnimationFrame(callback) {
        callback();
      },
      addEventListener(type, handler) {
        const handlers = windowListeners.get(type) ?? [];
        handlers.push(handler);
        windowListeners.set(type, handlers);
      },
      getComputedStyle(element) {
        return element.__style ?? {};
      }
    }
  };
  context.getComputedStyle = context.window.getComputedStyle;

  vm.runInNewContext(navBarScript, context);
  summaryLink.click();

  for (const handler of windowListeners.get('scroll') ?? []) {
    handler();
  }

  return { homeLink, summaryLink };
};

test('navigation controls use accessible buttons and default to dark theme', () => {
  assert.match(index, /<html lang="en" data-theme="dark">/);
  assert.match(index, /<button\s+type="button"\s+class="menu-toggle icon"\s+id="menuToggle"[\s\S]*aria-expanded="false"[\s\S]*aria-controls="primaryNav"/);
  assert.doesNotMatch(index, /<a\b[^>]*\bid="menuToggle"/);
  assert.match(index, /<button\s+type="button"\s+class="theme-toggle"\s+id="themeToggle"[\s\S]*role="switch"[\s\S]*aria-checked="false"/);
  assert.match(index, /<script src="scripts\/theme\.js" defer><\/script>/);
});

test('styles define both dark and light theme tokens', () => {
  assert.match(styles, /:root\s*{[\s\S]*--bg:/);
  assert.match(styles, /\[data-theme="light"\]\s*{[\s\S]*--bg:/);
  assert.match(styles, /color-scheme:\s*dark/);
  assert.match(styles, /color-scheme:\s*light/);
});

test('hero title exposes one readable name without duplicate text nodes', () => {
  const titleMatch = index.match(/<h1\b[^>]*id="hero-title"[\s\S]*?<\/h1>/);

  assert.ok(titleMatch, 'Expected hero title markup');
  assert.match(index, /<span id="hero-title-label" hidden>Nicholas Genco<\/span>/);
  assert.match(titleMatch[0], /\baria-labelledby="hero-title-label"/);
  assert.doesNotMatch(titleMatch[0], /\baria-label=/);
  assert.doesNotMatch(titleMatch[0], /<span class="sr-only">Nicholas Genco<\/span>/);
  assert.match(titleMatch[0], /<span aria-hidden="true">N<\/span>/);
  assert.doesNotMatch(titleMatch[0], /<span>N<\/span>/);
  assert.match(styles, /#hero-title span\[aria-hidden="true"\]\s*{/);
  assert.doesNotMatch(styles, /#hero-title\s+span\s*{/);
  assert.match(styles, /#hero-title > span:nth-child\(14\)\s*{/);
  assert.doesNotMatch(styles, /#hero-title > span:nth-child\(15\)\s*{/);
});

test('hero background advertises optimized image-set sources', () => {
  assert.match(styles, /image-set\(/);
  assert.match(styles, /background-640\.avif/);
  assert.match(styles, /background-640\.webp/);
  assert.match(styles, /background-640\.jpg/);
  assert.match(styles, /background-1024\.avif/);
  assert.match(styles, /background-1024\.webp/);
  assert.match(styles, /background-1024\.jpg/);
  assert.match(styles, /background-1600\.avif/);
  assert.match(styles, /background-1600\.webp/);
});

test('site copy prioritizes senior frontend platform work with consulting secondary', () => {
  assert.match(index, /Senior Frontend Platform Engineer/);
  assert.match(index, /I modernize complex product interfaces into accessible, reusable frontend platforms\./);
  assert.match(index, /Frontend Platform Architecture/);
  assert.match(index, /Selective Custom Software Consulting/);
  assert.doesNotMatch(index, /Open to building custom websites, software, and applications for businesses and individuals\./);
});

test('resume source mirrors the hybrid positioning used on the site', () => {
  assert.match(resumeSource, /Senior Frontend Platform Engineer/);
  assert.match(resumeSource, /Enterprise UI modernization/);
  assert.match(resumeSource, /Preact\/React, TypeScript, Web Components/);
  assert.match(resumeSource, /Selective consulting/);
});

test('theme script defaults to dark mode and exposes state to assistive technology', () => {
  const { root, toggle, label, icon, meta, storage } = runThemeScript();

  assert.equal(root.dataset.theme, 'dark');
  assert.equal(root.style.colorScheme, 'dark');
  assert.equal(toggle.getAttribute('aria-checked'), 'false');
  assert.equal(label.textContent, 'Dark');
  assert.equal(icon.textContent, '☾');
  assert.equal(meta.getAttribute('content'), '#05070a');
  assert.equal(storage.get('nickygencs17-theme'), undefined);
});

test('theme script toggles to light mode and persists the preference', () => {
  const { root, toggle, label, icon, meta, storage } = runThemeScript();

  toggle.click();

  assert.equal(root.dataset.theme, 'light');
  assert.equal(root.style.colorScheme, 'light');
  assert.equal(toggle.getAttribute('aria-checked'), 'true');
  assert.equal(label.textContent, 'Light');
  assert.equal(icon.textContent, '☀');
  assert.equal(meta.getAttribute('content'), '#f8fafc');
  assert.equal(storage.get('nickygencs17-theme'), 'light');
});

test('theme script ignores invalid stored themes', () => {
  const { root, toggle } = runThemeScript('blue');

  assert.equal(root.dataset.theme, 'dark');
  assert.equal(toggle.getAttribute('aria-checked'), 'false');
});

test('scroll spy keeps summary active after anchor jump with scroll margin', () => {
  const { homeLink, summaryLink } = runNavBarAtSummaryAnchor();

  assert.equal(summaryLink.getAttribute('aria-current'), 'true');
  assert.equal(homeLink.getAttribute('aria-current'), null);
});
