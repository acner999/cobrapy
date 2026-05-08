/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/v1',
    NEXT_PUBLIC_SHOW_DEV_HINTS: process.env.NEXT_PUBLIC_SHOW_DEV_HINTS ?? (process.env.NODE_ENV === 'development' ? 'true' : 'false'),
  },
  tailwind: {
    config: {
      theme: {
        extend: {
          colors: {
            primary: '#0a7d3a',
            surface: '#f8faf9',
            'dark-surface': '#0c0e0d',
          },
        },
      },
    },
  },
};
export default nextConfig;