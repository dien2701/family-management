package vn.giapha.member.dto;

import java.time.Instant;

import vn.giapha.member.entity.MemberRelative;

/** Bản chụp một dòng người thân cho audit log và bản sao "thành viên đã xóa". */
public record RelativeSnapshot(Long id, Long memberId, Long relativeMemberId, String label, Instant createdAt) {

    public static RelativeSnapshot of(MemberRelative r) {
        return new RelativeSnapshot(r.getId(), r.getMemberId(), r.getRelativeMemberId(), r.getLabel(), r.getCreatedAt());
    }
}
