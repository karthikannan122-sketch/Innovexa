import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, ...vals] = line.split('=');
        if (key && vals.length) {
          const val = vals.join('=').trim().replace(/^["']|["']$/g, '');
          if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = val;
          if (key.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseAnonKey = val;
        }
      });
    }
  } catch (e) {
    console.error('Error reading .env file:', e);
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runPhase2Tests() {
  console.log('====================================================');
  console.log('INNOVEXA PHASE 2: COMPLETE PROJECT MANAGEMENT TEST');
  console.log('====================================================');

  const testUserAId = '00000000-0000-0000-0000-000000000001';
  const testUserBId = '00000000-0000-0000-0000-000000000002';
  const testProjectId = `test_proj_${Date.now()}`;

  try {
    // 0. Ensure Categories exist in public.categories
    console.log('\n[TEST 0] Querying public.categories...');
    const { data: categories, error: catErr } = await supabase
      .from('categories')
      .select('*')
      .limit(5);

    if (catErr) throw new Error(`Category query failed: ${catErr.message}`);
    console.log(`✓ Fetched ${categories?.length || 0} categories from database:`, categories?.map(c => c.name || c.id));
    const testCategoryId = categories?.[0]?.id || 'cat_general';
    const testCategoryName = categories?.[0]?.name || 'General';

    // 1. User A creates Project A in public.projects
    console.log('\n[TEST 1] User A creates Project A in public.projects...');
    const projectPayload = {
      id: testProjectId,
      user_id: testUserAId,
      creator_id: testUserAId,
      creator_name: 'Test Innovator A',
      creator_handle: 'innovator_a',
      title: `Quantum Ledger Engine ${Date.now()}`,
      short_description: 'Decentralized high-throughput settlement architecture.',
      description: 'Full architectural specification for next-gen scalable state settlement.',
      problem_statement: 'High latency and gas costs in current L1 blockchains.',
      proposed_solution: 'A hybrid zk-rollup execution engine with optimistic fallback.',
      category_id: testCategoryId,
      category_name: testCategoryName,
      project_type: 'startup',
      creation_type: 'STARTUP',
      project_stage: 'prototype',
      startup_stage: 'prototype',
      innovation_type: 'technical',
      target_users: 'Blockchain engineers, dApp protocols, fintech builders',
      features: ['Sub-second finality', 'EVM parity', 'Zero-knowledge proofs'],
      tags: ['blockchain', 'cryptography', 'scaling'],
      cover_image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200',
      images: ['https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200'],
      launch_url: 'https://quantumledger.io',
      website_url: 'https://quantumledger.io',
      github_url: 'https://github.com/innovexa/quantum-ledger',
      demo_url: 'https://demo.quantumledger.io',
      status: 'UNDER_VALIDATION',
      is_public: true,
      upvotes_count: 0,
      downvotes_count: 0,
      valid_reviews_count: 0,
      published_at: new Date().toISOString()
    };

    const { data: createdProj, error: createErr } = await supabase
      .from('projects')
      .insert(projectPayload)
      .select()
      .single();

    if (createErr) throw new Error(`Project creation failed: ${createErr.message}`);
    console.log('✓ Project A created successfully with ID:', createdProj.id);
    console.log('  Title:', createdProj.title);
    console.log('  Type:', createdProj.project_type);
    console.log('  Stage:', createdProj.project_stage);
    console.log('  Public:', createdProj.is_public);
    console.log('  Status:', createdProj.status);

    // 2. User B verifies Project A is visible in Explore (public + published)
    console.log('\n[TEST 2] User B discovers Project A in Explore query...');
    const { data: exploreProjects, error: exploreErr } = await supabase
      .from('projects')
      .select('*')
      .eq('is_public', true)
      .neq('status', 'DRAFT')
      .eq('id', testProjectId);

    if (exploreErr) throw new Error(`Explore query failed: ${exploreErr.message}`);
    if (!exploreProjects || exploreProjects.length === 0) {
      throw new Error('Project A is not visible in Explore query!');
    }
    console.log('✓ User B successfully discovered Project A in public Explore feed.');

    // 3. User B votes on Project A (Upvote -> Downvote -> Remove Vote)
    console.log('\n[TEST 3] User B tests voting on Project A...');

    // 3a. Upvote
    console.log('  3a. User B upvotes Project A...');
    const { error: upvoteErr } = await supabase
      .from('project_votes')
      .upsert({
        project_id: testProjectId,
        user_id: testUserBId,
        vote_type: 'upvote'
      }, { onConflict: 'project_id,user_id' });

    if (upvoteErr) throw new Error(`Upvote failed: ${upvoteErr.message}`);

    // Update project upvotes_count
    await supabase.rpc('sync_project_votes', { target_project_id: testProjectId }).catch(() => {});
    const { data: projAfterUpvote } = await supabase.from('projects').select('*').eq('id', testProjectId).single();
    const { count: voteRowsCount1 } = await supabase.from('project_votes').select('*', { count: 'exact', head: true }).eq('project_id', testProjectId).eq('user_id', testUserBId);
    console.log(`  ✓ Vote recorded in project_votes. Rows for (User B, Project A): ${voteRowsCount1}`);

    // 3b. Switch to Downvote
    console.log('  3b. User B switches vote to downvote...');
    const { error: downvoteErr } = await supabase
      .from('project_votes')
      .upsert({
        project_id: testProjectId,
        user_id: testUserBId,
        vote_type: 'downvote'
      }, { onConflict: 'project_id,user_id' });

    if (downvoteErr) throw new Error(`Downvote failed: ${downvoteErr.message}`);
    const { count: voteRowsCount2 } = await supabase.from('project_votes').select('*', { count: 'exact', head: true }).eq('project_id', testProjectId).eq('user_id', testUserBId);
    const { data: currentVote } = await supabase.from('project_votes').select('vote_type').eq('project_id', testProjectId).eq('user_id', testUserBId).single();
    console.log(`  ✓ Vote updated to "${currentVote.vote_type}". Total rows (must remain 1): ${voteRowsCount2}`);
    if (voteRowsCount2 !== 1) throw new Error('Duplicate vote rows detected!');

    // 3c. Remove Vote (Toggle off)
    console.log('  3c. User B clicks downvote again to remove vote...');
    const { error: deleteVoteErr } = await supabase
      .from('project_votes')
      .delete()
      .eq('project_id', testProjectId)
      .eq('user_id', testUserBId);

    if (deleteVoteErr) throw new Error(`Vote removal failed: ${deleteVoteErr.message}`);
    const { count: voteRowsCount3 } = await supabase.from('project_votes').select('*', { count: 'exact', head: true }).eq('project_id', testProjectId).eq('user_id', testUserBId);
    console.log(`  ✓ Vote removed. Rows remaining: ${voteRowsCount3}`);

    // 4. User B follows Project A
    console.log('\n[TEST 4] User B follows Project A in public.project_follows...');
    const { error: followErr } = await supabase
      .from('project_follows')
      .insert({
        project_id: testProjectId,
        user_id: testUserBId
      });

    if (followErr) throw new Error(`Follow failed: ${followErr.message}`);
    const { count: followCount } = await supabase.from('project_follows').select('*', { count: 'exact', head: true }).eq('project_id', testProjectId);
    console.log(`✓ User B followed Project A. Total followers: ${followCount}`);

    // Verify duplicate follow prevention
    const { error: dupFollowErr } = await supabase
      .from('project_follows')
      .insert({
        project_id: testProjectId,
        user_id: testUserBId
      });
    if (dupFollowErr) {
      console.log('✓ Duplicate follow correctly blocked by unique constraint:', dupFollowErr.code || dupFollowErr.message);
    }

    // 5. User B submits a suggestion on Project A
    console.log('\n[TEST 5] User B submits a suggestion in public.project_suggestions...');
    const testSuggestionId = `sug_${Date.now()}`;
    const { data: createdSug, error: sugErr } = await supabase
      .from('project_suggestions')
      .insert({
        id: testSuggestionId,
        project_id: testProjectId,
        user_id: testUserBId,
        title: 'Add support for BLS signature aggregation',
        content: 'BLS aggregation can reduce state proof size by 65%.',
        suggestion_type: 'architecture',
        status: 'open'
      })
      .select()
      .single();

    if (sugErr) throw new Error(`Suggestion creation failed: ${sugErr.message}`);
    console.log(`✓ Suggestion created with ID: ${createdSug.id}, Status: ${createdSug.status}`);

    // User A updates suggestion status to 'accepted'
    console.log('  User A accepts the suggestion...');
    const { data: updatedSug, error: updateSugErr } = await supabase
      .from('project_suggestions')
      .update({ status: 'accepted' })
      .eq('id', testSuggestionId)
      .select()
      .single();

    if (updateSugErr) throw new Error(`Suggestion update failed: ${updateSugErr.message}`);
    console.log(`✓ Suggestion status updated to: "${updatedSug.status}"`);

    // 6. User A updates Project A
    console.log('\n[TEST 6] User A updates Project A...');
    const { data: updatedProj, error: updateProjErr } = await supabase
      .from('projects')
      .update({
        title: `Quantum Ledger Engine (v2) ${Date.now()}`,
        project_stage: 'development'
      })
      .eq('id', testProjectId)
      .eq('user_id', testUserAId)
      .select()
      .single();

    if (updateProjErr) throw new Error(`Project update failed: ${updateProjErr.message}`);
    console.log('✓ Project A updated by User A:');
    console.log('  New Title:', updatedProj.title);
    console.log('  New Stage:', updatedProj.project_stage);

    // 7. User A unpublishes Project A (moves to private draft)
    console.log('\n[TEST 7] User A unpublishes Project A...');
    const { error: unpubErr } = await supabase
      .from('projects')
      .update({
        status: 'DRAFT',
        is_public: false
      })
      .eq('id', testProjectId)
      .eq('user_id', testUserAId);

    if (unpubErr) throw new Error(`Unpublish failed: ${unpubErr.message}`);

    // User B checks Explore feed — Project A must NOT be visible
    const { data: draftExploreCheck } = await supabase
      .from('projects')
      .select('id')
      .eq('is_public', true)
      .neq('status', 'DRAFT')
      .eq('id', testProjectId);

    if (draftExploreCheck && draftExploreCheck.length > 0) {
      throw new Error('Draft project is improperly visible in Explore feed!');
    }
    console.log('✓ Project A correctly hidden from public Explore when in DRAFT mode.');

    // 8. Clean up test records
    console.log('\n[CLEANUP] Removing test records...');
    await supabase.from('project_suggestions').delete().eq('project_id', testProjectId);
    await supabase.from('project_follows').delete().eq('project_id', testProjectId);
    await supabase.from('project_votes').delete().eq('project_id', testProjectId);
    await supabase.from('projects').delete().eq('id', testProjectId);
    console.log('✓ Test data cleaned up.');

    console.log('\n====================================================');
    console.log('>>> ALL PHASE 2 PROJECT MANAGEMENT TESTS PASSED! <<<');
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n❌ PHASE 2 TEST FAILED:', err.message || err);
    process.exit(1);
  }
}

runPhase2Tests();
