/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');
const colors = require('tailwindcss/colors');
const defaultTheme = require('tailwindcss/defaultTheme');

/**
 * Tailwind configuration
 */
const config = {
    darkMode: ['selector', '.dark'],
    content: ['./src/**/*.{html,scss,ts}'],
    important: true, // Required to override Material's default styles
    theme: {
        fontSize: {
            xs: '0.625rem',
            sm: '0.75rem',
            md: '0.8125rem',
            base: '0.875rem',
            lg: '1rem',
            xl: '1.125rem',
            '2xl': '1.25rem',
            '3xl': '1.5rem',
            '4xl': '2rem',
            '5xl': '2.25rem',
            '6xl': '2.5rem',
            '7xl': '3rem',
            '8xl': '4rem',
            '9xl': '6rem',
            '10xl': '8rem',
        },
        screens: {
            sm: '600px',
            md: '960px',
            lg: '1280px',
            xl: '1440px',
        },
        extend: {
            animation: {
                'spin-slow': 'spin 3s linear infinite',
            },
            colors: {
                gray: colors.slate,
                // Noctua brand colors for direct use
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
            flex: {
                0: '0 0 auto',
            },
            fontFamily: {
                sans: `Roboto, "Helvetica Neue", ${defaultTheme.fontFamily.sans.join(',')}`,
                mono: `"IBM Plex Mono", ${defaultTheme.fontFamily.mono.join(',')}`,
            },
            opacity: {
                12: '0.12',
                38: '0.38',
                87: '0.87',
            },
            rotate: {
                '-270': '270deg',
                15: '15deg',
                30: '30deg',
                60: '60deg',
                270: '270deg',
            },
            scale: {
                '-1': '-1',
            },
            zIndex: {
                '-1': -1,
                49: 49,
                60: 60,
                70: 70,
                80: 80,
                90: 90,
                99: 99,
                999: 999,
                9999: 9999,
                99999: 99999,
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
                // Bigger values
                100: '25rem',
                120: '30rem',
                128: '32rem',
                140: '35rem',
                160: '40rem',
                180: '45rem',
                192: '48rem',
                200: '50rem',
                240: '60rem',
                256: '64rem',
                280: '70rem',
                320: '80rem',
                360: '90rem',
                400: '100rem',
                480: '120rem',
                // Fractional values
                '1/2': '50%',
                '1/3': '33.333333%',
                '2/3': '66.666667%',
                '1/4': '25%',
                '2/4': '50%',
                '3/4': '75%',
            },
            minHeight: ({ theme }) => ({
                ...theme('spacing'),
            }),
            maxHeight: {
                none: 'none',
            },
            minWidth: ({ theme }) => ({
                ...theme('spacing'),
                screen: '100vw',
            }),
            maxWidth: ({ theme }) => ({
                ...theme('spacing'),
                screen: '100vw',
            }),
            transitionDuration: {
                400: '400ms',
            },
            transitionTimingFunction: {
                drawer: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
            },
        },
    },
    corePlugins: {
        appearance: false,
        container: false,
        float: false,
        clear: false,
        placeholderColor: false,
        placeholderOpacity: false,
        verticalAlign: false,
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
        plugin(function({ addUtilities }) {
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

module.exports = config;
