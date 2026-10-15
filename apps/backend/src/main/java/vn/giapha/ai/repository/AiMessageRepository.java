package vn.giapha.ai.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import vn.giapha.ai.entity.AiMessage;

public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {

    /** Tin của một đoạn chat, mới nhất trước (đảo lại thành cũ trước ở Service). */
    List<AiMessage> findByConversationIdOrderByCreatedAtDesc(Long conversationId, Pageable pageable);
}
