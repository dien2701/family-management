# Tộc Phả — Frontend

React 19 · Vite · TypeScript strict · Tailwind CSS 4 · shadcn/ui. Quy tắc và cấu trúc: `../../.claude/rules/frontend.md`, `../../docs/STRUCTURE.md` §4, giao diện: `../../docs/DESIGN.md`.

```bash
npm install
npm run dev        # http://localhost:5173, proxy /api tới :8080
npm run gen:api    # cần backend chạy ở :8080, sinh src/services/schema.d.ts
npm run lint
npm run build      # gồm tsc -b
npm test           # Vitest
```
