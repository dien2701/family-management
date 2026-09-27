package vn.giapha.ai.dto;

import java.time.Instant;

/** Lượt hỏi trong ngày theo giờ Việt Nam; {@code remaining = limit - used}. */
public record AiQuota(int limit, int used, int remaining, Instant resetAt) {
}
