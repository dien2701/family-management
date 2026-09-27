// Chạy dev server ở chế độ giả lập (VITE_API_MODE=mock). Dùng script Node thay vì `VAR=x vite` để chạy được
// trên cả PowerShell lẫn bash. Vite tự đưa biến VITE_* của process.env vào import.meta.env.
process.env.VITE_API_MODE = 'mock'
const { createServer } = await import('vite')
const server = await createServer()
await server.listen()
server.printUrls()
server.bindCLIShortcuts({ print: true })
