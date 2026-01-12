import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import checker from 'vite-plugin-checker'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    checker({
      eslint: {
        lintCommand: 'eslint "./src/**/*.{js,jsx}"',
        useFlatConfig: true,
      },
    }),
  ],
  server: {
    host: true, // Needed for Docker exposure
    proxy: {
      '/api': {
        // eslint-disable-next-line no-undef
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})