-- Lượt hỏi AI mỗi ngày cho khách chưa đăng nhập và tài khoản chưa duyệt (DECISIONS #91); 0 = tắt AI với khách.
INSERT INTO system_setting (setting_key, setting_value, updated_by, updated_at)
VALUES ('AI_QUOTA_GUEST', '15', NULL, UTC_TIMESTAMP(6));
