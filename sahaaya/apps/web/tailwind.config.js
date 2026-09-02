/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Leafcare-inspired palette
        primary: {
          50: '#F0F5F1',
          100: '#DCEADF',
          200: '#BAD4BF',
          300: '#8EB996',
          400: '#5E9A6D',
          500: '#3E7C59',  // Main sage/forest green
          600: '#316649',
          700: '#274E3A',
          800: '#1F3D30',
          900: '#1A3328',
        },
        secondary: {
          50: '#FDFDFB',
          100: '#F6F5EF',  // Soft cream background
          200: '#ECEAE0',
          300: '#DDDAC6',
          400: '#C9C4A3',
          500: '#B3AB80',
        },
        // Distress bands - desaturated for calm but legible
        distress: {
          green: '#4E9E6B',    // Stable
          yellow: '#E8A23D',   // Mild concern
          orange: '#E8703D',   // Significant concern
          red: '#D9534F',      // Urgent (desaturated)
        },
        // Semantic
        background: '#F6F5EF',
        surface: '#FFFFFF',
        text: {
          primary: '#1F2A24',   // Charcoal
          secondary: '#4A5D50',
          muted: '#7A8D7F',
          inverse: '#F6F5EF',
        },
        border: '#D4D8D5',
        focus: '#3E7C59',
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-md': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-sm': ['2.25rem', { lineHeight: '1.3' }],
        'heading-xl': ['1.875rem', { lineHeight: '1.3' }],
        'heading-lg': ['1.5rem', { lineHeight: '1.4' }],
        'heading-md': ['1.25rem', { lineHeight: '1.4' }],
        'heading-sm': ['1.125rem', { lineHeight: '1.5' }],
        'body-lg': ['1.125rem', { lineHeight: '1.7' }],
        'body': ['1rem', { lineHeight: '1.7' }],
        'body-sm': ['0.875rem', { lineHeight: '1.6' }],
        'caption': ['0.75rem', { lineHeight: '1.5' }],
      },
      spacing: {
        '0': '0',
        '1': '0.25rem',   // 4px
        '2': '0.5rem',    // 8px
        '3': '0.75rem',   // 12px
        '4': '1rem',      // 16px
        '5': '1.25rem',   // 20px
        '6': '1.5rem',    // 24px
        '8': '2rem',      // 32px
        '10': '2.5rem',   // 40px
        '12': '3rem',     // 48px
        '16': '4rem',     // 64px
        '20': '5rem',     // 80px
        '24': '6rem',     // 96px,
      },
      borderRadius: {
        'none': '0',
        'sm': '0.375rem',   // 6px
        'md': '0.5rem',     // 8px
        'lg': '0.75rem',    // 12px
        'xl': '1rem',       // 16px
        '2xl': '1.5rem',    // 24px
        'full': '9999px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(31, 42, 36, 0.06)',
        'card': '0 4px 16px rgba(31, 42, 36, 0.08)',
        'elevated': '0 8px 32px rgba(31, 42, 36, 0.10)',
        'alert': '0 0 0 3px rgba(232, 162, 61, 0.3)',
        'alert-orange': '0 0 0 3px rgba(232, 112, 61, 0.3)',
        'alert-red': '0 0 0 3px rgba(217, 83, 79, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'slide-down': 'slideDown 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.2s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
        'slow': '350ms',
      },
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}