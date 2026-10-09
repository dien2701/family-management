package vn.giapha.member;

import java.time.Clock;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

import vn.giapha.common.exception.BusinessException;
import vn.giapha.common.util.SearchText;
import vn.giapha.member.entity.BirthCalendar;
import vn.giapha.member.entity.LinkRequestStatus;
import vn.giapha.member.entity.Member;
import vn.giapha.member.repository.MemberLinkRequestRepository;
import vn.giapha.member.repository.MemberRepository;
import vn.giapha.member.service.RelativeService;

/**
 * API công khai của module member cho module khác (người thân, cây, tệp, sự kiện, AI). Chỉ trả bản sao chỉ-đọc, không
 * lộ entity và không có SĐT hay email.
 */
@Component
public class MemberFacade {

    /** Thông tin tối thiểu để module khác hiển thị một thành viên. */
    public record MemberRef(Long id, String fullName, String avatarUrl, boolean deceased) {
    }

    /**
     * Đủ dữ liệu để tính giỗ và sinh nhật (module event, IDEA §6.5, §7). Không có SĐT hay email.
     * {@code birthMonth}/{@code birthDay} có thể {@code null} (chỉ biết năm sinh); tương tự cho ngày mất.
     */
    public record OccurrenceMember(
            Long id,
            String fullName,
            boolean deceased,
            Integer birthYear, Integer birthMonth, Integer birthDay, boolean birthLunar, boolean birthLeap,
            Integer deathSolarYear, Integer deathSolarMonth, Integer deathSolarDay,
            Integer deathLunarYear, Integer deathLunarMonth, Integer deathLunarDay, boolean deathLunarLeap,
            Integer memorialOverrideDay, Integer memorialOverrideMonth) {
    }

    /**
     * Thông tin để vẽ một ô trên cây. {@code gender} là {@code "M"}, {@code "F"} hoặc null (chưa biết); {@code deathYear}
     * là năm mất dương lịch nếu biết.
     */
    public record MemberCard(Long id, String fullName, String gender, String avatarUrl, List<String> labels,
            Integer birthYear, boolean deceased, Integer deathYear) {
    }

    /** Thẻ số liệu của dashboard (IDEA §6.8). */
    public record MemberStats(int total, int living, int deceased) {
    }

    /** Đủ dữ liệu để AI trả lời (tool {@code getMember}, IDEA §10; DECISIONS #73): không bao giờ có SĐT hay email. */
    public record MemberInfo(Long id, String fullName, String tabooName, String gender, boolean deceased,
            Integer birthYear, Integer birthMonth, Integer birthDay, boolean birthLunar,
            Integer deathSolarYear, Integer deathSolarMonth, Integer deathSolarDay,
            Integer deathLunarYear, Integer deathLunarMonth, Integer deathLunarDay,
            String biography, List<String> labels) {
    }

    /** Một dòng người thân trong hồ sơ, cho AI (tool {@code getRelatives}, IDEA §10): không có SĐT hay email. */
    public record RelativeRef(Long memberId, String fullName, String label) {
    }

    /**
     * Một dòng báo cáo thành viên (Excel, PDF; IDEA §6.9). {@code phone} và {@code email} chỉ có giá trị khi người gọi
     * xin {@code withContact = true}, nếu không luôn là {@code null}.
     */
    public record ReportMember(Long id, String fullName, String tabooName, String gender, boolean deceased,
            Integer birthYear, Integer birthMonth, Integer birthDay, boolean birthLunar,
            Integer deathSolarYear, Integer deathSolarMonth, Integer deathSolarDay,
            Integer deathLunarYear, Integer deathLunarMonth, Integer deathLunarDay, boolean deathLunarLeap,
            String burialPlace, String phone, String email) {
    }

    private final MemberRepository repository;
    private final MemberLinkRequestRepository linkRequests;
    private final RelativeService relatives;
    private final JsonMapper json;
    private final Clock clock;

    MemberFacade(MemberRepository repository, MemberLinkRequestRepository linkRequests, RelativeService relatives,
            JsonMapper json, Clock clock) {
        this.repository = repository;
        this.linkRequests = linkRequests;
        this.relatives = relatives;
        this.json = json;
        this.clock = clock;
    }

    /** Tổng số thành viên, còn sống và đã mất (dashboard). */
    @Transactional(readOnly = true)
    public MemberStats stats() {
        long total = repository.count();
        long deceased = repository.countByDeceased(true);
        return new MemberStats((int) total, (int) (total - deceased), (int) deceased);
    }

