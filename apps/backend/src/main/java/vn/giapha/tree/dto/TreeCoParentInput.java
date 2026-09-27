package vn.giapha.tree.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/** Đổi cặp cha–mẹ. {@code coParentNodeId} bắt buộc có mặt, null nghĩa là để hệ thống tự nhận (khi có đúng 1 vợ/chồng). */
public record TreeCoParentInput(@JsonProperty(required = true) Long coParentNodeId) {
}
