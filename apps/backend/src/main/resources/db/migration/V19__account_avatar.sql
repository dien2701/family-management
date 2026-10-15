-- Ảnh đại diện riêng của tài khoản (kind ACCOUNT_AVATAR), độc lập với ảnh thành viên.
--
-- `account_id` là chủ của ảnh; không có khóa ngoại, cùng quy ước với `member_id` và `created_by`. Ảnh vẫn tính vào
-- quota 1 GB chung. URL hiện hành nằm ở `user_account.avatar_url`.
ALTER TABLE attachment
    DROP CHECK chk_attachment_kind;

ALTER TABLE attachment
    MODIFY COLUMN kind VARCHAR(20) NOT NULL COMMENT 'AVATAR | DOCUMENT | ACCOUNT_AVATAR',
    ADD COLUMN account_id BIGINT NULL COMMENT 'user_account.id; chỉ dùng với ACCOUNT_AVATAR' AFTER member_id,
    ADD KEY idx_attachment_account (account_id, kind),
    ADD CONSTRAINT chk_attachment_kind CHECK (kind IN ('AVATAR', 'DOCUMENT', 'ACCOUNT_AVATAR')),
    ADD CONSTRAINT chk_attachment_account_avatar CHECK (kind <> 'ACCOUNT_AVATAR' OR account_id IS NOT NULL);
