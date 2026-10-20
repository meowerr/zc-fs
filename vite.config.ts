import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  esbuild: {
    legalComments: 'none',
  },
  plugins: [

    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'ZC Formula Student PitLane',
        short_name: 'PitLane',
        description: 'Zewail City Formula Student Telemetry & Project Workspace',
        theme_color: '#0B1B3A',
        background_color: '#070A0E',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallbackDenylist: [/^\/rest\//, /^\/auth\//, /supabase\.co/],
        ignoreURLParametersMatching: [/.*/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.includes('supabase.co'),
            handler: 'NetworkOnly',
          },
        ],
      }
    })
  ],
  build: {
    target: 'es2022',
    rollupOptions: {

      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'lucide-react'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
