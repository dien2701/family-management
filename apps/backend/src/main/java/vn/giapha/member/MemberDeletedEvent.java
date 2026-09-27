package vn.giapha.member;

/**
 * Thành viên sắp bị xóa. Phát <b>đồng bộ, trong transaction xóa</b>, sau khi đã ghi snapshot vào audit log và
 * ngay trước khi xóa dòng {@code member}: listener dọn các bảng có khóa ngoại tới thành viên (người thân ở cả hai
 * phía, yêu cầu liên kết đang chờ, gỡ {@code user.member_id}, tệp đính kèm) rồi việc xóa mới tiếp tục.
 * Xóa tệp trên Cloudinary phải chờ sau khi commit.
 */
public record MemberDeletedEvent(Long memberId, Long actorId) {
}
