package vn.giapha.tree.service;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.auth.AuthFacade;
import vn.giapha.common.audit.AuditLogWriter;
import vn.giapha.common.exception.BusinessException;
import vn.giapha.common.exception.FieldError;
import vn.giapha.member.MemberFacade;
import vn.giapha.member.MemberFacade.MemberCard;
import vn.giapha.tree.dto.TreeChildInput;
import vn.giapha.tree.dto.TreeCoParentInput;
import vn.giapha.tree.dto.TreeMemberInput;
import vn.giapha.tree.dto.TreeMoveInput;
import vn.giapha.tree.dto.TreeNodeDto;
import vn.giapha.tree.dto.TreeOrderInput;
import vn.giapha.tree.dto.TreeResponse;
import vn.giapha.tree.entity.TreeNode;
import vn.giapha.tree.entity.TreeSpouse;
import vn.giapha.tree.mapper.TreeMapper;
import vn.giapha.tree.repository.TreeNodeRepository;
import vn.giapha.tree.repository.TreeSpouseRepository;
import vn.giapha.tree.service.TreeRules.ChildPair;
import vn.giapha.tree.service.TreeRules.ReorderPlan;

/**
 * Cây gia phả dựng tay (IDEA §8; DECISIONS #60, #61). Mọi tài khoản đã duyệt xem được; chỉ Admin dựng, vai trò đọc
 * lại từ DB. Quy tắc hợp lệ giống hệt {@code utils/tree} của frontend ({@link TreeRules}).
 *
 * <p>Đọc: tải cả cây bằng một truy vấn mỗi bảng rồi dựng đồ thị trong bộ nhớ. Ghi: khóa cả cây
 * ({@code SELECT ... FOR UPDATE}, xem {@link TreeNodeRepository#findAllForUpdate()}), kiểm tra trên đồ thị vừa đọc
 * dưới khóa, sửa entity rồi ghi audit log gồm đúng những dòng đã đổi (trước và sau).
 */
@Service
public class TreeService {

    private static final String TARGET_TYPE = "TREE_NODE";

    private final TreeNodeRepository nodes;
    private final TreeSpouseRepository spouses;
    private final TreeMapper mapper;
    private final MemberFacade members;
    private final AuthFacade auth;
    private final AuditLogWriter audit;
    private final Clock clock;

    TreeService(TreeNodeRepository nodes, TreeSpouseRepository spouses, TreeMapper mapper, MemberFacade members,
            AuthFacade auth, AuditLogWriter audit, Clock clock) {
        this.nodes = nodes;
        this.spouses = spouses;
        this.mapper = mapper;
        this.members = members;
        this.auth = auth;
        this.audit = audit;
        this.clock = clock;
    }

    /** Ảnh chụp một ô để ghi audit log (không chứa gì nhạy cảm). */
    record NodeSnapshot(Long id, Long memberId, Long parentNodeId, Long coParentNodeId, int sortOrder) {
    }

    /** Ảnh chụp một dòng vợ/chồng để ghi audit log. */
    record SpouseSnapshot(Long spouseNodeId, Long nodeId, int order) {
    }

    /** Những dòng đã đổi trong một thao tác: {@code before} là dòng bị sửa/xóa, {@code after} là dòng mới/đã sửa. */
    record TreeChange(List<NodeSnapshot> nodes, List<SpouseSnapshot> spouses) {
        boolean isEmpty() {
            return nodes.isEmpty() && spouses.isEmpty();
        }
    }

    /** Trạng thái cây đã khóa trong một thao tác ghi. */
    private final class Locked {
        final List<TreeNode> nodeList = nodes.findAllForUpdate();
        // Đọc vợ/chồng sau khi đã khóa các ô nên không ai sửa được xen giữa
        final List<TreeSpouse> spouseList = spouses.findAllOrdered();
        final TreeIndex index = new TreeIndex(nodeList, spouseList);
        final Map<Long, TreeSpouse> spouseRows = spouseList.stream()
                .collect(Collectors.toMap(TreeSpouse::getSpouseNodeId, s -> s));
        final TreeChange before = snapshot(nodeList, spouseList);
        final Instant now = Instant.now(clock);
    }

