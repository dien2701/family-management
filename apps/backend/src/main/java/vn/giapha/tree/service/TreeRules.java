package vn.giapha.tree.service;

import java.util.List;

import vn.giapha.tree.entity.TreeNode;

/**
 * Kiểm tra hợp lệ mọi thao tác dựng cây theo DECISIONS #60 và #61. Bản Java của {@code utils/tree/rules.ts} (frontend),
 * cùng thứ tự kiểm tra và cùng mã lỗi; vi phạm thì ném {@link vn.giapha.common.exception.BusinessException}.
 */
final class TreeRules {

    /** Cặp cha–mẹ đã được xác định cho một người con; {@code coParentNodeId} có thể null. */
    record ChildPair(Long parentNodeId, Long coParentNodeId) {
    }

    /** Kết quả kiểm tra đổi thứ tự: hàng anh em (đã xếp) và vị trí hiện tại, vị trí đến của ô. */
    record ReorderPlan(List<TreeNode> siblings, int from, int to) {
    }

    private TreeRules() {
    }

    /** Mỗi thành viên chỉ có một ô trên cây. */
    static void checkMemberFree(TreeIndex index, Long memberId) {
        if (index.isMemberOnTree(memberId)) {
            throw TreeError.MEMBER_ALREADY_ON_TREE.exception();
        }
    }

    static void checkAddRoot(TreeIndex index, Long memberId) {
        checkMemberFree(index, memberId);
    }

    /**
     * Xác định cặp cha–mẹ khi thêm con (hoặc chuyển nhánh vào) dưới ô {@code nodeId}:
     * bấm trên ô vợ/chồng thì cặp là ô đó cùng người thuộc dòng; ô thuộc dòng có từ 2 vợ/chồng thì bắt buộc chọn
     * {@code coParentNodeId}, có đúng 1 thì tự nhận, không có thì không có cặp.
     */
    static ChildPair resolveChildPair(TreeIndex index, Long nodeId, Long coParentNodeId) {
        if (!index.contains(nodeId)) {
            throw TreeError.TREE_NODE_NOT_FOUND.exception();
        }
        Long ownerId = index.ownerOf(nodeId);
        if (ownerId != null) {
            if (coParentNodeId != null && !coParentNodeId.equals(nodeId)) {
                throw TreeError.TREE_INVALID_CO_PARENT.exception();
            }
            return new ChildPair(ownerId, nodeId);
        }
        List<TreeIndex.SpouseEntry> spouses = index.spousesOf(nodeId);
        if (coParentNodeId != null) {
            if (spouses.stream().noneMatch(s -> s.node().getId().equals(coParentNodeId))) {
                throw TreeError.TREE_INVALID_CO_PARENT.exception();
            }
            return new ChildPair(nodeId, coParentNodeId);
        }
        if (spouses.size() >= 2) {
            throw TreeError.TREE_NEEDS_CO_PARENT.exception();
        }
        return new ChildPair(nodeId, spouses.isEmpty() ? null : spouses.get(0).node().getId());
    }

    static ChildPair checkAddChild(TreeIndex index, Long nodeId, Long memberId, Long coParentNodeId) {
        ChildPair pair = resolveChildPair(index, nodeId, coParentNodeId);
        checkMemberFree(index, memberId);
        return pair;
    }

    /** "+ Vợ/Chồng" chỉ có trên ô thuộc dòng. Trả thứ tự của người mới (sau người cuối). */
    static int checkAddSpouse(TreeIndex index, Long nodeId, Long memberId) {
        if (!index.contains(nodeId)) {
            throw TreeError.TREE_NODE_NOT_FOUND.exception();
        }
        if (index.isSpouseNode(nodeId)) {
            throw TreeError.TREE_SPOUSE_NOT_ALLOWED.exception();
        }
        checkMemberFree(index, memberId);
        List<TreeIndex.SpouseEntry> spouses = index.spousesOf(nodeId);
        return (spouses.isEmpty() ? 0 : spouses.get(spouses.size() - 1).order()) + 1;
    }

    /** "+ Cha/Mẹ" chỉ có trên ô thuộc dòng ở Đời 01 (gốc). */
    static void checkAddParent(TreeIndex index, Long nodeId, Long memberId) {
        TreeNode node = index.node(nodeId);
        if (node == null) {
            throw TreeError.TREE_NODE_NOT_FOUND.exception();
        }
        if (index.isSpouseNode(nodeId) || node.getParentNodeId() != null) {
            throw TreeError.TREE_PARENT_ONLY_AT_TOP.exception();
        }
        checkMemberFree(index, memberId);
    }

