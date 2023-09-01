/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Or if using `src` directory:
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './plugins/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/norse-plugin-*/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          100: '#C7EEF9',
          200: '#92D9F4',
          300: '#58B1DE',
          400: '#2F86BD',
          500: '#005191',
          600: '#003E7C',
          700: '#002E68',
          800: '#002154',
          900: '#001745',
        },
        secondary: {
          100: '#FFF5DC',
          200: '#FFE9B9',
          300: '#FFDA96',
          400: '#FFCB7C',
          500: '#FFB351',
          600: '#DB8E3B',
          700: '#B76C28',
          800: '#934E19',
          900: '#7A380F',
        },
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
