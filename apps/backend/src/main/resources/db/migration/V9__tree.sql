-- Cây gia phả dựng tay (IDEA §8; DECISIONS #60, #61).
--
-- `tree_node`: một ô trên cây. `member_id` NULL là ô trống (đã gỡ người ra khỏi cây); UNIQUE để mỗi thành viên chỉ
-- có một ô (MySQL cho phép nhiều NULL). `parent_node_id` luôn là ô THUỘC DÒNG, `co_parent_node_id` là ô vợ/chồng của ô
-- đó cùng sinh ra ô này. Đời không lưu, tính khi đọc (độ sâu từ gốc). Khóa ngoại để mặc định (RESTRICT): việc xóa ô
-- luôn nối lại con cháu trước (TreeService), và xóa thành viên bị chặn khi còn ô (TreeDeletionGuard).
CREATE TABLE tree_node
(
    id                BIGINT      NOT NULL AUTO_INCREMENT,
    member_id         BIGINT      NULL COMMENT 'NULL là ô trống',
    parent_node_id    BIGINT      NULL COMMENT 'Ô cha/mẹ thuộc dòng; NULL với gốc và với ô vợ/chồng',
    co_parent_node_id BIGINT      NULL COMMENT 'Ô vợ/chồng của parent_node_id cùng sinh ra ô này',
    sort_order        INT         NOT NULL DEFAULT 0 COMMENT 'Thứ tự anh em, nhỏ trước',
    created_by        BIGINT      NULL COMMENT 'user_account.id; không có FK, cùng quy ước với các created_by khác',
    created_at        DATETIME(6) NOT NULL COMMENT 'UTC',
    updated_at        DATETIME(6) NOT NULL COMMENT 'UTC',
    PRIMARY KEY (id),
    UNIQUE KEY uq_tree_node_member (member_id),
    KEY idx_tree_node_parent (parent_node_id, sort_order),
    KEY idx_tree_node_co_parent (co_parent_node_id),
    CONSTRAINT fk_tree_node_member FOREIGN KEY (member_id) REFERENCES member (id),
    CONSTRAINT fk_tree_node_parent FOREIGN KEY (parent_node_id) REFERENCES tree_node (id),
    CONSTRAINT fk_tree_node_co_parent FOREIGN KEY (co_parent_node_id) REFERENCES tree_node (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

-- `tree_spouse`: ô vợ/chồng thuộc đúng một ô thuộc dòng. `spouse_node_id` là khóa chính nên một ô vợ/chồng
-- không thể thuộc hai người. Ô vợ/chồng không có cha/mẹ và không có vợ/chồng riêng (quy tắc do TreeService giữ).
CREATE TABLE tree_spouse
(
    spouse_node_id BIGINT NOT NULL,
    node_id        BIGINT NOT NULL COMMENT 'Ô thuộc dòng',
    spouse_order   INT    NOT NULL COMMENT 'Thứ tự vợ/chồng: 1 = Cả, 2 = Hai...',
    PRIMARY KEY (spouse_node_id),
    KEY idx_tree_spouse_node (node_id, spouse_order),
    CONSTRAINT chk_tree_spouse_not_self CHECK (node_id <> spouse_node_id),
    CONSTRAINT chk_tree_spouse_order CHECK (spouse_order >= 1),
    CONSTRAINT fk_tree_spouse_node FOREIGN KEY (node_id) REFERENCES tree_node (id),
    CONSTRAINT fk_tree_spouse_spouse FOREIGN KEY (spouse_node_id) REFERENCES tree_node (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
