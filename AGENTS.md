# AGENTS.md — Tộc Phả (dành cho Antigravity)

> File này cho agent của **Antigravity** (Gemini). Nguồn quy tắc chính là `CLAUDE.md`, **mọi quy tắc trong đó đều áp dụng**. File này chỉ thêm những điều Antigravity cần biết vì không có hook và skill của Claude Code (DECISIONS #83).

## Đầu mỗi phiên
1. Đọc `CLAUDE.md` (tổng quan, thuật ngữ, quy ước) và `roadmap/ROADMAP.md` (mục Quy tắc, bảng Tiến độ, mục của đợt được giao).
2. Chỉ nhận đợt có cột **Công cụ = Antigravity** trong bảng Tiến độ (hiện là Đợt 11, 18, 19, 20, 21, 22, 23). Đợt ghi Claude Code thì dừng và báo người dùng.
3. Đọc đúng các file mà prompt của đợt nêu, gồm:
   - `.claude/rules/frontend.md`, `.claude/rules/security.md`, `.claude/rules/git.md`;
   - `docs/DESIGN.md` trước khi làm UI;
   - các mục IDEA và DECISIONS mà prompt nêu.
   `docs/DECISIONS.md` thắng `roadmap/IDEA.md` khi mâu thuẫn.

## Thuật ngữ bắt buộc
- **Tài khoản** (user): người đăng nhập, vai trò Admin hoặc User. **Thành viên** (member): người trong gia phả, là dữ liệu nội dung.
- Hai khái niệm khác nhau, liên kết 1–1 và không bắt buộc ("Tôi là ai"). Giao diện không dùng lẫn hai từ này.

## Điều cấm (Claude Code chặn bằng hook, ở đây phải tự giữ)
- Không đọc, tạo hay sửa file `.env*` (trừ `.env.example`). Không đưa bí mật hay token vào code, lớp giả lập, hay localStorage.
- Không sửa file Flyway `V*.sql` đã có.
- Không sửa gì trong `apps/backend/`: GĐ A chỉ làm frontend.
- Không sửa tay `apps/frontend/src/services/schema.d.ts`: chỉ sinh bằng `npm run gen:api`.
- Trong `shared/api/openapi.yaml` chỉ thêm phần của đợt đang làm. Không đổi hợp đồng của đợt khác.
- **Không tạo dữ liệu giả.** Chỉ có 28 thành viên ở `shared/fixtures/seed/members.json` và dữ liệu người dùng tự nhập. Dữ liệu mẫu chỉ được nằm trong test.
- Không commit, push, tạo PR khi người dùng chưa yêu cầu. Mỗi đợt một nhánh `dot-NN-<ten>`.
- Không làm việc ngoài checklist của đợt. Thấy việc cần làm thêm thì ghi vào mục ghi chú của đợt.
- Không chạy song song với phiên Claude Code trên cùng repo.

## Skill và kiểm tra
- **Bắt buộc dùng skill `ui-ux-pro-max`** (`.agents/skills/ui-ux-pro-max`) cho mọi phần UI. Không dùng được thì dừng và báo người dùng.
- Không có `run`, `dataviz`, `code-review`, `security-review`, `dot-close` của Claude Code. Thay bằng:
  - `npm run lint`, `npm run build`, `npm test` phải pass. Có sửa hợp đồng thì thêm `npm run lint:api` và `npm run gen:api`.
  - Chạy `npm run dev:mock` (trong `apps/frontend`, backend dev thật phải chạy cho đăng nhập), rồi tự kiểm tra bằng trình duyệt của Antigravity ở khổ **375px** và **1280px**: không cuộn ngang, chữ nền ≥16px, vùng chạm ≥44px, focus nhìn rõ.
  - Tự rà các điểm phân quyền của đợt: ẩn nút hoặc menu với User, và handler giả lập trả 403 hoặc `ProblemDetail` đúng như backend.

## Có điểm chưa rõ
Hỏi người dùng trước khi làm. Hỏi ngắn, nêu các phương án và khuyến nghị. Không tự giả định rồi viết luôn.

## Khi xong đợt
Làm đúng mục "Khi xong một đợt" trong `roadmap/ROADMAP.md`:
- tick `- [x]` kèm ngày;
- đổi ⬜ ở tiêu đề và ở bảng Tiến độ thành `✅ YYYY-MM-DD`;
- điền **✅ Đã làm** (có ghi rõ phần đã tự kiểm tra ở 375px và 1280px), cập nhật 🔧 và 🧪 nếu khác dự kiến;
- in khối **"➡️ Đợt tiếp"** ra chat theo mẫu, kể cả khi đợt kế thuộc Claude Code;
- in bảng `skill | đã dùng (có/không)`;
- rồi **DỪNG**.