    // ---------- Đọc ----------

    @Transactional(readOnly = true)
    public TreeResponse get() {
        List<TreeNode> nodeList = nodes.findAllOrdered();
        Map<Long, MemberCard> cards = cardsOf(nodeList);
        return new TreeResponse(
                nodeList.stream().map(n -> mapper.toNode(n, cards)).toList(),
                spouses.findAllOrdered().stream().map(mapper::toSpouse).toList());
    }

    // ---------- Ghi ----------

    @Transactional
    public TreeNodeDto addRoot(Long actorId, TreeMemberInput input) {
        requireAdmin(actorId);
        Long memberId = requireMember(input.memberId());
        Locked tree = lock();
        TreeRules.checkAddRoot(tree.index, memberId);
        TreeNode node = insert(new TreeNode(memberId, null, null, nextSortOrder(tree.index.roots(), null), actorId,
                tree.now));
        return finish(actorId, "CREATE", tree, node);
    }

    @Transactional
    public TreeNodeDto addChild(Long actorId, Long nodeId, TreeChildInput input) {
        requireAdmin(actorId);
        Long memberId = requireMember(input.memberId());
        Long coParentNodeId = optionalNodeId(input.coParentNodeId(), "coParentNodeId");
        Locked tree = lock();
        ChildPair pair = TreeRules.checkAddChild(tree.index, nodeId, memberId, coParentNodeId);
        TreeNode node = insert(new TreeNode(memberId, pair.parentNodeId(), pair.coParentNodeId(),
                nextSortOrder(tree.index.childrenOf(pair.parentNodeId()), null), actorId, tree.now));
        return finish(actorId, "CREATE", tree, node);
    }

    @Transactional
    public TreeNodeDto addSpouse(Long actorId, Long nodeId, TreeMemberInput input) {
        requireAdmin(actorId);
        Long memberId = requireMember(input.memberId());
        Locked tree = lock();
        int order = TreeRules.checkAddSpouse(tree.index, nodeId, memberId);
        TreeNode node = insert(new TreeNode(memberId, null, null, 0, actorId, tree.now));
        spouses.save(new TreeSpouse(nodeId, node.getId(), order));
        return finish(actorId, "CREATE", tree, node);
    }

    /** Người mới thế vào chỗ của gốc cũ; gốc cũ thành con duy nhất (cả cây rời dịch xuống một đời). */
    @Transactional
    public TreeNodeDto addParent(Long actorId, Long nodeId, TreeMemberInput input) {
        requireAdmin(actorId);
        Long memberId = requireMember(input.memberId());
        Locked tree = lock();
        TreeRules.checkAddParent(tree.index, nodeId, memberId);
        TreeNode child = tree.index.node(nodeId);
        TreeNode node = insert(new TreeNode(memberId, null, null, child.getSortOrder(), actorId, tree.now));
        child.place(node.getId(), null, 1, tree.now);
        return finish(actorId, "CREATE", tree, node);
    }

    @Transactional
    public TreeNodeDto fillSlot(Long actorId, Long nodeId, TreeMemberInput input) {
        requireAdmin(actorId);
        Long memberId = requireMember(input.memberId());
        Locked tree = lock();
        TreeRules.checkFillSlot(tree.index, nodeId, memberId);
        TreeNode node = tree.index.node(nodeId);
        node.setMemberId(memberId, tree.now);
        flushOrConflict();
        return finish(actorId, "UPDATE", tree, node);
    }

    @Transactional
    public TreeNodeDto removeMember(Long actorId, Long nodeId) {
        requireAdmin(actorId);
        Locked tree = lock();
        TreeRules.checkRemoveMember(tree.index, nodeId);
        TreeNode node = tree.index.node(nodeId);
        node.setMemberId(null, tree.now);
        return finish(actorId, "UPDATE", tree, node);
    }

