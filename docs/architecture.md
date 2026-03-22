# AgroPan — Architecture Document

## System Overview

AgroPan is a **full-stack smart agriculture platform** focused on Nepal. It combines IoT-based field monitoring with a digital marketplace, community forum, and emergency alert system — connecting farmers, merchants, and administrators on a single platform.

> "AgroPan is not just a website — it's an agriculture ecosystem: monitor, trade, discuss, and stay safe."

---

## Architecture Principles

| Principle                | Rationale                                                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Progressive web**      | The landing page runs client-side with zero dependencies, while backend features (marketplace, forum, alerts) connect to a server API. |
| **Role-based**           | Two primary user types — **Farmer** and **Merchant** — each with distinct capabilities and a shared community space.                   |
| **Mobile-first**         | 65%+ of Nepal's internet users access via mobile. Every layout and interaction is designed for small screens first, then enhanced.     |
| **IoT-integrated**       | ESP32-S3 field devices send real sensor data to a web API, bridging physical agriculture with digital tools.                           |
| **Nepal-contextualized** | Crop names, districts, market prices, and alert types are calibrated to Nepal's agriculture reality.                                   |

---

## Platform Features

### 1. IoT Field Device

ESP32-S3 hardware nodes deployed in fields send sensor data (soil moisture, temperature, humidity, air quality) to the platform's web API every 30 seconds. Farmers can monitor conditions remotely.

### 2. Marketplace

Farmers analyze real-time crop prices, list produce for sale, and connect directly with merchants. Merchants browse listings, compare prices across districts, and contact farmers. Both roles have dedicated account types.

### 3. Community Forum

A discussion space for registered farmers and merchants. Topic categories include crop diseases, market trends, weather advisories, equipment tips, success stories, and seasonal guides.

### 4. Emergency Alerts

Administrators broadcast urgent alerts covering disease outbreaks, pest invasions, natural disasters (landslides, floods), and severe weather. Alerts are delivered via the platform, SMS, and email.

---

## Folder Structure

```
agropan/
├── index.html              ← Landing page (single-page, static)
├── css/
│   ├── variables.css       ← Design tokens (colors, spacing, fonts)
│   └── index.css           ← Unified stylesheet (reset → components → responsive)
├── js/
│   ├── animations.js       ← Intersection Observer scroll reveals
│   └── main.js             ← App controller (nav, scroll, counters)
├── gallery/                ← Real Nepali agriculture photographs
├── docs/
│   └── architecture.md     ← This document
└── README.md               ← Project overview & quick start
```

---

## Module Dependency Graph

```
index.html
  ├── css/variables.css    (design tokens)
  ├── css/index.css        (unified styles, depends on variables)
  │
  ├── js/animations.js     (standalone — Intersection Observer)
  └── js/main.js           (standalone — nav, scroll, counters)
```

### Loading Order

Scripts load at the bottom of `<body>`:

1. `animations.js` — Registers scroll observers immediately
2. `main.js` — Wires DOM events (navbar, smooth scroll, counter animation)

---

## CSS Architecture

### Unified Stylesheet (`index.css`)

All styles are consolidated into a single file organized by layer:

1. **Reset & Base** — element-level resets, global defaults
2. **Layout** — containers, sections, navbar, grid utilities
3. **Components** — buttons, hero, feature cards, marketplace, community, alerts, gallery, process, CTA, footer
4. **Animations** — scroll reveal and stagger transitions
5. **Responsive** — consolidated media queries (640px → 768px → 1024px)

### Token-Driven Design

All visual properties flow from `variables.css`. A single change to `--color-primary` updates every component in the system.

### Responsive Strategy

- **Mobile-first**: Base styles target `320px+`
- **Small tablet** (`640px`): 2-column grids for features, marketplace, community, alerts
- **Tablet** (`768px`): Desktop nav, hero side-by-side layout, footer row layout
- **Desktop** (`1024px`): Full 3-4 column grids, expanded spacing

---

## Landing Page Sections

| Section          | Purpose                                               | Key Classes                                                        |
| ---------------- | ----------------------------------------------------- | ------------------------------------------------------------------ |
| **Navbar**       | Fixed navigation with mobile hamburger menu           | `.navbar`, `.navbar__links`, `.navbar__mobile-menu`                |
| **Hero**         | Full-viewport intro with preview card and stats strip | `.hero`, `.hero__layout`, `.hero__preview-card`, `.hero__stats`    |
| **Features**     | 4-card grid: IoT, Marketplace, Forum, Alerts          | `.features__grid`, `.feature-card`, `.feature-card__icon--{color}` |
| **IoT Device**   | Smart field device with specs banner                  | `.platform__banner`, `.platform__grid`, `.platform__specs`         |
| **Marketplace**  | Farmer/Merchant role split with feature lists         | `.marketplace__layout`, `.marketplace__role`, `.marketplace__list` |
| **Community**    | 6-topic discussion forum cards                        | `.community__grid`, `.community__card`                             |
| **Alerts**       | Admin-driven emergency alert cards (4 types)          | `.alerts__grid`, `.alert__card--{severity}`, `.alerts__channels`   |
| **How It Works** | 4-step process cards                                  | `.process__grid`, `.process__card`                                 |
| **Gallery**      | Photo grid with hover overlays                        | `.gallery__grid`, `.gallery__card`                                 |
| **CTA**          | Dual farmer/merchant call-to-action                   | `.cta-section`, `.cta-section__actions`                            |
| **Footer**       | Brand, links, copyright                               | `.footer`, `.footer__inner`                                        |

---

## Animation Strategy

| Animation          | Trigger                   | Method                              |
| ------------------ | ------------------------- | ----------------------------------- |
| Scroll reveal      | Element enters viewport   | Intersection Observer               |
| Staggered reveal   | Container enters viewport | CSS `transition-delay` per child    |
| Counter animation  | Page load                 | `requestAnimationFrame`             |
| Hero zoom          | Continuous                | CSS `@keyframes` infinite alternate |
| Preview card float | Continuous                | CSS `@keyframes` infinite           |

All animations respect `prefers-reduced-motion: reduce`.

---

## Accessibility

- Semantic HTML5 elements throughout
- ARIA labels on navigation and interactive elements
- Keyboard-navigable focus states (`:focus-visible`)
- Color contrast ratios meet WCAG AA
- Screen-reader-only utility class (`.sr-only`)
- Reduced motion media query support

---

## Future Architecture (Production Path)

| Phase    | Enhancement                                                                 |
| -------- | --------------------------------------------------------------------------- |
| **v1.1** | Backend API for marketplace listings, user registration, and authentication |
| **v1.2** | Community forum with real-time thread creation and replies                  |
| **v2.0** | Admin dashboard for emergency alert broadcasting (SMS + email integration)  |
| **v2.1** | Multi-language support (English + Nepali) with `i18n` module                |
| **v3.0** | IoT data dashboard with historical charts and alert thresholds              |
| **v3.1** | Mobile app (PWA) with offline support and push notifications                |

---

_Document version: 2.0 · Last updated: February 2026_