    /** Số yêu cầu "Tôi là ai" đang chờ Admin duyệt (dashboard). */
    @Transactional(readOnly = true)
    public long pendingLinkRequestCount() {
        return linkRequests.countByStatus(LinkRequestStatus.PENDING);
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

    /** Toàn bộ thành viên, đủ dữ liệu để module event tính giỗ và sinh nhật. */
    @Transactional(readOnly = true)
    public List<OccurrenceMember> findAllForOccurrences() {
        return repository.findAll().stream().map(MemberFacade::toOccurrenceMember).toList();
    }

    /** Toàn bộ thành viên theo họ tên, cho báo cáo. SĐT và email chỉ kèm khi {@code withContact} (người xuất là Admin). */
    @Transactional(readOnly = true)
    public List<ReportMember> findAllForReport(boolean withContact) {
        return repository.findAll(Sort.by("fullName")).stream().map(m -> new ReportMember(m.getId(), m.getFullName(),
                m.getTabooName(), m.getGender() == null ? null : m.getGender().name(), m.isDeceased(),
                m.getBirthYear(), m.getBirthMonth(), m.getBirthDay(), m.getBirthdayCalendar() == BirthCalendar.LUNAR,
                m.getDeathYear(), m.getDeathMonth(), m.getDeathDay(),
                m.getDeathLunarYear(), m.getDeathLunarMonth(), m.getDeathLunarDay(), m.isDeathLunarLeap(),
                m.getBurialPlace(), withContact ? m.getPhone() : null, withContact ? m.getEmail() : null)).toList();
    }

    /** Thẻ tóm tắt của các thành viên có id trong {@code memberIds} (một truy vấn); id không tồn tại thì bỏ qua. */
    @Transactional(readOnly = true)
    public List<MemberCard> findCards(Collection<Long> memberIds) {
        return repository.findAllById(memberIds).stream().map(this::toCard).toList();
    }

    /** Tìm theo họ tên, không cần gõ dấu (tool {@code searchMembers}, IDEA §10); rỗng thì trả danh sách rỗng. */
    @Transactional(readOnly = true)
    public List<MemberRef> searchMembers(String query, int limit) {
        String needle = SearchText.normalize(query);
        if (needle.isEmpty()) {
            return List.of();
        }
        String escaped = needle.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        Specification<Member> spec = (root, cq, cb) -> cb.like(root.<String>get("searchName"), "%" + escaped + "%",
                '\\');
        return repository.findAll(spec, PageRequest.of(0, limit, Sort.by("fullName"))).stream()
                .map(MemberFacade::toRef).toList();
    }

    /** Chi tiết một thành viên cho AI (tool {@code getMember}, IDEA §10). */
    @Transactional(readOnly = true)
    public Optional<MemberInfo> getInfo(Long memberId) {
        return repository.findById(memberId).map(this::toInfo);
    }

    /** Người thân trong hồ sơ (tool {@code getRelatives}, IDEA §10). */
    @Transactional(readOnly = true)
    public List<RelativeRef> getRelativeList(Long memberId) {
        return relatives.list(memberId).stream()
                .map(r -> new RelativeRef(r.relative().id(), r.relative().fullName(), r.label()))
                .toList();
    }

    /**
     * Đặt hoặc gỡ ảnh đại diện. Chỉ module file gọi, sau khi đã kiểm quyền và kiểm tệp; chạy trong transaction của
     * người gọi để ảnh và dòng đính kèm cùng commit.
     */
    @Transactional
    public void changeAvatar(Long memberId, String url) {
        Member member = repository.findById(memberId).orElseThrow(
                () -> new BusinessException(HttpStatus.NOT_FOUND, "MEMBER_NOT_FOUND", "Không tìm thấy thành viên."));
        member.changeAvatar(url, Instant.now(clock));
    }

    private MemberInfo toInfo(Member m) {
        List<String> labels = m.getLabels() == null ? List.of() : List.of(json.readValue(m.getLabels(), String[].class));
        return new MemberInfo(m.getId(), m.getFullName(), m.getTabooName(),
                m.getGender() == null ? null : m.getGender().name(), m.isDeceased(),
                m.getBirthYear(), m.getBirthMonth(), m.getBirthDay(), m.getBirthdayCalendar() == BirthCalendar.LUNAR,
                m.getDeathYear(), m.getDeathMonth(), m.getDeathDay(),
                m.getDeathLunarYear(), m.getDeathLunarMonth(), m.getDeathLunarDay(),
                m.getBiography(), labels);
    }

    private MemberCard toCard(Member m) {
        List<String> labels = m.getLabels() == null ? List.of() : List.of(json.readValue(m.getLabels(), String[].class));
        return new MemberCard(m.getId(), m.getFullName(), m.getGender() == null ? null : m.getGender().name(),
                m.getAvatarUrl(), labels, m.getBirthYear(), m.isDeceased(), m.getDeathYear());
    }

    private static MemberRef toRef(Member m) {
        return new MemberRef(m.getId(), m.getFullName(), m.getAvatarUrl(), m.isDeceased());
    }

    private static OccurrenceMember toOccurrenceMember(Member m) {
        return new OccurrenceMember(m.getId(), m.getFullName(), m.isDeceased(),
                m.getBirthYear(), m.getBirthMonth(), m.getBirthDay(), m.getBirthdayCalendar() == BirthCalendar.LUNAR,
                m.isBirthLunarLeap(),
                m.getDeathYear(), m.getDeathMonth(), m.getDeathDay(),
                m.getDeathLunarYear(), m.getDeathLunarMonth(), m.getDeathLunarDay(), m.isDeathLunarLeap(),
                m.getMemorialOverrideDay(), m.getMemorialOverrideMonth());
    }
}
