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
const resumePage = readProjectFile('../resume.html');
const llmsText = readProjectFile('../llms.txt');
const resumeJsonText = readProjectFile('../data/resume.json');
const sitemap = readProjectFile('../sitemap.xml');
const packageJson = readProjectFile('../package.json');
const ciWorkflow = readProjectFile('../.github/workflows/ci.yml');
const pagesWorkflow = readProjectFile('../.github/workflows/pages.yml');

const readProjectBuffer = (path) => readFileSync(new URL(path, import.meta.url));

const readPngSize = (path) => {
  const image = readProjectBuffer(path);
  return {
    width: image.readUInt32BE(16),
    height: image.readUInt32BE(20)
  };
};

const extractJsonLd = (html) => {
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)];
  return scripts.map(([, json]) => JSON.parse(json));
};

const createElement = () => {
  const listeners = new Map();
  const attributes = new Map();
  const styles = new Map();
  const classes = new Set();

  return {
    textContent: '',
    style: {
      setProperty(name, value) {
        styles.set(name, value);
      },
      removeProperty(name) {
        styles.delete(name);
      }
    },
    classList: {
      add(name) {
        classes.add(name);
      },
      remove(...names) {
        names.forEach((name) => classes.delete(name));
      },
      contains(name) {
        return classes.has(name);
      }
    },
    get offsetWidth() {
      return 1;
    },
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
  const hero = createElement();
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
        if (selector === '.hero') return hero;
        return selector === 'meta[name="theme-color"]' ? meta : null;
      }
    },
    window: {
      clearTimeout() {},
      getComputedStyle() {
        return {
          backgroundImage: 'url("images/background.jpg")',
          backgroundPosition: 'center',
          backgroundSize: 'cover'
        };
      },
      matchMedia() {
        return { matches: false };
      },
      requestAnimationFrame(callback) {
        callback();
      },
      setTimeout(callback) {
        callback();
        return 1;
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
  context.getComputedStyle = context.window.getComputedStyle;

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

test('hero background advertises optimized dark and light image-set sources', () => {
  assert.match(styles, /image-set\(/);
  assert.match(styles, /background-640\.avif/);
  assert.match(styles, /background-640\.webp/);
  assert.match(styles, /background-640\.jpg/);
  assert.match(styles, /background-1024\.avif/);
  assert.match(styles, /background-1024\.webp/);
  assert.match(styles, /background-1024\.jpg/);
  assert.match(styles, /background-1600\.avif/);
  assert.match(styles, /background-1600\.webp/);
  assert.match(styles, /nyc-day-640\.avif/);
  assert.match(styles, /nyc-day-640\.webp/);
  assert.match(styles, /nyc-day-1024\.jpg/);
  assert.match(styles, /nyc-day-1600\.avif/);
  assert.match(styles, /nyc-day-1600\.webp/);
});

test('small mobile hero keeps the background image covering the viewport', () => {
  const smallMobileHeroMatch = styles.match(/@media \(max-width: 480px\) \{[\s\S]*?\.hero \{([\s\S]*?)\n  \}/);

  assert.ok(smallMobileHeroMatch, 'Expected small mobile hero styles');
  assert.match(smallMobileHeroMatch[1], /background-size:\s*var\(--hero-bg-size\);/);
  assert.match(smallMobileHeroMatch[1], /background-position:\s*var\(--hero-bg-position\);/);
  assert.doesNotMatch(smallMobileHeroMatch[1], /background-size:\s*contain;/);
});

test('site copy prioritizes senior platform software work with consulting secondary', () => {
  assert.match(index, /Senior Platform Software Engineer/);
  assert.match(index, /I build scalable, high-performance applications\./);
  assert.match(index, /Scalable UI Architecture/);
  assert.match(index, /Selective Custom Software Consulting/);
  assert.doesNotMatch(index, /Open to building custom websites, software, and applications for businesses and individuals\./);
});

test('homepage uses ProfilePage structured data and avoids FAQPage markup', () => {
  const jsonLd = extractJsonLd(index);
  const graphNodes = jsonLd.flatMap((entry) => entry['@graph'] ?? [entry]);
  const profilePage = graphNodes.find((entry) => entry['@type'] === 'ProfilePage');
  const person = graphNodes.find((entry) => entry['@id'] === 'https://www.nicholasgenco.com/#person');
  const service = graphNodes.find((entry) => entry['@id'] === 'https://www.nicholasgenco.com/#consulting');

  assert.ok(profilePage, 'Expected ProfilePage JSON-LD');
  assert.equal(profilePage.mainEntity['@id'], 'https://www.nicholasgenco.com/#person');
  assert.equal(profilePage.url, 'https://www.nicholasgenco.com/');
  assert.equal(profilePage.dateModified, '2026-06-18T11:30:00-04:00');
  assert.match(profilePage.dateModified, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/);
  assert.deepEqual(profilePage.hasPart.map((part) => part.name), [
    'Oracle Enterprise UI Modernization',
    'Reusable Enterprise Component Library',
    'Accessible High-Performance Data Interfaces'
  ]);
  assert.equal(person.name, 'Nicholas Genco');
  assert.equal(person.jobTitle, 'Senior Platform Software Engineer');
  assert.equal(person.email, 'mailto:nickygencs@gmail.com');
  assert.equal(person.telephone, '+1-845-729-9778');
  assert.match(person.description, /enterprise UI modernization/i);
  assert.deepEqual(person.subjectOf.map((entry) => entry['@id']), [
    'https://www.nicholasgenco.com/resume.html',
    'https://www.nicholasgenco.com/data/NicholasGenco2026.pdf',
    'https://www.nicholasgenco.com/data/resume.json'
  ]);
  assert.deepEqual(person.knowsLanguage.map((entry) => entry.name), ['English', 'Spanish']);
  assert.deepEqual(person.alumniOf.map((entry) => entry.name), ['Stony Brook University', 'SUNY Westchester']);
  assert.equal(person.hasOccupation.name, 'Senior Platform Software Engineer');
  assert.ok(graphNodes.find((entry) => entry['@id'] === 'https://www.nicholasgenco.com/data/resume.json'));
  assert.deepEqual(person.sameAs, [
    'https://www.linkedin.com/in/nicholas-genco-6a8588a0/',
    'https://github.com/nickygencs17'
  ]);
  assert.equal(service.provider['@id'], 'https://www.nicholasgenco.com/#person');
  assert.equal(graphNodes.some((entry) => entry['@type'] === 'FAQPage'), false);
});

test('homepage includes selected work case studies for richer search context', () => {
  assert.match(index, /<li><a href="#selected-work">Work<\/a><\/li>/);
  assert.match(index, /<section id="selected-work" class="section band" aria-labelledby="selected-work-heading">/);
  assert.match(index, /id="oracle-ui-modernization"/);
  assert.match(index, /Oracle Enterprise UI Modernization/);
  assert.match(index, /Reusable Enterprise Component Library/);
  assert.match(index, /Accessible High-Performance Data Interfaces/);
  assert.match(index, /legacy Knockout\/JET interfaces/);
});

test('homepage advertises an indexable resume page and large social preview image', () => {
  assert.match(index, /<meta property="og:image" content="https:\/\/www\.nicholasgenco\.com\/images\/nicholas-genco-social-preview\.png">/);
  assert.match(index, /<meta property="og:image:width" content="1200">/);
  assert.match(index, /<meta property="og:image:height" content="630">/);
  assert.match(index, /<meta name="twitter:image" content="https:\/\/www\.nicholasgenco\.com\/images\/nicholas-genco-social-preview\.png">/);
  assert.match(index, /<a href="resume\.html">Resume<\/a>/);

  assert.deepEqual(readPngSize('../images/nicholas-genco-social-preview.png'), {
    width: 1200,
    height: 630
  });
});

test('resume html page is crawlable and links to the PDF resume', () => {
  assert.match(resumePage, /<!DOCTYPE html>/);
  assert.match(resumePage, /<title>Nicholas Genco Resume — Senior Platform Software Engineer<\/title>/);
  assert.match(resumePage, /<meta name="description" content="HTML resume for Nicholas Genco/);
  assert.match(resumePage, /<link rel="canonical" href="https:\/\/www\.nicholasgenco\.com\/resume\.html">/);
  assert.match(resumePage, /<main id="main">/);
  assert.match(resumePage, /Senior Platform Software Engineer/);
  assert.match(resumePage, /Enterprise UI modernization/);
  assert.match(resumePage, /Senior Platform Software Engineer \| Oracle/);
  assert.match(resumePage, /<a href="data\/NicholasGenco2026\.pdf"[^>]*download[^>]*>Download PDF<\/a>/);
  assert.match(resumePage, /<a href="index\.html#summary">Portfolio<\/a>/);
});

test('sitemap includes lastmod dates for the homepage, resume page, and PDF', () => {
  assert.match(sitemap, /<loc>https:\/\/www\.nicholasgenco\.com\/<\/loc>\s*<lastmod>2026-06-18<\/lastmod>/);
  assert.match(sitemap, /<loc>https:\/\/www\.nicholasgenco\.com\/resume\.html<\/loc>\s*<lastmod>2026-06-18<\/lastmod>/);
  assert.match(sitemap, /<loc>https:\/\/www\.nicholasgenco\.com\/data\/NicholasGenco2026\.pdf<\/loc>\s*<lastmod>2026-06-18<\/lastmod>/);
  assert.match(sitemap, /<loc>https:\/\/www\.nicholasgenco\.com\/llms\.txt<\/loc>\s*<lastmod>2026-06-18<\/lastmod>/);
  assert.match(sitemap, /<loc>https:\/\/www\.nicholasgenco\.com\/data\/resume\.json<\/loc>\s*<lastmod>2026-06-18<\/lastmod>/);
});

test('html lint validates every crawlable HTML page', () => {
  const parsedPackage = JSON.parse(packageJson);

  assert.equal(parsedPackage.scripts['lint:html'], 'html-validate index.html resume.html data/NicholasGenco.resume.html');
  assert.equal(parsedPackage.scripts['lint:links'], 'node scripts/lint-links.mjs');
  assert.match(ciWorkflow, /run:\s*npm ci --omit=optional --ignore-scripts/);
  assert.match(ciWorkflow, /run:\s*npm run lint/);
  assert.match(pagesWorkflow, /run:\s*npm ci --omit=optional --ignore-scripts/);
  assert.match(pagesWorkflow, /uses:\s*actions\/checkout@v5/);
  assert.match(pagesWorkflow, /uses:\s*actions\/upload-pages-artifact@v5/);
  assert.match(pagesWorkflow, /uses:\s*actions\/deploy-pages@v5/);
  assert.doesNotMatch(pagesWorkflow, /actions\/(?:checkout|upload-artifact|deploy-pages)@v4/);
});

test('resume source mirrors the hybrid positioning used on the site', () => {
  assert.match(resumeSource, /Senior Platform Software Engineer/);
  assert.match(resumeSource, /Enterprise UI modernization/);
  assert.match(resumeSource, /React\/Preact/);
  assert.match(resumeSource, /June 2026 - Present/);
});

test('llms.txt exposes a concise AI-readable site map', () => {
  assert.match(llmsText, /^# Nicholas Genco/m);
  assert.match(llmsText, /Senior Platform Software Engineer at Oracle/);
  assert.match(llmsText, /https:\/\/www\.nicholasgenco\.com\/resume\.html/);
  assert.match(llmsText, /https:\/\/www\.nicholasgenco\.com\/data\/resume\.json/);
  assert.match(llmsText, /https:\/\/www\.nicholasgenco\.com\/data\/NicholasGenco2026\.pdf/);
  assert.match(llmsText, /TypeScript, JavaScript, Preact, Knockout, Node\.js, HTML\/CSS, Oracle JET/);
});

test('resume.json exposes structured resume data for AI agents', () => {
  const resume = JSON.parse(resumeJsonText);

  assert.equal(resume.name, 'Nicholas Genco');
  assert.equal(resume.title, 'Senior Platform Software Engineer');
  assert.equal(resume.location, 'Rocky Point, New York');
  assert.equal(resume.links.resumePdf, 'https://www.nicholasgenco.com/data/NicholasGenco2026.pdf');
  assert.equal(resume.links.resumeHtml, 'https://www.nicholasgenco.com/resume.html');
  assert.ok(resume.skills.includes('Scalable UI Architecture'));
  assert.ok(resume.skills.includes('Oracle JET'));
  assert.deepEqual(resume.languages, [
    { name: 'English', proficiency: 'Native or Bilingual' },
    { name: 'Spanish', proficiency: 'Full Professional' }
  ]);
  assert.deepEqual(resume.experience[0], {
    company: 'Oracle',
    title: 'Senior Platform Software Engineer',
    location: 'Remote',
    startDate: '2026-06',
    endDate: 'Present',
    bullets: [
      'Built and stabilized accessible JET components across TreeView, TreeTable, DataGrid, and related collection patterns.',
      'Improved keyboard, drag-and-drop, virtualization, and progressive loading behavior for complex enterprise UI components.',
      'Expanded automated test coverage across Karma Mocha, QUnit, Playwright-style browser tests, and cross-browser workflows.',
      'Partnered with design, accessibility, QA, and component owners to refine reusable UI patterns and ship reliable fixes across release branches.'
    ],
    technologies: ['TypeScript', 'JavaScript', 'Preact', 'Knockout', 'Node.js', 'HTML/CSS', 'Oracle JET']
  });
  assert.equal(resume.education[0].institution, 'Stony Brook University');
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
