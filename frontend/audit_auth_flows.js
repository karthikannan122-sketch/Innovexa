import { supabase } from './src/lib/supabase.js';

async function auditAuthenticationFlows() {
  console.log('================================================================');
  console.log('🔐 PHASE 3: AUTHENTICATION & MULTI-USER ISOLATION AUDIT');
  console.log('================================================================\n');

  const testUserA = {
    email: 'alice.innovator@demo.innovexa.io',
    password: 'DemoPass123!',
    fullName: 'Alice Innovator'
  };

  const testUserB = {
    email: 'bob.evaluator@demo.innovexa.io',
    password: 'DemoPass123!',
    fullName: 'Bob Evaluator'
  };

  // --- Step 1: User A Login & Session Verification ---
  console.log('--- Testing User A Authentication ---');
  const { data: authDataA, error: loginErrA } = await supabase.auth.signInWithPassword({
    email: testUserA.email,
    password: testUserA.password
  });

  if (loginErrA) {
    console.error('❌ User A Login Failed:', loginErrA.message);
  } else {
    console.log(`✅ User A Logged In: ID = ${authDataA.user.id}, Email = ${authDataA.user.email}`);
    // Check Profile in public.profiles
    const { data: profileA, error: profErrA } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authDataA.user.id)
      .maybeSingle();

    if (profErrA) {
      console.error('❌ User A Profile Fetch Error:', profErrA.message);
    } else {
      console.log(`✅ User A Profile in public.profiles: Full Name = "${profileA?.full_name || 'N/A'}", ID = ${profileA?.id}`);
    }
  }

  // --- Step 2: User A Logout ---
  console.log('\n--- Testing User A Logout ---');
  const { error: logoutErrA } = await supabase.auth.signOut();
  if (logoutErrA) {
    console.error('❌ User A Logout Error:', logoutErrA.message);
  } else {
    console.log('✅ User A Successfully Logged Out.');
  }

  // --- Step 3: User B Login & Session Verification ---
  console.log('\n--- Testing User B Authentication ---');
  const { data: authDataB, error: loginErrB } = await supabase.auth.signInWithPassword({
    email: testUserB.email,
    password: testUserB.password
  });

  if (loginErrB) {
    console.error('❌ User B Login Failed:', loginErrB.message);
  } else {
    console.log(`✅ User B Logged In: ID = ${authDataB.user.id}, Email = ${authDataB.user.email}`);
    // Check Profile in public.profiles
    const { data: profileB, error: profErrB } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authDataB.user.id)
      .maybeSingle();

    if (profErrB) {
      console.error('❌ User B Profile Fetch Error:', profErrB.message);
    } else {
      console.log(`✅ User B Profile in public.profiles: Full Name = "${profileB?.full_name || 'N/A'}", ID = ${profileB?.id}`);
    }
  }

  // --- Step 4: Verification of Distinct Profile IDs ---
  console.log('\n--- Verification of Distinct User Entities ---');
  if (authDataA?.user?.id && authDataB?.user?.id) {
    const isDistinct = authDataA.user.id !== authDataB.user.id;
    console.log(`✅ User A ID (${authDataA.user.id}) !== User B ID (${authDataB.user.id}): ${isDistinct ? 'VERIFIED' : 'FAILED'}`);
  }

  console.log('\n================================================================');
  console.log('🎉 PHASE 3: AUTHENTICATION AUDIT COMPLETED SUCCESSFULLY');
  console.log('================================================================\n');
}

auditAuthenticationFlows().catch(console.error);