    /**
     * Xóa ô trống mà vẫn giữ nhánh (DECISIONS #61, bản Java của {@code utils/tree/delete.ts}):
     * ô vợ/chồng bị bỏ và con của cặp đó thành con của một mình người thuộc dòng; ô thuộc dòng có vợ/chồng thì vợ/chồng
     * thứ nhất thế vào đúng chỗ; ô thuộc dòng không có vợ/chồng thì con cháu lên thế chỗ (dịch lên một đời).
     */
    @Transactional
    public void deleteNode(Long actorId, Long nodeId) {
        requireAdmin(actorId);
        Locked tree = lock();
        TreeRules.checkDeleteSlot(tree.index, nodeId);
        TreeNode node = tree.index.node(nodeId);
        detach(tree, node);
        nodes.delete(node);
        writeAudit(actorId, "DELETE", tree, nodeId);
    }

    @Transactional
    public TreeNodeDto moveNode(Long actorId, Long nodeId, TreeMoveInput input) {
        requireAdmin(actorId);
        Long newParentNodeId = optionalNodeId(input.newParentNodeId(), "newParentNodeId");
        Long coParentNodeId = optionalNodeId(input.coParentNodeId(), "coParentNodeId");
        Locked tree = lock();
        ChildPair pair = TreeRules.checkMove(tree.index, nodeId, newParentNodeId, coParentNodeId);
        TreeNode node = tree.index.node(nodeId);
        List<TreeNode> siblings = pair.parentNodeId() == null
                ? tree.index.roots()
                : tree.index.childrenOf(pair.parentNodeId());
        node.place(pair.parentNodeId(), pair.coParentNodeId(), nextSortOrder(siblings, nodeId), tree.now);
        return finish(actorId, "UPDATE", tree, node);
    }

    @Transactional
    public TreeNodeDto reorderNode(Long actorId, Long nodeId, TreeOrderInput input) {
        requireAdmin(actorId);
        boolean left = switch (input.direction() == null ? "" : input.direction()) {
            case "LEFT" -> true;
            case "RIGHT" -> false;
            default -> throw validation("direction", "Hướng chỉ nhận LEFT hoặc RIGHT.");
        };
        Locked tree = lock();
        ReorderPlan plan = TreeRules.checkReorder(tree.index, nodeId, left);
        // Đánh số lại cả hàng anh em rồi đổi chỗ hai người, tránh nhầm khi các sortOrder đang trùng nhau
        List<TreeNode> order = new ArrayList<>(plan.siblings());
        Collections.swap(order, plan.from(), plan.to());
        for (int i = 0; i < order.size(); i++) {
            order.get(i).setSortOrder(i + 1, tree.now);
        }
        return finish(actorId, "UPDATE", tree, tree.index.node(nodeId));
    }

    @Transactional
    public TreeNodeDto setCoParent(Long actorId, Long nodeId, TreeCoParentInput input) {
        requireAdmin(actorId);
        Long coParentNodeId = optionalNodeId(input.coParentNodeId(), "coParentNodeId");
        Locked tree = lock();
        ChildPair pair = TreeRules.checkSetCoParent(tree.index, nodeId, coParentNodeId);
        TreeNode node = tree.index.node(nodeId);
        node.setCoParentNodeId(pair.coParentNodeId(), tree.now);
        return finish(actorId, "UPDATE", tree, node);
    }

    // ---------- Xóa ô ----------

