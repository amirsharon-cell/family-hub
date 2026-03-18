import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/family-hub/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Family Hub',
        short_name: 'Family Hub',
        description: 'Shared family calendar and resource manager',
        theme_color: '#4f46e5',
        background_color: '#f9fafb',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/family-hub/',
        scope: '/family-hub/',
        icons: [
          {
            src: '/family-hub/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
