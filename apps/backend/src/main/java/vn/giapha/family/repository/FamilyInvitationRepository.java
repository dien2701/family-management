package vn.giapha.family.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.giapha.family.entity.FamilyInvitation;

public interface FamilyInvitationRepository extends JpaRepository<FamilyInvitation, Long> {

    Optional<FamilyInvitation> findByCode(String code);

    Optional<FamilyInvitation> findByIdAndFamilyId(Long id, Long familyId);

    List<FamilyInvitation> findByFamilyIdOrderByCreatedAtDescIdDesc(Long familyId);

    boolean existsByCode(String code);
}
