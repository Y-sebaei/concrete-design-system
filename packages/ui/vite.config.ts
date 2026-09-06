import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    lib: {
      /*
       * Two entries, because package.json declares two JavaScript exports.
       * The tokens subpath exists so a consumer can generate their own
       * semantic layer from the ramps without pulling in every component.
       */
      entry: {
        index: resolve(import.meta.dirname, 'src/index.ts'),
        'tokens/index': resolve(import.meta.dirname, 'src/tokens/index.ts'),
      },
      formats: ['es'],
    },
    // React stays external. Bundling it into a component library gives the
    // consumer two copies of React, and the second one has its own hook
    // dispatcher, which fails at runtime with an error that names none of this.
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client'],
      output: {
        assetFileNames: (asset) =>
          asset.names?.[0]?.endsWith('.css') ? 'concrete-ui.css' : '[name][extname]',
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});
