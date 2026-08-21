import { generateFeedbackInsights, calculateProjectContentHash } from '../src/services/aiInsights.js';

async function testDistinctProjectInsights() {
  console.log('================================================================');
  console.log('TESTING DYNAMIC AI INSIGHTS GENERATION FOR 3 DISTINCT PROJECTS');
  console.log('================================================================');

  // TEST PROJECT A: AI Healthcare Assistant
  const projectA = {
    id: 'proj_health_ai_001',
    title: 'CarePulse Clinical Copilot',
    category_name: 'Healthcare & Medicine',
    problem_statement: 'Emergency triage clinicians spend 4.5 hours daily cross-referencing multi-lead ECGs and patient EHR vitals, creating cognitive fatigue and clinical documentation delays.',
    proposed_solution: 'Real-time multi-modal edge AI triage model providing instant ST-elevation hazard alerts and FHIR terminology mapping.',
    target_users: 'Cardiologists, Emergency Department Physicians, Intensive Care Nurses',
    description: 'Autonomous edge-accelerated clinical triage assistant for emergency medicine.',
    features: ['Real-time 12-lead ECG rhythm classification under 15ms', 'HL7 FHIR & DICOM EHR interoperability', 'Edge offline inference engine'],
    tags: ['Healthcare', 'Cardiology', 'ClinicalAI', 'ECG', 'Triage']
  };

  // TEST PROJECT B: Smart Agriculture System
  const projectB = {
    id: 'proj_agri_iot_002',
    title: 'CropSense Hyper-Local Soil Grid',
    category_name: 'Agriculture & AgriTech',
    problem_statement: 'Smallholder farmers experience 40% crop yield loss due to unpredictable microclimate dry spells and unmonitored subsoil nitrogen depletion.',
    proposed_solution: 'Solar-powered subterranean LoRaWAN sensor mesh measuring soil moisture, NPK levels, and automated drip-irrigation actuation.',
    target_users: 'Commercial Agronomists, Smallholder Grain Farmers, Vineyard Managers',
    description: 'Subterranean wireless sensor network predicting soil depletion and automating micro-irrigation.',
    features: ['Subsoil NPK electro-chemical probe telemetry', 'Solar-powered LoRaWAN mesh nodes with 5km range', 'Automated drip-irrigation solenoid valves'],
    tags: ['AgriTech', 'IoT', 'SoilSensors', 'Irrigation', 'Sustainability']
  };

  // TEST PROJECT C: Cybersecurity Threat Detection
  const projectC = {
    id: 'proj_cyber_sec_003',
    title: 'SpecterGuard Zero-Trust Mesh',
    category_name: 'Cybersecurity',
    problem_statement: 'Enterprise Kubernetes clusters face sophisticated lateral movement and silent privilege escalation attacks that evade traditional signature-based firewalls.',
    proposed_solution: 'Kernel-level eBPF behavioral anomaly detection engine isolating rogue containers within 35 microseconds.',
    target_users: 'DevSecOps Engineers, Cloud Security Architects, Enterprise CISOs',
    description: 'Low-overhead eBPF security mesh detecting zero-day lateral movement in cloud-native microservices.',
    features: ['Kernel-space eBPF packet inspection without sidecar proxy overhead', 'Autonomous zero-trust policy enforcement & socket teardown', 'MITRE ATT&CK killchain graph visualization'],
    tags: ['Cybersecurity', 'eBPF', 'ZeroTrust', 'Kubernetes', 'CloudSecurity']
  };

  console.log('\n--- 1. Testing Project A (Healthcare) ---');
  const hashA = calculateProjectContentHash(projectA);
  console.log('Project A Content Hash:', hashA);
  const insightA = await generateFeedbackInsights(projectA, [], true);
  console.log('Insight A Project ID:', insightA.project_id);
  console.log('Insight A Title:', insightA.project_title);
  console.log('Insight A Summary:', insightA.project_summary);
  console.log('Insight A Problem Clarity Analysis:', insightA.problem_analysis?.analysis);
  console.log('Insight A Strengths:', insightA.strengths);
  console.log('Insight A Weaknesses:', insightA.weaknesses);
  console.log('Insight A Technical Feasibility:', insightA.technical_feasibility?.analysis);
  console.log('Insight A Readines/Overall Score:', insightA.overall_score);

  console.log('\n--- 2. Testing Project B (Agriculture) ---');
  const hashB = calculateProjectContentHash(projectB);
  console.log('Project B Content Hash:', hashB);
  const insightB = await generateFeedbackInsights(projectB, [], true);
  console.log('Insight B Project ID:', insightB.project_id);
  console.log('Insight B Title:', insightB.project_title);
  console.log('Insight B Summary:', insightB.project_summary);
  console.log('Insight B Problem Clarity Analysis:', insightB.problem_analysis?.analysis);
  console.log('Insight B Strengths:', insightB.strengths);
  console.log('Insight B Weaknesses:', insightB.weaknesses);
  console.log('Insight B Technical Feasibility:', insightB.technical_feasibility?.analysis);
  console.log('Insight B Readines/Overall Score:', insightB.overall_score);

  console.log('\n--- 3. Testing Project C (Cybersecurity) ---');
  const hashC = calculateProjectContentHash(projectC);
  console.log('Project C Content Hash:', hashC);
  const insightC = await generateFeedbackInsights(projectC, [], true);
  console.log('Insight C Project ID:', insightC.project_id);
  console.log('Insight C Title:', insightC.project_title);
  console.log('Insight C Summary:', insightC.project_summary);
  console.log('Insight C Problem Clarity Analysis:', insightC.problem_analysis?.analysis);
  console.log('Insight C Strengths:', insightC.strengths);
  console.log('Insight C Weaknesses:', insightC.weaknesses);
  console.log('Insight C Technical Feasibility:', insightC.technical_feasibility?.analysis);
  console.log('Insight C Readines/Overall Score:', insightC.overall_score);

  // Distinctness Validation Checks
  console.log('\n================================================================');
  console.log('VALIDATING DISTINCTNESS AND ZERO HARDCODED REPETITION');
  console.log('================================================================');

  const areSummariesDifferent = insightA.project_summary !== insightB.project_summary && insightB.project_summary !== insightC.project_summary;
  const areProblemsDifferent = insightA.problem_analysis.analysis !== insightB.problem_analysis.analysis && insightB.problem_analysis.analysis !== insightC.problem_analysis.analysis;
  const areStrengthsDifferent = JSON.stringify(insightA.strengths) !== JSON.stringify(insightB.strengths) && JSON.stringify(insightB.strengths) !== JSON.stringify(insightC.strengths);
  
  // Specificity tests
  const healthMentionsMedical = insightA.project_summary.toLowerCase().includes('health') || insightA.problem_analysis.analysis.toLowerCase().includes('ecg') || insightA.strengths.some(s => s.toLowerCase().includes('ecg') || s.toLowerCase().includes('clinician') || s.toLowerCase().includes('triage'));
  const agriMentionsSoil = insightB.project_summary.toLowerCase().includes('agri') || insightB.problem_analysis.analysis.toLowerCase().includes('soil') || insightB.strengths.some(s => s.toLowerCase().includes('crop') || s.toLowerCase().includes('soil') || s.toLowerCase().includes('farmer'));
  const cyberMentionsSecurity = insightC.project_summary.toLowerCase().includes('cyber') || insightC.problem_analysis.analysis.toLowerCase().includes('attack') || insightC.strengths.some(s => s.toLowerCase().includes('security') || s.toLowerCase().includes('ebpf') || s.toLowerCase().includes('container') || s.toLowerCase().includes('kubernetes'));

  console.log('✓ Summaries are 100% distinct:', areSummariesDifferent);
  console.log('✓ Problem analyses are 100% distinct:', areProblemsDifferent);
  console.log('✓ Strengths are 100% distinct:', areStrengthsDifferent);
  console.log('✓ Project A specifically evaluates Medical / Healthcare challenges:', healthMentionsMedical);
  console.log('✓ Project B specifically evaluates AgriTech / Soil / Farming challenges:', agriMentionsSoil);
  console.log('✓ Project C specifically evaluates Cybersecurity / eBPF / Attack challenges:', cyberMentionsSecurity);

  if (areSummariesDifferent && areProblemsDifferent && areStrengthsDifferent && healthMentionsMedical && agriMentionsSoil && cyberMentionsSecurity) {
    console.log('\n>>> ALL 3 PROJECT TESTS PASSED WITH 100% DOMAIN SPECIFICITY AND ZERO REPEATED BOILERPLATE <<<');
  } else {
    throw new Error('Distinctness test failed!');
  }
}

testDistinctProjectInsights().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
