import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Relative base keeps the build deployable under any sub-path and inside Capacitor (file/https://localhost).
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt': a new schedule never replaces the old one silently; the user taps "Обновить".
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Расписание — Университет Туран',
        short_name: 'Расписание',
        description: 'Офлайн-расписание занятий университета',
        lang: 'ru',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#F4F6F7',
        theme_color: '#0B7A5C',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        // Only successful, versioned (hash-named) assets are precached; nothing is cached by guesswork.
      },
    }),
  ],
  build: { target: 'es2022', cssCodeSplit: true, sourcemap: false },
})
