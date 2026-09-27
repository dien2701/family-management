package vn.giapha.tree.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Một ô trên cây gia phả (DECISIONS #60). {@code memberId = null} là ô trống. Không dùng quan hệ JPA: cả cây được tải
 * một lần và dựng đồ thị trong bộ nhớ ({@code TreeIndex}). Không bao giờ trả ra API: luôn qua DTO.
 */
@Entity
@Table(name = "tree_node")
public class TreeNode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id")
    private Long memberId;

    @Column(name = "parent_node_id")
    private Long parentNodeId;

    @Column(name = "co_parent_node_id")
    private Long coParentNodeId;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_by", updatable = false)
    private Long createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected TreeNode() {
    }

    public TreeNode(Long memberId, Long parentNodeId, Long coParentNodeId, int sortOrder, Long createdBy,
            Instant now) {
        this.memberId = memberId;
        this.parentNodeId = parentNodeId;
        this.coParentNodeId = coParentNodeId;
        this.sortOrder = sortOrder;
        this.createdBy = createdBy;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void setMemberId(Long memberId, Instant now) {
        this.memberId = memberId;
        this.updatedAt = now;
    }

    /** Đặt lại vị trí trên cây: cha/mẹ thuộc dòng, cặp cha–mẹ và thứ tự anh em. */
    public void place(Long parentNodeId, Long coParentNodeId, int sortOrder, Instant now) {
        this.parentNodeId = parentNodeId;
        this.coParentNodeId = coParentNodeId;
        this.sortOrder = sortOrder;
        this.updatedAt = now;
    }

    public void setParentNodeId(Long parentNodeId, Instant now) {
        this.parentNodeId = parentNodeId;
        this.updatedAt = now;
    }

    public void setCoParentNodeId(Long coParentNodeId, Instant now) {
        this.coParentNodeId = coParentNodeId;
        this.updatedAt = now;
    }

    public void setSortOrder(int sortOrder, Instant now) {
        if (this.sortOrder != sortOrder) {
            this.sortOrder = sortOrder;
            this.updatedAt = now;
        }
    }

    public Long getId() {
        return id;
    }

    public Long getMemberId() {
        return memberId;
    }

    public Long getParentNodeId() {
        return parentNodeId;
    }

    public Long getCoParentNodeId() {
        return coParentNodeId;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
