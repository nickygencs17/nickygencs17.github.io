# nickygencs17.github.io

Personal website for Nicholas Genco — Software Engineer III @ Oracle, Senior Frontend Engineer.

Live site: GitHub Pages (user site). This repository contains a static site: `index.html`, `css/style.css`, and `scripts/navBar.js` with supporting assets in `images/` and `favicons/`.

## Overview

- Accessible, semantic HTML with proper landmarks (header, nav, main, footer)
- Keyboard/screen reader friendly:
  - Accessible mobile nav toggle with `aria-controls`/`aria-expanded`
  - Focus-in behavior ensures the fixed nav is visible for keyboard users
- Clean, minimal CSS focused only on used classes
- Lean JS for navigation behavior (no globals, passive scroll, `requestAnimationFrame`)
- Favicon set updated and normalized (`manifest.json`, `browserconfig.xml`, mask icon, ICO)
- Dynamic tenure calculation for experience dates (automatically updates “Present (X years Y months)”)

## Project structure

- `index.html` — main page content (hero, summary, experience, education)
- `css/style.css` — tokens + layout, nav, hero, sections, footer; no legacy/unused styles
- `scripts/navBar.js` — nav toggle, scroll-based visibility, a11y helpers
- `scripts/tenure.js` — computes and injects dynamic tenure text for roles
- `images/` — logo, background, social icon SVGs
- `favicons/` — favicon set (ico, pngs, safari pinned tab, manifest, browserconfig)

## Local usage

- Open the site locally:
  - macOS: `open index.html`
  - Or double-click `index.html` in Finder
- No build step required.

## Accessibility

- Landmarks: `header`/`nav`/`main`/`footer`
- Headings: logical hierarchy with `aria-labelledby` for sections
- Keyboard:
  - Burger menu is keyboard-activatable (Enter/Space) and updates `aria-expanded`
  - Escape closes mobile nav
  - Focusing any nav item makes the fixed nav visible
- External links use `rel="noopener noreferrer"` where applicable
- Decorative icon images have empty `alt` and accessible link labels

## Favicon/PWA

- `favicons/manifest.json`: valid JSON with theme/background `#000000`
- `favicons/browserconfig.xml`: relative paths adjusted and color normalized
- `index.html` includes:
  - `apple-touch-icon`
  - multiple PNG sizes
  - shortcut icon (ico)
  - `mask-icon` for Safari
  - `msapplication-config`

## Dynamic Tenure (scripts/tenure.js)

This script auto-calculates and injects “X years Y months” for roles, so you don’t have to manually update “Present” durations.

- File: `scripts/tenure.js` (loaded with `defer`)
- How it works:
  - Finds any `.meta` element with a `data-start` attribute
  - Optionally reads `data-end` for past roles
  - Calculates full calendar month differences and formats as “X years Y months”
  - Injects the value into a child `[data-tenure]` span

### Usage

- Present role (inclusive of the current month):
  ```html
  <p class="meta" data-start="2022-08-01">
    August 2022 – Present (<span data-tenure></span>)
  </p>
  ```
  - The script treats “Present” as inclusive of the ongoing month (e.g., August → November = 4 months).

- Past role (exact full months only):
  ```html
  <p class="meta" data-start="2020-06-01" data-end="2022-08-01">
    June 2020 – August 2022 (<span data-tenure></span>)
  </p>
  ```

### Notes

- `data-start` and `data-end` should be ISO-like dates (`YYYY-MM-DD`). Day-of-month is used to avoid overcounting partial months.
- If JavaScript is disabled, the parentheses will be empty. You may place a static fallback inside the `<span data-tenure>` which the script will overwrite when enabled.
- The script is idempotent and has no global variables; it runs on `DOMContentLoaded`.
