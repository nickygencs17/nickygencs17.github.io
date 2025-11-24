# nickygencs17.github.io

Personal website for Nicholas Genco — Software Engineer III @ Oracle, Senior Frontend Engineer.

Live site: GitHub Pages (user site). This repository contains a static site: index.html, css/style.css, and scripts/navBar.js with supporting assets in images/ and favicons/.

## Overview

- Accessible, semantic HTML with proper landmarks (header, nav, main, footer)
- Keyboard/screen reader friendly:
  - Skip link
  - Accessible mobile nav toggle with aria-controls/aria-expanded
  - Focus-in behavior ensures the fixed nav is visible for keyboard users
- Clean, minimal CSS focused only on used classes
- Lean JS for navigation behavior (no globals, passive scroll, requestAnimationFrame)
- Favicon set updated and normalized (manifest.json, browserconfig.xml, mask icon, ICO)

## Project structure

- index.html — main page content (hero, summary, experience, education)
- css/style.css — tokens + layout, nav, hero, sections, footer; no legacy/unused styles
- scripts/navBar.js — nav toggle, scroll-based visibility, a11y helpers
- images/ — logo, background, social icon SVGs
- favicons/ — favicon set (ico, pngs, safari pinned tab, manifest, browserconfig)

## Local usage

- Open the site locally:
  - macOS: open index.html
  - Or double-click index.html in Finder
- No build step required.

## Accessibility

- Landmarks: header/nav/main/footer
- Headings: logical hierarchy with aria-labelledby for sections
- Keyboard:
  - Skip to main link
  - Burger menu is keyboard-activatable (Enter/Space) and updates aria-expanded
  - Escape closes mobile nav
  - Focusing any nav item makes the fixed nav visible
- External links use rel="noopener noreferrer" where applicable
- Decorative icon images have empty alt and accessible link labels

## Favicon/PWA

- favicons/manifest.json: valid JSON with theme/background #000000
- favicons/browserconfig.xml: relative paths adjusted and color normalized
- index.html includes:
  - apple-touch-icon
  - multiple PNG sizes
  - shortcut icon (ico)
  - mask-icon for Safari
  - msapplication config

## Maintenance

- .gitignore includes macOS, logs, build caches, node_modules, and editor files
- If system files were committed previously, untrack them:
  git rm -r --cached .DS_Store "**/.DS_Store" "Thumbs.db" "Desktop.ini"
  git commit -m "chore: remove tracked system files now ignored"

## Potential future improvements (optional)

- Image optimization (compress background.jpg, provide responsive sources)
- Add a sitemap.xml and robots.txt
- Add a simple CI check (link validation, HTML a11y lint)
