package vn.giapha.ai.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.giapha.ai.entity.AiConversation;

public interface AiConversationRepository extends JpaRepository<AiConversation, Long> {

    Optional<AiConversation> findByIdAndAccountId(Long id, Long accountId);

    long countByAccountId(Long accountId);

    /** Đoạn không ghim có lần chat cuối cũ nhất: bị xóa khi vượt giới hạn. */
    Optional<AiConversation> findFirstByAccountIdAndPinnedFalseOrderByUpdatedAtAsc(Long accountId);

    List<AiConversation> findByAccountIdOrderByPinnedDescUpdatedAtDesc(Long accountId);

    /** Tìm theo tiêu đề hoặc nội dung tin; collation {@code ai_ci} nên không phân biệt hoa thường và dấu. */
    @Query("""
            select c from AiConversation c
            where c.accountId = :accountId
              and (c.title like concat('%', :q, '%')
                or exists (select 1 from AiMessage m
                           where m.conversationId = c.id and m.content like concat('%', :q, '%')))
            order by c.pinned desc, c.updatedAt desc""")
    List<AiConversation> search(@Param("accountId") Long accountId, @Param("q") String q);
}
