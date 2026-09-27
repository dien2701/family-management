-- Bỏ dòng họ (IDEA §4, DECISIONS #54, #57, #63): hệ thống chỉ còn một gia phả chung, không có tenant.
-- Thứ tự quan trọng: gỡ khóa ngoại trước khi xóa bảng family, gỡ index trước khi xóa cột (MySQL không chạy DDL trong transaction).
DROP TABLE family_invitation;

ALTER TABLE user_account
    DROP FOREIGN KEY fk_user_family;
ALTER TABLE user_consent
    DROP FOREIGN KEY fk_consent_family;

DROP TABLE family;

ALTER TABLE user_account
    DROP INDEX idx_user_family,
    DROP COLUMN family_id,
    DROP COLUMN family_role,
    DROP COLUMN hide_maternal_line;

ALTER TABLE user_consent
    DROP INDEX idx_consent_family,
    DROP COLUMN family_id;

ALTER TABLE audit_log
    DROP INDEX idx_audit_family_created,
    DROP COLUMN family_id;