    /** Nối lại con cháu, vợ/chồng và thứ tự anh em quanh ô sắp xóa để không còn dòng nào trỏ tới nó. */
    private void detach(Locked tree, TreeNode node) {
        TreeIndex index = tree.index;
        Instant now = tree.now;
        Long nodeId = node.getId();
        Long ownerId = index.ownerOf(nodeId);

        if (ownerId != null) {
            // Ô vợ/chồng: con của cặp đó thành con của một mình người thuộc dòng; đánh lại thứ tự vợ/chồng còn lại
            for (TreeNode n : tree.nodeList) {
                if (nodeId.equals(n.getCoParentNodeId())) {
                    n.setCoParentNodeId(null, now);
                }
            }
            int order = 0;
            for (TreeIndex.SpouseEntry entry : index.spousesOf(ownerId)) {
                if (!entry.node().getId().equals(nodeId)) {
                    tree.spouseRows.get(entry.node().getId()).setOrder(++order);
                }
            }
            spouses.delete(tree.spouseRows.get(nodeId));
            return;
        }

        List<TreeIndex.SpouseEntry> own = index.spousesOf(nodeId);
        List<TreeNode> kids = index.childrenOf(nodeId);
        Long parentId = node.getParentNodeId();
        List<Long> replacement = new ArrayList<>();

        if (!own.isEmpty()) {
            // Vợ/chồng thứ nhất thế vào đúng chỗ (cha/mẹ, cặp cha–mẹ, thứ tự), nhận con cháu và các vợ/chồng còn lại
            TreeNode heir = own.get(0).node();
            heir.place(parentId, node.getCoParentNodeId(), heir.getSortOrder(), now);
            for (TreeNode kid : kids) {
                kid.setParentNodeId(heir.getId(), now);
                if (heir.getId().equals(kid.getCoParentNodeId())) {
                    kid.setCoParentNodeId(null, now);
                }
            }
            spouses.delete(tree.spouseRows.get(heir.getId()));
            for (int i = 1; i < own.size(); i++) {
                tree.spouseRows.get(own.get(i).node().getId()).reassign(heir.getId(), i);
            }
            replacement.add(heir.getId());
        } else {
            // Con cháu lên thế chỗ, làm con của cha/mẹ của ô bị xóa (hoặc thành gốc)
            for (TreeNode kid : kids) {
                kid.place(parentId, parentId == null ? null : node.getCoParentNodeId(), kid.getSortOrder(), now);
                replacement.add(kid.getId());
            }
        }

        // Người thế chỗ đứng đúng vị trí của ô cũ giữa các anh em, xếp lại 1..n
        List<Long> merged = new ArrayList<>();
        for (TreeNode sibling : index.siblingsOf(nodeId)) {
            if (sibling.getId().equals(nodeId)) {
                merged.addAll(replacement);
            } else {
                merged.add(sibling.getId());
            }
        }
        int sort = 0;
        for (Long id : merged) {
            index.node(id).setSortOrder(++sort, now);
        }
    }

    // ---------- Nội bộ ----------

    private Locked lock() {
        return new Locked();
    }

    /** Lưu ô mới để có id ngay; đụng khóa duy nhất của {@code member_id} thì báo thành viên đã có trên cây. */
    private TreeNode insert(TreeNode node) {
        try {
            return nodes.saveAndFlush(node);
        } catch (DataIntegrityViolationException e) {
            throw TreeError.MEMBER_ALREADY_ON_TREE.exception();
        }
    }

    private void flushOrConflict() {
        try {
            nodes.flush();
        } catch (DataIntegrityViolationException e) {
            throw TreeError.MEMBER_ALREADY_ON_TREE.exception();
        }
    }

    /** Ghi audit log của thao tác rồi trả ô đã đổi. */
    private TreeNodeDto finish(Long actorId, String action, Locked tree, TreeNode node) {
        writeAudit(actorId, action, tree, node.getId());
        return mapper.toNode(node, cardsOf(List.of(node)));
    }

