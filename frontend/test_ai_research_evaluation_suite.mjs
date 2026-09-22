import { AIResearchService } from './src/services/aiResearchService.js';

// Polyfill minimal localStorage for node environment
if (typeof localStorage === 'undefined' || localStorage === null) {
  let store = {};
  global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
}

console.log('✦ RUNNING AI RESEARCH & HUMAN EVALUATION TEST SUITE ✦\n');

async function runTests() {
  let passed = 0;
  let total = 0;

  function assert(condition, name) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${name}`);
    }
  }

  // 1. Test AI Research Synthesis with Open Source links
  console.log('1. Testing AI Research Synthesis...');
  const res = await AIResearchService.generateResearch({
    title: 'Autonomous Multi-Agent Climate Carbon Verifier',
    problemStatement: 'Manual carbon credit verification suffers from 6-month verification latency and opaque audit trails.',
    category: 'Sustainability & Climate'
  });

  assert(res.success === true, 'AIResearchService.generateResearch returns success');
  assert(res.data && res.data.title.includes('Climate'), 'Research title contains domain topic');
  assert(Array.isArray(res.data.open_source_stack) && res.data.open_source_stack.length >= 3, 'Open source stack contains >= 3 verified links/repos');
  assert(res.data.open_source_stack.some(s => s.type === 'GITHUB_REPO'), 'Contains GitHub repository sources');
  assert(res.data.open_source_stack.some(s => s.type === 'ARXIV_PAPER'), 'Contains arXiv research paper sources');
  assert(Array.isArray(res.data.novel_ideas_and_hypotheses) && res.data.novel_ideas_and_hypotheses.length >= 3, 'Contains >= 3 novel idea exploration hypotheses');

  // 2. Test Human Evaluation Persistence
  console.log('\n2. Testing Human-in-the-Loop Evaluation Form Persistence...');
  const evalPayload = {
    research_id: res.data.research_id,
    project_title: res.data.title,
    evaluator_name: 'Dr. Jane Smith (Climate Data Scientist)',
    category: 'Sustainability & Climate',
    verdict: 'VALIDATED_HIGH_POTENTIAL',
    feasibility_score: 5,
    novelty_score: 4,
    open_source_grounding_score: 5,
    future_utility_score: 5,
    human_critique_notes: 'Strong alignment with IPCC open telemetry. Should ensure cold-start data pipelines are tested against real sensors.',
    future_action_plan: '1. Fork open climate data repos. 2. Implement automated sensor ingestion API.',
    research_brief: res.data
  };

  const saveRes = await AIResearchService.saveHumanEvaluation(evalPayload);
  assert(saveRes.success === true, 'saveHumanEvaluation successfully persists evaluation');
  assert(saveRes.data && saveRes.data.id.startsWith('eval_'), 'Returns valid evaluation ID');

  // 3. Test Retrieval from Saved Archive
  console.log('\n3. Testing Retrieval of Human-Evaluated Research Archive...');
  const allSaved = AIResearchService.getSavedEvaluations();
  assert(Array.isArray(allSaved) && allSaved.length >= 1, 'Saved evaluations are retrieved successfully');
  assert(allSaved[0].verdict === 'VALIDATED_HIGH_POTENTIAL', 'Preserved human verdict');
  assert(allSaved[0].future_utility_score === 5, 'Preserved future utility score');
  assert(allSaved[0].human_critique_notes.includes('IPCC'), 'Preserved domain critique notes');

  // 4. Test Deletion
  console.log('\n4. Testing Evaluation Management...');
  const delRes = AIResearchService.deleteEvaluation(saveRes.data.id);
  assert(delRes === true, 'deleteEvaluation executes successfully');
  const afterDel = AIResearchService.getSavedEvaluations();
  assert(!afterDel.some(e => e.id === saveRes.data.id), 'Deleted evaluation no longer in archive');

  console.log(`\n✦ SUITE SUMMARY: ${passed} / ${total} TESTS PASSED ✦`);
  if (passed === total) {
    console.log('✅ ALL AI RESEARCH & HUMAN EVALUATION TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  } else {
    console.error('❌ SOME TESTS FAILED.');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
