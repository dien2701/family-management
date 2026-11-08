-- Admin xóa tài khoản (DECISIONS #97): xóa mềm, tài khoản chuyển sang tab "Đã xóa" và bị khóa, khôi phục được.
--
-- Khóa dùng lại cột status/lock_reason sẵn có: tài khoản đang mở thì thành LOCKED + lock_reason = DELETED; đang bị
-- khóa vì lý do khác thì giữ nguyên. Khôi phục chỉ mở khóa khi lock_reason = DELETED, nên về đúng trạng thái trước khi xóa.
ALTER TABLE user_account
    MODIFY COLUMN lock_reason VARCHAR(20) NULL COMMENT 'MANUAL | MEMBER_LOCKED | DELETED',
    ADD COLUMN deleted_at DATETIME(6) NULL COMMENT 'Admin xóa lúc nào (UTC); NULL là chưa xóa' AFTER created_at,
    ADD COLUMN deleted_by BIGINT NULL COMMENT 'user_account.id của Admin đã xóa' AFTER deleted_at,
    ADD KEY idx_user_account_deleted (deleted_at);
