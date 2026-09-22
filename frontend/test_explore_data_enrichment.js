import { supabase } from './src/lib/supabase.js';
import { SupabaseService } from './src/services/supabaseService.js';

async function testExploreDataEnrichment() {
  console.log('================================================================');
  console.log('🔍 AUDITING & TESTING EXPLORE PAGE DATA ENRICHMENT');
  console.log('================================================================\n');

  // Sign in as Bob to simulate a real peer user browsing Explore
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'bob.evaluator@demo.innovexa.io',
    password: 'DemoPass123!'
  });
  if (authErr) throw authErr;
  console.log(`✓ Signed in as: ${auth.user.email} (${auth.user.id})\n`);

  // Fetch all projects using SupabaseService
  const { data: projects, error } = await SupabaseService.getProjects();

  if (error) {
    console.error('Failed to load explore projects:', error);
    return;
  }

  console.log(`✅ Retrieved ${projects?.length || 0} published projects from Supabase.`);
  console.log('------------------------------------------------------------\n');

  let passCount = 0;
  projects.forEach((p, idx) => {
    const hasTitle = Boolean(p.title && p.title.length > 2);
    const hasCategory = Boolean(p.category_name);
    const hasType = Boolean(p.project_type);
    const hasProblem = Boolean(p.problem_statement && p.problem_statement.length >= 15);
    const hasSolution = Boolean(p.proposed_solution && p.proposed_solution.length >= 15);
    const hasTargetUsers = Boolean(p.target_users && p.target_users.length >= 5);
    const hasBenefits = Boolean(p.key_benefits || p.expected_impact);
    const hasCreator = Boolean(p.creator_name);

    const isAllComplete = hasTitle && hasCategory && hasType && hasProblem && hasSolution && hasTargetUsers && hasBenefits;
    if (isAllComplete) passCount++;

    console.log(`[PROJECT ${idx + 1}] "${p.title}"`);
    console.log(`  DATABASE ID: ${p.id}`);
    console.log(`  CATEGORY: ${p.category_name}`);
    console.log(`  PROJECT TYPE: ${p.project_type}`);
    console.log(`  CREATOR: ${p.creator_name}`);
    console.log(`  UPVOTES: ${p.upvotes_count || 0} | REVIEWS: ${p.valid_reviews_count || 0}`);
    console.log(`  SHORT DESC: "${p.short_description?.slice(0, 80)}..."`);
    console.log(`  PROBLEM STATEMENT: ${hasProblem ? '✓ COMPLETE' : '✗ INCOMPLETE'}`);
    console.log(`    → "${p.problem_statement}"`);
    console.log(`  PROPOSED SOLUTION: ${hasSolution ? '✓ COMPLETE' : '✗ INCOMPLETE'}`);
    console.log(`    → "${p.proposed_solution}"`);
    console.log(`  TARGET USERS: "${p.target_users}"`);
    console.log(`  KEY BENEFITS: "${p.key_benefits || p.expected_impact}"`);
    console.log(`  STATUS: ${isAllComplete ? '✅ PASS (Fully Structured & Project-Specific)' : '⚠️ INCOMPLETE'}\n`);
  });

  console.log('================================================================');
  console.log(`🎉 AUDIT SUMMARY: ${passCount} / ${projects.length} PROJECTS FULLY STRUCTURED & VERIFIED`);
  console.log('================================================================\n');
}

testExploreDataEnrichment().catch(console.error);
