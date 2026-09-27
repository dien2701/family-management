package vn.giapha.member.dto;

import java.time.Instant;

import vn.giapha.common.web.LinkedMember;
import vn.giapha.member.entity.LinkRequestStatus;

/**
 * Yêu cầu "Đây là tôi". Họ tên và email tài khoản đọc hiện tại từ tài khoản. Thành viên đã bị xóa thì {@code member}
 * vẫn có {@code id} nhưng họ tên rỗng (yêu cầu chuyển sang {@code CANCELLED}).
 */
public record LinkRequestResponse(
        Long id,
        Long accountId,
        String accountFullName,
        String accountEmail,
        LinkedMember member,
        LinkRequestStatus status,
        Instant createdAt,
        Instant decidedAt) {
}