    /** Audit log chỉ giữ những dòng đã đổi: {@code before} là trạng thái cũ, {@code after} là trạng thái mới. */
    private void writeAudit(Long actorId, String action, Locked tree, Long targetId) {
        TreeChange after = snapshot(nodes.findAllOrdered(), spouses.findAllOrdered());
        Map<Long, NodeSnapshot> afterNodes = after.nodes().stream().collect(Collectors.toMap(NodeSnapshot::id, n -> n));
        Map<Long, SpouseSnapshot> afterSpouses = after.spouses().stream()
                .collect(Collectors.toMap(SpouseSnapshot::spouseNodeId, s -> s));
        Map<Long, NodeSnapshot> beforeNodes = tree.before.nodes().stream()
                .collect(Collectors.toMap(NodeSnapshot::id, n -> n));
        Map<Long, SpouseSnapshot> beforeSpouses = tree.before.spouses().stream()
                .collect(Collectors.toMap(SpouseSnapshot::spouseNodeId, s -> s));

        TreeChange changedBefore = new TreeChange(
                tree.before.nodes().stream().filter(n -> !n.equals(afterNodes.get(n.id()))).toList(),
                tree.before.spouses().stream().filter(s -> !s.equals(afterSpouses.get(s.spouseNodeId()))).toList());
        TreeChange changedAfter = new TreeChange(
                after.nodes().stream().filter(n -> !n.equals(beforeNodes.get(n.id()))).toList(),
                after.spouses().stream().filter(s -> !s.equals(beforeSpouses.get(s.spouseNodeId()))).toList());
        audit.write(actorId, action, TARGET_TYPE, targetId, changedBefore.isEmpty() ? null : changedBefore,
                changedAfter.isEmpty() ? null : changedAfter);
    }

    private static TreeChange snapshot(List<TreeNode> nodeList, List<TreeSpouse> spouseList) {
        return new TreeChange(
                nodeList.stream().map(n -> new NodeSnapshot(n.getId(), n.getMemberId(), n.getParentNodeId(),
                        n.getCoParentNodeId(), n.getSortOrder())).toList(),
                spouseList.stream().map(s -> new SpouseSnapshot(s.getSpouseNodeId(), s.getNodeId(), s.getOrder()))
                        .toList());
    }

    /** Thẻ thành viên của các ô có người, một truy vấn. */
    private Map<Long, MemberCard> cardsOf(List<TreeNode> nodeList) {
        Set<Long> ids = nodeList.stream().map(TreeNode::getMemberId).filter(id -> id != null)
                .collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return Map.of();
        }
        Map<Long, MemberCard> result = new HashMap<>();
        members.findCards(ids).forEach(card -> result.put(card.id(), card));
        return result;
    }

    /** Thứ tự cho người mới xếp cuối các anh em ({@code exceptId} là ô đang được chuyển, không tính). */
    private static int nextSortOrder(List<TreeNode> siblings, Long exceptId) {
        return siblings.stream().filter(n -> !n.getId().equals(exceptId)).mapToInt(TreeNode::getSortOrder).max()
                .orElse(0) + 1;
    }

    private Long requireMember(Long memberId) {
        if (memberId == null || memberId < 1) {
            throw validation("memberId", "Vui lòng chọn một thành viên.");
        }
        if (!members.exists(memberId)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "MEMBER_NOT_FOUND", "Không tìm thấy thành viên.");
        }
        return memberId;
    }

    /** Trường id ô có thể để trống (null) nhưng nếu có thì phải là số nguyên dương. */
    private static Long optionalNodeId(Long value, String field) {
        if (value != null && value < 1) {
            throw validation(field, "Mã ô trên cây không hợp lệ.");
        }
        return value;
    }

    private void requireAdmin(Long actorId) {
        boolean admin = auth.find(actorId).filter(AuthFacade.Account::usable).map(AuthFacade.Account::admin)
                .orElse(false);
        if (!admin) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Chỉ Admin được thực hiện thao tác này.");
        }
    }

    private static BusinessException validation(String field, String message) {
        return new BusinessException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Dữ liệu không hợp lệ.",
                List.of(new FieldError(field, message)));
    }
}
