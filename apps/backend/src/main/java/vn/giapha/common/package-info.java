/**
 * Thành phần dùng chung (audit, security, exception, consent, web, util).
 * Module OPEN để các module nghiệp vụ gọi trực tiếp; không chứa nghiệp vụ riêng của module nào.
 */
@ApplicationModule(displayName = "Common", type = ApplicationModule.Type.OPEN)
package vn.giapha.common;

import org.springframework.modulith.ApplicationModule;
