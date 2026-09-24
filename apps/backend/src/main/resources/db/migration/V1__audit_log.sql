-- Audit log: chỉ thêm, không sửa, không xóa (IDEA §12).
-- `before` là từ khóa của MySQL nên cột đặt tên before_data / after_data.
CREATE TABLE audit_log
(
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    family_id   BIGINT       NULL COMMENT 'NULL với thao tác cấp hệ thống',
    actor_id    BIGINT       NULL COMMENT 'user_account.id; NULL với thao tác hệ thống',
    action      VARCHAR(50)  NOT NULL,
    target_type VARCHAR(50)  NOT NULL,
    target_id   BIGINT       NULL,
    before_data JSON         NULL,
    after_data  JSON         NULL,
    created_at  DATETIME(6)  NOT NULL COMMENT 'UTC',
    PRIMARY KEY (id),
    KEY idx_audit_family_created (family_id, created_at),
    KEY idx_audit_target (target_type, target_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
