import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],


  build: {
    outDir: '../statics/', // Assets will be placed in the public directory
    rollupOptions: {
      output: {
        entryFileNames: 'index.js' // Specify the desired filename for the main JavaScript file
      }
    },
    emptyOutDir: true,
  }
});