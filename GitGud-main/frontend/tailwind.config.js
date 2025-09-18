// tailwind.config.js
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './index.html'
    // Add any other content paths you need
  ],
  theme: {
    extend: {
      // Your theme extensions
      fontFamily: {
        Boldonse: ['Boldonse', 'monospace'],
      },
    },
  },
  plugins: [
    // Any plugins you're using
  ],
};