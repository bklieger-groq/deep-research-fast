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
                    50: '#FFF7ED',
                    100: '#FFEDD5',
                    200: '#FED7AA',
                    300: '#FDBA74',
                    400: '#FB923C',
                    500: '#F97316',
                    600: '#EA580C',
                    700: '#C2410C',
                    800: '#9A3412',
                    900: '#7C2D12',
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
                    primary: "#F97316",
                    secondary: "#FB923C",
                    accent: "#C2410C",
                    neutral: "#2b3440",
                    "base-100": "#ffffff",
                    "base-200": "#FFF7ED",
                    "base-300": "#FFEDD5",
                },
            },
        ],
    },
} 