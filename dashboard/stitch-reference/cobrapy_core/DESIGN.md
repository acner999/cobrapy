---
name: CobraPy Core
colors:
  surface: '#f6fbf2'
  surface-dim: '#d6dcd3'
  surface-bright: '#f6fbf2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f5ec'
  surface-container: '#eaf0e6'
  surface-container-high: '#e4eae1'
  surface-container-highest: '#dfe4db'
  on-surface: '#171d17'
  on-surface-variant: '#3f4a3f'
  inverse-surface: '#2c322c'
  inverse-on-surface: '#edf2e9'
  outline: '#6f7a6e'
  outline-variant: '#becabc'
  surface-tint: '#006d31'
  primary: '#00622b'
  on-primary: '#ffffff'
  primary-container: '#0a7d3a'
  on-primary-container: '#bcffc3'
  inverse-primary: '#78db8c'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#943048'
  on-tertiary: '#ffffff'
  tertiary-container: '#b3485f'
  on-tertiary-container: '#ffeaec'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#94f8a6'
  primary-fixed-dim: '#78db8c'
  on-primary-fixed: '#00210a'
  on-primary-fixed-variant: '#005323'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffd9dd'
  tertiary-fixed-dim: '#ffb2bd'
  on-tertiary-fixed: '#400014'
  on-tertiary-fixed-variant: '#82223b'
  background: '#f6fbf2'
  on-background: '#171d17'
  surface-variant: '#dfe4db'
typography:
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
  api-snippet:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.7'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 20px
  margin: 24px
---

## Brand & Style

This design system is built to establish institutional authority and developer-centric efficiency within the Paraguayan fintech landscape. The visual identity balances the heritage of the "Verde Guaraní" with a modern, high-performance interface inspired by global infrastructure leaders.

The style is defined as **Corporate Modern**. It prioritizes information density and clarity over decorative elements. The aesthetic is "Data-First," ensuring that complex financial transactions, API integrations, and settlement reports are legible and actionable. The emotional response should be one of stability, precision, and local relevance.

## Colors

The color palette is anchored by **Verde Guaraní**, a deep emerald that communicates financial trust and national identity. This is supported by a vibrant secondary green used for interaction states and successful transaction markers.

The neutral scale utilizes the Zinc palette to maintain a cool, professional atmosphere. Backgrounds use a subtle off-white to reduce eye strain during prolonged technical use, while cards and primary containers remain pure white to create clear visual separation. Use the status colors strictly for semantic meaning: green for "Pagado," amber for "Pendiente," and red for "Fallido" or "Cancelado."

## Typography

This design system utilizes a dual-font strategy to differentiate between UI narrative and technical data. 

**Inter** is the primary typeface for all structural UI elements, navigation, and instructional text. It is chosen for its exceptional legibility in SaaS environments. 

**JetBrains Mono** is utilized for all "hard data" points. This includes transaction IDs, API keys, and specifically financial figures (e.g., **Gs. 500.000**). The monospaced nature ensures that columns of numbers align perfectly in data tables, facilitating faster audits and visual processing.

## Layout & Spacing

The layout philosophy follows a **Fixed-Fluid Hybrid** model. Dashboards utilize a 12-column fluid grid for the main content area with fixed gutters of 20px. 

Spacing is governed by an 8pt grid system to ensure mathematical harmony. Generous internal padding (24px+) is preferred for cards and containers to give data "room to breathe," reflecting the clean, minimalist inspiration of global financial tools. Horizontal lists and tables should prioritize wide margins to prevent visual clutter in data-heavy views.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layering** and subtle ambient shadows rather than dramatic depth. 

The base layer is the Zinc-50 background. The primary functional layer consists of white cards with a single-pixel border (#e4e4e7) and a very soft shadow (0 1px 3px rgba(0,0,0,0.08)). This creates a "flat-but-lifted" appearance. Modals and dropdown menus use a slightly more pronounced shadow to indicate temporary focus, but avoid high-contrast shadows or neon glows to maintain professional integrity.

## Shapes

The shape language is structured to feel approachable yet precise. A varied radius scale is applied depending on the component's scale:
- **Inputs & Fields:** 6px radius for a sharp, technical feel.
- **Buttons & Chips:** 8px radius for a comfortable touch target.
- **Cards & Containers:** 12px radius to soften the primary layout blocks and provide a modern "Stripe-like" finish.

Avoid fully circular (pill) shapes for primary buttons to keep the interface feeling structured and professional.

## Components

### Buttons
Primary buttons use the Verde Guaraní (#0a7d3a) background with white text. Hover states transition to the vibrant green (#10b981). Secondary buttons should use a white background with a Zinc-200 border and Zinc-900 text.

### Data Tables
Tables are the heart of the platform. Use `body-sm` for headers in all-caps with increased letter spacing. Row cells containing Guaraní amounts must use `data-mono` for alignment. Use a subtle hover state (#f4f4f5) on rows to assist with tracking.

### Badges & Status
Badges use a "soft" style: a light tinted background with high-contrast text. 
- **Paid (Pagado):** Light green background, dark green text.
- **Pending (Pendiente):** Light amber background, dark amber text.
- **Failed (Fallido):** Light red background, dark red text.

### Form Inputs
Labels use `body-sm` in Zinc-900 with medium weight. Input fields use a 6px radius, a 1px border (#e4e4e7), and a focus state consisting of a 1px Verde Guaraní border and a subtle green outer glow.

### API & Code Blocks
Code snippets and API keys must be housed in a Zinc-900 container with JetBrains Mono text. Use syntax highlighting that avoids neon colors, sticking to muted blues, greens, and greys.