package vn.giapha.tree.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Di chuyển nhánh. {@code newParentNodeId} bắt buộc có mặt nhưng được để null (thành gốc mới), nên thiếu khóa này thì
 * bị từ chối khi đọc JSON.
 */
public record TreeMoveInput(@JsonProperty(required = true) Long newParentNodeId, Long coParentNodeId) {
}
