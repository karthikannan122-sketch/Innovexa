import { supabase } from './src/lib/supabase.js';

async function testProjectCreation() {
  console.log('======================================================');
  console.log('🧪 TESTING SINGLE-OPERATION PROJECT CREATION IN SUPABASE');
  console.log('======================================================\n');

  // 1. Authenticate user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'alice.innovator@demo.innovexa.io',
    password: 'DemoPass123!'
  });

  if (authError || !authData?.user) {
    console.error('Authentication failed:', authError);
    process.exit(1);
  }

  const user = authData.user;
  console.log(`✓ Authenticated as: ${user.email} (ID: ${user.id})`);

  // 2. Select category UUID
  const selectedCategoryId = '93fe2938-c843-4fa4-8b01-b07d59990023'; // Technology category UUID
  console.log(`✓ Using selectedCategoryId (UUID): ${selectedCategoryId}`);

  const formData = {
    title: 'QuantumEdge Distributed Inference Engine',
    description: 'Ultra-low-latency decentralized AI inference runtime across heterogeneous edge nodes.',
    projectType: 'startup',
    launchUrl: 'https://quantumedge.network'
  };

  console.log('\nSubmitting insert operation...');

  // 3. Exact single-operation insertion
  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      category_id: selectedCategoryId,
      title: formData.title,
      description: formData.description,
      project_type: formData.projectType,
      launch_url: formData.launchUrl || null,
      status: "published"
    })
    .select()
    .single();

  if (error) {
    console.error("Project creation failed:", error);
    process.exit(1);
  }

  console.log("\nProject created successfully:", project);

  // Assertions
  if (!project.id) throw new Error('Missing project.id');
  if (project.category_id !== selectedCategoryId) throw new Error(`Category ID mismatch: expected ${selectedCategoryId}, got ${project.category_id}`);
  if (project.user_id !== user.id) throw new Error(`User ID mismatch: expected ${user.id}, got ${project.user_id}`);
  if (project.status !== 'published') throw new Error(`Status mismatch: expected published, got ${project.status}`);

  console.log('\n✓ All assertions passed:');
  console.log(`  - project.id: ${project.id}`);
  console.log(`  - project.category_id: ${project.category_id} (valid UUID)`);
  console.log(`  - project.user_id: ${project.user_id}`);
  console.log(`  - project.status: ${project.status}`);
  console.log(`  - project.launch_url: ${project.launch_url}`);

  // Cleanup test row
  await supabase.from('projects').delete().eq('id', project.id);
  console.log('\n✓ Cleanup complete.');

  console.log('\n======================================================');
  console.log('🎉 SINGLE-OPERATION PROJECT CREATION VERIFIED!');
  console.log('======================================================\n');
}

testProjectCreation().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
