package vn.giapha.calendar.mapper;

import org.mapstruct.Mapper;

import vn.giapha.calendar.LunarDate;
import vn.giapha.calendar.dto.LunarDateResponse;

@Mapper
public interface CalendarMapper {

    LunarDateResponse toResponse(LunarDate date);
}