    /** Gỡ khỏi cây: ô có người thì thành ô trống, con cháu và vợ/chồng giữ nguyên. */
    static void checkRemoveMember(TreeIndex index, Long nodeId) {
        TreeNode node = index.node(nodeId);
        if (node == null) {
            throw TreeError.TREE_NODE_NOT_FOUND.exception();
        }
        if (node.getMemberId() == null) {
            throw TreeError.TREE_SLOT_EMPTY.exception();
        }
    }

    /** Điền ô trống bằng một thành viên chưa có trên cây. */
    static void checkFillSlot(TreeIndex index, Long nodeId, Long memberId) {
        TreeNode node = index.node(nodeId);
        if (node == null) {
            throw TreeError.TREE_NODE_NOT_FOUND.exception();
        }
        if (node.getMemberId() != null) {
            throw TreeError.TREE_SLOT_NOT_EMPTY.exception();
        }
        checkMemberFree(index, memberId);
    }

    /** Xóa ô: chỉ ô trống (đã gỡ người). Ô còn con cháu hoặc vợ/chồng vẫn xóa được, nhánh được giữ lại. */
    static void checkDeleteSlot(TreeIndex index, Long nodeId) {
        TreeNode node = index.node(nodeId);
        if (node == null) {
            throw TreeError.TREE_NODE_NOT_FOUND.exception();
        }
        if (node.getMemberId() != null) {
            throw TreeError.TREE_SLOT_NOT_EMPTY.exception();
        }
    }

    /**
     * Di chuyển nhánh: ô thuộc dòng đi kèm vợ/chồng và con cháu, tới làm con của {@code newParentNodeId} (ô thuộc dòng
     * hoặc ô vợ/chồng, cặp xác định như khi thêm con) hoặc thành gốc mới khi là null. Chặn vòng. Trả cặp cha–mẹ mới
     * (cả hai null khi thành gốc).
     */
    static ChildPair checkMove(TreeIndex index, Long nodeId, Long newParentNodeId, Long coParentNodeId) {
        if (!index.contains(nodeId)) {
            throw TreeError.TREE_NODE_NOT_FOUND.exception();
        }
        if (index.isSpouseNode(nodeId)) {
            throw TreeError.TREE_MOVE_LINEAGE_ONLY.exception();
        }
        if (newParentNodeId == null) {
            return new ChildPair(null, null);
        }
        if (!index.contains(newParentNodeId)) {
            throw TreeError.TREE_NODE_NOT_FOUND.exception();
        }
        if (index.branchIds(nodeId).contains(newParentNodeId)) {
            throw TreeError.TREE_CYCLE.exception();
        }
        return resolveChildPair(index, newParentNodeId, coParentNodeId);
    }

    /** Đổi cặp cha–mẹ của một người con: {@code coParentNodeId} phải là vợ/chồng của cha/mẹ hiện tại. */
    static ChildPair checkSetCoParent(TreeIndex index, Long nodeId, Long coParentNodeId) {
        TreeNode node = index.node(nodeId);
        if (node == null) {
            throw TreeError.TREE_NODE_NOT_FOUND.exception();
        }
        if (node.getParentNodeId() == null || index.isSpouseNode(nodeId)) {
            throw TreeError.TREE_NOT_A_CHILD.exception();
        }
        return resolveChildPair(index, node.getParentNodeId(), coParentNodeId);
    }

    /** Đổi thứ tự anh em: chỉ ô thuộc dòng, đổi chỗ với người kề bên. */
    static ReorderPlan checkReorder(TreeIndex index, Long nodeId, boolean left) {
        if (!index.contains(nodeId)) {
            throw TreeError.TREE_NODE_NOT_FOUND.exception();
        }
        if (index.isSpouseNode(nodeId)) {
            throw TreeError.TREE_MOVE_LINEAGE_ONLY.exception();
        }
        List<TreeNode> siblings = index.siblingsOf(nodeId);
        int from = -1;
        for (int i = 0; i < siblings.size(); i++) {
            if (siblings.get(i).getId().equals(nodeId)) {
                from = i;
                break;
            }
        }
        int to = left ? from - 1 : from + 1;
        if (from < 0 || to < 0 || to >= siblings.size()) {
            throw TreeError.TREE_ORDER_EDGE.exception();
        }
        return new ReorderPlan(siblings, from, to);
    }
}
