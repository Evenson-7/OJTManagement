import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'esnext', // Compiles to modern, fast JavaScript
    modulePreload: false, // Stops Vite from downloading hidden routes in the background
    cssCodeSplit: true, // Ensures CSS is split and deferred properly
    chunkSizeWarningLimit: 2000, // Safely ignore the generic terminal warning
    rollupOptions: {
      // Notice we completely removed manualChunks!
      // Rollup will now perfectly tree-shake Firebase and delete the "Unused JS"
    }
  }
})