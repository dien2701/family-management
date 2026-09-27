package vn.giapha.admin.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.giapha.admin.entity.SystemSetting;

public interface SystemSettingRepository extends JpaRepository<SystemSetting, String> {
}
