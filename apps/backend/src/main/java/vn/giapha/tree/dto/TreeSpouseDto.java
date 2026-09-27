package vn.giapha.tree.dto;

/** Quan hệ vợ/chồng: {@code nodeId} là ô thuộc dòng, {@code spouseNodeId} là ô vợ/chồng, {@code order} từ 1 (Cả, Hai...). */
public record TreeSpouseDto(Long nodeId, Long spouseNodeId, int order) {
}
