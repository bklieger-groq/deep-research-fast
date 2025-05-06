/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')

module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx}',
        './pages/**/*.{js,ts,jsx,tsx}',
        './components/**/*.{js,ts,jsx,tsx}',
    ],
    safelist: [
        'text-gray-800',
        'text-gray-600',
        'text-gray-500',
        'bg-gray-100',
        'bg-gray-50',
        'border-gray-200',
        'border-gray-100',
        {
            pattern: /bg-(red|green|blue|gray|primary)-(50|100|200|300|400|500|600|700|800|900)/,
        },
        {
            pattern: /text-(red|green|blue|gray|primary)-(50|100|200|300|400|500|600|700|800|900)/,
        },
        {
            pattern: /border-(red|green|blue|gray|primary)-(50|100|200|300|400|500|600|700|800|900)/,
        },
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#F0F9FF',
                    100: '#E1F3FF',
                    200: '#C3E7FE',
                    300: '#A4D9FD',
                    400: '#85CAFC',
                    500: '#67BCFB',
                    600: '#3D9DF9',
                    700: '#2B81E2',
                    800: '#1963CB',
                    900: '#1252B5',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }
        },
    },
    plugins: [require('daisyui')],
    daisyui: {
        themes: [
            {
                light: {
                    primary: "#3D9DF9",
                    secondary: "#67BCFB",
                    accent: "#1963CB",
                    neutral: "#2b3440",
                    "base-100": "#ffffff",
                    "base-200": "#F0F9FF",
                    "base-300": "#E1F3FF",
                },
            },
        ],
    },
} 