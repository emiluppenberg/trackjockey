import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'app/worklets/phase-vocoder.worklet.js'),
      formats: ['es'], // AudioWorklet only supports ES modules
      fileName: () => 'phase-vocoder.worklet.js'
    },
    rollupOptions: {
      output: {
        intro: '',
        outro: ''
      }
    },
    outDir: 'public/worklets', // final build location
    emptyOutDir: false // keep other public files intact
  }
});
