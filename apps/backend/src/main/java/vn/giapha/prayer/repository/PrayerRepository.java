package vn.giapha.prayer.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.giapha.prayer.entity.Prayer;

public interface PrayerRepository extends JpaRepository<Prayer, Long> {

    List<Prayer> findAllByOrderByTitleAscIdAsc();
}
