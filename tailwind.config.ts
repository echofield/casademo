import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#FAF8F2',
        ink: '#1A1A1A',
        green: '#003D2C',
        gold: '#A38767',
        'grey-light': '#E8E5DE',
        'grey-medium': '#C8C4BA',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        sm: '0 1px 3px rgba(26, 26, 26, 0.03)',
        md: '0 2px 8px rgba(26, 26, 26, 0.04)',
        lg: '0 4px 16px rgba(26, 26, 26, 0.05)',
      },
      borderWidth: {
        thin: '0.5px',
      },
    },
  },
  plugins: [],
}
export default config
