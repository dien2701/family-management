package vn.giapha.prayer.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.giapha.prayer.entity.PrayerFill;
import vn.giapha.prayer.entity.PrayerFillId;

public interface PrayerFillRepository extends JpaRepository<PrayerFill, PrayerFillId> {
}
