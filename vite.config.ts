import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // GitHub Pages (project site): site is served at
    // https://anhyen2k.github.io/pfl-yenvisuals/ so assets must be under
    // '/pfl-yenvisuals/'. Do NOT use '/' here — that base is only for Vercel
    // (root domain). This build must NOT be uploaded to Vercel.
    base: '/pfl-yenvisuals/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
