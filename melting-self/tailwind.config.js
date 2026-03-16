/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'glacier-bg': '#0A0F1C',       // 深冰背景
        'glacier-text': '#E8EAED',     // 微暖白文字
        'glacier-accent': '#A3D8FF',   // 冰裂强调色 (青蓝)
      },
      fontFamily: {
        // 如果系统有思源黑体优先用，没有则回退到原生无衬线
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'], 
        serif: ['"Noto Serif SC"', 'serif'],
      }
    },
  },
  plugins: [],
}