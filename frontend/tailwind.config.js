/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                abstract: '#030303',
                accentBlue: '#3b82f6',
                accentPink: '#ec4899',
            },
            fontFamily: {
                grotesk: ['"Space Grotesk"', 'sans-serif'],
            },
            letterSpacing: {
                heavy: '0.3em',
            }
        },
    },
    plugins: [],
}
