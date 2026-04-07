/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Manrope', 'sans-serif'],
                display: ['Plus Jakarta Sans', 'Manrope', 'sans-serif'],
            },
            animation: {
                'slow-zoom': 'slow-zoom 20s infinite alternate',
                'progress-fast': 'progress 2s ease-in-out infinite',
                'scroll-text': 'scroll-text 30s linear infinite',
                'pulse-slow': 'pulse-slow 2s ease-in-out infinite',
                'flight-move': 'flight-move 3s ease-in-out infinite',
                'boarding-glow': 'boarding-glow 2s ease-in-out infinite',
            },
            keyframes: {
                'slow-zoom': {
                    '0%': { transform: 'scale(1)' },
                    '100%': { transform: 'scale(1.1)' },
                },
                'progress': {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
                'scroll-text': {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-33.3%)' },
                },
                'pulse-slow': {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(239,68,68,0.4)' },
                    '50%': { boxShadow: '0 0 20px 4px rgba(239,68,68,0.3)' },
                },
                'flight-move': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-2px)' },
                },
                'boarding-glow': {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(245,158,11,0.3)' },
                    '50%': { boxShadow: '0 0 15px 3px rgba(245,158,11,0.2)' },
                },
            },
            colors: {
                primary: {
                    DEFAULT: '#137fec',
                    50: '#f0f7ff',
                    100: '#e0effe',
                    200: '#bae0fd',
                    300: '#7cc7fb',
                    400: '#36abf7',
                    500: '#137fec',
                    600: '#0665cc',
                    700: '#0751a4',
                    800: '#0b4586',
                    900: '#0f3a6f',
                },
                navy: {
                    50: '#f6f7f9',
                    100: '#eceef2',
                    200: '#d5dae2',
                    300: '#b0b9c9',
                    400: '#8593aa',
                    500: '#64748b',
                    600: '#4e5b72',
                    700: '#3f495c',
                    800: '#333b4a',
                    900: '#1e2634',
                    950: '#101922',
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/container-queries'),
    ],
};
