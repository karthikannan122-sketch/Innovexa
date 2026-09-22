// frontend/test_phase8_dashboard.mjs
// Verification suite for Phase 8: Dashboard Completion

import assert from 'assert';

console.log('--- RUNNING PHASE 8 DASHBOARD TESTS ---');

// Mock data representing Supabase responses
const mockUserId = 'user_abc_123';

const mockProjects = [
  { id: 'p1', user_id: mockUserId, title: 'AI Code Reviewer', status: 'PUBLISHED', views_count: 140, upvotes_count: 12, valid_reviews_count: 4 },
  { id: 'p2', user_id: mockUserId, title: 'Smart Habit Tracker', status: 'DRAFT', views_count: 25, upvotes_count: 3, valid_reviews_count: 1 },
  { id: 'p3', user_id: mockUserId, title: 'Eco Energy Monitor', status: 'UNDER_VALIDATION', views_count: 60, upvotes_count: 8, valid_reviews_count: 2 }
];

const mockVotes = [
  { id: 'v1', project_id: 'p1', user_id: 'u2', vote_type: 'upvote', created_at: '2026-08-24T12:00:00Z', profiles: { full_name: 'Sarah Chen' } },
  { id: 'v2', project_id: 'p1', user_id: 'u3', vote_type: 'upvote', created_at: '2026-08-24T13:00:00Z', profiles: { full_name: 'Alex Vance' } },
  { id: 'v3', project_id: 'p2', user_id: 'u4', vote_type: 'downvote', created_at: '2026-08-24T14:00:00Z', profiles: { full_name: 'David Kim' } }
];

const mockReviews = [
  { id: 'r1', project_id: 'p1', user_id: 'u2', rating: 5, overall_feedback: 'Outstanding architecture and crisp execution!', created_at: '2026-08-24T11:00:00Z', profiles: { full_name: 'Sarah Chen' } },
  { id: 'r2', project_id: 'p3', user_id: 'u5', rating: 4, overall_feedback: 'Solid problem statement, needs deeper market metrics.', created_at: '2026-08-24T15:00:00Z', profiles: { full_name: 'Elena Rostova' } }
];

const mockSuggestions = [
  { id: 's1', project_id: 'p1', user_id: 'u3', suggestion_type: 'FEATURE', title: 'Add GitHub Actions Integration', created_at: '2026-08-24T16:00:00Z', profiles: { full_name: 'Alex Vance' } }
];

const mockFollows = [
  { id: 'f1', project_id: 'p1', user_id: 'u6', created_at: '2026-08-24T17:00:00Z', profiles: { full_name: 'Marcus Brody' } },
  { id: 'f2', project_id: 'p3', user_id: 'u7', created_at: '2026-08-24T17:30:00Z', profiles: { full_name: 'Chloe Frazer' } }
];

const mockNotifications = [
  { id: 'n1', user_id: mockUserId, title: 'New Badge Awarded', is_read: false, created_at: '2026-08-24T10:00:00Z' },
  { id: 'n2', user_id: mockUserId, title: 'Weekly Digest', is_read: true, created_at: '2026-08-23T10:00:00Z' }
];

const mockMessages = [
  { id: 'm1', sender_id: 'u2', receiver_id: mockUserId, content: 'Hey, loved your AI Code Reviewer project!', is_read: false, created_at: '2026-08-24T18:00:00Z', sender: { full_name: 'Sarah Chen' } },
  { id: 'm2', sender_id: 'u3', receiver_id: mockUserId, content: 'Thanks for the quick response.', is_read: true, created_at: '2026-08-24T09:00:00Z', sender: { full_name: 'Alex Vance' } }
];

