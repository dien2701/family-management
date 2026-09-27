package vn.giapha.tree.service;

import org.springframework.http.HttpStatus;

import vn.giapha.common.exception.BusinessException;

/** Mã lỗi và thông báo của các thao tác cây; giống {@code TREE_ERROR_STATUS} và thông báo ở {@code utils/tree/rules.ts}. */
enum TreeError {

    TREE_NODE_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy ô này trên cây."),
    MEMBER_ALREADY_ON_TREE(HttpStatus.CONFLICT, "Thành viên này đã có trên cây."),
    TREE_NEEDS_CO_PARENT(HttpStatus.CONFLICT, "Người này có từ 2 vợ/chồng trở lên, hãy chọn đây là con với ai."),
    TREE_INVALID_CO_PARENT(HttpStatus.CONFLICT, "Người được chọn không phải vợ/chồng của cha/mẹ."),
    TREE_PARENT_ONLY_AT_TOP(HttpStatus.CONFLICT, "Chỉ thêm được cha/mẹ cho người gốc ở Đời 01."),
    TREE_SPOUSE_NOT_ALLOWED(HttpStatus.CONFLICT, "Ô vợ/chồng không thêm được vợ/chồng."),
    TREE_SLOT_NOT_EMPTY(HttpStatus.CONFLICT, "Ô này đang có người, không phải ô trống."),
    TREE_SLOT_EMPTY(HttpStatus.CONFLICT, "Ô này đã là ô trống."),
    TREE_CYCLE(HttpStatus.CONFLICT, "Không thể chuyển nhánh vào chính con cháu của nó."),
    TREE_MOVE_LINEAGE_ONLY(HttpStatus.CONFLICT, "Chỉ chuyển được ô thuộc dòng; vợ/chồng đi theo người trong dòng."),
    TREE_NOT_A_CHILD(HttpStatus.CONFLICT, "Ô này không có cha/mẹ nên không có cặp cha–mẹ."),
    TREE_ORDER_EDGE(HttpStatus.CONFLICT, "Đã ở đầu hoặc cuối hàng anh em, không đổi chỗ thêm được.");

    private final HttpStatus status;
    private final String message;

    TreeError(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }

    BusinessException exception() {
        return new BusinessException(status, name(), message);
    }
}
