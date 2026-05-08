import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#0a7d3a', light: '#10b981' }, // verde guaraní
      },
    },
  },
  plugins: [],
};
export default config;
