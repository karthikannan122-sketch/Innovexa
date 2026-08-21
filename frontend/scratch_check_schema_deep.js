import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

let supabaseUrl = 'https://jeafkfarfkojazznsafj.supabase.co';
let supabaseAnonKey = 'sb_publishable_-7UvJQ2w3M0tcNBXuv597Q_OwdtksZf';

try {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && v) {
      if (k.trim() === 'VITE_SUPABASE_URL') supabaseUrl = v.trim();
      if (k.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseAnonKey = v.trim();
    }
  });
} catch (e) {}

const client = createClient(supabaseUrl, supabaseAnonKey);

const tables = ['profiles', 'categories', 'projects', 'reviews', 'project_likes', 'notifications'];

const wordlist = [
  'id', 'user_id', 'creator_id', 'author_id', 'reviewer_id', 'project_id', 'category_id', 'post_id',
  'title', 'name', 'full_name', 'username', 'email', 'avatar', 'avatar_url', 'bio', 'headline',
  'description', 'short_description', 'content', 'message', 'type', 'project_type', 'status',
  'rating', 'score', 'suggestion', 'suggestions', 'feedback', 'overall_feedback', 'relevance',
  'relevance_answer', 'problem_relevance', 'would_use', 'is_valid', 'valid', 'is_read', 'read',
  'created_at', 'updated_at', 'published_at', 'launch_url', 'website_url', 'demo_url', 'github_url',
  'upvotes', 'downvotes', 'likes', 'dislikes', 'votes', 'vote_type', 'vote', 'value', 'direction',
  'interests', 'skills', 'categories', 'role', 'roles', 'organization', 'company', 'tags', 'features',
  'problem_statement', 'proposed_solution', 'target_users', 'images', 'cover_image', 'onboarding_completed',
  'credits', 'reputation_score', 'reputation_tier', 'slug', 'color', 'icon', 'data', 'metadata',
  'summary', 'ai_summary', 'ai_insights', 'insights', 'analysis', 'strengths', 'gaps', 'recommendations',
  'readiness_score', 'readiness', 'feasibility', 'differentiation', 'next_steps', 'problem_clarity', 'value_prop',
  'upvotes_count', 'downvotes_count', 'likes_count', 'reviews_count', 'valid_reviews_count', 'comments_count',
  'version', 'views_count', 'stage', 'project_stage', 'development_stage', 'launch_status', 'is_public',
  'visibility', 'published'
];

async function run() {
  for (const t of tables) {
    const existing = [];
    for (const col of wordlist) {
      const { data, error } = await client.from(t).select(col).limit(1);
      if (!error) {
        existing.push(col);
      }
    }
    console.log(`=== TABLE: ${t} ===`);
    console.log(`Columns (${existing.length}):`, existing.join(', '));
  }
}

run().catch(console.error);
