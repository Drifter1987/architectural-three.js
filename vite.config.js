import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  root: 'app',
  base: './',
  plugins: [viteSingleFile({ removeViteModuleLoader: true })],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'es2022',
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    modulePreload: false,
    sourcemap: false,
    reportCompressedSize: false
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  }
});
