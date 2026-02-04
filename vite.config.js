import { defineConfig, build } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { resolve } from 'path';

const contentScripts = {
  content_canid: resolve(__dirname, 'src/contents/canid.content.ts'),
};

const otherEntries = {
  popup: resolve(__dirname, 'src/popup.ts'),
  background: resolve(__dirname, 'src/background.ts'),
};

const contentScriptBuilderPlugin = () => {
  let config;
  return {
    name: 'content-script-builder',
    apply: 'build',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    async closeBundle() {
      if (config.build.ssr || config.build.watch) {
        return;
      }

      console.log('\nBuilding content scripts separately...');
      for (const [name, entryPath] of Object.entries(contentScripts)) {
        console.log(`  Building content script: ${name}`);
        try {
          await build({
            configFile: false,
            build: {
              emptyOutDir: false,
              outDir: config.build.outDir || 'dist',
              rollupOptions: {
                input: entryPath,
                output: {
                  format: 'iife',
                  inlineDynamicImports: true,
                  entryFileNames: `contents/${name}.js`,
                  name: name,
                },
              },
            },
            logLevel: 'warn',
          });
        } catch (error) {
          console.error(`Error building content script ${name}:`, error);
        }
      }
      console.log('Finished building content scripts.');
    },
  };
};

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        ...otherEntries,
      },
      output: {
        // We MUST use 'es' for the main build if we want to avoid the 
        // "multiple inputs not supported for inlineDynamicImports" error 
        // if Vite defaults it to true somehow, or just to keep it simple.
        // Actually, popup.js and background.js should be 'es' if manifest/html support it.
        format: 'es',
        entryFileNames: '[name].js',
      },
    },
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'public/manifest.json', dest: '.' },
        { src: 'public/popup.html', dest: '.' },
        { src: 'public/popup.css', dest: '.' }
      ]
    }),
    contentScriptBuilderPlugin(),
  ]
});