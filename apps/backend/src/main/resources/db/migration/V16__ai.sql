-- Trợ lý AI (IDEA §10; DECISIONS #47, #73, #77): lượt hỏi trong ngày và lịch sử trò chuyện.
-- Lượt hỏi reset lúc 0h giờ Việt Nam: usage_date khác hôm nay (giờ VN) thì coi used_count = 0, không cần job riêng.
CREATE TABLE ai_usage
(
    account_id BIGINT      NOT NULL COMMENT 'user_account.id; không có FK, cùng quy ước với notification',
    usage_date DATE        NOT NULL COMMENT 'Ngày (giờ Việt Nam) của used_count hiện tại',
    used_count INT         NOT NULL DEFAULT 0,
    updated_at DATETIME(6) NOT NULL COMMENT 'UTC',
    PRIMARY KEY (account_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

-- Một luồng chat duy nhất mỗi tài khoản, giữ 30 ngày (job dọn ở AiMessageCleanupJob). draft_json là ảnh chụp AiDraft
-- (id chính là id dòng ASSISTANT chứa nó); NULL khi câu trả lời không kèm bản nháp đề xuất.
CREATE TABLE ai_message
(
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    account_id BIGINT       NOT NULL COMMENT 'user_account.id; không có FK, cùng quy ước với notification',
    role       VARCHAR(10)  NOT NULL COMMENT 'USER hoặc ASSISTANT',
    content    TEXT         NOT NULL,
    draft_json JSON         NULL COMMENT 'AiDraft hiện hành (đổi status khi submit/apply); NULL nếu không có',
    created_at DATETIME(6)  NOT NULL COMMENT 'UTC',
    PRIMARY KEY (id),
    KEY idx_ai_message_account (account_id, created_at)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
