-- Đề xuất sự kiện chung (IDEA §6.6; DECISIONS #65, #77). target_type chỉ còn EVENT, không cần liên kết "Tôi là ai".
-- payload là nội dung CustomEventInput; NULL khi action = DELETE. base_updated_at là custom_event.updated_at lúc
-- gửi đề xuất, dùng để phát hiện xung đột (updated_at hiện tại > base_updated_at) khi Admin duyệt.
CREATE TABLE proposal
(
    id              BIGINT        NOT NULL AUTO_INCREMENT,
    account_id      BIGINT        NOT NULL COMMENT 'user_account.id; không có FK, cùng quy ước với created_by khác',
    target_type     VARCHAR(20)   NOT NULL COMMENT 'Chỉ có EVENT (DECISIONS #77)',
    action          VARCHAR(10)   NOT NULL COMMENT 'CREATE | UPDATE | DELETE',
    target_id       BIGINT        NULL COMMENT 'custom_event.id; NULL khi action = CREATE',
    payload         JSON          NULL COMMENT 'Nội dung CustomEventInput; NULL khi action = DELETE',
    status          VARCHAR(10)   NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING | APPROVED | REJECTED',
    note            VARCHAR(1000) NULL COMMENT 'Lý do từ chối',
    base_updated_at DATETIME(6)   NULL COMMENT 'custom_event.updated_at lúc gửi đề xuất, để phát hiện xung đột',
    created_at      DATETIME(6)   NOT NULL COMMENT 'UTC',
    PRIMARY KEY (id),
    KEY idx_proposal_status_created (status, created_at),
    KEY idx_proposal_account (account_id, created_at),
    CONSTRAINT chk_proposal_target_type CHECK (target_type = 'EVENT'),
    CONSTRAINT chk_proposal_action CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
    CONSTRAINT chk_proposal_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
