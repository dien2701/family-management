package vn.giapha.event.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.giapha.event.entity.CustomEvent;

public interface CustomEventRepository extends JpaRepository<CustomEvent, Long> {

    List<CustomEvent> findAllByOrderByIdAsc();
}
