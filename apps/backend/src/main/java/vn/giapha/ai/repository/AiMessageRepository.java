package vn.giapha.ai.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import vn.giapha.ai.entity.AiMessage;

public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {

    /** Lịch sử trò chuyện của một tài khoản, mới nhất trước (đảo lại thành cũ trước ở Service). */
    List<AiMessage> findByAccountIdOrderByCreatedAtDesc(Long accountId, Pageable pageable);

    /** Job dọn tin nhắn cũ hơn 30 ngày (IDEA §10). */
    long deleteByCreatedAtBefore(Instant cutoff);
}
