---
name: dot-close
description: Đóng một đợt trong roadmap/ROADMAP.md. Dùng khi đợt đang làm đã code xong và người dùng nói "xong đợt", "đóng đợt", "tick đợt", "kết thúc đợt NN", hoặc khi bạn chuẩn bị báo hoàn thành một đợt. Chạy lệnh kiểm tra theo loại đợt (BE/FE), tick ✅ kèm ngày, điền 4 mục cuối đợt, in bảng skill đã gọi rồi DỪNG. Dùng ngay cả khi người dùng chỉ nói "làm xong rồi" trong ngữ cảnh một đợt roadmap.
---

# Đóng đợt

Mục tiêu: chỉ tick ✅ khi đợt thật sự đạt "định nghĩa xong" (CLAUDE.md), và để lại ROADMAP đủ thông tin cho phiên sau. Tick khi chưa pass sẽ làm phiên sau tin nhầm là nền đã ổn.

## Các bước

1. **Xác định đợt và loại đợt.** Đọc mục đợt trong `roadmap/ROADMAP.md`. Loại: BE, FE, hoặc cả hai (đợt setup).
2. **Chạy kiểm tra, xem kết quả thật (không đoán):**
   - BE (trong `apps/backend`): `.\mvnw.cmd verify` (Git Bash: `./mvnw verify`). Cần Docker chạy. Phải pass gồm `ModularityTests` và test truy cập chéo family.
   - FE (trong `apps/frontend`): `npm run lint`, `npm run build`, và `npm test` nếu có test. Đã chạy app và kiểm tra ở 375px và 1280px (dùng skill `run`).
   - Có bước nào đỏ: **không tick**. Báo lỗi nguyên văn, sửa nếu nằm trong phạm vi đợt, chạy lại.
3. **Cập nhật ROADMAP** (chỉ đợt này):
   - Mỗi `- [ ]` đã làm thành `- [x] … ✅ YYYY-MM-DD`. Mục nào chưa làm thì để nguyên và ghi lý do vào ✅ Đã làm.
   - Đổi `⬜` ở tiêu đề đợt và ở bảng Tiến độ thành `✅ YYYY-MM-DD`.
   - Điền 4 mục cuối đợt:
     - **✅ Đã làm:** ngày, tóm tắt 2–4 dòng, file chính.
     - **🔧 Setup thủ công:** cập nhật nếu thực tế khác dự kiến.
     - **🧪 Test thủ công:** cập nhật từng bước nếu khác dự kiến.
     - **➡️ Đợt tiếp:** giữ prompt của đợt kế, chỉnh nếu có phát sinh ảnh hưởng.
   - Việc phát sinh ngoài phạm vi: ghi vào ✅ Đã làm dưới dạng "Việc nên làm thêm", không tự làm.
4. **In bảng skill** (theo mục ➡️ của đợt vừa làm): `skill | đã gọi (có/không)`. Ghi thật; skill nào chưa gọi thì nói rõ.
5. **DỪNG.** Không bắt đầu đợt kế. Không commit/push nếu người dùng chưa yêu cầu (CLAUDE.md).
