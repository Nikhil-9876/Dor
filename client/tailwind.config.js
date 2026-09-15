/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode surfaces — slightly warm, not pure white
        surface: {
          DEFAULT: '#FFFFFF',
          elevated: '#F6F6F8',
          bg: '#F2F2F6',
        },
        // Dark mode surfaces
        dark: {
          bg: '#0C0C10',
          surface: '#16161E',
          elevated: '#1E1E2A',
          border: '#27273A',
        },
        // Brand — distinctive slate-blue, not default indigo
        primary: {
          50:  '#EAF0FF',
          100: '#D3E2FF',
          200: '#A8C4FF',
          300: '#6B9FFF',
          400: '#4880F5',
          500: '#3366E8',   // main accent
          600: '#2554D4',
          700: '#1C44B8',
          800: '#153494',
          900: '#0F2470',
        },
        // Accent — warm coral for CTAs / highlights
        accent: {
          50:  '#FFF1EE',
          100: '#FFE0D8',
          200: '#FFC2B0',
          300: '#FF9878',
          400: '#FF6F47',
          500: '#F2521E',
          600: '#D43F10',
        },
        // Semantic status — deliberately non-default
        // Success: muted teal (not Tailwind emerald-500)
        success: {
          DEFAULT: '#0D9E7E',
          light: '#E4F7F3',
          dark: '#12C99E',
        },
        // Warning: deep amber (not Tailwind yellow-500)
        warning: {
          DEFAULT: '#C97D08',
          light: '#FEF5E0',
          dark: '#F5A623',
        },
        // Danger: muted rose-brick (not Tailwind red-500)
        danger: {
          DEFAULT: '#C73B3B',
          light: '#FDEAEA',
          dark: '#EF6060',
        },
        // Sending: steel blue
        info: {
          DEFAULT: '#2F80C2',
          light: '#E8F3FC',
          dark: '#5FA8E8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'stat': ['2.5rem', { lineHeight: '1', fontWeight: '900', letterSpacing: '-0.03em' }],
        'stat-sm': ['1.75rem', { lineHeight: '1', fontWeight: '800', letterSpacing: '-0.025em' }],
      },
      borderRadius: {
        card: '0.875rem',
        btn: '0.5rem',
        pill: '9999px',
      },
      boxShadow: {
        // Tiered card shadow system
        card:    '0 1px 2px 0 rgb(0 0 0 / 0.06), 0 1px 3px 0 rgb(0 0 0 / 0.04)',
        'card-md': '0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 6px -2px rgb(0 0 0 / 0.05)',
        'card-lg': '0 12px 28px -4px rgb(0 0 0 / 0.12), 0 6px 12px -4px rgb(0 0 0 / 0.06)',
        'card-feature': '0 20px 40px -8px rgb(51 102 232 / 0.15), 0 8px 16px -4px rgb(0 0 0 / 0.06)',
        'inner-glow': 'inset 0 1px 0 0 rgb(255 255 255 / 0.06)',
        'glow-primary': '0 0 0 3px rgb(51 102 232 / 0.2)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #3366E8 0%, #2554D4 100%)',
        'gradient-accent':  'linear-gradient(135deg, #F2521E 0%, #FF6F47 100%)',
        'gradient-success': 'linear-gradient(135deg, #0D9E7E 0%, #0BBFA0 100%)',
        'gradient-danger':  'linear-gradient(135deg, #C73B3B 0%, #D95656 100%)',
        'gradient-subtle':  'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(0,0,0,0.015) 100%)',
        'stat-primary': 'linear-gradient(135deg, #EAF0FF 0%, #D3E2FF 100%)',
        'stat-success': 'linear-gradient(135deg, #E4F7F3 0%, #CCEFE9 100%)',
        'stat-danger':  'linear-gradient(135deg, #FDEAEA 0%, #FADADA 100%)',
        'stat-warning': 'linear-gradient(135deg, #FEF5E0 0%, #FDECC8 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 2s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
