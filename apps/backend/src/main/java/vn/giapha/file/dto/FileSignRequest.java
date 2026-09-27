package vn.giapha.file.dto;

import vn.giapha.file.entity.AttachmentKind;

/** Khớp schema {@code FileSignRequest}: {@code memberId} bắt buộc với AVATAR, null với DOCUMENT là tài liệu chung. */
public record FileSignRequest(AttachmentKind kind, Long memberId, String title, String fileName, String mimeType,
        Long sizeBytes) {
}
