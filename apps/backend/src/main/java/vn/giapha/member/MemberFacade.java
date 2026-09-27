package vn.giapha.member;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.member.entity.Member;
import vn.giapha.member.repository.MemberRepository;

/**
 * API công khai của module member cho module khác (người thân, cây, tệp, sự kiện, AI). Chỉ trả bản sao chỉ-đọc, không
 * lộ entity và không có SĐT hay email.
 */
@Component
public class MemberFacade {

    /** Thông tin tối thiểu để module khác hiển thị một thành viên. */
    public record MemberRef(Long id, String fullName, String avatarUrl, boolean deceased) {
    }

    private final MemberRepository repository;

    MemberFacade(MemberRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public boolean exists(Long memberId) {
        return repository.existsById(memberId);
    }

    @Transactional(readOnly = true)
    public Optional<MemberRef> find(Long memberId) {
        return repository.findById(memberId).map(MemberFacade::toRef);
    }

    /** Thành viên có id trong {@code memberIds}; id không tồn tại thì bỏ qua. */
    @Transactional(readOnly = true)
    public List<MemberRef> findAll(Collection<Long> memberIds) {
        return repository.findAllById(memberIds).stream().map(MemberFacade::toRef).toList();
    }

    private static MemberRef toRef(Member m) {
        return new MemberRef(m.getId(), m.getFullName(), m.getAvatarUrl(), m.isDeceased());
    }
}
