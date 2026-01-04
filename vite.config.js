import { defineConfig } from 'vite'

export default defineConfig({
  // Point d'entrée principal
  root: '.',
  
  // Configuration pour le build
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './example.html'
      }
    },
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  
  // Configuration du serveur de développement
  server: {
    port: 3000,
    open: '/example.html'
  },
  
  // Optimisations
  optimizeDeps: {
    include: ['./ssss.js', './mpz.js'],
    esbuildOptions: {
      // Forcer la conversion CommonJS vers ES modules
      format: 'esm'
    }
  }
})
