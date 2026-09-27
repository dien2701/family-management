package vn.giapha.auth;

import java.util.Collection;
import java.util.Map;

/**
 * Cổng để module auth hỏi và báo module member mà không phụ thuộc ngược vào member (member đã phụ thuộc auth).
 * {@code member} hiện thực interface này; auth chỉ biết nó qua đây.
 */
public interface MemberDirectory {

    /** Họ tên (ghi nguyên văn) của các thành viên có trong {@code memberIds}; id không tồn tại thì vắng mặt. */
    Map<Long, String> fullNames(Collection<Long> memberIds);

    /**
     * Admin vừa gán trực tiếp {@code memberId} cho tài khoản (DECISIONS #80, #81). Chạy trong transaction của thao tác:
     * chép email tài khoản sang hồ sơ nếu hồ sơ chưa có, hủy yêu cầu "Đây là tôi" đang chờ của tài khoản đó và phát
     * event cho thông báo.
     */
    void afterAdminLink(Long accountId, String accountEmail, Long memberId, Long actorId);
}
