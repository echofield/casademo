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
        // SYMI Design System Colors

        // Background/Paper
        bg: '#FAF8F2',
        'bg-soft': '#F5F3ED',
        surface: '#FAF8F2',
        'surface-alt': '#F5F3ED',

        // Text/Ink
        text: '#1A1A1A',
        'text-soft': '#3D3D3D',
        'text-muted': '#6E685F',

        // Primary (forest green - SYMI)
        primary: '#1B4332',
        'primary-soft': '#2F6B4F',

        // Accent (premium gold)
        gold: '#A38767',

        // Semantic
        danger: '#C34747',
        success: '#2F6B4F',

        // Structure
        faint: '#E8E5DE',
        warmgrey: '#C9C5BC',

        // Legacy aliases (for compatibility)
        paper: '#FAF8F2',
        ink: '#1A1A1A',
        green: '#1B4332',
        'grey-light': '#E8E5DE',
        'grey-medium': '#C9C5BC',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // SYMI-style green-tinted shadows
        soft: '0 1px 2px rgba(27, 67, 50, 0.03)',
        card: '0 40px 80px rgba(27, 67, 50, 0.08)',
        sm: '0 1px 3px rgba(27, 67, 50, 0.03)',
        md: '0 8px 40px rgba(27, 67, 50, 0.04)',
        lg: '0 24px 80px rgba(27, 67, 50, 0.08)',
        modal: '0 24px 80px rgba(26, 26, 26, 0.2)',
      },
      borderColor: {
        DEFAULT: '#E8E5DE',
        strong: '#C9C5BC',
      },
      borderWidth: {
        thin: '0.5px',
      },
      borderRadius: {
        // SYMI uses very subtle radius
        DEFAULT: '2px',
        sm: '2px',
        md: '2px',
        lg: '2px',
      },
    },
  },
  plugins: [],
}
export default config
