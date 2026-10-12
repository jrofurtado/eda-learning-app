import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps the build portable (GitHub Pages, any static host, subfolders).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // vendor libs and learning content change at different rates — cache them separately
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
          if (id.includes('/src/packs/')) return 'content';
        },
      },
    },
  },
});
