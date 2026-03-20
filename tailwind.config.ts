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
        // Background
        bg: '#F7F4EE',
        'bg-soft': '#F2EEE7',
        surface: '#FCFAF6',
        'surface-alt': '#F8F5EF',

        // Text
        text: '#1C1B19',
        'text-soft': '#5F5A53',
        'text-muted': '#6E685F',

        // Primary (trust green)
        primary: '#0D4A3A',
        'primary-soft': '#1B5C49',

        // Accent (premium gold)
        gold: '#A48763',

        // Semantic
        danger: '#C34747',
        success: '#2F6B4F',

        // Legacy aliases (for compatibility)
        paper: '#F7F4EE',
        ink: '#1C1B19',
        green: '#0D4A3A',
        'grey-light': '#E8E5DE',
        'grey-medium': '#C8C4BA',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(28, 27, 25, 0.03)',
        card: '0 8px 20px rgba(28, 27, 25, 0.04)',
        sm: '0 1px 3px rgba(28, 27, 25, 0.03)',
        md: '0 2px 8px rgba(28, 27, 25, 0.04)',
        lg: '0 4px 16px rgba(28, 27, 25, 0.05)',
      },
      borderColor: {
        DEFAULT: 'rgba(28, 27, 25, 0.08)',
        strong: 'rgba(28, 27, 25, 0.14)',
      },
      borderWidth: {
        thin: '0.5px',
      },
    },
  },
  plugins: [],
}
export default config
