package vn.giapha.member;

import java.util.List;

/**
 * Bổ sung một phần vào bản sao "đã xóa" của thành viên trong audit log (IDEA §6.1). Snapshot có dạng
 * {@code {"member": ..., "relations": [...], "attachments": [...]}}; module nào giữ dữ liệu liên quan hiện thực
 * interface này để phần của mình được lưu <b>trước</b> khi {@link MemberDeletedEvent} khiến dữ liệu đó bị xóa
 * (người thân ở Đợt 28 dùng {@code "relations"}, tệp đính kèm ở Đợt 30 dùng {@code "attachments"}).
 */
public interface MemberSnapshotContributor {

    /** Khóa trong snapshot: {@code "relations"} hoặc {@code "attachments"}. */
    String section();

    /** Các dòng dữ liệu liên quan tới thành viên; chạy trong transaction của thao tác xóa. */
    List<?> collect(Long memberId);
}
