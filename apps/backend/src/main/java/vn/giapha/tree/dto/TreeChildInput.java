package vn.giapha.tree.dto;

/** Thêm con: {@code coParentNodeId} là ô vợ/chồng còn lại của con, bắt buộc khi cha/mẹ có từ 2 vợ/chồng. */
public record TreeChildInput(Long memberId, Long coParentNodeId) {
}
