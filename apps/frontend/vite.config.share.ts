// Build một file HTML duy nhất chạy bằng lớp giả lập để gửi cho người khác xem (npm run build:share).
// Tách khỏi vite.config.ts nên không ảnh hưởng bản build prod (lớp giả lập vẫn không lọt vào prod).
import { readFileSync } from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'

const root = import.meta.dirname

// Nhúng JS/CSS vào chính file HTML
function inlineEverything(): Plugin {
  return {
    name: 'inline-everything',
    enforce: 'post',
    generateBundle(_, bundle) {
      const html = Object.values(bundle).find((f) => f.type === 'asset' && f.fileName.endsWith('.html'))
      if (!html || html.type !== 'asset') return
      let source = String(html.source)
      const take = (name: string) => {
        const chunk = bundle[name]
        if (!chunk) return ''
        delete bundle[name]
        // Với codeSplitting tắt, Vite bỏ sót chỗ thay biến này (không có chunk nào để preload)
        return chunk.type === 'chunk' ? chunk.code.replaceAll('__VITE_PRELOAD__', 'void 0') : String(chunk.source)
      }
      source = source.replace(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (_m, href: string) => {
        return `<style>${take(href.replace(/^\.?\//, ''))}</style>`
      })
      let scripts = ''
      source = source.replace(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g, (_m, src: string) => {
        scripts += `<script type="module">${take(src.replace(/^\.?\//, '')).replace(/<\/script/gi, '<\\/script')}</script>`
        return ''
      })
      const icon = readFileSync(path.join(root, 'public/favicon.svg')).toString('base64')
      source = source
        .replace(/<link rel="icon"[^>]*>/, `<link rel="icon" href="data:image/svg+xml;base64,${icon}" />`)
        .replace('</body>', () => `${scripts}</body>`)
      html.source = source
    },
  }
}

export default defineConfig({
  root: path.join(root, 'share'),
  base: './',
  plugins: [react(), tailwindcss(), inlineEverything()],
  resolve: {
    alias: {
      '@': path.join(root, 'src'),
      '@fixtures': path.join(root, '../../shared/fixtures'),
      'virtual:pwa-register/react': path.join(root, 'share/pwa-stub.ts'),
    },
  },
  define: {
    'import.meta.env.DEV': 'true',
    'import.meta.env.VITE_API_MODE': '"mock"',
    'import.meta.env.VITE_GOOGLE_CLIENT_ID': '""',
  },
  server: { fs: { allow: ['../..'] } },
  build: {
    outDir: path.join(root, 'dist-share'),
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    modulePreload: false,
    chunkSizeWarningLimit: 100_000,
    rollupOptions: { output: { codeSplitting: false } },
  },
})
