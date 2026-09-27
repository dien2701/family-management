package vn.giapha.member;

/**
 * Chặn việc xóa một thành viên. Mọi bean hiện thực interface này được hỏi trước khi xóa; ném
 * {@link vn.giapha.common.exception.BusinessException} (thường 409) để hủy. Module cây gia phả hiện thực
 * ({@code TreeDeletionGuard}) để chặn xóa người đang có trên cây ({@code MEMBER_ON_TREE}).
 */
public interface MemberDeletionGuard {

    /** Chạy trong transaction của thao tác xóa. */
    void check(Long memberId);
}
