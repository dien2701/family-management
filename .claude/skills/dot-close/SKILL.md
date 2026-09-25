---
name: dot-close
description: Đóng một đợt trong roadmap/ROADMAP.md. Dùng khi đợt đang làm đã code xong và người dùng nói "xong đợt", "đóng đợt", "tick đợt", "kết thúc đợt NN", hoặc khi bạn chuẩn bị báo hoàn thành một đợt. Tick ✅ kèm ngày, điền ✅ Đã làm, in khối hướng dẫn thủ công (setup, lệnh kiểm tra, test tay, git, đợt tiếp) rồi DỪNG. Không chạy lệnh kiểm tra (DECISIONS #84).
---

# Đóng đợt

Theo DECISIONS #84: AI không chạy lint/build/test/verify. Tick ngay khi code xong; người dùng tự chạy kiểm tra và báo lỗi trong cùng phiên.

## Các bước
1. **Cập nhật ROADMAP** (chỉ mục của đợt này, không đọc cả file):
   - `- [ ]` đã làm → `- [x] … ✅ YYYY-MM-DD`. Mục chưa làm để nguyên, ghi lý do vào ✅ Đã làm.
   - `⬜` ở tiêu đề đợt và ở bảng Tiến độ → `✅ YYYY-MM-DD`. Cập nhật dòng "▶️ Đợt đang chờ".
   - **✅ Đã làm:** ngày, tóm tắt 2–4 dòng, file chính; việc phát sinh ghi "Việc nên làm thêm" (không tự làm).
   - Sửa 🔧 / 🧪 nếu thực tế khác dự kiến.
2. **In ra chat khối hướng dẫn thủ công** đúng mẫu ở ROADMAP mục Quy tắc: 🔧 setup, ▶️ lệnh kiểm tra (theo loại đợt FE/BE), 🧪 các bước test tay, 💾 lệnh git gợi ý (nhánh `dot-NN-<ten>`, commit Conventional Commits), ➡️ đợt tiếp (công cụ · model · effort theo bảng Tiến độ) kèm prompt mẫu đã điền số và tên đợt. Đợt cuối (41) thì in "Hết lộ trình".
3. **DỪNG.** Không bắt đầu đợt kế, không commit/push khi người dùng chưa yêu cầu.
