package vn.giapha.prayer.mapper;

import org.mapstruct.Mapper;

import vn.giapha.prayer.dto.PrayerResponse;
import vn.giapha.prayer.dto.PrayerSummaryResponse;
import vn.giapha.prayer.entity.Prayer;

@Mapper
public interface PrayerMapper {

    PrayerResponse toResponse(Prayer prayer);

    PrayerSummaryResponse toSummary(Prayer prayer);
}
