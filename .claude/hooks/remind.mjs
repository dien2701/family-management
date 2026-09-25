// SessionStart: nhắc quy trình làm việc theo đợt (DECISIONS #84: tiết kiệm token).
if (process.argv[2] === "session") {
  console.log("Nhắc: chỉ đọc mục Quy tắc, bảng Tiến độ và mục của đợt được giao trong roadmap/ROADMAP.md (không đọc cả file). Mỗi phiên MỘT đợt. Không viết test, không review, không chạy lint/build/test, không mở app. Xong: tick ✅, in khối hướng dẫn thủ công + Đợt tiếp rồi DỪNG.");
}
