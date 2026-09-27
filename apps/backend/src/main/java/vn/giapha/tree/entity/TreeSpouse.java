package vn.giapha.tree.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Quan hệ vợ/chồng của một ô thuộc dòng. Khóa chính là {@code spouseNodeId} nên một ô vợ/chồng chỉ thuộc đúng một ô
 * thuộc dòng (DECISIONS #60).
 */
@Entity
@Table(name = "tree_spouse")
public class TreeSpouse {

    @Id
    @Column(name = "spouse_node_id")
    private Long spouseNodeId;

    @Column(name = "node_id", nullable = false)
    private Long nodeId;

    @Column(name = "spouse_order", nullable = false)
    private int spouseOrder;

    protected TreeSpouse() {
    }

    public TreeSpouse(Long nodeId, Long spouseNodeId, int order) {
        this.nodeId = nodeId;
        this.spouseNodeId = spouseNodeId;
        this.spouseOrder = order;
    }

    /** Chuyển sang một ô thuộc dòng khác (khi ô thuộc dòng cũ bị xóa) với thứ tự mới. */
    public void reassign(Long nodeId, int order) {
        this.nodeId = nodeId;
        this.spouseOrder = order;
    }

    public void setOrder(int order) {
        this.spouseOrder = order;
    }

    public Long getSpouseNodeId() {
        return spouseNodeId;
    }

    public Long getNodeId() {
        return nodeId;
    }

    public int getOrder() {
        return spouseOrder;
    }
}
