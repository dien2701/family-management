# ROADMAP — Tộc Phả

> Mỗi phiên **chỉ làm một đợt**. **Không đọc cả file này**: chỉ đọc mục Quy tắc, bảng Tiến độ và mục của đợt được giao (tìm theo tiêu đề `### Đợt N`).
> Đặc tả: `roadmap/IDEA.md` (bản chốt v2). Quyết định: `docs/DECISIONS.md` (thắng IDEA; mục M #84 về tiết kiệm token thắng mọi mục trước). Giao diện: `docs/DESIGN.md`.
> Đợt 0–10 đã xong, chi tiết ở `roadmap/DONE.md` (chỉ mở khi cần tra cứu).

## Quy tắc
- Thứ tự: **GĐ A** toàn bộ frontend (chế độ giả lập) → **GĐ B** toàn bộ backend → **GĐ C** nối và deploy. Làm lần lượt, không chạy song song hai công cụ.
- **Hợp đồng trước (#70):** API mới thì viết vào `shared/api/openapi.yaml` trước, AI chạy `npm run gen:api` (sinh kiểu, không phải bước kiểm tra), rồi mới làm UI/BE. Không tạo dữ liệu giả (#71).
- **Tiết kiệm token (DECISIONS #84):**
  - AI **không** viết test mới, **không** review (code-review, security-review), **không** chạy lint/build/test/verify, **không** mở app hay trình duyệt. Bạn tự chạy và báo lỗi lại.
  - Test cũ vẫn giữ và vẫn chạy trong CI. Đổi code làm test cũ hỏng thì **xóa test đó**, không sửa.
  - AI chỉ đọc đúng các file/mục ghi ở dòng thứ hai của đợt (IDEA §…, DECISIONS #…); `.claude/rules/*` tự nạp theo thư mục. FE đọc thêm `docs/DESIGN.md`.
  - Skill duy nhất: `ui-ux-pro-max` cho đợt FE.
- **Công cụ (#83):** Antigravity (chế độ Planning) cho đợt FE nhẹ 11, 18–19, 20–21, 22, 23; còn lại Claude Code. Model/effort theo bảng Tiến độ: Opus chỉ ở Đợt 14; effort `high` chỉ cho đợt cây, quyền/tài khoản, AI; còn lại `medium`.
- **Khi code xong một đợt** (tick ngay, không chờ bạn chạy kiểm tra):
  1. `- [ ]` → `- [x] … ✅ YYYY-MM-DD`; ⬜ ở tiêu đề và bảng Tiến độ → `✅ YYYY-MM-DD`.
  2. Điền **✅ Đã làm** (2–4 dòng + file chính, việc phát sinh ghi "Việc nên làm thêm"); sửa 🔧/🧪 nếu khác dự kiến.
  3. In ra chat **khối hướng dẫn thủ công** theo mẫu dưới, rồi DỪNG. Bạn chạy thấy lỗi thì báo ngay trong phiên đó.

  ````text
  🔧 Setup: <mục 🔧 của đợt, hoặc "Không có">
  ▶️ Lệnh kiểm tra (bạn tự chạy):
     FE (apps/frontend): npm run lint ; npm run build   [+ npm run lint:api nếu có sửa openapi.yaml]
     BE (apps/backend):  .\mvnw.cmd compile            [muốn chạy test cũ: .\mvnw.cmd verify, cần Docker]
     Chạy app: FE npm run dev:mock (GĐ A) | BE .\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
  🧪 Test tay: <các bước 🧪 của đợt; FE thêm: xem ở 375px và 1280px (DevTools > Toggle device)>
  💾 Git gợi ý: git checkout -b dot-NN-<ten> ; git add -A ; git commit -m "feat(<module>): ..." ; git push -u origin dot-NN-<ten>
  ➡️ Đợt tiếp: Đợt N — <Tên> · Công cụ <…> · Model <…> · Effort/Chế độ <…>
  ```text
  <prompt mẫu bên dưới, đã điền N và tên>
  ```
  ````

- **Prompt mẫu Claude Code:**
  ```text
  Làm Đợt N — <Tên> theo roadmap/ROADMAP.md. Chỉ đọc mục Quy tắc, bảng Tiến độ và mục Đợt N (không đọc cả file), cùng đúng các mục IDEA/DECISIONS ghi ở dòng thứ hai của đợt. [FE: đọc docs/DESIGN.md, dùng skill ui-ux-pro-max.] Chỉ làm checklist Đợt N. Không viết test, không review, không chạy lint/build/test, không mở app. Chưa rõ thì hỏi tôi trước. Xong: tick ✅, điền ✅ Đã làm, in khối hướng dẫn thủ công theo mẫu rồi DỪNG.
  ```
- **Prompt mẫu Antigravity:**
  ```text
  Làm Đợt N — <Tên> theo roadmap/ROADMAP.md. Đọc AGENTS.md (điều cấm), rồi chỉ đọc mục Quy tắc, bảng Tiến độ và mục Đợt N, cùng đúng các mục IDEA/DECISIONS ghi ở dòng thứ hai của đợt, .claude/rules/frontend.md và docs/DESIGN.md. Dùng skill ui-ux-pro-max (.agents/skills/ui-ux-pro-max) cho UI. Chỉ làm checklist Đợt N. Không viết test, không chạy lint/build/test, không mở trình duyệt. Chưa rõ thì hỏi tôi trước. Xong: tick ✅, điền ✅ Đã làm, in khối hướng dẫn thủ công theo mẫu rồi DỪNG.
  ```

## Tiến độ

| Đợt | Tên | Công cụ | Model · Effort | Trạng thái |
|---|---|---|---|---|
| 0–10 | Nền tảng, lịch âm, tài khoản, hợp đồng + giả lập (`roadmap/DONE.md`) | Claude Code | | ✅ 2026-09-25 |
| **GĐ A** | **Frontend (chế độ giả lập)** | | | |
| 11 | Thành viên FE: danh sách, chi tiết | **Antigravity** | Gemini 3.1 Pro · Planning | ✅ 2026-09-25 |
| 12 | Thành viên FE: form, xóa, ảnh đại diện | Claude Code | Sonnet · medium | ⬜ |
| 13 | Người thân, "Tôi là ai" và tự sửa hồ sơ FE | Claude Code | Sonnet · high | ⬜ |
| 14 | Cây FE: mô hình và thuật toán layout | Claude Code | **Opus** · high | ⬜ |
| 15–16 | Cây FE: hiển thị, thêm người, chỉnh sửa và điều hướng | Claude Code | Sonnet · high | ⬜ |
| 17 | Lịch và sự kiện FE | Claude Code | Sonnet · medium | ⬜ |
| 18–19 | Dashboard FE và PWA | **Antigravity** | Gemini 3.8 Flash · Planning | ⬜ |
| 20–21 | Đề xuất sự kiện và Thông báo FE | **Antigravity** | Gemini 3.1 Pro · Planning | ⬜ |
| 22 | Đính kèm và trang Xuất dữ liệu FE | **Antigravity** | Gemini 3.8 Flash · Planning | ⬜ |
| 23 | Quản trị FE: hàng đợi, đã xóa, cấu hình | **Antigravity** | Gemini 3.1 Pro · Planning | ⬜ |
| 24 | Trợ lý AI FE | Claude Code | Sonnet · high | ⬜ |
| 25 | In cây khổ lớn | Claude Code | Sonnet · medium | ⬜ |
| **GĐ B** | **Backend** | | | |
| 26–27 | Gỡ dòng họ BE, Thành viên BE + seed 28 người | Claude Code | Sonnet · high | ⬜ |
| 28 | Người thân, "Tôi là ai" và tự sửa hồ sơ BE | Claude Code | Sonnet · high | ⬜ |
| 29 | Cây BE | Claude Code | Sonnet · high | ⬜ |
| 30 | Upload và đính kèm BE | Claude Code | Sonnet · medium | ⬜ |
| 31 | Sự kiện chung và lịch nhắc BE | Claude Code | Sonnet · medium | ⬜ |
| 32 | Dashboard và quản trị BE | Claude Code | Sonnet · medium | ⬜ |
| 33–34 | Đề xuất sự kiện và Thông báo BE | Claude Code | Sonnet · medium | ⬜ |
| 35 | Web Push BE | Claude Code | Sonnet · medium | ⬜ |
| 36–37 | AI BE: provider, tool, SSE, quota, soạn đề xuất, phạm vi | Claude Code | Sonnet · high | ⬜ |
| 38 | Export BE (Excel, PDF) | Claude Code | Sonnet · medium | ⬜ |
| **GĐ C** | **Nối và phát hành** | | | |
| 39 | Nối FE với BE thật, gỡ lớp giả lập | Claude Code | Sonnet · medium | ⬜ |
| ~~40~~ | ~~E2E Playwright~~ (bỏ theo #84) | | | ❌ |
| 41 | Deploy production | Claude Code | Sonnet · medium | ⬜ |

## ▶️ Đợt đang chờ: Đợt 12 — Thành viên FE: form, xóa, ảnh đại diện
Công cụ **Claude Code** · Model **Sonnet** · Chế độ **medium** · Prompt: dùng **Prompt mẫu Claude Code** ở trên với N = 12.

---

# GIAI ĐOẠN A — FRONTEND (CHẾ ĐỘ GIẢ LẬP)

> Mọi đợt GĐ A chạy frontend bằng `npm run dev:mock` (`VITE_API_MODE=mock`). Đăng nhập, `/api/me` và tài khoản vẫn gọi backend thật (Đợt 2–3, 8), nên backend dev phải đang chạy.
> Mỗi đợt làm theo thứ tự: (1) viết hợp đồng của module trong `shared/api/openapi.yaml` → (2) `npm run gen:api` → (3) handler giả lập → (4) UI.
> Phần cần máy chủ (AI, push, upload, file Excel/PDF từ backend) hiện "Cần kết nối máy chủ" (#72).

### Đợt 11 — Thành viên FE: danh sách, chi tiết ✅ 2026-09-25
IDEA §6.1 · DECISIONS #58, #66, #71
- [x] `features/member`: `api.ts`, `hooks.ts` (TanStack Query, tham số lọc lưu trên URL), `strings.ts`. ✅ 2026-09-25
- [x] Danh sách: ✅ 2026-09-25
  - dạng bảng trên máy tính, dạng thẻ trên điện thoại;
  - sắp xếp theo tên, tuổi, thời gian thêm, đời;
  - tìm không dấu;
  - lọc theo khoảng tuổi, đời, sống/mất, có trên cây;
  - có trạng thái rỗng (khác nhau cho "không có kết quả" và "chưa có ai"), skeleton khi tải, và trạng thái lỗi.
- [x] Trang chi tiết: ✅ 2026-09-25
  - Thẻ hồ sơ navy: avatar hoặc chữ cái đầu, họ tên nguyên văn, badge "Đã mất", ngày mất âm kèm dương (hoặc chỉ ngày/tháng âm), nơi an táng.
  - Các ô liên hệ chỉ hiện khi API có trả.
  - Người chưa có giới tính thì hiện trung tính, không đoán.
- [x] Để chỗ sẵn các khối: Người thân (Đợt 13), Trên cây (Đợt 16), Tệp đính kèm (Đợt 22). ✅ 2026-09-25

**✅ Đã làm:**
- Khởi tạo thư mục tính năng `features/member` (api, hooks, strings).
- Xây dựng trang danh sách `MembersPage` với `MemberFilters` đồng bộ URL Search Params; danh sách hiển thị thẻ trên di động và bảng trên máy tính.
- Xây dựng trang hồ sơ `MemberDetailPage` màu xanh navy (profile card) chuẩn theo thiết kế, đặt khung chờ sẵn các Đợt 13, 16, 22.
- Xóa trang ảo cũ và cập nhật bộ định tuyến (`routes.tsx`).

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. `npm run dev:mock`, vào Thành viên: có 28 người, tất cả đều "Đã mất".
2. Gõ "kai": ra 3 người (Tham, Kai Nhất, Phí Thị Giản). Gõ "hang": ra "Nguyễn Thị Hằng".
3. Mở "Cụ Nguyễn Thị Thêm": ngày mất hiện "01/11 âm lịch", không có năm dương.
4. Mở "Nguyễn Văn Thành": ngày mất 02/05/2025 âm lịch kèm ngày dương tương ứng. Nơi an táng là Kim Hoàng.
5. F5 khi đang lọc: bộ lọc vẫn còn (nằm trên URL). Kiểm tra ở khổ 375px và 1280px.

---

### Đợt 12 — Thành viên FE: form, xóa, ảnh đại diện ⬜
IDEA §6.1, §6.7 · DECISIONS #58, #62, #67, #72
- [ ] Hợp đồng: `POST /api/members`, `PUT /api/members/{id}`, `DELETE /api/members/{id}` (409 `MEMBER_ON_TREE`), `POST /api/files/sign`, `POST /api/files/confirm` (kind AVATAR).
- [ ] Handler giả lập:
  - Tạo và sửa: tính `search_name`. Ngày mất nhập âm mà có năm thì tự đổi sang dương, còn nhập dương thì tự đổi sang âm (bằng `utils/lunar`). Các trường về cái chết chỉ hợp lệ khi đã mất.
  - Xóa: chặn nếu có trên cây; xóa các dòng người thân liên quan (cả dòng trong hồ sơ người đó lẫn dòng người đó xuất hiện ở hồ sơ khác, sau khi Đợt 13 có store người thân) và ghi snapshot "đã xóa" vào store (dùng ở Đợt 23).
  - Upload: trả 503 "Cần kết nối máy chủ".
- [ ] `MemberForm` (RHF + Zod):
  - Chỉ họ tên bắt buộc. Giới tính có 3 lựa chọn Nam / Nữ / Chưa rõ.
  - Khối "Đã qua đời": ngày mất dùng `DualDateInput` (cho phép chỉ ngày/tháng âm), ngày giỗ ghi đè, nơi an táng.
  - Ngày sinh dùng `DualDateInput` (cho phép chỉ năm). Chọn sinh nhật Dương hoặc Âm.
  - Có tên húy, nhãn, tiểu sử, SĐT, email.
  - Tách nhóm "đã mất" (đã qua đời, ngày mất, ngày giỗ ghi đè, nơi an táng) thành một khối riêng trong form và trong schema, có prop `lockDeathFields` để Đợt 13 dùng cho User tự sửa hồ sơ (#76).
- [ ] Nút Xóa (chỉ Admin) kèm xác nhận. Khi bị chặn thì giải thích "Hãy gỡ người này khỏi cây trước".
- [ ] `AvatarUpload` (`components/shared`): chọn ảnh, kiểm tra định dạng và giới hạn 10 MB ngay ở máy, có preview. Ở chế độ giả lập thì báo "Cần kết nối máy chủ".
- [ ] Ở đợt này chỉ Admin thấy các nút Thêm, Sửa, Xóa. Nút "Sửa hồ sơ của tôi" cho User làm ở Đợt 13 (cần liên kết "Tôi là ai").

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Admin thêm một thành viên chỉ có họ tên: lưu được, và người đó hiện trong danh sách.
2. Sửa "Cụ Nguyễn Văn Tỵ": đặt giới tính Nam, lưu. F5 vẫn còn (dữ liệu nằm trong localStorage).
3. Nhập ngày mất âm 15/6 nhuận 2025: ngày dương được tự điền.
4. Xóa thành viên vừa thêm: xóa được. Đăng nhập bằng User: không thấy nút Thêm, Sửa, Xóa.
5. Chọn ảnh 12 MB: bị báo quá kích thước ngay.

---

### Đợt 13 — Người thân, "Tôi là ai" và tự sửa hồ sơ FE ⬜
IDEA §2, §6.1, §6.2, §6.3, §6.7, §6.10 · DECISIONS #71, #75, #76, #78, #79–#82
- [ ] Hợp đồng:
  - Người thân: `GET /api/members/{id}/relatives` (mỗi dòng có `id`, người thân dạng `MemberSummary`, `label`), `POST /api/members/{id}/relatives` (`relativeMemberId`, `label`), `PUT /api/members/{id}/relatives/{relativeId}` (`label`), `DELETE /api/members/{id}/relatives/{relativeId}`. Lỗi: 409 `RELATIVE_EXISTS`, 400 khi tự thêm chính mình, 403 khi không phải chủ hồ sơ hay Admin.
  - Liên kết: `POST /api/link-requests`, `GET /api/link-requests/mine`, `DELETE /api/me/member-link`, và cho Admin `GET /api/link-requests?status=PENDING`, `POST /api/link-requests/{id}/approve`, `POST /api/link-requests/{id}/reject`.
  - Admin gán/hủy liên kết trực tiếp (#80): `PUT /api/admin/accounts/{id}/member-link` (`memberId`) và `DELETE /api/admin/accounts/{id}/member-link`. Lỗi: 409 `MEMBER_ALREADY_LINKED` (thành viên đã có tài khoản khác), 409 `ACCOUNT_ALREADY_LINKED` (tài khoản đã liên kết người khác), 409 `INVALID_ACCOUNT_STATE` (tài khoản chưa duyệt), 404 khi không có tài khoản hoặc thành viên.
  - `AccountAdminResponse` (của `GET /api/admin/accounts`) thêm thành viên đang liên kết (id và họ tên, `null` nếu chưa có).
  - `PUT /api/members/{id}`: bổ sung quyền của chủ hồ sơ (#76) và lỗi 403 `DEATH_FIELDS_ADMIN_ONLY`. `POST /api/files/sign` và `/confirm` với `kind=AVATAR`: chủ hồ sơ được gọi cho hồ sơ của mình (#78).
- [ ] Handler giả lập:
  - Người thân: một chiều; một người chỉ xuất hiện một lần trong danh sách của một hồ sơ; không tự thêm chính mình; nhãn bắt buộc, cắt khoảng trắng, dài ≤ 50 ký tự; người thân phải là thành viên đã có. Chỉ chủ hồ sơ (theo `memberId` của `/api/me` đã bọc) hoặc Admin được ghi.
  - Sửa hồ sơ: User chỉ sửa được hồ sơ của mình. Đổi giá trị ở nhóm "đã mất" thì trả 403 `DEATH_FIELDS_ADMIN_ONLY`, giá trị giữ nguyên thì bỏ qua.
  - Liên kết 1–1 (#80): không liên kết được thành viên đã có tài khoản khác, tài khoản đã liên kết thì phải hủy trước. User tự hủy liên kết của mình, Admin hủy được của bất kỳ ai.
  - Admin gán trực tiếp: chỉ tài khoản đã duyệt; yêu cầu "Đây là tôi" đang chờ của tài khoản đó tự hủy.
  - **Chép email (#81):** khi liên kết có hiệu lực (Admin duyệt yêu cầu hoặc Admin gán), nếu hồ sơ chưa có email thì chép email của tài khoản sang. Hồ sơ đã có email thì giữ nguyên. Không chép họ tên, ảnh, SĐT. Hủy liên kết không xóa email đã chép.
  - Khóa hoặc từ chối tài khoản không gỡ liên kết (#82).
  - **Bọc** `GET /api/me` để gắn `memberId` từ store. **Bọc** `GET /api/admin/accounts` (backend thật) để gắn thành viên đang liên kết từ store.
  - Handler xóa thành viên (Đợt 12): dọn các dòng người thân ở cả hai phía, gỡ liên kết của tài khoản (tài khoản vẫn còn).
- [ ] Khối **Người thân** trên hồ sơ:
  - danh sách "Tên — nhãn", mỗi tên là một link;
  - chủ hồ sơ và Admin có "Thêm người thân": chọn thành viên (tìm không dấu, loại chủ hồ sơ và những người đã có trong danh sách), nhập nhãn; sửa nhãn và xóa được;
  - người khác chỉ xem.
- [ ] **Tự sửa hồ sơ:** trên hồ sơ của chính mình, User thấy nút "Sửa hồ sơ của tôi". Nút mở `MemberForm` với `lockDeathFields`: nhóm "đã mất" chỉ để xem, kèm ghi chú "Chỉ Admin sửa được phần này". `AvatarUpload` cũng mở cho chủ hồ sơ (ở chế độ giả lập vẫn báo "Cần kết nối máy chủ").
- [ ] Trang **"Tôi là ai"** (menu Thêm): tìm thành viên, bấm "Đây là tôi", có trạng thái đang chờ, và hủy liên kết. Hồ sơ của chính mình có dấu "Đây là bạn".
- [ ] Quản trị > **Yêu cầu liên kết**: danh sách chờ, Duyệt, Từ chối, badge số đang chờ.
- [ ] Quản trị > **Tài khoản** (trang của Đợt 10): mỗi dòng hiện thành viên đang liên kết (link tới hồ sơ). Tài khoản đã duyệt mà chưa liên kết có "Gán thành viên" (hộp chọn thành viên chưa có tài khoản, tìm không dấu, bottom sheet trên điện thoại). Tài khoản đã liên kết có "Hủy liên kết" (qua `ConfirmDialog`). Lỗi 409 hiện đúng thông báo.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Admin mở hồ sơ "Nguyễn Văn Kỷ", thêm người thân "Cụ Nguyễn Văn Uyên" với nhãn "cha". Hồ sơ Kỷ hiện "Cụ Nguyễn Văn Uyên — cha". Hồ sơ Uyên không có dòng nào về Kỷ.
2. Thêm Uyên vào hồ sơ Kỷ lần nữa: bị báo đã có. Mở hồ sơ Uyên, thêm Kỷ với nhãn "con": thêm được.
3. Admin thêm một thành viên thử còn sống. User chọn "Đây là tôi" cho người đó, Admin duyệt ở Quản trị > Yêu cầu liên kết. Hồ sơ đó hiện "Đây là bạn".
4. User đó bấm "Sửa hồ sơ của tôi", sửa tiểu sử và lưu: có hiệu lực ngay. Nhóm "đã mất" bị khóa.
5. User đó thêm người thân vào hồ sơ của mình: thêm được. Mở hồ sơ người khác: không có nút sửa và không có nút thêm người thân.
6. Admin mở hồ sơ ở bước 3 (bằng tài khoản Admin): ô email là email đăng nhập của User đó. Admin hủy liên kết ở Quản trị > Tài khoản: hồ sơ mất dấu "Đây là bạn", email vẫn còn.
7. Admin sửa email hồ sơ thành địa chỉ khác, rồi dùng "Gán thành viên" để gán lại hồ sơ đó cho User: gán được, email hồ sơ giữ địa chỉ Admin đã sửa. Gán hồ sơ đó cho một tài khoản thứ hai: bị báo đã có liên kết.
8. *(Dữ liệu thử ở các bước trên chỉ để kiểm tra, xong thì "Khôi phục dữ liệu gốc".)*

---

### Đợt 14 — Cây FE: mô hình và thuật toán layout ⬜
IDEA §8 · DECISIONS #34, #60, #61
- [ ] Hợp đồng `GET /api/tree`: trả `nodes` (`id`, `memberId|null`, `parentNodeId`, `coParentNodeId`, `sortOrder`, cùng tóm tắt thành viên gồm họ tên, giới tính, đã mất, năm sinh–mất, nhãn, avatar) và `spouses` (`nodeId`, `spouseNodeId`, `order`). Đời **không** nằm trong response, frontend tự tính.
- [ ] `src/utils/tree/` (hàm thuần, lớp giả lập và UI dùng chung):
  - tính đời theo từng cây rời; lấy tổ tiên, con cháu, nhánh;
  - danh sách thành viên chưa có trên cây;
  - kiểm tra hợp lệ cho mọi thao tác theo #60 và #61: "+ Cha/Mẹ" chỉ ở Đời 01, bắt buộc chọn cặp khi có ≥ 2 vợ/chồng, ô vợ/chồng không có "+ Vợ/Chồng", xóa ô trống, di chuyển chặn vòng, mỗi thành viên chỉ có một ô.
- [ ] `features/tree/layout/layoutTree.ts`: hàm thuần, kết quả xác định.
  - Đầu vào: đồ thị cùng options (`collapsedIds`, `rootNodeId`, `maxDepth`, `focusNodeId`).
  - Đầu ra: toạ độ các ô, đường nối (hôn nhân, cặp đến con, một mình cha/mẹ đến con), và `y` của từng hàng đời.
  - Quy tắc: mỗi đời một hàng. Đơn vị xếp là ô thuộc dòng cùng các vợ/chồng xếp hai bên theo `order`. Con đi xuống từ trung điểm của đúng cặp. Anh em xếp theo `sortOrder`. Ô trống có cùng kích thước. Nén cây con để không chồng lấn. Các cây rời đặt cạnh nhau.
- [ ] Trang `/dev/cay` (chỉ có ở chế độ dev): vẽ SVG thô từ vài đồ thị mẫu viết ngay trong trang (nhiều vợ + ô trống, 2 gốc không nối, ô trống có con cháu; tên "Ô 1, Ô 2…", không dùng người thật) để tự kiểm bằng mắt.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Mở `/dev/cay`, chọn ca "nhiều vợ + ô trống": con nối đúng từ trung điểm của cặp, ô trống có viền đứt, không có ô nào chồng lên nhau.
2. Chọn ca "2 gốc không nối": hai cây đứng cạnh nhau, cùng ở Đời 01.

---

### Đợt 15–16 — Cây FE: hiển thị, thêm người, chỉnh sửa và điều hướng ⬜
IDEA §6.1, §8 · DECISIONS #60–62, #71
**Phần 15 — Cây FE: hiển thị và thêm người**
- [ ] Hợp đồng: `POST /api/tree/roots`, `POST /api/tree/nodes/{id}/children` (có `coParentNodeId`), `POST /api/tree/nodes/{id}/spouses`, `POST /api/tree/nodes/{id}/parent`. Body chứa `memberId`. Lỗi trả ProblemDetail với mã như `TREE_NEEDS_CO_PARENT`, `TREE_PARENT_ONLY_AT_TOP`, `MEMBER_ALREADY_ON_TREE`.
- [ ] Handler giả lập cho `GET /api/tree` và các thao tác thêm. Store cây nằm trong localStorage và **lúc đầu trống**. Kiểm tra hợp lệ bằng `utils/tree`.
- [ ] Trang Cây:
  - React Flow chỉ hiển thị kết quả của `layoutTree`.
  - `MemberNode` theo DESIGN §5: họ tên nguyên văn, ảnh hoặc chữ cái đầu, người đã mất có viền xám và ✝ kèm năm mất, có nhãn.
  - Ô trống viền đứt. Ô của người chưa rõ giới tính vẽ trung tính.
  - Đường nối hôn nhân (kèm thứ tự) và đường cha mẹ–con.
- [ ] Cột trái cố định "Đời 01…N", đồng bộ trục y với viewport. Zoom, kéo, pinch. Bật `onlyRenderVisibleElements`.
- [ ] Cây trống:
  - User thấy trạng thái rỗng "Cây chưa được dựng".
  - Admin thấy nút **"+ Thêm người gốc"**, và thêm được nhiều gốc.
- [ ] Admin thấy ba nút "+" trên ô (dưới: Con, cạnh: Vợ/Chồng, trên: Cha/Mẹ), chỉ hiện ở chỗ được phép theo `utils/tree`.
  - Mỗi nút mở hộp chọn **thành viên chưa có trên cây**, có tìm không dấu. Hộp này là bottom sheet trên điện thoại.
  - "+ Con" trên người có ≥ 2 vợ/chồng thì hỏi thêm "Con với ai".

**Phần 16 — Cây FE: chỉnh sửa và điều hướng**
- [ ] Hợp đồng:
  - `DELETE /api/tree/nodes/{id}/member` (gỡ khỏi cây, ô thành ô trống);
  - `PUT /api/tree/nodes/{id}/member` (điền ô trống);
  - `DELETE /api/tree/nodes/{id}` (xóa ô trống, lỗi `TREE_SLOT_NOT_EMPTY` hoặc `TREE_SLOT_HAS_LINKS`);
  - `POST /api/tree/nodes/{id}/move` (`newParentNodeId|null`, `coParentNodeId`; lỗi `TREE_CYCLE`);
  - `PUT /api/tree/nodes/{id}/order`;
  - `PUT /api/tree/nodes/{id}/co-parent`.

  Kèm handler giả lập.
- [ ] Menu khi bấm vào ô:
  - Mọi người thấy "Xem hồ sơ" và "Xem cây từ người này".
  - Admin thấy thêm "Gỡ khỏi cây", "Di chuyển nhánh", "Đổi thứ tự", "Đổi cặp cha–mẹ", và "Xóa ô" (với ô trống).
  - Bấm vào ô trống thì mở hộp chọn người để điền.
- [ ] Di chuyển nhánh:
  - Máy tính (≥ 1024px): kéo thả, hiện vùng thả hợp lệ, thả sai chỗ thì báo lý do.
  - Điện thoại: dùng menu "Di chuyển nhánh" rồi chọn ô đích hoặc "Thành gốc mới".
  - Luôn có hộp xác nhận ghi số người trong nhánh.
- [ ] Điều hướng:
  - thu gọn hoặc mở rộng từng nhánh;
  - ô tìm kiếm nhảy tới người cần tìm và làm nổi bật;
  - "Xem cây từ người này";
  - **"Xem tổ tiên của tôi"** (cần đã liên kết và có trên cây, nếu không thì giải thích lý do);
  - trên điện thoại mặc định hiện 3 đời quanh người được chọn (hoặc chính mình), chạm để mở rộng.
- [ ] Hồ sơ thành viên: khối **"Trên cây"** gồm đời, cha/mẹ, vợ/chồng, con theo cây, và nút "Xem trên cây". Người chưa có trên cây thì ghi rõ. Handler danh sách thành viên lọc được theo đời và theo có trên cây.
- [ ] Xóa thành viên đang có trên cây (Đợt 12) nay bị chặn thật.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
_Phần 15:_
1. User vào Cây: thấy "Cây chưa được dựng".
2. Admin bấm "+ Thêm người gốc", chọn một người: người đó hiện ở Đời 01.
3. Bấm "+" cạnh để thêm 2 vợ/chồng, rồi bấm "+" dưới: phải hỏi "Con với ai". Con hiện đúng dưới cặp đã chọn.
4. Bấm "+" trên của người gốc: người mới thành Đời 01, cả cây dịch xuống. Ô ở Đời 02 không còn nút "+" trên.
5. Hộp chọn không còn những người đã có trên cây. Ở khổ 375px thì pinch và kéo đều mượt.
6. *(Xong thì "Khôi phục dữ liệu gốc" nếu chỉ thử nghiệm.)*

_Phần 16:_
1. Dựng một cây thử có 3 đời. Gỡ người ở giữa: ô của họ thành ô trống, con cháu vẫn nối vào ô trống, và người đó vẫn còn trong danh sách thành viên.
2. Bấm ô trống, điền một người khác: cây vẽ lại đúng.
3. Kéo một nhánh vào trong chính con cháu của nó: bị chặn. Kéo sang một ô khác: cả nhánh đi theo.
4. Xóa ô trống còn con: bị chặn. Xóa ô trống không còn liên kết: xóa được.
5. Liên kết tài khoản với một người trên cây rồi bấm "Xem tổ tiên của tôi": chỉ hiện đường đi lên các đời trên.
6. Ở khổ 375px chỉ thấy 3 đời, chạm để mở rộng.

---

### Đợt 17 — Lịch và sự kiện FE ⬜
IDEA §6.5, §7 · DESIGN §1 (màu sự kiện) · DECISIONS #31, #65, #72
- [ ] Hợp đồng:
  - CRUD `/api/events` (Admin ghi, mọi người đọc; `year = null` nghĩa là lặp hằng năm);
  - `GET /api/calendar/upcoming?days=7|15|30|90|365&type=&sort=asc|desc`;
  - `GET /api/calendar/month?year=&month=&mode=solar|lunar`;
  - `GET /api/calendar/recent?limit=10`.
- [ ] `src/utils/occurrences/` (hàm thuần): sinh các lần xảy ra trong một khoảng ngày.
  - **Giỗ:** người đã mất có ngày mất âm hoặc ngày ghi đè, theo `AnniversaryRules`. Ghi "giỗ lần thứ N" nếu biết năm mất.
  - **Sinh nhật:** người còn sống có ngày/tháng sinh. Ghi "tròn N tuổi" nếu biết năm sinh.
  - **Sự kiện chung.**
  - Mỗi lần xảy ra có một `eventKey` ổn định.
- [ ] Handler giả lập cho sự kiện và lịch, dùng `utils/occurrences` trên store.
- [ ] Tab **"Sắp tới"**:
  - chọn khoảng thời gian, lọc theo loại, sắp xếp;
  - mỗi dòng có icon và màu theo loại, kèm "còn N ngày", "giỗ lần thứ N", "tròn N tuổi".
- [ ] Tab **"Lịch tháng"**:
  - mỗi ô có ngày dương lớn, ngày âm nhỏ và chấm màu;
  - nút gạt "Xem theo âm";
  - bấm vào ngày thì mở sheet danh sách sự kiện;
  - dưới 768px hiện danh sách theo tuần.
- [ ] Form sự kiện chung (chỉ Admin): dùng `DualDateInput`, chọn lặp hằng năm hoặc một lần, có sửa và xóa. Chú giải màu có kèm chữ.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Vào Lịch > Sắp tới, chọn "Cả năm": thấy giỗ của các cụ có ngày mất (ví dụ "Giỗ Cụ Nguyễn Văn Sửu — 11/7 âm — giỗ lần thứ N").
2. Lịch tháng 12 âm (bật "Xem theo âm"): có giỗ Bà Trần Thị Nhung (29/12) và Nguyễn Văn Thông (29/12).
3. Admin tạo sự kiện "Giỗ tổ" lặp hằng năm theo âm: sự kiện hiện ở cả hai tab.
4. Ở khổ 375px, lịch tháng chuyển thành danh sách theo tuần.

---

### Đợt 18–19 — Dashboard FE và PWA ⬜
IDEA §1, §6.8, §9 · DECISIONS #38, #71
**Phần 18 — Dashboard FE**
- [ ] Hợp đồng `GET /api/dashboard`:
  - `totalMembers`, `living`, `deceased`, `onTree`, `maxGeneration`;
  - `nextEvent`, `recentEvents[10]`, `upcoming30[]`;
  - riêng Admin có thêm `pendingAccounts`, `pendingProposals`, `pendingLinkRequests`.
- [ ] Handler giả lập tính từ store. Riêng `pendingAccounts` lấy từ backend thật (`/api/admin/accounts?approval=WAITING`). `pendingProposals` bằng 0 cho tới Đợt 20.
- [ ] Trang Tổng quan:
  - hàng stat tile (theo mục "Thẻ số liệu" của `docs/DESIGN.md`, số dạng tabular);
  - thẻ navy "Sắp tới" có đếm ngược;
  - danh sách 30 ngày tới và danh sách 10 sự kiện vừa qua.
  - Admin có thẻ "Chờ duyệt" gồm 3 số, bấm vào dẫn tới trang tương ứng.
  - Có trạng thái rỗng khi cây còn trống.

**Phần 19 — PWA**
- [ ] `vite-plugin-pwa` theo kiểu **injectManifest**, có sẵn chỗ cho handler `push` ở Đợt 21. Manifest gồm tên "Tộc Phả", `theme_color` là màu primary, `display: standalone`, và bộ icon 192/512/maskable.
- [ ] Service worker precache app shell. Dùng NetworkFirst cho `GET /api/**`, trừ `/api/auth/**` và `/api/me`. Không cache request ghi. Ở chế độ giả lập không đăng ký service worker.
- [ ] Toast "Có bản mới" kèm nút tải lại. Banner "Đang offline — dữ liệu có thể cũ".
- [ ] Hướng dẫn cài: Android và máy tính dùng `beforeinstallprompt`, iOS hiện hướng dẫn "Chia sẻ → Thêm vào MH chính".
- [ ] Chạy Lighthouse trên bản build: đạt tiêu chí cài đặt PWA, Performance trên mobile ≥ 80.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
_Phần 18:_
1. Tổng quan với dữ liệu gốc: Tổng 28, Còn sống 0, Đã mất 28, Trên cây 0.
2. Admin thêm một người vào cây, quay lại Tổng quan: Trên cây 1, Số đời 1.
3. Có tài khoản chờ duyệt: thẻ Chờ duyệt của Admin hiện đúng số, bấm vào mở Quản trị > Tài khoản.
4. Kiểm tra ở khổ 375px và 1280px, số không bị nhảy độ rộng.

_Phần 19:_
1. `npm run build && npm run preview`, mở Chrome: có biểu tượng cài đặt, cài được.
2. Tắt mạng (DevTools Offline): hiện banner offline, các trang đã xem vẫn mở được.
3. Build lại có thay đổi: toast "Có bản mới" hiện ra.

---

### Đợt 20–21 — Đề xuất sự kiện và Thông báo FE ⬜
IDEA §6.6, §9 · DECISIONS #65, #71, #72, #77
**Phần 20 — Đề xuất sự kiện FE**
- [ ] Hợp đồng:
  - `POST /api/proposals` (`targetType` chỉ có `EVENT`, `action` CREATE|UPDATE|DELETE, `targetId`, `payload`);
  - `GET /api/proposals/mine`;
  - cho Admin: `GET /api/proposals?status=PENDING`, `GET /api/proposals/count`, `POST /api/proposals/{id}/approve` (có thể gửi kèm payload đã chỉnh), `POST /api/proposals/{id}/reject` (kèm `note`).
- [ ] Handler giả lập:
  - tính diff, lưu `baseUpdatedAt`;
  - khi duyệt thì áp dụng vào store sự kiện;
  - báo `conflict` nếu sự kiện đã bị sửa sau `baseUpdatedAt`.
- [ ] Thêm `mode: 'direct' | 'proposal'` cho form sự kiện. User thấy "Đề xuất sự kiện" (thêm mới) và "Đề xuất sửa/xóa" trên từng sự kiện. Không cần liên kết "Tôi là ai".
- [ ] Trang **"Đề xuất của tôi"**: hiện trạng thái và lý do bị từ chối.
- [ ] Quản trị > **Đề xuất**:
  - hàng đợi, và badge trên menu;
  - trang chi tiết có diff 2 cột, sửa payload, Duyệt, Từ chối kèm lý do;
  - banner cảnh báo khi `conflict`.
  - Tổng quan lấy `pendingProposals` là số thật.

**Phần 21 — Thông báo FE**
- [ ] Hợp đồng:
  - `GET /api/notifications` (phân trang), `GET /api/notifications/unread-count`, `POST /api/notifications/{id}/read`, `POST /api/notifications/read-all`;
  - `GET/PUT /api/notifications/preferences`;
  - `GET /api/push/public-key`, `POST/DELETE /api/push/subscribe`, `POST /api/push/test`.
- [ ] Handler giả lập: hộp thư rỗng (không tạo thông báo giả), tùy chọn lưu vào store, các endpoint push trả 503 "Cần kết nối máy chủ".
- [ ] Chuông trên Header và BottomNav, có badge số chưa đọc (refetch khi cửa sổ được focus lại). Trang hộp thư có "Đánh dấu đã đọc hết", bấm vào thông báo thì đi tới `link`.
- [ ] Trang Cài đặt thông báo:
  - công tắc cho 3 loại, các mốc nhắc, giờ nhận;
  - trạng thái "Thiết bị này: đã/chưa nhận thông báo";
  - nút "Bật thông báo" (xin quyền rồi subscribe) và nút "Gửi thử".
- [ ] Service worker: sự kiện `push` thì hiện notification, `notificationclick` thì mở hoặc focus app tại `link`.
- [ ] Hướng dẫn ở lần đăng nhập đầu, tùy thiết bị:
  - Android và máy tính: bấm "Cho phép".
  - iOS dưới 16.4: báo không hỗ trợ.
  - iOS từ 16.4 mà chưa cài app: hướng dẫn "Thêm vào MH chính" trước.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
_Phần 20:_
1. User (chưa liên kết cũng được) đề xuất sự kiện "Họp họ đầu năm" ngày 10/1 âm. Admin duyệt: sự kiện hiện trên lịch, User thấy trạng thái "Đã duyệt".
2. User đề xuất đổi địa điểm của sự kiện đó. Admin từ chối kèm lý do: User thấy lý do.
3. Admin sửa sự kiện trong lúc một đề xuất sửa đang chờ: mở đề xuất đó thấy banner xung đột.

_Phần 21:_
1. Chuông hiện 0. Hộp thư có trạng thái rỗng.
2. Tắt "Sinh nhật", đổi giờ nhận thành 20h, F5: vẫn giữ nguyên.
3. Bấm "Bật thông báo" ở chế độ giả lập: xin quyền được, nhưng subscribe báo "Cần kết nối máy chủ".
4. Mô phỏng thiết bị iPhone iOS 16.4 chưa cài app: hướng dẫn đúng.

---

### Đợt 22 — Đính kèm và trang Xuất dữ liệu FE ⬜
IDEA §6.7, §6.9 · DECISIONS #67, #72, #83
- [ ] Hợp đồng:
  - mở rộng sign/confirm cho `kind=DOCUMENT` (có `title`, `memberId|null`);
  - `GET /api/members/{id}/attachments`, `GET /api/attachments/common`, `DELETE /api/attachments/{id}`;
  - `GET /api/attachments/{id}/download` (trả URL có chữ ký, hết hạn sau thời gian ngắn);
  - `GET /api/files/quota`;
  - báo cáo (chuyển từ Đợt 25): `GET /api/reports/members.xlsx`, `GET /api/reports/events.xlsx?year=`, `GET /api/reports/members.pdf`, `GET /api/reports/memorials.pdf?lunarYear=`.
- [ ] Handler giả lập: danh sách rỗng, quota 0 / 1 GB, upload, tải về và 4 báo cáo đều trả 503 "Cần kết nối máy chủ".
- [ ] Tab **"Tệp đính kèm"** trên hồ sơ: lưới ảnh thu nhỏ và danh sách tài liệu.
  - Admin upload bằng kéo thả hoặc chọn file, có thanh tiến độ.
  - Báo lỗi ngay khi sai định dạng hoặc quá 10 MB.
- [ ] Xem trước: ảnh mở bằng lightbox, PDF mở ở tab mới, docx/xlsx thì tải về. Admin có nút xóa kèm xác nhận.
- [ ] Trang **"Tài liệu chung"** (menu Thêm).
- [ ] Thanh quota "x MB / 1 GB" dạng meter (`role="meter"` hoặc `<meter>`, không chỉ dựa vào màu), có kèm chữ (hiện cho Admin).
- [ ] Trang **"Xuất dữ liệu"** (menu Thêm, chuyển từ Đợt 25): 4 nút tải (chọn năm hoặc năm âm), có trạng thái đang tải. Ở chế độ giả lập thì báo cần máy chủ.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Hồ sơ bất kỳ > Tệp đính kèm: có trạng thái rỗng. User không thấy nút tải lên.
2. Admin kéo thả file `.exe`: bị báo sai định dạng ngay. Kéo file PDF 11 MB: bị báo quá kích thước.
3. Kéo file PDF hợp lệ: báo "Cần kết nối máy chủ".
4. Thanh quota hiện "0 MB / 1 GB" và đọc được bằng trình đọc màn hình.
5. Thêm > Xuất dữ liệu: bấm từng nút tải, đều báo "Cần kết nối máy chủ", giao diện không treo.

---

### Đợt 23 — Quản trị FE: hàng đợi, đã xóa, cấu hình ⬜
IDEA §6.10 · DECISIONS #55, #62
- [ ] Hợp đồng:
  - `GET/PUT /api/admin/settings` (`policyVersion`, `aiQuotaUser`, `aiQuotaAdmin`, `uploadMaxMb`, `totalQuotaMb`);
  - `GET /api/admin/deleted-members` và `GET /api/admin/deleted-members/{auditId}`.
- [ ] Handler giả lập: cấu hình lưu vào store; danh sách đã xóa lấy từ các snapshot mà thao tác xóa ở Đợt 12 đã ghi.
- [ ] Trang **Quản trị** tổng: các thẻ dẫn tới Tài khoản, Yêu cầu liên kết, Đề xuất, Thành viên đã xóa, Cấu hình. Mỗi thẻ có badge số đang chờ.
- [ ] **Thành viên đã xóa:** danh sách (ai xóa, lúc nào), bấm vào xem snapshot gồm thông tin, các dòng người thân liên quan và danh sách tệp.
- [ ] **Cấu hình:** form RHF + Zod. Khi đổi phiên bản chính sách thì cảnh báo rằng mọi người sẽ phải đồng ý lại.
- [ ] Rà cả khu Quản trị: guard route, ẩn menu với User, không có đường nào tới trang Admin từ giao diện của User.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Admin xóa một thành viên thử (không có trên cây), rồi mở Quản trị > Thành viên đã xóa: thấy snapshot.
2. Đổi lượt AI của User thành 20: lưu được.
3. User gõ thẳng URL của từng trang quản trị: đều bị chặn.

---

### Đợt 24 — Trợ lý AI FE ⬜
IDEA §10 · DECISIONS #72, #73, #77
- [ ] Hợp đồng:
  - `POST /api/ai/chat` trả `text/event-stream`, gồm các event `token`, `draft`, `done`, `error`;
  - `GET /api/ai/quota`, `GET /api/ai/messages`;
  - `POST /api/ai/drafts/{id}/submit` (User) và `POST /api/ai/drafts/{id}/apply` (Admin).
- [ ] Handler giả lập: chat trả 503 "Cần kết nối máy chủ", quota trả 15 hoặc 30 theo vai trò, lịch sử rỗng.
- [ ] Trang **"Trợ lý"** (menu Thêm và sidebar):
  - luồng chat, các chip gợi ý câu hỏi;
  - ô nhập dính ở đáy, trên điện thoại không bị bàn phím che;
  - ở chế độ giả lập hiện banner "Cần kết nối máy chủ".
- [ ] Đọc SSE bằng `fetch` + `ReadableStream`: gắn Bearer, gặp 401 thì refresh rồi thử lại, chữ hiện dần, có nút Dừng. Render markdown **an toàn** (không có HTML thô, link chỉ nhận http/https).
- [ ] Thẻ xem trước draft: có diff, nút "Gửi đề xuất" (User) hoặc "Áp dụng" (Admin). Sau khi bấm thì thẻ chuyển sang trạng thái đã xử lý.
- [ ] Hiện "Còn N câu hôm nay". Hết lượt thì khóa ô nhập và ghi giờ reset (0h giờ Việt Nam).

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Mở Trợ lý ở khổ 375px: ô nhập nằm ở đáy, có chip gợi ý, có banner cần máy chủ.
2. User thấy "Còn 15 câu hôm nay", Admin thấy 30.
3. Gửi câu hỏi: báo lỗi thân thiện, không treo giao diện.

---

### Đợt 25 — In cây khổ lớn ⬜
IDEA §8 · DECISIONS #34, #72, #83
> Hợp đồng 4 báo cáo và trang "Xuất dữ liệu" đã chuyển sang Đợt 22 (DECISIONS #83). Đợt này chỉ còn In cây.
- [ ] **"In cây"** (từ trang Cây), chạy được đầy đủ ở chế độ giả lập vì tính hoàn toàn ở máy:
  - chọn gốc, khổ A3 hoặc A2, dọc hoặc ngang, có hoặc không có ảnh;
  - dùng lại `layoutTree` và render sang SVG vector (nhúng font Be Vietnam Pro);
  - xuất PDF (cây quá lớn thì chia trang theo khổ, có dấu cắt ghép) và PNG khoảng 300 dpi;
  - có cột "Đời" và tiêu đề.
- [ ] Chạy trong Web Worker hoặc chia nhỏ công việc để không treo giao diện với 500 ô.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Dựng một cây thử vài đời, bấm In cây, chọn A3 ngang: file PDF mở ra với chữ có dấu đúng và nét vector (phóng to không vỡ).
2. Chọn PNG: ảnh rõ khi in.

---

# GIAI ĐOẠN B — BACKEND

> Mỗi đợt BE làm đúng những endpoint mà `shared/api/openapi.yaml` đã có, khớp tên trường, mã lỗi và phân quyền.
> Hành vi phải giống handler giả lập. Chỗ nào giả lập sai so với IDEA/DECISIONS thì sửa theo IDEA/DECISIONS và ghi vào ✅ Đã làm.

### Đợt 26–27 — Gỡ dòng họ BE, Thành viên BE + seed 28 người ⬜
IDEA §4, §6.1, Phụ lục A · DECISIONS #54, #57, #58, #62, #63, #66, #68, #70
**Phần 26 — Gỡ dòng họ BE**
- [ ] Xóa module `family`: code, test, `FamilyFacade` và mọi chỗ gọi tới nó. Bỏ claim `familyId` và `familyRole`, bỏ `ROLE_MANAGER` trong `SecurityConfig`, bỏ `app.family.*`. `CurrentUser` không còn `familyId`.
- [ ] `V5__drop_family.sql`:
  - bỏ FK rồi xóa bảng `family_invitation` và `family`;
  - bỏ các cột `user_account.family_id`, `family_role`, `hide_maternal_line`;
  - bỏ `user_consent.family_id`;
  - bỏ `audit_log.family_id` cùng index của nó.
  - Entity phải khớp (`ddl-auto: validate`).
- [ ] Sửa annotation springdoc của auth, me, calendar, admin/accounts cho khớp hợp đồng.

**Phần 27 — Thành viên BE + seed 28 người**
- [ ] `V6__member.sql`: bảng `member` theo IDEA §4, có index `search_name`. Thêm FK và UNIQUE cho `user_account.member_id`.
- [ ] `V7__seed_members.sql` **sinh bằng script** `shared/fixtures/seed/to-sql.mjs` từ `members.json` (cách chạy ghi trong README), không sửa tay.
- [ ] CRUD theo hợp đồng (ở đợt này chỉ Admin ghi, quyền chủ hồ sơ tự sửa làm ở Đợt 28):
  - `search_name` do Service chuẩn hóa;
  - ngày mất nhập theo một lịch thì tự điền lịch còn lại qua `CalendarFacade`, trừ khi không có năm;
  - các trường về cái chết chỉ hợp lệ khi đã mất.
- [ ] `GET /api/members` và `GET /api/members/{id}`: tìm không dấu, lọc, sắp xếp, phân trang. Riêng lọc `generation` và `onTree` để lại cho Đợt 29. SĐT và email chỉ trả cho Admin và chính chủ.
- [ ] Xóa:
  - hỏi các bean `MemberDeletionGuard` (Đợt 29 thêm guard của cây);
  - ghi snapshot vào audit log;
  - phát `MemberDeletedEvent` trong transaction để các đợt sau tự dọn người thân, liên kết, tệp.
- [ ] Viết `MemberFacade`. Ghi audit log khi tạo, sửa, xóa.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:**
- Phần 26: Không có (DB dev chạy thêm V5 khi khởi động).
- Phần 27: Không có.

**🧪 Test thủ công (từng bước):**
_Phần 26:_
1. Chạy backend: Flyway áp dụng V5, app khởi động được.
2. Đăng nhập, giải mã access token: không còn `familyId` và `familyRole`.
3. Chạy frontend ở chế độ **thật** (không mock): đăng nhập, trang chờ duyệt và Quản trị > Tài khoản vẫn chạy.

_Phần 27:_
1. Chạy backend: bảng `member` có đúng 28 dòng.
2. Chạy frontend ở chế độ thật, vào Thành viên: có 28 người như ở chế độ giả lập.
3. Admin thêm, sửa, xóa một người: làm được. User không thấy các nút này, và gọi thẳng API thì nhận 403.

---

### Đợt 28 — Người thân, "Tôi là ai" và tự sửa hồ sơ BE ⬜
IDEA §6.1, §6.2, §6.3 · DECISIONS #62, #75, #76, #79–#82
- [ ] `V8__relative_link.sql`: `member_relative` (`UNIQUE(member_id, relative_member_id)`, CHECK không tự thêm, FK tới `member`) và `member_link_request`.
- [ ] API người thân theo hợp đồng. Chủ hồ sơ (`user.member_id` đọc từ DB) và Admin được ghi, mọi tài khoản đã duyệt được đọc. Ghi audit log.
- [ ] Quyền chủ hồ sơ cho `PUT /api/members/{id}` (#76):
  - User chỉ sửa được hồ sơ của mình, sửa hồ sơ người khác thì 403;
  - nhóm "đã mất" đổi giá trị thì 403 `DEATH_FIELDS_ADMIN_ONLY`, giữ nguyên thì bỏ qua;
  - Admin sửa được mọi trường của mọi hồ sơ.
- [ ] API yêu cầu liên kết theo hợp đồng:
  - không liên kết được thành viên đã có tài khoản;
  - Admin duyệt thì gán `user.member_id` (UNIQUE chống đua);
  - User tự hủy liên kết của mình (`DELETE /api/me/member-link`).
  - `/api/me` trả `memberId`.
- [ ] Admin gán/hủy liên kết trực tiếp (#80): `PUT` và `DELETE /api/admin/accounts/{id}/member-link` theo hợp đồng.
  - chỉ gán cho tài khoản ACTIVE + APPROVED (`INVALID_ACCOUNT_STATE`);
  - 409 `MEMBER_ALREADY_LINKED` / `ACCOUNT_ALREADY_LINKED` khi một bên đã có liên kết;
  - yêu cầu "Đây là tôi" đang chờ của tài khoản đó chuyển sang hủy;
  - `GET /api/admin/accounts` trả thêm thành viên đang liên kết;
  - phát event để Đợt 34 gửi thông báo cho người được gán; ghi audit log.
- [ ] Chép email (#81): khi liên kết có hiệu lực (duyệt yêu cầu hoặc Admin gán), `member.email` đang trống thì lấy email của tài khoản, trong cùng transaction. Không đụng họ tên, ảnh, SĐT. Không có đường nào đổi `user_account.email` theo hồ sơ.
- [ ] Khóa, từ chối tài khoản không gỡ `member_id` (#82).
- [ ] Listener `MemberDeletedEvent`: xóa các dòng người thân ở cả hai phía, hủy các yêu cầu đang chờ, gỡ `user.member_id`.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Frontend ở chế độ thật: lặp lại các bước 🧪 của Đợt 13, kết quả phải giống ở chế độ giả lập.
2. Xóa một thành viên đang có trong danh sách người thân của người khác: hồ sơ của người kia không còn dòng đó.
3. Admin gán một thành viên chưa có email cho một tài khoản đã duyệt: hồ sơ có email của tài khoản. Khóa tài khoản đó rồi mở khóa: liên kết vẫn còn. Sửa email trên hồ sơ: email đăng nhập của tài khoản không đổi.

---

### Đợt 29 — Cây BE ⬜
IDEA §8 · DECISIONS #60–62
- [ ] `V9__tree.sql`: `tree_node` (`member_id` NULL UNIQUE, FK tự tham chiếu), `tree_spouse` (`spouse_node_id` UNIQUE).
- [ ] `GET /api/tree`: tải toàn bộ bằng một truy vấn, dựng đồ thị trong bộ nhớ. Mục tiêu: 500 ô dưới 300 ms.
- [ ] Các thao tác ghi theo hợp đồng (thêm gốc, con, vợ/chồng, cha/mẹ, gỡ, điền, xóa ô trống, di chuyển, đổi thứ tự, đổi cặp):
  - chỉ Admin được làm;
  - quy tắc giống hệt `utils/tree` (bản FE ở Đợt 14);
  - khóa các dòng liên quan (`SELECT … FOR UPDATE`) để hai Admin thao tác cùng lúc không làm hỏng cây;
  - ghi audit log.
- [ ] `TreeDeletionGuard` (hiện thực `MemberDeletionGuard`): chặn xóa người đang có trên cây, trả 409 `MEMBER_ON_TREE`.
- [ ] Danh sách thành viên: lọc theo `generation` và `onTree` (đời tính theo cùng thuật toán).

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Frontend ở chế độ thật: lặp lại các bước 🧪 của Đợt 15–16, kết quả phải giống ở chế độ giả lập.
2. Hai cửa sổ Admin cùng di chuyển hai nhánh chồng lên nhau: một cái thành công, cái kia báo lỗi rõ ràng, và cây không bị hỏng.

---

### Đợt 30 — Upload và đính kèm BE ⬜
IDEA §6.7 · DECISIONS #62, #67
- [ ] `V10__attachment.sql`: bảng `attachment` (`kind` AVATAR|DOCUMENT, `member_id` NULL nghĩa là tài liệu chung).
- [ ] `POST /api/files/sign`: cấp chữ ký Cloudinary, folder `giapha/`, kiểm tra quota trước khi cấp.
- [ ] `POST /api/files/confirm`: xác minh `public_id` bằng Cloudinary Admin API (định dạng, ≤ 10 MB, đúng folder) rồi lưu. AVATAR thì cập nhật `member.avatar_url` và xóa ảnh cũ.
- [ ] Các API còn lại theo hợp đồng: danh sách tệp của thành viên, tài liệu chung, xóa (chỉ Admin, xóa luôn trên Cloudinary), link tải có chữ ký và hết hạn ngắn, quota.
- [ ] Cloudinary đặt sau interface `FileStorage`, test dùng bản giả. Listener `MemberDeletedEvent` xóa tệp **sau khi commit**.
- [ ] Quyền upload (#78): User đã liên kết chỉ được `sign`/`confirm` `kind=AVATAR` cho hồ sơ của mình (kiểm `memberId = user.member_id` ở cả hai bước, chỉ jpg/png/webp). `DOCUMENT`, tài liệu chung và xóa tệp chỉ Admin.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Tạo tài khoản Cloudinary, điền `CLOUDINARY_*` vào `apps/backend/.env`.

**🧪 Test thủ công (từng bước):**
1. Frontend ở chế độ thật: Admin tải ảnh đại diện cho một cụ, ảnh hiện ở hồ sơ và trên cây.
2. Tải một PDF vào Tài liệu chung: User mở xem được. Thanh quota tăng lên.
3. Xóa tệp: tệp biến mất cả trên Cloudinary.

---

### Đợt 31 — Sự kiện chung và lịch nhắc BE ⬜
IDEA §6.5, §7 · DECISIONS #31, #65, #72
- [ ] `V11__custom_event.sql`. CRUD `/api/events`: Admin ghi, mọi tài khoản đã duyệt đọc. Kiểm tra lịch, cờ nhuận, ngày/tháng hợp lệ. Ghi audit log. Viết `EventFacade`.
- [ ] `OccurrenceService.between(from, to, types)`: giỗ, sinh nhật và sự kiện chung theo IDEA §6.5 và §7. `eventKey` phải giống bản FE (dùng lại ở Đợt 35).
- [ ] `GET /api/calendar/upcoming`, `/month`, `/recent` theo hợp đồng.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Frontend ở chế độ thật: tab Sắp tới "Cả năm" ra đúng danh sách như ở chế độ giả lập (so vài dòng: Cụ Sửu 11/7, Bà Nhung 29/12).
2. Admin tạo, sửa, xóa sự kiện chung. User không làm được.

---

### Đợt 32 — Dashboard và quản trị BE ⬜
IDEA §6.8, §6.10 · DECISIONS #55, #62
- [ ] `GET /api/dashboard` theo hợp đồng. Số người trên cây và số đời lấy qua `TreeFacade`. Admin có thêm 3 số chờ duyệt (`pendingProposals` bằng 0 cho tới Đợt 33).
- [ ] `V12__system_setting.sql` (key-value), có cache Caffeine. `GET/PUT /api/admin/settings`. Các chỗ đang dùng giá trị cấu hình (phiên bản chính sách, giới hạn upload) chuyển sang đọc từ đây.
- [ ] `GET /api/admin/deleted-members` và `GET /api/admin/deleted-members/{auditId}` đọc snapshot từ `audit_log`.
- [ ] Ghi audit log cho mọi thao tác quản trị.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Frontend ở chế độ thật: Tổng quan hiện Tổng 28 (cộng với số người đã thêm).
2. Admin đổi phiên bản chính sách: đăng nhập lại bằng User thì phải đồng ý lại.
3. Xóa một thành viên thử: Quản trị > Thành viên đã xóa có snapshot.

---

### Đợt 33–34 — Đề xuất sự kiện và Thông báo BE ⬜
IDEA §6.6, §9 · DECISIONS #65, #77
**Phần 33 — Đề xuất sự kiện BE**
- [ ] `V13__proposal.sql` (`target_type` chỉ có `EVENT`).
- [ ] `POST /api/proposals`:
  - chỉ nhận `targetType=EVENT`, không cần liên kết;
  - server tự tính `diff` và lưu `base_updated_at`;
  - validate payload bằng **cùng validator** với API sự kiện ghi trực tiếp.
- [ ] Các API còn lại theo hợp đồng: `mine`, danh sách chờ, `count`, `approve` (nhận payload đã chỉnh), `reject`.
  - Khi duyệt thì áp dụng qua `EventFacade` trong một transaction và ghi audit log.
  - Báo `conflict: true` khi `updated_at > base_updated_at`.
- [ ] Phát `ProposalReviewed` (để Đợt 34 dùng). Dashboard lấy `pendingProposals` là số thật.

**Phần 34 — Thông báo BE: hộp thư, tùy chọn**
- [ ] `V14__notification.sql`: `notification` và `notification_pref` (giá trị mặc định tạo lười ở lần đọc đầu tiên).
- [ ] API hộp thư và tùy chọn theo hợp đồng. Mỗi người chỉ đọc được thông báo của chính mình.
- [ ] Listener tạo thông báo:
  - tài khoản mới chờ duyệt → mọi Admin;
  - được duyệt → người đó;
  - kết quả liên kết → người yêu cầu;
  - Admin gán liên kết trực tiếp → người được gán (cùng loại với "kết quả liên kết", DECISIONS #80);
  - đề xuất mới → mọi Admin;
  - `ProposalReviewed` → người đề xuất.

  Đợt 8 cần phát event cho tài khoản chờ duyệt: nếu chưa có thì thêm ở đợt này.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
_Phần 33:_ Frontend ở chế độ thật, lặp lại các bước 🧪 (Phần 20) của Đợt 20–21, kết quả phải giống ở chế độ giả lập.

_Phần 34:_
1. Đăng ký user mới: Admin thấy chuông tăng thêm 1, bấm vào thì tới Quản trị > Tài khoản.
2. Admin duyệt user đó: user thấy thông báo "Tài khoản đã được duyệt".

---

### Đợt 35 — Web Push BE ⬜
IDEA §9 · DECISIONS #46
- [ ] `V15__push.sql`: `push_subscription` và `notification_dispatch` (UNIQUE trên 4 cột).
- [ ] `PushSender` (interface) và bản cài bằng `nl.martijndwars:web-push` + khóa VAPID. API push theo hợp đồng.
- [ ] `DigestJob` (`@Scheduled` mỗi giờ, zone +7):
  - với tài khoản **đã duyệt** có `send_hour` bằng giờ hiện tại, lấy các lần xảy ra tại những mốc và loại đã bật, gộp thành một bản tin;
  - bản tin rỗng thì không gửi;
  - ghi `notification`, gửi push, và ghi `notification_dispatch` để chống gửi trùng.
- [ ] Gặp 404/410 thì xóa subscription. Gửi thành công thì cập nhật `last_ok_at`.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Sinh khóa VAPID (`npx web-push generate-vapid-keys`), điền vào `apps/backend/.env`.

**🧪 Test thủ công (từng bước):**
1. Frontend ở chế độ thật trên Chrome: bấm "Bật thông báo" rồi "Gửi thử", thông báo hiện ra trên máy.
2. Đặt giờ nhận bằng giờ hiện tại, rồi chạy job bằng tay (endpoint dev hoặc test): nhận được một bản tin gộp.

---

### Đợt 36–37 — AI BE: provider, tool, SSE, quota, soạn đề xuất, phạm vi ⬜
IDEA §6.6, §10 · DECISIONS #47, #73, #77
**Phần 36 — AI BE: provider, tool, SSE, quota**
- [ ] `V16__ai.sql`: `ai_usage` và `ai_message`. Mỗi user có một luồng chat, job dọn tin nhắn cũ hơn 30 ngày.
- [ ] `AiProvider` và `GeminiProvider` (`com.google.genai`, streaming, function calling). `FakeAiProvider` dùng cho profile dev và test.
- [ ] Các tool chỉ đọc (#73), gọi qua facade. DTO riêng cho AI **không có trường SĐT/email**.
- [ ] `POST /api/ai/chat` trả SSE (`token`/`done`/`error`), và ghi lại `ai_message`.
  - Kiểm tra rồi tăng `ai_usage` (15 hoặc 30, đọc từ `system_setting`, reset lúc 0h giờ +7).
  - Có rate limit bằng bucket4j.
  - `GET /api/ai/quota` và `GET /api/ai/messages`.
- [ ] System prompt nêu vai trò và phạm vi (phần từ chối và gợi ý câu hỏi làm ở Đợt 37).

**Phần 37 — AI BE: soạn đề xuất sự kiện, phạm vi**
- [ ] Tool `draftProposal`: tạo `AiDraft` (lưu tạm, có TTL), **chỉ cho sự kiện chung**, gồm payload và diff tính theo cùng logic của module proposal. SSE gửi event `draft` kèm id. **Không ghi vào dữ liệu gia phả.**
- [ ] `POST /api/ai/drafts/{id}/submit`: User tạo proposal với `source=AI`. `POST /api/ai/drafts/{id}/apply`: Admin tạo và duyệt proposal ngay, có ghi audit log.
- [ ] Người dùng nhờ sửa hồ sơ hoặc người thân: AI không soạn draft, chỉ hướng dẫn tự sửa trên trang hồ sơ (có trong system prompt, có test với Fake).
- [ ] Câu hỏi ngoài phạm vi: từ chối lịch sự và gợi ý 3 câu hỏi mẫu (có trong system prompt, có test với Fake).

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:**
- Phần 36: Điền `GEMINI_API_KEY` vào `apps/backend/.env`.
- Phần 37: Không có.

**🧪 Test thủ công (từng bước):**
_Phần 36:_
1. Frontend ở chế độ thật, hỏi "Giỗ Cụ Nguyễn Văn Sửu ngày nào?": chữ hiện dần, trả lời đúng 11/7 âm.
2. Hỏi SĐT của một người: AI không có dữ liệu này.
3. Hỏi đến khi hết lượt: ô nhập bị khóa.

_Phần 37:_
1. User nói "Thêm sự kiện họp họ ngày 10 tháng Giêng âm": có thẻ draft, bấm "Gửi đề xuất" thì Admin thấy đề xuất trong hàng đợi.
2. User nói "Sửa tiểu sử của tôi": AI hướng dẫn vào trang hồ sơ để tự sửa, không có thẻ draft.
3. Hỏi chuyện không liên quan: AI từ chối và gợi ý 3 câu.

---

### Đợt 38 — Export BE (Excel, PDF) ⬜
IDEA §6.9 · DECISIONS #48, #66
- [ ] `GET /api/reports/members.xlsx`: có header, cột ngày dạng date, dòng tiêu đề đông cứng, tự căn độ rộng cột. `GET /api/reports/events.xlsx?year=`.
- [ ] `GET /api/reports/members.pdf` và `GET /api/reports/memorials.pdf?lunarYear=` (nhóm theo tháng âm, kèm ngày dương tương ứng). Nhúng font Be Vietnam Pro, khổ A4, có số trang.
- [ ] Cột SĐT/email chỉ có khi người xuất là Admin. Tên file có ngày xuất.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Không có.

**🧪 Test thủ công (từng bước):**
1. Frontend ở chế độ thật, trang Xuất dữ liệu: tải đủ 4 file và mở được. Chữ tiếng Việt đúng.
2. Lịch giỗ PDF: tháng 12 âm có Bà Trần Thị Nhung và Nguyễn Văn Thông.

---

# GIAI ĐOẠN C — NỐI VÀ PHÁT HÀNH

### Đợt 39 — Nối FE với BE thật, gỡ lớp giả lập ⬜
DECISIONS #70–72
- [ ] Chuyển `services/client.ts` sang gọi backend thật cho mọi endpoint. Bạn chạy thử mọi màn hình (Admin, User đã liên kết, User chưa liên kết, tài khoản chờ duyệt) rồi báo chỗ lệch; AI sửa và ghi danh sách vào ✅ Đã làm.
- [ ] Công cụ **chuyển dữ liệu tạm**: script dev `apps/frontend/scripts/import-mock-data.ts`.
  - Đọc file JSON đã tải ở mục "Dữ liệu tạm", rồi gọi API thật bằng token Admin để tạo lại: thành viên thêm mới hoặc đã sửa, người thân, cây, sự kiện.
  - Có chế độ chạy thử (dry-run) và báo cáo.
  - Không tạo trùng 28 người đã có sẵn trong seed (khớp theo id seed).
- [ ] Gỡ `src/services/mock/`, script `dev:mock`, `VITE_API_MODE`, mục "Dữ liệu tạm" và các banner "Cần kết nối máy chủ". Giữ lại `shared/fixtures/seed/members.json` (nguồn của seed).
- [ ] Cập nhật `CLAUDE.md`, `.claude/rules/frontend.md`, `docs/STRUCTURE.md` và DECISIONS #71 (ghi "đã gỡ ở Đợt 39").

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Nếu đã nhập dữ liệu thật ở chế độ giả lập: vào Thêm > Dữ liệu tạm > "Tải dữ liệu tạm (JSON)" **trước khi** cập nhật lên bản của đợt này.

**🧪 Test thủ công (từng bước):**
1. Chạy script chuyển dữ liệu ở chế độ dry-run, rồi chạy thật: cây và danh sách người thân đã dựng ở chế độ giả lập hiện ra y hệt ở chế độ thật.
2. `npm run build`: không còn mã mock nào.
3. Đi hết các màn hình bằng 4 loại tài khoản: không có lỗi console.

---

### Đợt 41 — Deploy production ⬜
IDEA §11 · DECISIONS #39–43
- [ ] `apps/backend/Dockerfile` (multi-stage, JRE 21, `linux/arm64`, không chạy bằng root). `infra/nginx/Dockerfile` build frontend rồi copy `dist` vào nginx.
- [ ] `infra/docker-compose.prod.yml`: nginx, app, mysql (có volume, không mở cổng ra ngoài), certbot. Mỗi service có healthcheck.
- [ ] Cấu hình nginx:
  - chuyển HTTP sang HTTPS, `/api` proxy tới app, SPA fallback;
  - gzip, cache dài cho asset có hash, `sw.js` không cache;
  - header HSTS, CSP, `X-Content-Type-Options`, `Referrer-Policy`.
  - Backend đặt `forward-headers-strategy` để IP của consent và rate limit là IP thật.
- [ ] `infra/backup/backup.sh`: `mysqldump`, gzip, đẩy lên Object Storage, xóa bản cũ hơn 30 ngày. Có mẫu dòng cron.
- [ ] `.github/workflows/deploy.yml`: chạy bằng `workflow_dispatch` hoặc tag `v*`. Build buildx arm64, đẩy GHCR, SSH vào server chạy `docker compose pull && up -d`.
- [ ] `infra/README.md` (runbook): lần deploy đầu (đặt `ROOT_ADMIN_EMAIL`, seed 28 người tự chạy qua Flyway), gia hạn chứng chỉ, khôi phục từ backup.

**✅ Đã làm:** _(điền khi xong)_

**🔧 Setup thủ công cần làm:** Tạo VM Oracle ARM, DuckDNS, secrets GitHub (SSH, GHCR), file `.env` prod trên server.

**🧪 Test thủ công (từng bước):**
1. Mở `https://<tên miền>`: có HTTPS, cài được PWA.
2. Đăng ký bằng `ROOT_ADMIN_EMAIL`: thành Admin ngay. Danh sách có 28 thành viên.
3. Chạy `backup.sh` bằng tay: file backup có trên Object Storage.
