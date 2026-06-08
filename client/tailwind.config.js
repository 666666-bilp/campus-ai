/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Deep indigo-ink — scholarly, refined
        primary: {
          50: '#f4f6f9',
          100: '#e3e8f0',
          200: '#c7d1e0',
          300: '#9eafc8',
          400: '#6f86ab',
          500: '#4e6893',
          600: '#3b537c',
          700: '#314465',
          800: '#2b3a55',
          900: '#273248',
          950: '#1a2130',
        },
        // Warm cream & charcoal for surfaces
        surface: {
          50:  '#fdfbf7',
          100: '#f7f3ea',
          200: '#efe7d5',
          300: '#e2d5b8',
          400: '#d4bf97',
          500: '#c6a879',
          600: '#b8925e',
          700: '#9a7a4f',
          800: '#7f6445',
          900: '#69533b',
          950: '#382b1e',
        },
        // Vermillion/cinnabar — warm, striking accent
        accent: {
          50:  '#fef6f3',
          100: '#fdeae3',
          200: '#fbd9cc',
          300: '#f7bfa8',
          400: '#f19a7a',
          500: '#e87853',
          600: '#d45d34',
          700: '#b24826',
          800: '#933d23',
          900: '#7a3722',
          950: '#42190e',
        },
      },
      fontFamily: {
        sans: ['Work Sans', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['DM Serif Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.75rem' }],
        '5xl': ['3rem', { lineHeight: '3.5rem' }],
      },
      spacing: {
        '4.5': '1.125rem',
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(39, 50, 72, 0.06), 0 8px 24px rgba(39, 50, 72, 0.04)',
        'soft-lg': '0 4px 16px rgba(39, 50, 72, 0.08), 0 16px 48px rgba(39, 50, 72, 0.04)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(39, 50, 72, 0.04)',
        'glow': '0 0 24px rgba(212, 93, 52, 0.25)',
        'glow-lg': '0 0 48px rgba(212, 93, 52, 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
        'slide-down': 'slideDown 0.3s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.3s ease-out forwards',
        'slide-in-right': 'slideInRight 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.25s ease-out forwards',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spinSlow 3s linear infinite',
        'shimmer': 'shimmer 2s infinite linear',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(-5%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
          '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.65' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '1000': '1000ms',
        '1500': '1500ms',
        '2000': '2000ms',
      },
      zIndex: {
        '1': '1',
        '5': '5',
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      screens: {
        'xs': '475px',
        '3xl': '1792px',
        '4xl': '2048px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
