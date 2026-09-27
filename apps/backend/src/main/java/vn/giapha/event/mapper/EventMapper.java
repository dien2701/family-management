package vn.giapha.event.mapper;

import org.mapstruct.Mapper;

import vn.giapha.event.dto.CustomEventResponse;
import vn.giapha.event.entity.CustomEvent;

@Mapper
public interface EventMapper {

    CustomEventResponse toResponse(CustomEvent event);
}
