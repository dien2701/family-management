package vn.giapha.tree.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import vn.giapha.common.exception.BusinessException;
import vn.giapha.member.MemberDeletionGuard;
import vn.giapha.tree.repository.TreeNodeRepository;

/** Chặn xóa thành viên đang có trên cây (DECISIONS #62): phải gỡ khỏi cây trước. */
@Component
class TreeDeletionGuard implements MemberDeletionGuard {

    private final TreeNodeRepository nodes;

    TreeDeletionGuard(TreeNodeRepository nodes) {
        this.nodes = nodes;
    }

    @Override
    public void check(Long memberId) {
        if (nodes.existsByMemberId(memberId)) {
            throw new BusinessException(HttpStatus.CONFLICT, "MEMBER_ON_TREE",
                    "Người này đang có trên cây gia phả. Hãy gỡ người này khỏi cây trước khi xóa.");
        }
    }
}
