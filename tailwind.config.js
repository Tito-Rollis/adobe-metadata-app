/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Dark theme palette
        'bg-primary':   '#1a1a2e',
        'bg-secondary': '#16213e',
        'bg-panel':     '#0f3460',
        'accent':       '#e8441a',
        'accent-hover': '#ff5722',
        'border':       '#2a2a4a',
        'text-primary': '#ffffff',
        'text-muted':   '#8888aa',
      }
    }
  },
  plugins: []
};
