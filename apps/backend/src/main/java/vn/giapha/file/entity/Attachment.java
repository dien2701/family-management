package vn.giapha.file.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Một tệp trên Cloudinary (IDEA §6.7). {@code memberId} null nghĩa là tài liệu chung. Không trả ra API. */
@Entity
@Table(name = "attachment")
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private AttachmentKind kind;

    @Column(name = "member_id")
    private Long memberId;

    @Column(name = "public_id", nullable = false, length = 300)
    private String publicId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 10)
    private FileFormat format;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(length = 255)
    private String title;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Attachment() {
    }

    public Attachment(AttachmentKind kind, Long memberId, String publicId, FileFormat format, String url, String title,
            String fileName, long sizeBytes, Long createdBy, Instant now) {
        this.kind = kind;
        this.memberId = memberId;
        this.publicId = publicId;
        this.format = format;
        this.url = url;
        this.title = title;
        this.fileName = fileName;
        this.sizeBytes = sizeBytes;
        this.createdBy = createdBy;
        this.createdAt = now;
    }

    public Long getId() {
        return id;
    }

    public AttachmentKind getKind() {
        return kind;
    }

    public Long getMemberId() {
        return memberId;
    }

    public String getPublicId() {
        return publicId;
    }

    public FileFormat getFormat() {
        return format;
    }

    public String getUrl() {
        return url;
    }

    public String getTitle() {
        return title;
    }

    public String getFileName() {
        return fileName;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
