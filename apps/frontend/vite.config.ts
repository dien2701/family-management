import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      disable: process.env.VITE_API_MODE === 'mock',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: false,
      pwaAssets: {
        disabled: false,
        config: true,
      },
      manifest: {
        name: 'Tộc Phả',
        short_name: 'Tộc Phả',
        description: 'Quản lý gia phả dòng họ',
        theme_color: '#24466F',
        background_color: '#EEF3F8',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: process.env.VITE_API_MODE !== 'mock',
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      // Bộ đối chiếu lịch âm dùng chung với backend (DECISIONS #35), chỉ import trong test
      '@fixtures': path.resolve(import.meta.dirname, '../../shared/fixtures'),
    },
  },
  server: {
    port: 5173,
    // Refresh cookie (Path=/api/auth) cần cùng origin nên dev proxy /api sang backend
    proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: false } },
    // Chế độ giả lập đọc shared/fixtures/seed/members.json nằm ngoài apps/frontend
    fs: { allow: ['../..'] },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Test không bao giờ chạy ở chế độ giả lập trừ khi tự bật bằng vi.stubEnv
    env: { VITE_API_MODE: '' },
  },
})
