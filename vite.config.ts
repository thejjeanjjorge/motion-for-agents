import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'playground',
  plugins: [react()],
  server: { strictPort: true },
  preview: { strictPort: true },
  build: { outDir: '../playground-dist', emptyOutDir: true },
});
