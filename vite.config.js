import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    nodePolyfills({
      include: ['crypto', 'stream', 'vm']
    })
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './template.html'
      }
    },
  }
})
