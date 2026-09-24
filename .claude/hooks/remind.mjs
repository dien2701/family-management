// SessionStart: nhắc quy trình làm việc theo đợt. Stop: nhắc chạy lệnh kiểm tra nếu có sửa code.
import { spawnSync } from "node:child_process";

const mode = process.argv[2];

if (mode === "session") {
  console.log("Nhắc: đọc CLAUDE.md và roadmap/ROADMAP.md trước; mỗi phiên chỉ làm MỘT đợt, xong thì tick ROADMAP, in prompt đợt tiếp (kèm model · effort · skill gợi ý) ra chat rồi DỪNG.");
} else if (mode === "stop") {
  const git = spawnSync("git", ["status", "--porcelain", "--", "apps"], { encoding: "utf8" });
  if (git.status === 0 && git.stdout.trim() !== "") {
    console.log(JSON.stringify({
      systemMessage:
        "Có thay đổi trong apps/. Đợt chỉ xong khi: BE `.\\mvnw.cmd verify` pass; FE `npm run lint` + `npm run build` pass (kèm `npm test` nếu có).",
    }));
  }
}
