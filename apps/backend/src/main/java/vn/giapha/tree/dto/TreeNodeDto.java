package vn.giapha.tree.dto;

/**
 * Một ô trên cây. Đời không có trong DTO (frontend tính theo độ sâu). {@code memberId} và {@code member} cùng null khi
 * là ô trống.
 */
public record TreeNodeDto(
        Long id,
        Long memberId,
        TreeMemberDto member,
        Long parentNodeId,
        Long coParentNodeId,
        int sortOrder) {
}
