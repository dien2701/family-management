package vn.giapha.tree.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import vn.giapha.common.security.CurrentUser;
import vn.giapha.common.web.ApiRefs;
import vn.giapha.tree.dto.TreeChildInput;
import vn.giapha.tree.dto.TreeCoParentInput;
import vn.giapha.tree.dto.TreeMemberInput;
import vn.giapha.tree.dto.TreeMoveInput;
import vn.giapha.tree.dto.TreeNodeDto;
import vn.giapha.tree.dto.TreeOrderInput;
import vn.giapha.tree.dto.TreeResponse;
import vn.giapha.tree.service.TreeService;

/**
 * Cây gia phả. Mọi tài khoản đã duyệt xem được (cổng duyệt do {@code ApprovalGateFilter} chặn); các thao tác dựng cây
 * do {@link TreeService} kiểm lại vai trò Admin từ DB. Mã lỗi nghiệp vụ {@code TREE_*} xem {@code TreeError}.
 */
@RestController
@RequestMapping("/api/tree")
@Tag(name = "tree")
class TreeController {

    private final TreeService service;

    TreeController(TreeService service) {
        this.service = service;
    }

    @Operation(operationId = "getTree", summary = "Toàn bộ cây gia phả",
            description = "Mọi tài khoản đã duyệt xem được. Trả toàn bộ đồ thị (nút và cạnh); đời không nằm trong "
                    + "response, frontend tự tính theo độ sâu. Cây trống thì cả hai mảng rỗng.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @GetMapping
    TreeResponse get() {
        return service.get();
    }

    @Operation(operationId = "addTreeRoot", summary = "Thêm người gốc",
            description = "Chỉ Admin. Đưa một thành viên chưa có trên cây vào làm gốc mới (Đời 01), xếp cuối các gốc. "
                    + "Lỗi: 409 MEMBER_ALREADY_ON_TREE.")
    @ApiResponse(responseCode = "201", description = "Đã thêm, trả ô mới")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @PostMapping("/roots")
    @ResponseStatus(HttpStatus.CREATED)
    TreeNodeDto addRoot(@Parameter(hidden = true) CurrentUser current, @RequestBody TreeMemberInput input) {
        return service.addRoot(current.userId(), input);
    }

    @Operation(operationId = "addTreeChild", summary = "Thêm con vào một ô",
            description = "Chỉ Admin. Con mới xếp cuối các anh em; cặp cha–mẹ xác định theo số vợ/chồng của ô "
                    + "(bấm trên ô vợ/chồng thì cặp là ô đó cùng người thuộc dòng). Lỗi: 404 TREE_NODE_NOT_FOUND; "
                    + "409 MEMBER_ALREADY_ON_TREE, TREE_INVALID_CO_PARENT, TREE_NEEDS_CO_PARENT.")
    @ApiResponse(responseCode = "201", description = "Đã thêm, trả ô mới")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @PostMapping("/nodes/{id}/children")
    @ResponseStatus(HttpStatus.CREATED)
    TreeNodeDto addChild(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id,
            @RequestBody TreeChildInput input) {
        return service.addChild(current.userId(), id, input);
    }

    @Operation(operationId = "addTreeSpouse", summary = "Thêm vợ/chồng cho một ô",
            description = "Chỉ Admin. Chỉ có trên ô thuộc dòng; người mới xếp sau vợ/chồng cuối. Lỗi: 404 "
                    + "TREE_NODE_NOT_FOUND; 409 TREE_SPOUSE_NOT_ALLOWED, MEMBER_ALREADY_ON_TREE.")
    @ApiResponse(responseCode = "201", description = "Đã thêm, trả ô vợ/chồng mới")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @PostMapping("/nodes/{id}/spouses")
    @ResponseStatus(HttpStatus.CREATED)
    TreeNodeDto addSpouse(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id,
            @RequestBody TreeMemberInput input) {
        return service.addSpouse(current.userId(), id, input);
    }

    @Operation(operationId = "addTreeParent", summary = "Thêm cha/mẹ cho người gốc",
            description = "Chỉ Admin. Chỉ có trên ô thuộc dòng ở Đời 01: người mới thành gốc, ô này thành con của "
                    + "người mới nên cả cây rời đó dịch xuống một đời. Lỗi: 404 TREE_NODE_NOT_FOUND; 409 "
                    + "TREE_PARENT_ONLY_AT_TOP, MEMBER_ALREADY_ON_TREE.")
    @ApiResponse(responseCode = "201", description = "Đã thêm, trả ô cha/mẹ mới")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @PostMapping("/nodes/{id}/parent")
    @ResponseStatus(HttpStatus.CREATED)
    TreeNodeDto addParent(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id,
            @RequestBody TreeMemberInput input) {
        return service.addParent(current.userId(), id, input);
    }

    @Operation(operationId = "fillTreeSlot", summary = "Điền người vào ô trống",
            description = "Chỉ Admin. Lỗi: 404 TREE_NODE_NOT_FOUND; 409 TREE_SLOT_NOT_EMPTY, MEMBER_ALREADY_ON_TREE.")
    @ApiResponse(responseCode = "200", description = "Thành công")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @PutMapping("/nodes/{id}/member")
    TreeNodeDto fillSlot(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id,
            @RequestBody TreeMemberInput input) {
        return service.fillSlot(current.userId(), id, input);
    }

    @Operation(operationId = "removeTreeMember", summary = "Gỡ người khỏi cây (ô thành ô trống)",
            description = "Chỉ Admin. Ô thành ô trống nằm đúng chỗ cũ, con cháu và vợ/chồng không bị ảnh hưởng. "
                    + "Lỗi: 404 TREE_NODE_NOT_FOUND; 409 TREE_SLOT_EMPTY.")
    @ApiResponse(responseCode = "200", description = "Thành công, trả ô đã trống")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @DeleteMapping("/nodes/{id}/member")
    TreeNodeDto removeMember(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id) {
        return service.removeMember(current.userId(), id);
    }

    @Operation(operationId = "deleteTreeNode", summary = "Xóa ô trống",
            description = "Chỉ Admin. Chỉ xóa được ô trống; nhánh được giữ lại (vợ/chồng hoặc con cháu thế chỗ, "
                    + "thứ tự anh em đánh lại từ 1). Lỗi: 404 TREE_NODE_NOT_FOUND; 409 TREE_SLOT_NOT_EMPTY.")
    @ApiResponse(responseCode = "204", description = "Đã xóa")
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @DeleteMapping("/nodes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void deleteNode(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id) {
        service.deleteNode(current.userId(), id);
    }

    @Operation(operationId = "moveTreeNode", summary = "Di chuyển nhánh",
            description = "Chỉ Admin. Một ô thuộc dòng đi kèm vợ/chồng và con cháu, tới làm con của newParentNodeId "
                    + "hoặc thành gốc mới khi newParentNodeId là null; xếp cuối các anh em ở nơi đến. Lỗi: 404 "
                    + "TREE_NODE_NOT_FOUND; 409 TREE_MOVE_LINEAGE_ONLY, TREE_CYCLE, TREE_NEEDS_CO_PARENT, "
                    + "TREE_INVALID_CO_PARENT.")
    @ApiResponse(responseCode = "200", description = "Thành công, trả ô đã chuyển")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @PostMapping("/nodes/{id}/move")
    TreeNodeDto move(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id,
            @RequestBody TreeMoveInput input) {
        return service.moveNode(current.userId(), id, input);
    }

    @Operation(operationId = "reorderTreeNode", summary = "Đổi thứ tự anh em",
            description = "Chỉ Admin. Đổi chỗ ô thuộc dòng với người anh em kề bên. Lỗi: 404 TREE_NODE_NOT_FOUND; "
                    + "409 TREE_MOVE_LINEAGE_ONLY, TREE_ORDER_EDGE.")
    @ApiResponse(responseCode = "200", description = "Thành công, trả ô đã đổi chỗ")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @PutMapping("/nodes/{id}/order")
    TreeNodeDto reorder(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id,
            @RequestBody TreeOrderInput input) {
        return service.reorderNode(current.userId(), id, input);
    }

    @Operation(operationId = "setTreeCoParent", summary = "Đổi cặp cha–mẹ của một người con",
            description = "Chỉ Admin. coParentNodeId phải là vợ/chồng của cha/mẹ hiện tại; cha/mẹ có đúng 1 vợ/chồng "
                    + "thì null tự nhận người đó, từ 2 vợ/chồng thì bắt buộc chọn. Lỗi: 404 TREE_NODE_NOT_FOUND; "
                    + "409 TREE_NOT_A_CHILD, TREE_INVALID_CO_PARENT, TREE_NEEDS_CO_PARENT.")
    @ApiResponse(responseCode = "200", description = "Thành công, trả ô đã đổi cặp")
    @ApiResponse(responseCode = "400", ref = ApiRefs.VALIDATION_ERROR)
    @ApiResponse(responseCode = "401", ref = ApiRefs.UNAUTHORIZED)
    @ApiResponse(responseCode = "403", ref = ApiRefs.FORBIDDEN)
    @ApiResponse(responseCode = "404", ref = ApiRefs.NOT_FOUND)
    @ApiResponse(responseCode = "409", ref = ApiRefs.CONFLICT)
    @PutMapping("/nodes/{id}/co-parent")
    TreeNodeDto setCoParent(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id,
            @RequestBody TreeCoParentInput input) {
        return service.setCoParent(current.userId(), id, input);
    }
}
