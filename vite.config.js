import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        content: 'src/content.ts',
        popup: 'src/popup.ts',
        background: 'src/background.ts',
        // agrega aquí otros scripts si los tienes
      },
      output: {
        entryFileNames: '[name].js'
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