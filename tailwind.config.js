/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Kiro-inspired dark theme
        'bg-primary':   '#0d1117',
        'bg-secondary': '#161b22',
        'bg-panel':     '#1c2128',
        'bg-hover':     '#21262d',
        'border':       '#30363d',
        'border-muted': '#21262d',
        'accent':       '#388bfd',
        'accent-hover': '#58a6ff',
        'accent-muted': '#1f3a5f',
        'text-primary': '#e6edf3',
        'text-muted':   '#8b949e',
        'text-subtle':  '#484f58',
        'success':      '#3fb950',
        'warning':      '#d29922',
        'danger':       '#f85149',
        'danger-muted': '#3d1c1c',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Cascadia Code"', 'Consolas', 'monospace'],
      }
    }
  },
  plugins: []
};
