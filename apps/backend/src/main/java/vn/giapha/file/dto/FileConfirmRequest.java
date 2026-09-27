package vn.giapha.file.dto;

import vn.giapha.file.entity.AttachmentKind;

/** Khớp schema {@code FileConfirmRequest}. */
public record FileConfirmRequest(AttachmentKind kind, Long memberId, String title, String publicId, String fileName) {
}
