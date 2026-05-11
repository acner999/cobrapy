import type { Config } from 'tailwindcss';

/**
 * Sistema de diseño Stripe-inspired (ver design.md raíz).
 * Mantenemos los nombres de tokens originales (semánticos) pero re-mapeados a la
 * paleta Stripe. Esto evita re-escribir páginas; cada componente sigue usando
 * `bg-surface-container-lowest`, `text-primary`, etc. y obtiene el nuevo look.
 */

// === Paleta Stripe ===
const STRIPE_PURPLE = '#533AFD';
const PURPLE_HOVER = '#4329E8';
const PURPLE_ACTIVE = '#3720D4';
const LAVENDER_TINT = '#E8E9FF';
const LAVENDER_FILL = '#F3F0FF';

const DEEP_NAVY = '#061B31';
const NAVY_SLATE = '#1A2C44';
const DARK_BLUE = '#0D1738';
const SLATE_BLUE = '#273951';
const INTERACTIVE_SLATE = '#50617A';
const LIGHT_SLATE = '#64748D';

const ORANGE = '#FF6118';
const ORANGE_LIGHT = '#FFE5DA';
const ORANGE_DARK = '#B33D00';

const PURE_BLACK = '#000000';
const PURE_WHITE = '#FFFFFF';
const SURFACE_BG = '#FFFFFF';
const SURFACE_SOFT = '#FBFBFD';
const LIGHT_BG = '#E5EDF5';
const BORDER_LIGHT = '#D4DEE9';
const BORDER_HOVER = '#B8CCDB';

const ERROR = '#BA1A1A';
const ERROR_BG = '#FFDAD6';
const ERROR_DARK = '#93000A';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // === Surfaces (fondos) ===
        surface: SURFACE_BG,                             // body / hero
        'surface-dim': LIGHT_BG,                         // sub-fondos
        'surface-bright': PURE_WHITE,                    // top-bar, áreas brillantes
        'surface-container-lowest': PURE_WHITE,          // cards
        'surface-container-low': SURFACE_SOFT,           // hover sutil de tablas
        'surface-container': LIGHT_BG,                   // chips/inputs deemphasized
        'surface-container-high': BORDER_LIGHT,          // hover/active deemphasized
        'surface-container-highest': BORDER_HOVER,       // edge cases
        'surface-variant': LIGHT_BG,
        background: SURFACE_BG,
        'on-background': DEEP_NAVY,

        // Texto sobre surfaces
        'on-surface': DEEP_NAVY,                         // títulos, body principal
        'on-surface-variant': LIGHT_SLATE,               // metadata, secundarios
        outline: INTERACTIVE_SLATE,                      // bordes activos / iconos
        'outline-variant': BORDER_LIGHT,                 // bordes suaves

        // Inverso (footers, sidebar admin, code blocks)
        'inverse-surface': DEEP_NAVY,
        'inverse-on-surface': PURE_WHITE,
        'inverse-primary': STRIPE_PURPLE,

        // === Primary (Stripe Purple) ===
        primary: STRIPE_PURPLE,
        'on-primary': PURE_WHITE,
        'primary-container': PURPLE_HOVER,               // hover de botones primary
        'on-primary-container': PURE_WHITE,
        'surface-tint': STRIPE_PURPLE,
        'primary-fixed': LAVENDER_FILL,                  // chips de éxito light
        'primary-fixed-dim': LAVENDER_TINT,              // bg para code blocks light
        'on-primary-fixed': DEEP_NAVY,
        'on-primary-fixed-variant': PURPLE_ACTIVE,

        // === Secondary (Stripe usa Orange como accent) ===
        secondary: ORANGE,
        'on-secondary': PURE_WHITE,
        'secondary-container': ORANGE_LIGHT,
        'on-secondary-container': ORANGE_DARK,
        'secondary-fixed': ORANGE_LIGHT,
        'secondary-fixed-dim': '#FFC4A8',
        'on-secondary-fixed': '#3D1100',
        'on-secondary-fixed-variant': ORANGE_DARK,

        // === Tertiary (alias de Orange para llamados especiales / pending) ===
        tertiary: ORANGE,
        'on-tertiary': PURE_WHITE,
        'tertiary-container': ORANGE_LIGHT,
        'on-tertiary-container': ORANGE_DARK,
        'tertiary-fixed': ORANGE_LIGHT,
        'tertiary-fixed-dim': '#FFC4A8',
        'on-tertiary-fixed': '#3D1100',
        'on-tertiary-fixed-variant': ORANGE_DARK,

        // === Error ===
        error: ERROR,
        'on-error': PURE_WHITE,
        'error-container': ERROR_BG,
        'on-error-container': ERROR_DARK,

        // === Atajos directos (cuando un componente quiere los nombres Stripe) ===
        'stripe-purple': STRIPE_PURPLE,
        'stripe-orange': ORANGE,
        'stripe-navy': DEEP_NAVY,
        'stripe-slate': INTERACTIVE_SLATE,
      },
      borderRadius: {
        // Stripe usa 4px en buttons/inputs, 5px en cards. El default Tailwind era 4px;
        // afinamos `lg` y `xl` para alinear con la spec.
        DEFAULT: '4px',
        sm: '2px',
        md: '5px',
        lg: '5px',         // cards
        xl: '8px',         // contenedores grandes
        '2xl': '12px',     // hero panels
        full: '9999px',
      },
      spacing: {
        unit: '4px', xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px',
        margin: '24px', gutter: '20px',
      },
      fontFamily: {
        h1: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        h2: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        h3: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        'body-base': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        'body-sm': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        'data-mono': ['"SF Mono"', '"JetBrains Mono"', 'Monaco', '"Cascadia Code"', 'monospace'],
        'api-snippet': ['"SF Mono"', '"JetBrains Mono"', 'Monaco', 'monospace'],
      },
      fontSize: {
        // Stripe: weight 300 (light) en headings, 400 en body. Tracking neutro.
        h1: ['48px', { lineHeight: '55.2px', letterSpacing: '0', fontWeight: '300' }],
        h2: ['32px', { lineHeight: '35.2px', letterSpacing: '0', fontWeight: '300' }],
        h3: ['26px', { lineHeight: '29.12px', letterSpacing: '0', fontWeight: '300' }],
        'body-base': ['14px', { lineHeight: '21px', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '16.8px', fontWeight: '400' }],
        'data-mono': ['13px', { lineHeight: '18.2px', fontWeight: '400' }],
        'api-snippet': ['13px', { lineHeight: '18.2px', fontWeight: '400' }],
      },
      boxShadow: {
        // Stripe es plano. Sombra muy sutil.
        card: '0px 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0px 4px 12px rgba(0, 0, 0, 0.08)',
        elevated: '0px 8px 24px rgba(6, 27, 49, 0.08)',
      },
    },
  },
  plugins: [],
};
export default config;
