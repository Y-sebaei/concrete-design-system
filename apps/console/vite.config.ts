import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const uiSrc = resolve(import.meta.dirname, '../../packages/ui/src');

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      /*
       * The console consumes the library by source rather than by its built
       * dist. That is the normal workspace arrangement and it buys two things:
       * one Tailwind pass compiles the library's classes and the console's
       * together against a single token layer, and there is no build-order
       * dependency while developing.
       *
       * The published path is proven separately: `npm run build -w
       * @ysebaei/concrete-ui` emits dist/index.js plus dist/concrete-ui.css,
       * and CI builds it on every push.
       */
      '@ysebaei/concrete-ui': resolve(uiSrc, 'index.ts'),
    },
  },
  server: { port: 5174 },
  preview: { port: 4173 },
});
