package vn.giapha.member.service;

import java.util.List;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.member.MemberSnapshotContributor;
import vn.giapha.member.dto.RelativeSnapshot;
import vn.giapha.member.repository.MemberRelativeRepository;

/** Đưa các dòng người thân dính tới thành viên (cả hai phía) vào phần {@code "relations"} của bản sao khi xóa. */
@Component
class RelativesSnapshotContributor implements MemberSnapshotContributor {

    private final MemberRelativeRepository relatives;

    RelativesSnapshotContributor(MemberRelativeRepository relatives) {
        this.relatives = relatives;
    }

    @Override
    public String section() {
        return "relations";
    }

    @Override
    @Transactional(readOnly = true)
    public List<RelativeSnapshot> collect(Long memberId) {
        return relatives.findAllInvolving(memberId).stream().map(RelativeSnapshot::of).toList();
    }
}
