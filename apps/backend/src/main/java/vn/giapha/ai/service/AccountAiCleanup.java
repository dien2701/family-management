package vn.giapha.ai.service;

import java.util.List;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import vn.giapha.auth.AccountPurgedEvent;

/** Xóa tin nhắn, đoạn chat và lượt dùng Trợ lý AI của tài khoản bị xóa vĩnh viễn (chạy trong transaction xóa). */
@Component
class AccountAiCleanup {

    // Tin nhắn trước đoạn chat vì có FK tới đoạn chat
    private static final List<String> ENTITIES = List.of("AiMessage", "AiConversation", "AiUsage");

    @PersistenceContext
    private EntityManager em;

    @EventListener
    void on(AccountPurgedEvent event) {
        for (String entity : ENTITIES) {
            em.createQuery("delete from " + entity + " x where x.accountId = :id")
                    .setParameter("id", event.accountId()).executeUpdate();
        }
    }
}
