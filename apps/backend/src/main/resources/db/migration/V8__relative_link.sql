-- Người thân trong hồ sơ và yêu cầu liên kết "Tôi là ai" (IDEA §6.2, §6.3; DECISIONS #75, #79–#82).
--
-- `member_relative`: một chiều, dòng (member_id, relative_member_id, label) nghĩa là trong hồ sơ member_id,
-- relative_member_id là "label". Khóa ngoại để mặc định (RESTRICT) vì MySQL cấm CHECK trên cột có hành động
-- CASCADE/SET NULL; việc dọn khi xóa thành viên do listener MemberDeletedEvent làm (xóa dòng ở cả hai phía).
CREATE TABLE member_relative
(
    id                 BIGINT      NOT NULL AUTO_INCREMENT,
    member_id          BIGINT      NOT NULL COMMENT 'Chủ hồ sơ',
    relative_member_id BIGINT      NOT NULL COMMENT 'Người thân được ghi trong hồ sơ của member_id',
    label              VARCHAR(50) NOT NULL COMMENT 'Người này là gì của chủ hồ sơ, ví dụ "cha", "vợ"',
    created_by         BIGINT      NULL COMMENT 'user_account.id; không có FK, cùng quy ước với các created_by khác',
    created_at         DATETIME(6) NOT NULL COMMENT 'UTC',
    updated_at         DATETIME(6) NOT NULL COMMENT 'UTC',
    PRIMARY KEY (id),
    UNIQUE KEY uq_relative_pair (member_id, relative_member_id),
    KEY idx_relative_target (relative_member_id),
    CONSTRAINT chk_relative_not_self CHECK (member_id <> relative_member_id),
    CONSTRAINT fk_relative_member FOREIGN KEY (member_id) REFERENCES member (id),
    CONSTRAINT fk_relative_target FOREIGN KEY (relative_member_id) REFERENCES member (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

-- `member_link_request`: yêu cầu "Đây là tôi". `member_id` cố ý KHÔNG có khóa ngoại: khi thành viên bị xóa, yêu cầu
-- đang chờ chuyển sang CANCELLED và dòng vẫn giữ lại làm lịch sử (id không bao giờ được dùng lại).
CREATE TABLE member_link_request
(
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    account_id BIGINT      NOT NULL,
    member_id  BIGINT      NOT NULL,
    status     VARCHAR(10) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING | APPROVED | REJECTED | CANCELLED',
    created_at DATETIME(6) NOT NULL COMMENT 'UTC',
    decided_at DATETIME(6) NULL COMMENT 'UTC',
    decided_by BIGINT      NULL COMMENT 'user_account.id của Admin đã duyệt/từ chối; NULL khi hệ thống tự hủy',
    PRIMARY KEY (id),
    KEY idx_link_request_status (status, created_at),
    KEY idx_link_request_account (account_id, created_at),
    KEY idx_link_request_member (member_id),
    CONSTRAINT fk_link_request_account FOREIGN KEY (account_id) REFERENCES user_account (id) ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
