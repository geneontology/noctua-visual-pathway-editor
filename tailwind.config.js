/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: [
    "./src/**/*.{html,scss,ts}",
  ],
  important: true, // Required to override Material's default styles
  theme: {
    screens: {
      sm: '600px',
      md: '960px',
      lg: '1280px',
      xl: '1440px',
    },
    extend: {
      colors: {
        'noc-primary': '#3b5998',
        'noc-primary-accent': '#8b9dc3',
        'noc-primary-lighter': '#dfe3ee',
        'noc-secondary': '#995014',
        'noc-toolbar': '#e7ecf4',
        'noc-highlight': '#fffcd8',
        'noc-highlight-model': '#e1f5fe',
        'noc-mf': '#7cd488',
        'noc-bp': '#f4c89c',
        'noc-cc': '#d3b5f5',
      },
      spacing: {
        13: '3.25rem',
        15: '3.75rem',
        18: '4.5rem',
        22: '5.5rem',
        26: '6.5rem',
        30: '7.5rem',
        50: '12.5rem',
        90: '22.5rem',
        100: '25rem',
        120: '30rem',
      },
      zIndex: {
        60: '60',
        70: '70',
        80: '80',
        90: '90',
        99: '99',
        999: '999',
        9999: '9999',
      },
    },
  },
  corePlugins: {
    container: false,
  },
  plugins: [
    // Deep width/height utilities: sets width/height + min + max together
    // Usage: deep-w-10, deep-w-[350px], deep-h-10, deep-h-[40px]
    plugin(function({ matchUtilities, theme }) {
      matchUtilities(
        {
          'deep-w': (value) => ({
            width: value,
            minWidth: value,
            maxWidth: value,
          }),
          'deep-h': (value) => ({
            height: value,
            minHeight: value,
            maxHeight: value,
          }),
        },
        { values: theme('spacing') }
      );
    }),
    // Aspect border utilities for MF/BP/CC indicators
    // Usage: aspect-border-mf, aspect-border-bp, aspect-border-cc
    plugin(function({ addUtilities, theme }) {
      addUtilities({
        '.aspect-border-mf': {
          'border-left-width': '5px',
          'border-left-style': 'solid',
          'border-left-color': `rgba(124, 212, 136, 0.8)`, // noc-mf with opacity
        },
        '.aspect-border-bp': {
          'border-left-width': '5px',
          'border-left-style': 'solid',
          'border-left-color': `rgba(244, 200, 156, 0.8)`, // noc-bp with opacity
        },
        '.aspect-border-cc': {
          'border-left-width': '5px',
          'border-left-style': 'solid',
          'border-left-color': `rgba(211, 181, 245, 0.8)`, // noc-cc with opacity
        },
        '.aspect-border-none': {
          'border-left-width': '5px',
          'border-left-style': 'solid',
          'border-left-color': '#fff',
        },
      });
    }),
  ],
};
