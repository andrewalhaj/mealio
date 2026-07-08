import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      colors: {
        glass: {
          white:    'var(--glass-fill)',
          'white-md': 'var(--glass-fill-md)',
          'white-lg': 'rgba(255,255,255,0.60)',
          black:    'rgba(0,0,0,0.25)',
          border:   'var(--glass-border)',
          'border-strong': 'var(--glass-border-strong)',
          shadow:   'rgba(0,0,0,0.30)',
          specular: 'var(--glass-specular)',
        },
        brand: {
          olive:   'var(--brand-olive)',
          'olive-2': '#252920',
          tomato:  '#c0392b',
          'tomato-muted': '#8b2020',
          saffron: '#e67e22',
          'saffron-muted': '#b35f10',
          basil:   '#27ae60',
          'basil-muted': '#1a7a42',
          frost:   '#f0f4ef',
          'frost-dim': '#d6dbd4',
        },
      },
      backdropBlur: {
        glass:    '28px',
        'glass-lg': '40px',
        'glass-sm': '16px',
      },
      borderRadius: {
        glass:    '24px',
        'glass-sm': '16px',
        'glass-lg': '32px',
      },
      boxShadow: {
        glass:    '0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.18)',
        'glass-lg': '0 16px 48px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.22)',
        'glass-card': '0 4px 24px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.15)',
      },
      keyframes: {
        'blob-drift': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%':       { transform: 'translate(30px, -20px) scale(1.06)' },
          '66%':       { transform: 'translate(-20px, 15px) scale(0.97)' },
        },
        'frost-reveal': {
          from: { clipPath: 'inset(55% 0 0 0 round 0 0 24px 24px)' },
          to:   { clipPath: 'inset(30% 0 0 0 round 0 0 24px 24px)' },
        },
        'frost-hide': {
          from: { clipPath: 'inset(30% 0 0 0 round 0 0 24px 24px)' },
          to:   { clipPath: 'inset(55% 0 0 0 round 0 0 24px 24px)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(16px) scale(0.96)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      animation: {
        'blob-a':      'blob-drift 18s ease-in-out infinite',
        'blob-b':      'blob-drift 22s ease-in-out infinite reverse',
        'blob-c':      'blob-drift 26s ease-in-out infinite 4s',
        'frost-reveal':'frost-reveal 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'frost-hide':  'frost-hide 0.25s ease-in forwards',
        'toast-in':    'toast-in 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards',
        shimmer:       'shimmer 2.5s linear infinite',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        glass:  'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}

export default config
