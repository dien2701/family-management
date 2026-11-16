-- Vai trò Trưởng chi (DECISIONS #105): user_account.system_role nhận thêm 'BRANCH_HEAD' (VARCHAR(10) đủ chỗ, không đổi cột).
-- Lượt hỏi AI mỗi ngày của Trưởng chi, mặc định bằng mức của Người dùng.
INSERT INTO system_setting (setting_key, setting_value, updated_by, updated_at)
VALUES ('AI_QUOTA_BRANCH_HEAD', '15', NULL, UTC_TIMESTAMP(6));
