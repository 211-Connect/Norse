/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Or if using `src` directory:
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#005191',
        secondary: '#FFB351',
      },
      backgroundImage: {
        'hero-image-mobile': 'url("/images/hero-mobile.jpg")',
        'hero-image-tablet': 'url("/images/hero-tablet.jpg")',
        'hero-image-desktop': 'url("/images/hero-desktop.jpg")',
      },
    },
  },
  plugins: [],
};
