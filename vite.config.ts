import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: './popup.html',
        queries: './queries.html',
        content: './src/scripts/content.tsx',
        background: './src/scripts/background.ts'
      },
      output: [
        {
          entryFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId
            if (facadeModuleId?.includes('content')) {
              return 'static/js/content.js'
            }
            if (facadeModuleId?.includes('background')) {
              return 'static/js/background.js'
            }
            if (facadeModuleId?.includes('queries')) {
              return 'queries.js'
            }
            return '[name].js'
          },
          chunkFileNames: 'static/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.includes('content.css')) {
              return 'static/css/content.css'
            }
            return 'static/css/[name]-[hash][extname]'
          },
          format: 'iife',
          name: 'ContentScript'
        }
      ]
    }
  },
  define: {
    global: 'globalThis',
  }
})