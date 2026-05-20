import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        red: {
          50:  '#FCEBEB',
          100: '#F7C1C1',
          400: '#E24B4A',
          600: '#C0392B',
          800: '#791F1F',
          900: '#501313',
        },
        gold: {
          50:  '#FAEEDA',
          400: '#EF9F27',
          600: '#BA7517',
          800: '#633806',
        },
        ink: {
          0:   '#FFF8F5',
          50:  '#F1EFE8',
          200: '#B4B2A9',
          400: '#888780',
          900: '#2C2C2A',
        },
        teal: {
          50:  '#E1F5EE',
          400: '#1D9E75',
          800: '#085041',
        },
      },
      fontFamily: {
        display: ['Noto Serif SC', 'Noto Serif', 'serif'],
        body:    ['DM Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
      },
      width: {
        nav: '220px',
      },
    },
  },
} satisfies Config