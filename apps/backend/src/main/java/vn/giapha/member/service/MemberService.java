package vn.giapha.member.service;

import java.text.Collator;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import jakarta.persistence.criteria.Predicate;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.giapha.auth.AuthFacade;
import vn.giapha.common.audit.AuditLogWriter;
import vn.giapha.common.exception.BusinessException;
import vn.giapha.common.util.SearchText;
import vn.giapha.member.MemberDeletedEvent;
import vn.giapha.member.MemberDeletionGuard;
import vn.giapha.member.MemberSnapshotContributor;
import vn.giapha.member.MemberTreePlacement;
import vn.giapha.member.dto.MemberDetail;
import vn.giapha.member.dto.MemberFilter;
import vn.giapha.member.dto.MemberInput;
import vn.giapha.member.dto.MemberPage;
import vn.giapha.member.dto.MemberSummary;
import vn.giapha.member.entity.Member;
import vn.giapha.member.entity.MemberProfile;
import vn.giapha.member.mapper.MemberMapper;
import vn.giapha.member.repository.MemberRepository;

/**
 * Thành viên gia phả (IDEA §4, §6.1; DECISIONS #58, #62, #66, #76). Admin thêm, sửa, xóa; User đã liên kết chỉ tự sửa
 * hồ sơ của mình. Vai trò và liên kết của người gọi luôn đọc từ DB, không tin claim (có thể cũ tới 15 phút).
 *
 * <p>Danh sách lọc theo tên và trạng thái ở DB, còn tuổi, đời, có trên cây, sắp xếp và phân trang làm trong bộ nhớ:
 * gia phả chỉ có vài trăm thành viên (IDEA §1) và cách này cho đúng thứ tự A–Z tiếng Việt, đúng như handler giả lập
 * của frontend. Đời lấy từ cây gia phả qua {@link MemberTreePlacement}.
 */
@Service
public class MemberService {

    private static final String TARGET_TYPE = "MEMBER";
    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final Collator VIETNAMESE = Collator.getInstance(Locale.forLanguageTag("vi"));
    private static final char LIKE_ESCAPE = '!';

    private static final Comparator<Member> BY_NAME = (a, b) -> {
        int c = VIETNAMESE.compare(a.getFullName(), b.getFullName());
        return c != 0 ? c : Long.compare(a.getId(), b.getId());
    };

    private final MemberRepository repository;
    private final MemberInputParser parser;
    private final MemberMapper mapper;
    private final AuthFacade auth;
    private final AuditLogWriter audit;
    private final ApplicationEventPublisher events;
    private final ObjectProvider<MemberDeletionGuard> guards;
    private final ObjectProvider<MemberSnapshotContributor> snapshotContributors;
    private final MemberTreePlacement placement;
    private final Clock clock;

    MemberService(MemberRepository repository, MemberInputParser parser, MemberMapper mapper, AuthFacade auth,
            AuditLogWriter audit, ApplicationEventPublisher events, ObjectProvider<MemberDeletionGuard> guards,
            ObjectProvider<MemberSnapshotContributor> snapshotContributors, MemberTreePlacement placement,
            Clock clock) {
        this.repository = repository;
        this.parser = parser;
        this.mapper = mapper;
        this.auth = auth;
        this.audit = audit;
        this.events = events;
        this.guards = guards;
        this.snapshotContributors = snapshotContributors;
        this.placement = placement;
        this.clock = clock;
    }

    // ---------- Đọc ----------

    @Transactional(readOnly = true)
    public MemberPage list(MemberFilter filter, int page, int size) {
        int currentYear = LocalDate.now(clock.withZone(VIETNAM)).getYear();
        Map<Long, Integer> generations = placement.generations();
        List<Member> matched = repository.findAll(specOf(filter)).stream()
                .filter(m -> inAgeRange(m, filter, currentYear))
                .filter(m -> filter.onTree() == null || filter.onTree() == generations.containsKey(m.getId()))
                .filter(m -> filter.generation() == null || filter.generation().equals(generations.get(m.getId())))
                .sorted(comparatorOf(filter.sort(), generations))
                .toList();
        int from = (int) Math.min((long) page * size, matched.size());
        int to = Math.min(from + size, matched.size());
        List<MemberSummary> items = matched.subList(from, to).stream()
                .map(m -> mapper.toSummary(m, generations.get(m.getId()), generations.containsKey(m.getId())))
                .toList();
        return new MemberPage(items, page, size, matched.size(), (int) Math.ceil(matched.size() / (double) size));
    }

    /** SĐT và email chỉ có với Admin và chính chủ hồ sơ (DECISIONS #66). */
    @Transactional(readOnly = true)
    public MemberDetail get(Long viewerId, Long id) {
        Member member = find(id);
        boolean contact = auth.find(viewerId).map(a -> a.admin() || id.equals(a.memberId())).orElse(false);
        return detailOf(member, contact);
    }

    // ---------- Ghi ----------

    @Transactional
    public MemberDetail create(Long actorId, MemberInput input) {
        requireAdmin(actorId);
        MemberProfile profile = parser.parse(input);
        Instant now = Instant.now(clock);
        Member member = new Member(actorId, now);
        member.apply(profile, now);
        repository.save(member);
        audit.write(actorId, "CREATE", TARGET_TYPE, member.getId(), null, mapper.toDetail(member, false));
        return mapper.toDetail(member, true);
    }

