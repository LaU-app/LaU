/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    legacy()
  ],
  server: {
    proxy: {
      // Cada vez que Vite vea "/uploads", lo mandará a Laragon
      '/uploads': {
        target: 'http://127.0.0.1:8000/',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom'
  },
  optimizeDeps: {
    include: ['node-vibrant']
  },
  build: {
    commonjsOptions: {
      include: [/node-vibrant/, /node_modules/]
    }
  }
})
