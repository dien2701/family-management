package vn.giapha.tree.service;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import vn.giapha.tree.entity.TreeNode;
import vn.giapha.tree.entity.TreeSpouse;

/**
 * Chỉ mục dựng một lần từ toàn bộ cây để tra nhanh; bản Java của {@code utils/tree/graph.ts} ở frontend. Quy ước:
 * ô <b>thuộc dòng</b> là ô không phải vợ/chồng của ai; {@code parentNodeId} của con luôn là ô thuộc dòng,
 * {@code coParentNodeId} là ô vợ/chồng của ô đó. Đời = độ sâu từ gốc, không lưu trong DB.
 *
 * <p>Chỉ mục là ảnh chụp tại lúc dựng: thao tác ghi kiểm tra trên chỉ mục rồi mới sửa entity, không dựa vào chỉ mục sau
 * khi sửa.
 */
final class TreeIndex {

    /** Một vợ/chồng của một ô thuộc dòng kèm thứ tự (1 = Cả, 2 = Hai...). */
    record SpouseEntry(TreeNode node, int order) {
    }

    private record Frame(TreeNode node, int generation) {
    }

    private static final Comparator<TreeNode> BY_SORT_ORDER =
            Comparator.comparingInt(TreeNode::getSortOrder).thenComparing(TreeNode::getId);

    private final Map<Long, TreeNode> nodes = new HashMap<>();
    /** Ô vợ/chồng → ô thuộc dòng của nó. */
    private final Map<Long, Long> ownerOf = new HashMap<>();
    /** Ô thuộc dòng → các ô vợ/chồng, thứ tự tăng dần. */
    private final Map<Long, List<SpouseEntry>> spousesOf = new HashMap<>();
    /** Ô thuộc dòng → các con theo {@code parentNodeId}, xếp theo {@code sortOrder}. */
    private final Map<Long, List<TreeNode>> childrenOf = new HashMap<>();
    private final List<TreeNode> roots = new ArrayList<>();
    /** Thành viên → ô của họ trên cây. */
    private final Map<Long, Long> nodeOfMember = new HashMap<>();

    TreeIndex(List<TreeNode> allNodes, List<TreeSpouse> allSpouses) {
        for (TreeNode node : allNodes) {
            nodes.put(node.getId(), node);
        }
        for (TreeSpouse link : allSpouses) {
            TreeNode spouse = nodes.get(link.getSpouseNodeId());
            if (spouse == null || !nodes.containsKey(link.getNodeId()) || ownerOf.containsKey(link.getSpouseNodeId())) {
                continue;
            }
            ownerOf.put(link.getSpouseNodeId(), link.getNodeId());
            spousesOf.computeIfAbsent(link.getNodeId(), k -> new ArrayList<>())
                    .add(new SpouseEntry(spouse, link.getOrder()));
        }
        for (List<SpouseEntry> list : spousesOf.values()) {
            list.sort(Comparator.comparingInt(SpouseEntry::order).thenComparing(s -> s.node().getId()));
        }
        for (TreeNode node : nodes.values()) {
            if (node.getMemberId() != null) {
                nodeOfMember.put(node.getMemberId(), node.getId());
            }
            if (ownerOf.containsKey(node.getId())) {
                continue;
            }
            if (node.getParentNodeId() != null && nodes.containsKey(node.getParentNodeId())) {
                childrenOf.computeIfAbsent(node.getParentNodeId(), k -> new ArrayList<>()).add(node);
            } else {
                roots.add(node);
            }
        }
        childrenOf.values().forEach(list -> list.sort(BY_SORT_ORDER));
        roots.sort(BY_SORT_ORDER);
    }

    TreeNode node(Long id) {
        return nodes.get(id);
    }

    boolean contains(Long id) {
        return nodes.containsKey(id);
    }

    /** Ô thuộc dòng mà {@code nodeId} là vợ/chồng của; {@code null} nếu chính nó thuộc dòng. */
    Long ownerOf(Long nodeId) {
        return ownerOf.get(nodeId);
    }

