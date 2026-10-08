// Bản build prod không được chứa mã hay dữ liệu của lớp giả lập, kể cả khi ai đó lỡ đặt VITE_API_MODE=mock
// (security.md: lớp giả lập không được lọt vào bản build prod).
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { build } from 'vite'
import { describe, expect, it } from 'vitest'

const root = path.resolve(import.meta.dirname, '../../..')

function readAllFiles(dir: string): { file: string; text: string }[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return readAllFiles(full)
    return /\.(js|css|html|json|map)$/.test(entry.name)
      ? [{ file: full, text: readFileSync(full, 'utf8') }]
      : []
  })
}

describe('bản build prod', () => {
  it(
    'không chứa lớp giả lập, dữ liệu 28 người hay nút "Dữ liệu tạm"',
    { timeout: 180_000 },
    async () => {
      const outDir = mkdtempSync(path.join(tmpdir(), 'giapha-prod-build-'))
      const previous = { mode: process.env.VITE_API_MODE, nodeEnv: process.env.NODE_ENV }
      process.env.VITE_API_MODE = 'mock'
      // Vitest đặt NODE_ENV=test làm import.meta.env.DEV = true; `npm run build` thật chạy với production
      process.env.NODE_ENV = 'production'
      try {
        await build({
          root,
          configFile: path.join(root, 'vite.config.ts'),
          mode: 'production',
          logLevel: 'silent',
          build: { outDir, emptyOutDir: true },
        })
      } finally {
        if (previous.mode === undefined) delete process.env.VITE_API_MODE
        else process.env.VITE_API_MODE = previous.mode
        process.env.NODE_ENV = previous.nodeEnv
      }

      const files = readAllFiles(outDir)
      try {
        expect(files.some((f) => f.file.endsWith('.js'))).toBe(true)
        const forbidden = [
          'giapha.mock', // key localStorage của kho giả lập
          'Cụ Kai Nhất', // dữ liệu 28 người
          'Dữ liệu tạm', // mục trong trang Thêm
          'MockRouter',
        ]
        for (const needle of forbidden) {
          const hit = files.find((f) => f.text.includes(needle))
          expect(hit, `"${needle}" xuất hiện trong ${hit?.file}`).toBeUndefined()
        }
      } finally {
        rmSync(outDir, { recursive: true, force: true })
      }
    },
  )
})
