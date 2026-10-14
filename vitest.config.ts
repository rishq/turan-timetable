import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { 'virtual:pwa-register': new URL('./src/tests/stubs/pwa-register.ts', import.meta.url).pathname } },
  test: { environment: 'jsdom', include: ['src/**/*.test.{ts,tsx}'] },
})
