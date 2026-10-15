-- Nhiều đoạn chat cho Trợ lý AI (DECISIONS #94): mỗi tin nhắn thuộc một đoạn. Không còn hạn 30 ngày; đoạn chỉ mất khi
-- người dùng xóa hoặc khi vượt 50 đoạn (xóa đoạn không ghim có lần chat cuối cũ nhất).
CREATE TABLE ai_conversation
(
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    account_id BIGINT       NOT NULL COMMENT 'user_account.id; không có FK, cùng quy ước với ai_message',
    title      VARCHAR(100) NOT NULL,
    pinned     TINYINT(1)   NOT NULL DEFAULT 0,
    created_at DATETIME(6)  NOT NULL COMMENT 'UTC',
    updated_at DATETIME(6)  NOT NULL COMMENT 'UTC; lần chat cuối',
    PRIMARY KEY (id),
    KEY idx_ai_conversation_account (account_id, pinned, updated_at)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

-- Lịch sử cũ của mỗi tài khoản gom thành một đoạn "Trò chuyện trước đây"
INSERT INTO ai_conversation (account_id, title, pinned, created_at, updated_at)
SELECT account_id, 'Trò chuyện trước đây', 0, MIN(created_at), MAX(created_at)
FROM ai_message
GROUP BY account_id;

ALTER TABLE ai_message
    ADD COLUMN conversation_id BIGINT NULL AFTER account_id;

UPDATE ai_message m
    JOIN ai_conversation c ON c.account_id = m.account_id
SET m.conversation_id = c.id;

ALTER TABLE ai_message
    MODIFY conversation_id BIGINT NOT NULL,
    ADD KEY idx_ai_message_conversation (conversation_id, created_at),
    ADD CONSTRAINT fk_ai_message_conversation FOREIGN KEY (conversation_id) REFERENCES ai_conversation (id) ON DELETE CASCADE;
