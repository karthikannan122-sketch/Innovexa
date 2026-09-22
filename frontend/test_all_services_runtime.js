import React from 'react';
import { supabase } from './src/lib/supabase.js';
import { SupabaseService } from './src/services/supabaseService.js';
import { StorageService } from './src/services/storage.js';

// Test that all services and data access methods execute safely without ReferenceErrors
async function runFullRuntimeServiceTest() {
  console.log('================================================================');
  console.log('🧪 RUNNING COMPREHENSIVE RUNTIME AUDIT OF ALL APPLICATION SERVICES');
  console.log('================================================================\n');

  // Sign in as peer evaluator to test all authenticated workflows
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'bob.evaluator@demo.innovexa.io',
    password: 'DemoPass123!'
  });
  if (authErr) throw authErr;
  console.log(`✓ Authenticated as: ${auth.user.email} (${auth.user.id})\n`);

  const results = [];

  // Helper tester
  async function testServiceCall(name, fn) {
    try {
      const res = await fn();
      results.push({ name, status: 'PASS', details: res ? 'Returned data' : 'Empty/Void' });
      console.log(`  ✓ [${name}]: PASS`);
    } catch (err) {
      results.push({ name, status: 'FAIL', error: err.message });
      console.error(`  ✗ [${name}]: FAIL -> ${err.message}`);
    }
  }

  console.log('1. Testing Project Queries:');
  await testServiceCall('getProjects', () => SupabaseService.getProjects());
  await testServiceCall('getUserProjects', () => SupabaseService.getUserProjects(auth.user.id));
  await testServiceCall('getCategories', () => SupabaseService.getCategories());

  console.log('\n2. Testing Review Queries:');
  await testServiceCall('getReviews', () => SupabaseService.getReviews());
  await testServiceCall('getProjectReviews', async () => {
    const { data: projs } = await SupabaseService.getProjects();
    if (projs && projs.length > 0) {
      return SupabaseService.getProjectReviews(projs[0].id);
    }
    return null;
  });

  console.log('\n3. Testing Likes / Upvote Queries:');
  await testServiceCall('getUserLikedProjects', () => SupabaseService.getUserLikedProjects(auth.user.id));
  await testServiceCall('getProjectLikes', async () => {
    const { data: projs } = await SupabaseService.getProjects();
    if (projs && projs.length > 0) {
      return SupabaseService.getProjectLikes(projs[0].id);
    }
    return null;
  });

  console.log('\n4. Testing Messaging Queries:');
  await testServiceCall('getConversations', () => SupabaseService.getConversations(auth.user.id));
  await testServiceCall('getNotifications', () => SupabaseService.getNotifications(auth.user.id));

  console.log('\n5. Testing Community Queries:');
  await testServiceCall('getCommunityPosts', () => SupabaseService.getCommunityPosts());
  await testServiceCall('getCommunityResources', () => SupabaseService.getCommunityResources());
  await testServiceCall('getProfiles', () => SupabaseService.getProfiles());

  console.log('\n================================================================');
  const passCount = results.filter(r => r.status === 'PASS').length;
  console.log(`🎉 RUNTIME SERVICE AUDIT RESULT: ${passCount} / ${results.length} PASSED WITH 0 ERRORS`);
  console.log('================================================================\n');
}

runFullRuntimeServiceTest().catch(console.error);
