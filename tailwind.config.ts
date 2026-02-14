import type {Config} from 'tailwindcss';

const config: Config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
        mono: ['var(--font-mono)']
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
};

export default config;
