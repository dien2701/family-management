# Quy tắc Git (áp dụng toàn repo)

- **Chỉ commit hoặc push khi người dùng yêu cầu.** Không tự tạo PR, không tự merge.
- Mỗi đợt một nhánh `dot-NN-<ten>` (ví dụ `dot-08-member-core`), rồi mở PR vào `main`. Không commit thẳng lên `main`.
- Commit theo Conventional Commits, viết tiếng Anh: `feat(member): add lock cascade`. Loại dùng: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`, `build`. Phần scope là tên module hoặc `fe`/`be`/`infra`.
- Mỗi commit là một thay đổi có nghĩa, build được. Không gộp việc của nhiều đợt vào một commit.
- Không commit bí mật: `.env*` (trừ `.env.example`), `settings.local.json`, khóa, token. Trước khi commit kiểm tra `git status` và `git diff --staged`.
- Không sửa file Flyway `V*.sql` đã có. Đổi schema thì thêm file V mới.
- Không dùng `--no-verify`, không bỏ qua hook, không `push --force` lên `main`. Cần ghi đè lịch sử nhánh riêng thì hỏi người dùng trước.
- Mô tả PR gồm: đợt nào, đã làm gì, cách kiểm tra, kết quả `verify`/`lint`/`build`. Đợt chưa xong (chưa pass lệnh kiểm tra) thì không mở PR.
- CI mỗi PR chạy BE `./mvnw verify`, FE `npm run lint` + `npm run build` + `npm test`. CI đỏ thì sửa, không merge.
- Deploy thủ công bằng `workflow_dispatch` hoặc khi push tag `v*`.
