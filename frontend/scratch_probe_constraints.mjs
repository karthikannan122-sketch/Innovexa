import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://crwqfrldxvjsbcsjyacg.supabase.co';
const SUPABASE_ANON = 'sb_publishable_UZKoNNZ0FvlzM3u9w1iT0A_PLe0I0Zr';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });

async function testConstraints() {
  // Let's test signup or update on an existing profile
  const { data: prof } = await supabase.from('profiles').select('id, role').limit(1).single();
  console.log('Sample profile:', prof);

  // Test values for roles
  const testRoles = ['innovator', 'reviewer', 'admin', 'evaluator', 'creator', 'user', 'INNOVATOR', 'I CREATE IDEAS'];
  for (const r of testRoles) {
    const { error } = await supabase.from('profiles').update({ role: r }).eq('id', '00000000-0000-0000-0000-000000000000');
    // PostgREST evaluates check constraints on UPDATE
    if (error && error.message.includes('check constraint')) {
      console.log(`Role '${r}': ❌ REJECTED (${error.message})`);
    } else {
      console.log(`Role '${r}': ✅ ALLOWED (no constraint error)`);
    }
  }

  // Test values for project status
  const testStatuses = ['published', 'draft', 'archived', 'under_validation', 'PUBLISHED', 'UNDER_VALIDATION'];
  for (const s of testStatuses) {
    const { error } = await supabase.from('projects').update({ status: s }).eq('id', '00000000-0000-0000-0000-000000000000');
    if (error && error.message.includes('check constraint')) {
      console.log(`Project status '${s}': ❌ REJECTED (${error.message})`);
    } else {
      console.log(`Project status '${s}': ✅ ALLOWED (no constraint error)`);
    }
  }

  // Test values for community_posts post_type
  const testPostTypes = ['discussion', 'question', 'resource', 'announcement', 'DISCUSSION'];
  for (const pt of testPostTypes) {
    const { error } = await supabase.from('community_posts').update({ post_type: pt }).eq('id', '00000000-0000-0000-0000-000000000000');
    if (error && error.message.includes('check constraint')) {
      console.log(`Post type '${pt}': ❌ REJECTED (${error.message})`);
    } else {
      console.log(`Post type '${pt}': ✅ ALLOWED (no constraint error)`);
    }
  }
}

testConstraints();
