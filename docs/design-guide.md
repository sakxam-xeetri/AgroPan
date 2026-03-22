# AgroPan — Design Guide

_Single source of truth for visual consistency across all pages._

---

## 1. Color Palette

| Token                   | Value     | Usage                         |
| ----------------------- | --------- | ----------------------------- |
| `--color-primary`       | `#2E7D65` | Buttons, links, accents       |
| `--color-primary-light` | `#3a9e80` | Hover states                  |
| `--color-primary-dark`  | `#225e4c` | Active / pressed states       |
| `--color-secondary`     | `#8B5E3C` | Earth tones, secondary badges |
| `--color-accent`        | `#2F8F9D` | Data / insight highlights     |
| `--color-alert`         | `#F2A900` | Warnings, risk amber          |
| `--color-bg`            | `#F7F7F4` | Page background (fog white)   |
| `--color-bg-card`       | `#FFFFFF` | Card / panel surfaces         |
| `--color-bg-dark`       | `#1E1E1E` | Footer, dark sections         |
| `--color-text`          | `#2B2B2B` | Primary text (charcoal)       |
| `--color-text-muted`    | `#6B6B6B` | Secondary text                |
| `--color-text-light`    | `#999999` | Tertiary text, timestamps     |
| `--color-border`        | `#E0DDD6` | Subtle dividers               |
| `--color-border-light`  | `#EDECE8` | Lighter dividers              |

---

## 2. Typography

| Role     | Family                           | Weight    |
| -------- | -------------------------------- | --------- |
| Headings | `Poppins`, `Inter`, sans-serif   | 600 / 700 |
| Body     | `Inter`, `Noto Sans`, sans-serif | 400 / 500 |
| Data     | `Inter`, monospace               | 400       |

**Type scale (rem):**
`xs: 0.75` · `sm: 0.875` · `base: 1` · `md: 1.125` · `lg: 1.25` · `xl: 1.5` · `2xl: 2` · `3xl: 2.5` · `4xl: 3.25`

---

## 3. Spacing (8px grid)

`xs: 4px` · `sm: 8px` · `md: 16px` · `lg: 24px` · `xl: 32px` · `2xl: 48px` · `3xl: 64px` · `4xl: 96px`

---

## 4. Border Radii

| Token           | Value   | Usage               |
| --------------- | ------- | ------------------- |
| `--radius-sm`   | `8px`   | Inputs, small cards |
| `--radius-md`   | `12px`  | Cards, panels       |
| `--radius-lg`   | `16px`  | Large cards         |
| `--radius-xl`   | `24px`  | Hero elements       |
| `--radius-pill` | `999px` | Buttons, tags       |

---

## 5. Shadows

| Token         | Value                          |
| ------------- | ------------------------------ |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.06)`   |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.08)`  |
| `--shadow-lg` | `0 8px 30px rgba(0,0,0,0.10)`  |
| `--shadow-xl` | `0 16px 48px rgba(0,0,0,0.12)` |

---

## 6. Buttons

All buttons use `--radius-pill` (fully rounded).

| Class           | Style                                  |
| --------------- | -------------------------------------- |
| `.btn`          | Base — flex center, semibold, sm text  |
| `.btn--primary` | Green bg, white text, green box-shadow |
| `.btn--ghost`   | Transparent, green border, green text  |
| `.btn--lg`      | Larger padding + base font size        |
| `.btn--sm`      | Smaller padding + xs font size         |

Hover: `translateY(-1px)`, lighter shade, stronger shadow.

---

## 7. Component Patterns

### Cards

- Background: `--color-bg-card` (#FFF)
- Border: `1px solid --color-border` or `--color-border-light`
- Radius: `--radius-md` (12px)
- Shadow: `--shadow-sm` at rest → `--shadow-md` on hover
- Padding: `--space-lg` (24px)

### Inputs (Auth pages)

- Background: `--color-bg` (#F7F7F4) — sits inside white card
- Border: `1.5px solid --color-border`
- Radius: `--radius-sm` (8px)
- Padding: `14px 16px 14px 48px` (room for left icon)
- Focus: `border-color: --color-primary`, subtle green glow
- Font: `--font-body`, `--text-base`

### Section tags

- Pill-shaped, uppercase, xs font, letter-spacing 0.12em
- Green text on 8% green background

---

## 8. Transitions

| Token               | Value                        |
| ------------------- | ---------------------------- |
| `--ease-out`        | `cubic-bezier(0.16,1,0.3,1)` |
| `--duration-fast`   | `150ms`                      |
| `--duration-normal` | `300ms`                      |
| `--duration-slow`   | `500ms`                      |

---

## 9. Layout

- Max content width: `1200px` (`--content-max`)
- Narrow content: `800px` (`--content-narrow`)
- Inline padding: `--space-lg` (24px)

### Breakpoints

| Name | Min-width | Key changes                            |
| ---- | --------- | -------------------------------------- |
| sm   | `640px`   | 2-col grids                            |
| md   | `768px`   | Desktop nav appears, hero side-by-side |
| lg   | `1024px`  | 3/4-col grids, larger headings         |

---

## 10. Auth Page Guidelines

- **Layout**: Split-screen on desktop (image left, form right). Full-width stacked on mobile.
- **Form card**: White bg, `--shadow-lg`, `--radius-lg`, generous padding.
- **Inputs**: Icon on left (Font Awesome), label above, placeholder in muted text.
- **Primary action**: Full-width `.btn--primary.btn--lg`.
- **Secondary link**: Centered below form, muted text with green link.
- **Background image**: Uses `gallery/` images, covered + darkened overlay.
- **Mobile**: Background image hidden, form fills screen with soft bg.

---

## 11. Icons

Font Awesome Pro v7.1.0 via CDN.

- Style: `fa-solid` for UI icons, `fa-brands` for social.
- Size: Use FA sizing classes or match with `font-size` variables.
- Color: Inherit from parent or use `--color-primary` for accent icons.

---

_Last updated: February 2026_
