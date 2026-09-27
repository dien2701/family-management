package vn.giapha.family.controller;

import java.util.List;

import io.swagger.v3.oas.annotations.Parameter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import vn.giapha.common.security.CurrentUser;
import vn.giapha.family.dto.CreateFamilyRequest;
import vn.giapha.family.dto.FamilyResponse;
import vn.giapha.family.dto.InvitationResponse;
import vn.giapha.family.dto.JoinFamilyRequest;
import vn.giapha.family.dto.TransferManagerRequest;
import vn.giapha.family.service.FamilyService;

/**
 * Family của người đang đăng nhập. Không nhận {@code familyId} từ client để chọn family thao tác: mọi thao tác
 * dựa trên family của người gọi; {@code GET /{id}} chỉ để xác nhận và trả 404 nếu {@code id} không phải family của họ.
 */
@RestController
@RequestMapping("/api/family")
class FamilyController {

    private final FamilyService service;

    FamilyController(FamilyService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    FamilyResponse create(@Parameter(hidden = true) CurrentUser current, @Valid @RequestBody CreateFamilyRequest req,
            HttpServletRequest http) {
        return service.create(current.userId(), req, http.getRemoteAddr());
    }

    @PostMapping("/join")
    FamilyResponse join(@Parameter(hidden = true) CurrentUser current, @Valid @RequestBody JoinFamilyRequest req,
            HttpServletRequest http) {
        return service.join(current.userId(), req.code(), http.getRemoteAddr());
    }

    @GetMapping
    FamilyResponse get(@Parameter(hidden = true) CurrentUser current) {
        return service.get(current.userId(), null);
    }

    @GetMapping("/{id}")
    FamilyResponse getById(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id) {
        return service.get(current.userId(), id);
    }

    @PostMapping("/invitations")
    @ResponseStatus(HttpStatus.CREATED)
    InvitationResponse createInvitation(@Parameter(hidden = true) CurrentUser current) {
        return service.createInvitation(current.userId());
    }

    @GetMapping("/invitations")
    List<InvitationResponse> listInvitations(@Parameter(hidden = true) CurrentUser current) {
        return service.listInvitations(current.userId());
    }

    @DeleteMapping("/invitations/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void revokeInvitation(@Parameter(hidden = true) CurrentUser current, @PathVariable Long id) {
        service.revokeInvitation(current.userId(), id);
    }

    @PostMapping("/leave")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void leave(@Parameter(hidden = true) CurrentUser current) {
        service.leave(current.userId());
    }

    @DeleteMapping("/accounts/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void removeAccount(@Parameter(hidden = true) CurrentUser current, @PathVariable Long userId) {
        service.removeAccount(current.userId(), userId);
    }

    @PostMapping("/transfer-manager")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void transferManager(@Parameter(hidden = true) CurrentUser current,
            @Valid @RequestBody TransferManagerRequest req) {
        service.transferManager(current.userId(), req.userId());
    }
}
