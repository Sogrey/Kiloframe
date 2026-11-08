import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages project site: set VITE_BASE=/Kiloframe/ in CI
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [vue()],
})
