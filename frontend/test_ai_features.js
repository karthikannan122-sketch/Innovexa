import { AIService } from './src/services/aiService.js';

async function runAiTests() {
  console.log('====================================================');
  console.log('✦ STARTING INNOVEXA AI SERVICES TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  // Sample Categories
  const categories = [
    { id: 'cat_ai', name: 'AI & Machine Learning' },
    { id: 'cat_health', name: 'Healthcare & Biotech' },
    { id: 'cat_clean', name: 'CleanTech & Climate' },
    { id: 'cat_edu', name: 'Education & Knowledge' },
    { id: 'cat_b2b', name: 'Enterprise SaaS & B2B' }
  ];

  // Sample Projects
  const mockProjects = [
    {
      id: 'p1',
      title: 'CardioScan AI Telemetry',
      category_id: 'cat_health',
      category_name: 'Healthcare & Biotech',
      short_description: 'Real-time deep learning ECG arrhythmia detection for emergency triage.',
      problem_statement: 'Emergency rooms experience diagnostic delays in detecting acute myocardial infarction from raw ECG telemetry.',
      proposed_solution: 'A lightweight edge model running on portable ECG monitors predicting cardiac anomalies in under 2 seconds.',
      target_users: 'Emergency physicians and cardiologists',
      project_type: 'idea',
      status: 'published',
      upvotes_count: 14,
      valid_reviews_count: 4
    },
    {
      id: 'p2',
      title: 'NeuralECG Diagnostic Companion',
      category_id: 'cat_health',
      category_name: 'Healthcare & Biotech',
      short_description: 'Clinical ECG telemetry analysis assistant for remote healthcare workers.',
      problem_statement: 'Remote clinics lack full-time cardiologists for immediate ECG triage.',
      proposed_solution: 'Cloud-assisted neural model alerting clinic staff of high-risk cardiac waveforms.',
      target_users: 'Remote healthcare clinicians',
      project_type: 'idea',
      status: 'published',
      upvotes_count: 8,
      valid_reviews_count: 2
    },
    {
      id: 'p3',
      title: 'CarbonLedger Green Supply Chain',
      category_id: 'cat_clean',
      category_name: 'CleanTech & Climate',
      short_description: 'Automated Scope 3 emissions audit ledger for freight logistics.',
      problem_statement: 'Logistics fleets struggle with verifiable carbon offset compliance.',
      proposed_solution: 'IoT telematics tracking fuel consumption converted into audit-ready carbon credits.',
      target_users: 'Supply chain directors',
      project_type: 'product',
      status: 'published',
      upvotes_count: 19,
      valid_reviews_count: 5
    }
  ];

  // Sample Reviews for p1
  const mockReviews = [
    {
      rating: 5,
      problem_relevance: 'YES',
      would_use: 'YES',
      overall_feedback: 'Extremely compelling clinical value proposition. Immediate ECG triage is a massive bottleneck in trauma centers.',
      suggestion: 'Ensure FDA Software as a Medical Device (SaMD) regulatory clearance roadmap is detailed.'
    },
    {
      rating: 4,
      problem_relevance: 'YES',
      would_use: 'YES',
      overall_feedback: 'Edge inference latency under 2 seconds is impressive for bedside telemetry.',
      suggestion: 'Test against noisy multi-lead patient motion artifacts.'
    }
  ];

  // 1. TEST AI IDEA ANALYZER & READINESS SCORE (Feature 1 & 7)
  console.log('\n--- 1. AI Idea Analyzer & Readiness Score ---');
  const analysis = await AIService.analyzeIdea(mockProjects[0], categories);
  assert(analysis && typeof analysis.summary === 'string', 'Analyzer returns concept summary');
  assert(analysis.readiness_score && analysis.readiness_score.total >= 0 && analysis.readiness_score.total <= 100, 'Readiness score is bounded between 0 and 100');
  assert(analysis.readiness_score.breakdown && analysis.readiness_score.breakdown.problem_clarity !== undefined, 'Readiness score includes transparent breakdown');
  assert(analysis.suggested_category && analysis.suggested_category.name.includes('Health'), 'Auto-classifies health innovation correctly');
  assert(Array.isArray(analysis.key_strengths) && analysis.key_strengths.length > 0, 'Returns key strengths');
  assert(Array.isArray(analysis.potential_gaps) && analysis.potential_gaps.length > 0, 'Returns potential gaps');

  // 2. TEST SMART TAG GENERATION (Feature 2)
  console.log('\n--- 2. Smart Tag Generation ---');
  const tags = await AIService.generateTags(mockProjects[0]);
  assert(Array.isArray(tags) && tags.length >= 3 && tags.length <= 7, 'Generates 3 to 7 tags');
  assert(tags.some(t => t.toLowerCase().includes('health') || t.toLowerCase().includes('ai') || t.toLowerCase().includes('clinical')), 'Generated tags contain domain keywords');

  // 3. TEST SIMILAR PROJECT DISCOVERY (Feature 3)
  console.log('\n--- 3. Similar Project Discovery ---');
  const similar = AIService.findSimilarProjects(mockProjects[0], mockProjects);
  assert(Array.isArray(similar) && similar.length > 0, 'Finds similar projects from network');
  assert(similar[0].id === 'p2', 'Identifies NeuralECG (p2) as the top match for CardioScan (p1)');
  assert(similar[0].similarity_score >= 70, 'Calculates high similarity percentage (>70%) for matching healthcare/ECG projects');
  assert(similar[0].similarity_reason && similar[0].similarity_reason.length > 5, 'Provides human-readable match rationale');

  // 4. TEST AI REVIEW QUESTIONS (Feature 4)
  console.log('\n--- 4. AI Review Questions ---');
  const questions = await AIService.generateReviewQuestions(mockProjects[0]);
  assert(Array.isArray(questions) && questions.length >= 3, 'Generates 3+ contextual validator questions');
  assert(questions.some(q => q.toLowerCase().includes('ecg') || q.toLowerCase().includes('cardio') || q.toLowerCase().includes('clinical') || q.toLowerCase().includes('regulatory') || q.toLowerCase().includes('feasible')), 'Questions are domain-specific to healthcare/ECG');

  // 5. TEST AI FEEDBACK SUMMARY & PRIORITY ACTIONS (Feature 5)
  console.log('\n--- 5. AI Feedback Summary & Priority Actions ---');
  const feedbackSummary = await AIService.generateFeedbackSummary(mockProjects[0], mockReviews);
  assert(feedbackSummary && feedbackSummary.sentiment !== undefined, 'Determines reviewer consensus sentiment');
  assert(feedbackSummary.priority_actions && feedbackSummary.priority_actions.high && feedbackSummary.priority_actions.medium && feedbackSummary.priority_actions.low, 'Generates High/Medium/Low priority action matrix');
  assert(Array.isArray(feedbackSummary.strengths) && feedbackSummary.strengths.length > 0, 'Extracts top feedback strengths');
  assert(Array.isArray(feedbackSummary.concerns) && feedbackSummary.concerns.length > 0, 'Extracts top feedback concerns');

  // 6. TEST PROJECT IMPROVEMENT ASSISTANT (Feature 6)
  console.log('\n--- 6. Project Improvement Assistant ---');
  const improvementPlan = await AIService.generateImprovementPlan(mockProjects[0], mockReviews);
  assert(improvementPlan && improvementPlan.clarity && improvementPlan.feasibility && improvementPlan.differentiation && improvementPlan.user_value, 'Generates 5-pillar improvement plan');
  assert(Array.isArray(improvementPlan.next_steps) && improvementPlan.next_steps.length > 0, 'Returns actionable next steps');

  // 7. TEST SMART PROJECT DESCRIPTION ASSISTANT (Feature 8)
  console.log('\n--- 7. Smart Project Description Assistant ---');
  const improvedDesc = await AIService.improveDescription('real time ecg monitor for hospitals. works fast.', 'CardioScan', 'Healthcare');
  assert(improvedDesc && improvedDesc.suggested && improvedDesc.suggested.length > 15, 'Returns polished description suggestion');
  assert(Array.isArray(improvedDesc.improvements) && improvedDesc.improvements.length > 0, 'Returns improvement highlights');

  // 8. TEST PERSONALIZED RECOMMENDATIONS (Feature 9)
  console.log('\n--- 8. AI-Powered Personalized Recommendations ---');
  const mockUser = {
    id: 'user_ajay',
    name: 'Ajay',
    interests: ['Healthcare & Biotech', 'CleanTech'],
    preferred_domains: ['Healthcare']
  };
  const recommendations = AIService.getPersonalizedRecommendations(mockUser, mockProjects);
  assert(Array.isArray(recommendations) && recommendations.length > 0, 'Returns personalized recommendations');
  assert(recommendations[0].recommendation_score > 0, 'Calculates non-zero recommendation score based on user interests');
  assert(recommendations[0].recommendation_reason !== undefined, 'Includes recommendation match reason');

  console.log(`\n====================================================`);
  console.log(`✦ TEST RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed/total)*100)}%)`);
  console.log(`====================================================\n`);

  if (passed === total) {
    console.log('🎉 ALL AI ENGINE & LOGIC TESTS COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('❌ SOME TESTS FAILED');
    process.exit(1);
  }
}

runAiTests();
