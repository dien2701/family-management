package vn.giapha.tree.dto;

import java.util.List;

/** Toàn bộ đồ thị cây (GET /api/tree). Cây trống thì cả hai mảng rỗng. */
public record TreeResponse(List<TreeNodeDto> nodes, List<TreeSpouseDto> spouses) {
}
