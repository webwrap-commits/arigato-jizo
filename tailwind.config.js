/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#fafaf8',
        'bg-secondary': '#f5f3f0',
        'accent': '#d4c5b0',
        'text-primary': '#4a4a4a',
        'text-secondary': '#888888',
        'text-tertiary': '#999999',
        'border': '#e8e6e1',
      },
      fontFamily: {
        // 元の設定を残しつつ、Zen Maru Gothicを追加しました
        'mincho': ['"Noto Serif JP"', 'serif'],
        'gothic': ['"Noto Sans JP"', 'sans-serif'],
        'sans': ['"Zen Maru Gothic"', 'sans-serif'],
      },
      spacing: {
        '80px': '80px',
        '60px': '60px',
        '40px': '40px',
        '30px': '30px',
      },
      boxShadow: {
        'subtle': '0 2px 8px rgba(0, 0, 0, 0.05)',
      },
      maxWidth: {
        'site': '1200px',
      },
      borderRadius: {
        'minimal': '2px',
      },
      letterSpacing: {
        'wide': '0.05em',
        'wider': '0.1em',
        'widest': '0.2em',
      },
    },
  },
  plugins: [],
};