    /**
     * Admin sửa mọi trường của mọi hồ sơ. User đã liên kết chỉ sửa hồ sơ của mình (theo {@code user.member_id} đọc từ DB,
     * không tin claim) và không đổi được nhóm "đã mất": gửi giá trị khác giá trị đang lưu thì 403
     * {@code DEATH_FIELDS_ADMIN_ONLY}, giữ nguyên thì bỏ qua để form gửi cả object vẫn hợp lệ (DECISIONS #76).
     */
    @Transactional
    public MemberDetail update(Long actorId, Long id, MemberInput input) {
        AuthFacade.Account actor = auth.find(actorId).filter(AuthFacade.Account::usable).orElseThrow(
                () -> new BusinessException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Bạn không có quyền sửa hồ sơ này."));
        if (!actor.admin() && !id.equals(actor.memberId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Bạn chỉ sửa được hồ sơ của chính mình.");
        }
        Member member = find(id);
        MemberProfile profile = parser.parse(input);
        if (!actor.admin() && !member.death().equals(profile.death())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "DEATH_FIELDS_ADMIN_ONLY",
                    "Thông tin về việc đã mất chỉ Admin được sửa.");
        }
        MemberDetail before = mapper.toDetail(member, false);
        member.apply(profile, Instant.now(clock));
        audit.write(actorId, "UPDATE", TARGET_TYPE, id, before, mapper.toDetail(member, false));
        return detailOf(member, true);
    }

    /**
     * Xóa theo thứ tự: hỏi các {@link MemberDeletionGuard} (có thể chặn), ghi snapshot đầy đủ vào audit log, phát
     * {@link MemberDeletedEvent} để module khác dọn dữ liệu của mình, rồi mới xóa dòng {@code member}. Tất cả trong một
     * transaction nên lỗi ở bước nào cũng hủy cả thao tác.
     */
    @Transactional
    public void delete(Long actorId, Long id) {
        requireAdmin(actorId);
        Member member = find(id);
        guards.orderedStream().forEach(guard -> guard.check(id));

        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("member", mapper.toDetail(member, true));
        snapshot.put("relations", List.of());
        snapshot.put("attachments", List.of());
        snapshotContributors.orderedStream()
                .forEach(contributor -> snapshot.put(contributor.section(), contributor.collect(id)));
        audit.write(actorId, "DELETE", TARGET_TYPE, id, snapshot, null);

        events.publishEvent(new MemberDeletedEvent(id, actorId));
        repository.delete(member);
    }

    // ---------- Nội bộ ----------

    /** Hồ sơ kèm đời và trạng thái trên cây. */
    private MemberDetail detailOf(Member member, boolean includeContact) {
        Map<Long, Integer> generations = placement.generations();
        return mapper.toDetail(member, includeContact, generations.get(member.getId()),
                generations.containsKey(member.getId()));
    }

    private Member find(Long id) {
        return repository.findById(id).orElseThrow(
                () -> new BusinessException(HttpStatus.NOT_FOUND, "MEMBER_NOT_FOUND", "Không tìm thấy thành viên."));
    }

    private void requireAdmin(Long actorId) {
        boolean admin = auth.find(actorId).map(AuthFacade.Account::admin).orElse(false);
        if (!admin) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Chỉ Admin được thực hiện thao tác này.");
        }
    }

    private static Specification<Member> specOf(MemberFilter filter) {
        String needle = SearchText.normalize(filter.q());
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (!needle.isEmpty()) {
                predicates.add(cb.like(root.<String>get("searchName"), "%" + escapeLike(needle) + "%", LIKE_ESCAPE));
            }
            if (filter.deceased() != null) {
                predicates.add(cb.equal(root.<Boolean>get("deceased"), filter.deceased()));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static String escapeLike(String text) {
        return text.replace("!", "!!").replace("%", "!%").replace("_", "!_");
    }

    /** Tuổi theo năm: người mất tính đến năm mất dương; chưa rõ năm sinh hoặc năm mất thì không tính được (null). */
    private static Integer ageOf(Member m, int currentYear) {
        if (m.getBirthYear() == null) {
            return null;
        }
        Integer endYear = m.isDeceased() ? m.getDeathYear() : Integer.valueOf(currentYear);
        return endYear == null ? null : endYear - m.getBirthYear();
    }

    /** Có `ageMin` hoặc `ageMax` thì người không tính được tuổi bị loại. */
    private static boolean inAgeRange(Member m, MemberFilter filter, int currentYear) {
        if (filter.ageMin() == null && filter.ageMax() == null) {
            return true;
        }
        Integer age = ageOf(m, currentYear);
        if (age == null) {
            return false;
        }
        return (filter.ageMin() == null || age >= filter.ageMin())
                && (filter.ageMax() == null || age <= filter.ageMax());
    }

    private static Comparator<Member> comparatorOf(String sort, Map<Long, Integer> generations) {
        return switch (sort == null ? "name" : sort) {
            // Lớn tuổi trước = năm sinh nhỏ trước; chưa rõ năm sinh xếp cuối
            case "age" -> Comparator.comparing(Member::getBirthYear, Comparator.nullsLast(Comparator.<Integer>naturalOrder()))
                    .thenComparing(BY_NAME);
            case "created" -> Comparator.comparing(Member::getCreatedAt, Comparator.<Instant>reverseOrder())
                    .thenComparing(Member::getId, Comparator.<Long>reverseOrder());
            // Đời nhỏ trước, người chưa lên cây xếp cuối
            case "generation" -> Comparator
                    .comparing((Member m) -> generations.get(m.getId()),
                            Comparator.nullsLast(Comparator.<Integer>naturalOrder()))
                    .thenComparing(BY_NAME);
            default -> BY_NAME;
        };
    }
}
