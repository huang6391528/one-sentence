/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 字体族
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"SFMono-Regular"',
          'Consolas',
          '"Liberation Mono"',
          'Menlo',
          'Courier',
          'monospace',
        ],
      },
      // 颜色
      colors: {
        black: '#000000',
        gray: {
          DEFAULT: '#333333',
          dark: '#333333',
          dim: '#444444',
          muted: '#555555',
          light: '#8A817C',
        },
      },
      // 间距
      spacing: {
        'btn-gap': '20px',
      },
      // 最大宽度
      maxWidth: {
        'input': '600px',
      },
      // 过渡时长
      transitionDuration: {
        'slow': '3000ms',
        'slow-2': '2000ms',
      },
      // 动画
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
