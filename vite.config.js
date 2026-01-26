// https://vite.dev/config/
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Fix for serving binary/model files correctly
    mimeTypes: {
      'application/wasm': ['wasm'],  // For any WASM files
      'application/octet-stream': ['bin', 'json']  // For model binaries and manifests
    }
  }
})
