import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        content_canid: resolve(__dirname, 'src/contents/canid.content.ts'),
        content_athena: resolve(__dirname, 'src/contents/athena.content.ts'),
        popup: resolve(__dirname, 'src/popup.ts'),
        background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name.startsWith('content_')) {
            return 'contents/[name].js';
          }
          return '[name].js';
        }
      }
    }
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'public/manifest.json', dest: '.' },
        { src: 'public/popup.html', dest: '.' },
        { src: 'public/popup.css', dest: '.' }
      ]
    })
  ]
});