    boolean isSpouseNode(Long nodeId) {
        return ownerOf.containsKey(nodeId);
    }

    List<SpouseEntry> spousesOf(Long nodeId) {
        return spousesOf.getOrDefault(nodeId, List.of());
    }

    List<TreeNode> childrenOf(Long nodeId) {
        return childrenOf.getOrDefault(nodeId, List.of());
    }

    List<TreeNode> roots() {
        return roots;
    }

    boolean isMemberOnTree(Long memberId) {
        return nodeOfMember.containsKey(memberId);
    }

    /** Ô thuộc dòng của một ô: chính nó, hoặc người mà nó là vợ/chồng. */
    Long lineageIdOf(Long nodeId) {
        Long owner = ownerOf.get(nodeId);
        return owner != null ? owner : nodeId;
    }

    /**
     * Đời = độ sâu, tính riêng cho từng cây rời (gốc là 1). Ô vợ/chồng cùng đời với người kia. Ô không nối được tới
     * gốc nào (dữ liệu hỏng) không có trong kết quả.
     */
    Map<Long, Integer> computeGenerations() {
        Map<Long, Integer> result = new HashMap<>();
        // Duyệt bằng ngăn xếp để cây sâu không tràn stack; mỗi ô chỉ thăm một lần
        ArrayDeque<Frame> stack = new ArrayDeque<>();
        for (TreeNode root : roots) {
            stack.push(new Frame(root, 1));
        }
        while (!stack.isEmpty()) {
            Frame frame = stack.pop();
            TreeNode node = frame.node();
            int generation = frame.generation();
            if (result.containsKey(node.getId())) {
                continue;
            }
            result.put(node.getId(), generation);
            for (SpouseEntry spouse : spousesOf(node.getId())) {
                result.put(spouse.node().getId(), generation);
            }
            for (TreeNode child : childrenOf(node.getId())) {
                stack.push(new Frame(child, generation + 1));
            }
        }
        return result;
    }

    /** Đời của từng thành viên có trên cây (gốc là đời 1); người chưa có trên cây không có trong map. */
    Map<Long, Integer> generationsByMember() {
        Map<Long, Integer> generations = computeGenerations();
        Map<Long, Integer> result = new HashMap<>();
        for (TreeNode node : nodes.values()) {
            Integer generation = generations.get(node.getId());
            if (node.getMemberId() != null && generation != null) {
                result.put(node.getMemberId(), generation);
            }
        }
        return result;
    }

    /**
     * Cả nhánh của một ô: ô thuộc dòng cùng vợ/chồng của nó, rồi con cháu kèm vợ/chồng của họ. Bấm vào ô vợ/chồng thì
     * tính nhánh của người thuộc dòng.
     */
    Set<Long> branchIds(Long nodeId) {
        Set<Long> result = new HashSet<>();
        TreeNode start = nodes.get(lineageIdOf(nodeId));
        if (start == null) {
            return result;
        }
        ArrayDeque<TreeNode> queue = new ArrayDeque<>();
        queue.add(start);
        while (!queue.isEmpty()) {
            TreeNode node = queue.poll();
            result.add(node.getId());
            spousesOf(node.getId()).forEach(s -> result.add(s.node().getId()));
            queue.addAll(childrenOf(node.getId()));
        }
        return result;
    }

    /** Anh em cùng cha/mẹ của một ô thuộc dòng (kể cả chính nó), xếp theo {@code sortOrder}; gốc thì là các gốc. */
    List<TreeNode> siblingsOf(Long nodeId) {
        TreeNode node = nodes.get(nodeId);
        if (node == null || ownerOf.containsKey(nodeId)) {
            return List.of();
        }
        return node.getParentNodeId() != null && nodes.containsKey(node.getParentNodeId())
                ? childrenOf(node.getParentNodeId())
                : roots;
    }
}
