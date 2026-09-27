package vn.giapha.file.dto;

import java.util.Map;

/** Khớp schema {@code FileSignResponse}. */
public record FileSignResponse(String uploadUrl, Map<String, String> fields) {
}
