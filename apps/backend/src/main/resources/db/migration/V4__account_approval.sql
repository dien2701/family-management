-- Duyệt tài khoản và đồng ý dữ liệu cá nhân không gắn dòng họ (IDEA §3, §5; DECISIONS #55–57).
-- Tài khoản đã có trước V4 nhận WAITING (mặc định của cột): Admin gốc hoặc Admin khác duyệt sau.
-- `approved_by` không có FK, cùng quy ước với `created_by`: xóa tài khoản người duyệt không bị chặn.
ALTER TABLE user_account
    ADD COLUMN approval_status VARCHAR(10) NOT NULL DEFAULT 'WAITING' COMMENT 'WAITING | APPROVED | REJECTED' AFTER lock_reason,
    ADD COLUMN approved_by     BIGINT      NULL COMMENT 'user_account.id của Admin đã duyệt' AFTER approval_status,
    ADD COLUMN approved_at     DATETIME(6) NULL COMMENT 'UTC' AFTER approved_by,
    ADD KEY idx_user_approval (approval_status, created_at),
    -- Đọc-khóa "mọi Admin" (chặn Admin cuối cùng, Admin gốc) đi theo index này thay vì khóa cả bảng ở REPEATABLE READ
    ADD KEY idx_user_role (system_role);

-- Consent không còn gắn dòng họ: người đăng ký email lưu ngay khi đăng ký nên family_id để NULL (Đợt 26 xóa hẳn cột).
ALTER TABLE user_consent
    MODIFY COLUMN family_id BIGINT NULL;

-- Đăng ký email lưu consent khi tài khoản còn PENDING; job dọn tài khoản PENDING quá hạn xóa user nên consent phải đi theo.
ALTER TABLE user_consent
    DROP FOREIGN KEY fk_consent_user;
ALTER TABLE user_consent
    ADD CONSTRAINT fk_consent_user FOREIGN KEY (user_id) REFERENCES user_account (id) ON DELETE CASCADE;
