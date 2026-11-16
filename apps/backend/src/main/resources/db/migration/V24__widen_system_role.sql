-- 'BRANCH_HEAD' dài 11 ký tự, vượt VARCHAR(10) cũ (DECISIONS #105). Giữ nguyên NOT NULL, mặc định và index idx_user_role.
ALTER TABLE user_account
    MODIFY COLUMN system_role VARCHAR(20) NOT NULL DEFAULT 'USER' COMMENT 'ADMIN | BRANCH_HEAD | USER';
