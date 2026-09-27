package vn.giapha.file.dto;

import java.time.Instant;

import vn.giapha.file.entity.Attachment;
import vn.giapha.file.entity.AttachmentKind;

/**
 * Khớp schema {@code Attachment}. Ảnh có {@code url} công khai; PDF/docx/xlsx là tệp cần chữ ký nên {@code url} chỉ
 * trỏ về API tải, link thật lấy ở {@code GET /api/attachments/{id}/download}.
 */
public record AttachmentResponse(Long id, AttachmentKind kind, Long memberId, String url, String title,
        String fileName, String mimeType, long sizeBytes, Instant createdAt) {

    public static AttachmentResponse of(Attachment a) {
        String url = a.getFormat().isImage() ? a.getUrl() : "/api/attachments/" + a.getId() + "/download";
        return new AttachmentResponse(a.getId(), a.getKind(), a.getMemberId(), url, a.getTitle(), a.getFileName(),
                a.getFormat().mimeType(), a.getSizeBytes(), a.getCreatedAt());
    }
}
