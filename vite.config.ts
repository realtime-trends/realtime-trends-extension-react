import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        popup: './popup.html',
        queries: './queries.html'
      },
      output: {
        entryFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId?.includes('popup')) {
            return 'popup.js'
          }
          if (facadeModuleId?.includes('queries')) {
            return 'queries.js'
          }
          return '[name].js'
        }
      }
    }
  },
  define: {
    global: 'globalThis',
  }
})