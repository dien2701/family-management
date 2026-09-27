// PreToolUse (Edit|Write): chặn ghi vào .env* (trừ .env.example) và file Flyway V*.sql đã có.
// Thoát mã 2 kèm thông báo trên stderr thì Claude Code từ chối lượt gọi và đưa lý do cho model.
import { existsSync } from "node:fs";
import { basename } from "node:path";

let raw = "";
for await (const chunk of process.stdin) raw += chunk;

let filePath = "";
try {
  filePath = JSON.parse(raw)?.tool_input?.file_path ?? "";
} catch {
  process.exit(0);
}
if (!filePath) process.exit(0);

const normalized = filePath.replaceAll("\\", "/");
const name = basename(normalized);

if (/^\.env(\..+)?$/.test(name) && name !== ".env.example") {
  console.error(`Chặn: không ghi vào ${name}. Bí mật chỉ do người dùng tự điền; sửa .env.example nếu cần thêm khóa.`);
  process.exit(2);
}

const isFlywayVersioned = /\/db\/migration\/V\d+__[^/]+\.sql$/.test(normalized);
if (isFlywayVersioned && existsSync(filePath)) {
  console.error(`Chặn: ${name} đã tồn tại. Không sửa file Flyway đã có, hãy thêm file V mới (skill flyway-migration).`);
  process.exit(2);
}
