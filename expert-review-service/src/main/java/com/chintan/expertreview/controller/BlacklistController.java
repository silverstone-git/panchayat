package com.chintan.expertreview.controller;
import com.chintan.expertreview.dto.*;
import com.chintan.expertreview.model.*;
import com.chintan.expertreview.repository.*;
import com.chintan.expertreview.service.BlacklistService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reviews/blacklist")
@RequiredArgsConstructor
public class BlacklistController {
    private final BlacklistService blacklistService;
    private final BlacklistProposalRepository repository;

    @PostMapping("/propose")
    public BlacklistProposal propose(@RequestBody BlacklistRequest req, @RequestHeader("X-User-Id") String uid) {
        return blacklistService.proposeBlacklist(req.getTargetUserId(), req.getReason(), uid);
    }

    @GetMapping("/pending")
    public List<BlacklistProposal> getPending() {
        return repository.findByStatus(BlacklistStatus.PENDING);
    }

    @PostMapping("/{id}/vote")
    public BlacklistProposal vote(@PathVariable UUID id, @RequestBody VoteRequest req, @RequestHeader("X-User-Id") String uid) {
        return blacklistService.castVote(id, uid, req.isApproved());
    }
}
