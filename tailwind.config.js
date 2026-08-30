/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-blue':  '#2563EB',
        'brand-dark':  '#0B192C',
        'bg-base':     'var(--bg-base)',
        'bg-card':     'var(--bg-card)',
        'white-pure':  '#ffffff',
        
        // Dark theme redirects for standard Tailwind utility classes
        white: 'var(--bg-card)',
        slate: {
          50: 'var(--bg-base)',
          100: 'var(--border-subtle)',
          200: 'var(--border-subtle)',
          250: 'var(--border-subtle)',
          300: '#1D2D44',
          350: '#1D2D44',
          400: 'var(--text-muted)',
          450: 'var(--text-muted)',
          500: 'var(--text-secondary)',
          550: 'var(--text-secondary)',
          600: 'var(--text-secondary)',
          650: 'var(--text-secondary)',
          700: 'var(--text-primary)',
          800: 'var(--text-primary)',
          850: 'var(--text-primary)',
          900: 'var(--text-primary)',
          950: '#020617',
        },
        blue: {
          50: 'rgba(51, 149, 255, 0.08)',
          100: 'rgba(51, 149, 255, 0.15)',
          200: 'rgba(51, 149, 255, 0.25)',
          500: 'var(--accent)',
          600: 'var(--accent)',
          650: 'var(--accent)',
          655: 'var(--accent)',
          700: 'var(--accent-light)',
          800: 'var(--accent-light)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '28px',
        '4xl': '36px',
      },
      backdropBlur: {
        '2xl': '24px',
        '3xl': '40px',
      },
      animation: {
        'fade-up':      'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards',
        'fade-in':      'fadeIn 0.4s ease forwards',
        'scale-up':     'scaleUp 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'slide-right':  'slideRight 0.4s cubic-bezier(0.22,1,0.36,1) forwards',
        'float':        'float 3s ease-in-out infinite',
        'pulse-ring':   'pulseRing 2s cubic-bezier(0.455,0.03,0.515,0.955) infinite',
        'shake':        'shake 0.4s ease',
        'gradient':     'gradientShift 4s linear infinite',
        'progress':     'progress 20s linear infinite',
      },
      keyframes: {
        fadeUp:        { from: { opacity: '0', transform: 'translateY(24px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:        { from: { opacity: '0' }, to: { opacity: '1' } },
        scaleUp:       { from: { opacity: '0', transform: 'scale(0.85)' }, to: { opacity: '1', transform: 'scale(1)' } },
        slideRight:    { from: { opacity: '0', transform: 'translateX(-20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        float:         { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        pulseRing:     { '0%': { boxShadow: '0 0 0 0 rgba(0,186,242,0.5)' }, '70%': { boxShadow: '0 0 0 14px rgba(0,186,242,0)' }, '100%': { boxShadow: '0 0 0 0 rgba(0,186,242,0)' } },
        shake:         { '0%,100%': { transform: 'translateX(0)' }, '20%': { transform: 'translateX(-6px)' }, '40%': { transform: 'translateX(6px)' }, '60%': { transform: 'translateX(-4px)' }, '80%': { transform: 'translateX(4px)' } },
        gradientShift: { '0%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' }, '100%': { backgroundPosition: '0% 50%' } },
        progress:      { from: { width: '0%' }, to: { width: '100%' } },
      },
    },
  },
  plugins: [],
};
