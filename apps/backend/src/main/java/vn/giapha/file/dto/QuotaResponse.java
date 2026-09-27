package vn.giapha.file.dto;

/** Khớp schema {@code QuotaResponse}, đơn vị MB. */
public record QuotaResponse(double usedMb, double limitMb) {
}
