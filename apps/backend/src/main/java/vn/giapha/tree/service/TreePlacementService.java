package vn.giapha.tree.service;

import java.util.Map;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.member.MemberTreePlacement;
import vn.giapha.tree.repository.TreeNodeRepository;
import vn.giapha.tree.repository.TreeSpouseRepository;

/** Cho module thành viên biết đời của từng người: dựng đồ thị từ cả cây rồi tính độ sâu (cùng thuật toán với frontend). */
@Component
class TreePlacementService implements MemberTreePlacement {

    private final TreeNodeRepository nodes;
    private final TreeSpouseRepository spouses;

    TreePlacementService(TreeNodeRepository nodes, TreeSpouseRepository spouses) {
        this.nodes = nodes;
        this.spouses = spouses;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, Integer> generations() {
        return new TreeIndex(nodes.findAllOrdered(), spouses.findAllOrdered()).generationsByMember();
    }
}
