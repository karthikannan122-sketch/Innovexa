import { StorageService } from './storage.js';
import { rankEligibleReviewers } from './matching.js';

/**
 * INNOVEXA Assignment Lifecycle & Reassignment Service
 */

export function checkAndProcessExpiredAssignments() {
  const assignments = StorageService.getAssignments();
  if (!assignments || assignments.length === 0) return;

  const allUsers = StorageService.getUsers();
  const allInnovations = StorageService.getInnovations();
  const now = Date.now();

  assignments.forEach(assign => {
    if (assign.assignment_status === 'COMPLETED' || assign.assignment_status === 'EXPIRED') {
      return;
    }

    const expiresAt = new Date(assign.expires_at).getTime();
    if (now > expiresAt) {
      StorageService.updateAssignment(assign.id, {
        assignment_status: 'EXPIRED',
        expired_at: new Date().toISOString()
      });

      // Penalize reviewer activity score
      const reviewer = allUsers.find(u => u.id === assign.reviewer_id);
      if (reviewer) {
        StorageService.updateUser(reviewer.id, {
          reputation_score: Math.max(0, (reviewer.reputation_score || 0) - 5),
          credits: Math.max(0, (reviewer.credits || 0) - 5)
        });
      }

      // Reassign to next best eligible reviewer if one exists
      const inno = allInnovations.find(i => i.id === assign.innovation_id);
      if (inno && inno.status === 'UNDER_VALIDATION') {
        const alreadyAssignedReviewerIds = new Set(
          assignments
            .filter(a => a.innovation_id === inno.id && a.assignment_status !== 'EXPIRED')
            .map(a => a.reviewer_id)
        );
        alreadyAssignedReviewerIds.add(assign.reviewer_id);

        const ranked = rankEligibleReviewers(inno, allUsers);
        const nextCandidate = ranked.find(r => !alreadyAssignedReviewerIds.has(r.user.id));

        if (nextCandidate) {
          StorageService.createAssignment({
            innovation_id: inno.id,
            reviewer_id: nextCandidate.user.id,
            match_score: nextCandidate.matchScore,
            assignment_status: 'ACTIVE',
          });
        }
      }
    }
  });
}
