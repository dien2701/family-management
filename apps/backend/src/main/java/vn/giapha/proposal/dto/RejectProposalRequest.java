package vn.giapha.proposal.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectProposalRequest(@NotBlank(message = "Vui lòng nhập lý do từ chối.") String note) {
}
