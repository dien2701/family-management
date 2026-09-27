// PostToolUse (Edit|Write): sửa file apps/frontend/** thì chạy eslint --fix trên file đó.
// Bỏ qua im lặng khi frontend chưa có (trước Đợt 1) hoặc chưa npm install.
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve, relative } from "node:path";

let raw = "";
for await (const chunk of process.stdin) raw += chunk;

let filePath = "";
try {
  filePath = JSON.parse(raw)?.tool_input?.file_path ?? "";
} catch {
  process.exit(0);
}

const frontend = resolve(process.env.CLAUDE_PROJECT_DIR ?? process.cwd(), "apps", "frontend");
const target = resolve(filePath);
const rel = relative(frontend, target).replaceAll("\\", "/");

if (!filePath || rel.startsWith("..") || !/\.(ts|tsx|js|jsx)$/.test(rel)) process.exit(0);
if (!existsSync(resolve(frontend, "node_modules", ".bin"))) process.exit(0);

const result = spawnSync("npx", ["eslint", "--fix", rel], { cwd: frontend, shell: true, encoding: "utf8" });
if (result.status !== 0) {
  // Không chặn công việc; chỉ báo để Claude thấy lỗi lint
  console.error(result.stdout || result.stderr);
  process.exit(1);
}
