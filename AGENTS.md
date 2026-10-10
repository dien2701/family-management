# AGENTS.md — Tộc Phả (dành cho Antigravity)

> File này cho agent của **Antigravity** (Gemini). Nguồn quy tắc chính là `CLAUDE.md`, **mọi quy tắc trong đó đều áp dụng**. File này chỉ thêm những điều Antigravity cần biết vì không có hook và skill của Claude Code (DECISIONS #83).

## Đầu mỗi phiên
1. Đọc `CLAUDE.md` (tổng quan, thuật ngữ, quy ước). Trong `roadmap/ROADMAP.md` **chỉ đọc** mục Quy tắc, bảng Tiến độ và mục của đợt được giao (không đọc cả file).
2. Chỉ nhận đợt có cột **Công cụ = Antigravity** trong bảng Tiến độ (hiện là Đợt 11, 18–19, 20–21, 22, 23). Đợt ghi Claude Code thì dừng và báo người dùng.
3. Đọc đúng các file mà prompt của đợt nêu, gồm:
   - `.claude/rules/frontend.md` (thêm `security.md` nếu đợt đụng quyền);
   - `docs/DESIGN.md` trước khi làm UI;
   - các mục IDEA và DECISIONS mà prompt nêu.
   `docs/DECISIONS.md` thắng `roadmap/IDEA.md` khi mâu thuẫn.

## Thuật ngữ bắt buộc
- **Tài khoản** (user): người đăng nhập, vai trò Admin hoặc User. **Thành viên** (member): người trong gia phả, là dữ liệu nội dung.
- Hai khái niệm khác nhau, liên kết 1–1 và không bắt buộc ("Tôi là ai"). Giao diện không dùng lẫn hai từ này.
- Tài khoản mới phải được Admin duyệt mới dùng đầy đủ. Riêng Trang chủ, Thành viên, Cây, Sự kiện, Đổi lịch thì khách và tài khoản chưa duyệt xem được chỉ-đọc (DECISIONS #88).

## Điều cấm (Claude Code chặn bằng hook, ở đây phải tự giữ)
- Không đọc, tạo hay sửa file `.env*` (trừ `.env.example`). Không đưa bí mật hay token vào code hay localStorage.
- Không sửa file Flyway `V*.sql` đã có.
- Không sửa gì trong `apps/backend/` (backend do Claude Code làm).
- Không sửa tay `apps/frontend/src/services/schema.d.ts`: chỉ sinh bằng `npm run gen:api`.
- Trong `shared/api/openapi.yaml` chỉ thêm phần của đợt đang làm. Không đổi hợp đồng của đợt khác.
- **Không tạo dữ liệu giả.** Chỉ có 28 thành viên ở `shared/fixtures/seed/members.json` và dữ liệu người dùng tự nhập. Dữ liệu mẫu chỉ được nằm trong test.
- Không commit, push, tạo PR khi người dùng chưa yêu cầu. Mỗi đợt một nhánh `dot-NN-<ten>`.
- Không làm việc ngoài checklist của đợt. Thấy việc cần làm thêm thì ghi vào mục ghi chú của đợt.
- Không chạy song song với phiên Claude Code trên cùng repo.

## Skill và kiểm tra (DECISIONS #84)
- Dùng skill `ui-ux-pro-max` (`.agents/skills/ui-ux-pro-max`) cho phần UI. Không dùng được thì dừng và báo người dùng.
- **Không** viết test mới, **không** chạy `npm run lint`/`build`/`test`, **không** mở trình duyệt. Chỉ chạy `npm run gen:api` khi có sửa `openapi.yaml`. Người dùng tự chạy kiểm tra và báo lỗi.
- Test cũ hỏng vì đổi code thì xóa test đó, không sửa.

## Có điểm chưa rõ
Hỏi người dùng trước khi làm. Hỏi ngắn, nêu các phương án và khuyến nghị. Không tự giả định rồi viết luôn.

## Khi xong đợt
Làm đúng mục "Khi code xong một đợt" trong `roadmap/ROADMAP.md`: tick ✅ kèm ngày (checkbox, tiêu đề, bảng Tiến độ), điền **✅ Đã làm**, in ra chat **khối hướng dẫn thủ công** theo mẫu (setup, lệnh kiểm tra, bước test tay kèm 375px/1280px, lệnh git gợi ý, "➡️ Đợt tiếp" kèm prompt mẫu đã điền, kể cả khi đợt kế thuộc Claude Code), rồi **DỪNG**.