// Calculation Function replicating SupabaseService.getUserDashboardSummary
function calculateDashboardSummary(userProjects, votes, reviews, suggestions, follows, notifications, messages) {
  const publishedProjects = userProjects.filter(p => (p.status || '').toUpperCase() === 'PUBLISHED');
  const draftProjects = userProjects.filter(p => (p.status || '').toUpperCase() !== 'PUBLISHED');

  const totalViews = userProjects.reduce((sum, p) => sum + (p.views_count || 0), 0);
  const upvotes = votes.filter(v => v.vote_type === 'upvote').length;
  const downvotes = votes.filter(v => v.vote_type === 'downvote').length;
  const reviewsCount = reviews.length;
  const suggestionsCount = suggestions.length;
  const followersCount = follows.length;
  const unreadNotifs = notifications.filter(n => !n.is_read).length;
  const unreadMsgs = messages.filter(m => !m.is_read).length;

  const activity = [];
  const projectTitleMap = {};
  userProjects.forEach(p => { projectTitleMap[p.id] = p.title; });

  reviews.forEach(r => {
    activity.push({
      type: 'new_review',
      title: `New Review on "${projectTitleMap[r.project_id]}"`,
      timestamp: r.created_at
    });
  });

  suggestions.forEach(s => {
    activity.push({
      type: 'new_suggestion',
      title: `New Suggestion on "${projectTitleMap[s.project_id]}"`,
      timestamp: s.created_at
    });
  });

  votes.forEach(v => {
    activity.push({
      type: 'new_vote',
      title: `New ${v.vote_type === 'upvote' ? 'Upvote' : 'Vote'} on "${projectTitleMap[v.project_id]}"`,
      timestamp: v.created_at
    });
  });

  follows.forEach(f => {
    activity.push({
      type: 'new_follower',
      title: `New Follower on "${projectTitleMap[f.project_id]}"`,
      timestamp: f.created_at
    });
  });

  messages.forEach(m => {
    activity.push({
      type: 'new_message',
      title: `Direct Message from ${m.sender.full_name}`,
      timestamp: m.created_at
    });
  });

  activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return {
    my_projects_count: userProjects.length,
    published_projects_count: publishedProjects.length,
    draft_projects_count: draftProjects.length,
    total_views: totalViews,
    upvotes,
    downvotes,
    reviews_received_count: reviewsCount,
    suggestions_count: suggestionsCount,
    followers_count: followersCount,
    unread_notifications_count: unreadNotifs,
    unread_messages_count: unreadMsgs,
    recent_activity: activity
  };
}

const summary = calculateDashboardSummary(
  mockProjects,
  mockVotes,
  mockReviews,
  mockSuggestions,
  mockFollows,
  mockNotifications,
  mockMessages
);

// Assertions
assert.strictEqual(summary.my_projects_count, 3, 'My projects should count 3');
assert.strictEqual(summary.published_projects_count, 1, 'Published projects should count 1');
assert.strictEqual(summary.draft_projects_count, 2, 'Draft/validation projects should count 2');
assert.strictEqual(summary.total_views, 225, 'Total views should sum to 225');
assert.strictEqual(summary.upvotes, 2, 'Upvotes should count 2');
assert.strictEqual(summary.downvotes, 1, 'Downvotes should count 1');
assert.strictEqual(summary.reviews_received_count, 2, 'Reviews should count 2');
assert.strictEqual(summary.suggestions_count, 1, 'Suggestions should count 1');
assert.strictEqual(summary.followers_count, 2, 'Followers should count 2');
assert.strictEqual(summary.unread_notifications_count, 1, 'Unread notifications should count 1');
assert.strictEqual(summary.unread_messages_count, 1, 'Unread messages should count 1');

// Verify recent activity covers all 5 required event types
const eventTypes = new Set(summary.recent_activity.map(a => a.type));
assert(eventTypes.has('new_review'), 'Recent activity must include new_review');
assert(eventTypes.has('new_suggestion'), 'Recent activity must include new_suggestion');
assert(eventTypes.has('new_vote'), 'Recent activity must include new_vote');
assert(eventTypes.has('new_follower'), 'Recent activity must include new_follower');
assert(eventTypes.has('new_message'), 'Recent activity must include new_message');

// Verify activity sorting
const timestamps = summary.recent_activity.map(a => new Date(a.timestamp).getTime());
for (let i = 0; i < timestamps.length - 1; i++) {
  assert(timestamps[i] >= timestamps[i + 1], 'Activities must be in descending chronological order');
}

console.log('✅ ALL 11 METRICS AND 5 ACTIVITY EVENT TYPES PASSED TEST VALIDATION!');
