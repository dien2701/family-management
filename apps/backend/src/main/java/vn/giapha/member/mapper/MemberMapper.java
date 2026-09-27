package vn.giapha.member.mapper;

import java.util.List;

import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

import vn.giapha.member.dto.MemberBirth;
import vn.giapha.member.dto.MemberDetail;
import vn.giapha.member.dto.MemberLunarDate;
import vn.giapha.member.dto.MemberSummary;
import vn.giapha.member.dto.MemorialOverride;
import vn.giapha.member.dto.SolarDate;
import vn.giapha.member.entity.Member;

/**
 * Entity sang DTO. Viết tay thay vì MapStruct vì phần lớn trường được gom lại (ngày sinh, ngày mất dương/âm, ngày giỗ),
 * nhãn lưu dạng JSON và SĐT/email chỉ đưa ra theo quyền xem.
 */
@Component
public class MemberMapper {

    private final JsonMapper json;

    MemberMapper(JsonMapper json) {
        this.json = json;
    }

    /** Không có thông tin cây: {@code generation = null}, {@code onTree = false} (dòng người thân, audit log). */
    public MemberSummary toSummary(Member m) {
        return toSummary(m, null, false);
    }

    /** @param generation đời trên cây (gốc là 1), null khi chưa có trên cây */
    public MemberSummary toSummary(Member m, Integer generation, boolean onTree) {
        return new MemberSummary(m.getId(), m.getFullName(), m.getGender(), m.getAvatarUrl(), labelsOf(m),
                m.getBirthYear(), m.isDeceased(), m.getDeathYear(), generation, onTree, m.getCreatedAt());
    }

    /** Không có thông tin cây: {@code generation = null}, {@code onTree = false}. */
    public MemberDetail toDetail(Member m, boolean includeContact) {
        return toDetail(m, includeContact, null, false);
    }

    /**
     * @param includeContact có đưa SĐT và email hay không (chỉ Admin và chính chủ)
     * @param generation     đời trên cây (gốc là 1), null khi chưa có trên cây
     */
    public MemberDetail toDetail(Member m, boolean includeContact, Integer generation, boolean onTree) {
        return new MemberDetail(m.getId(), m.getFullName(), m.getGender(), m.getAvatarUrl(), labelsOf(m),
                m.getBirthYear(), m.isDeceased(), m.getDeathYear(), generation, onTree, m.getCreatedAt(),
                m.getTabooName(), includeContact ? m.getPhone() : null, includeContact ? m.getEmail() : null,
                m.getBiography(), birthOf(m), deathSolarOf(m), deathLunarOf(m), memorialOf(m), m.getBurialPlace(),
                m.getUpdatedAt());
    }

    private List<String> labelsOf(Member m) {
        return m.getLabels() == null ? List.of() : List.of(json.readValue(m.getLabels(), String[].class));
    }

    /** {@code null} khi chưa biết gì về ngày sinh. */
    private static MemberBirth birthOf(Member m) {
        if (m.getBirthYear() == null && m.getBirthMonth() == null && m.getBirthDay() == null) {
            return null;
        }
        return new MemberBirth(m.getBirthYear(), m.getBirthMonth(), m.getBirthDay(), m.getBirthdayCalendar(),
                m.isBirthLunarLeap());
    }

    private static SolarDate deathSolarOf(Member m) {
        if (m.getDeathYear() == null || m.getDeathMonth() == null || m.getDeathDay() == null) {
            return null;
        }
        return new SolarDate(m.getDeathYear(), m.getDeathMonth(), m.getDeathDay());
    }

    private static MemberLunarDate deathLunarOf(Member m) {
        if (m.getDeathLunarDay() == null || m.getDeathLunarMonth() == null) {
            return null;
        }
        return new MemberLunarDate(m.getDeathLunarDay(), m.getDeathLunarMonth(), m.isDeathLunarLeap(),
                m.getDeathLunarYear());
    }

    private static MemorialOverride memorialOf(Member m) {
        if (m.getMemorialOverrideDay() == null || m.getMemorialOverrideMonth() == null) {
            return null;
        }
        return new MemorialOverride(m.getMemorialOverrideDay(), m.getMemorialOverrideMonth());
    }
}
