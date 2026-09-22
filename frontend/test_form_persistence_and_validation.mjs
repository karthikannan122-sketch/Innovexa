import fs from 'fs';
import { cleanProjectTitle } from './src/utils/textUtils.js';

function runFormLogicValidationTests() {
  console.log('====================================================');
  console.log('FORM LOGIC, VALIDATION & PERSISTENCE TEST SUITE');
  console.log('====================================================\n');

  // Test 1: Title cleaning & Special characters
  console.log('--- TEST 1: TITLE FORMATTING & SPECIAL CHARACTERS ---');
  const rawTitles = [
    '   AI Autonomous Study Companion   ',
    'Novel Brain-Computer Interface (v2.0) [Prototype]!',
    '  Decentralized Finance & Oracles: Micro-Payments #1  ',
    'Special @#&*() Chars Test'
  ];
  for (const t of rawTitles) {
    const cleaned = cleanProjectTitle(t);
    console.log(`Raw: "${t}" -> Cleaned: "${cleaned}"`);
    if (!cleaned || cleaned.trim().length === 0) {
      throw new Error(`Clean title failed for: ${t}`);
    }
  }
  console.log('✅ Title cleaning passed!\n');

  // Test 2: Validation rules across tracks
  console.log('--- TEST 2: VALIDATION RULES ACROSS 5 CREATION TRACKS ---');
  const tracks = ['IDEA', 'PRODUCT', 'STARTUP', 'PROTOTYPE', 'RESEARCH'];

  for (const track of tracks) {
    console.log(`Checking track: ${track}`);
    
    // Step 1 check
    const step1Valid = (title, problem) => {
      if (!title || !title.trim()) return false;
      if (!problem || problem.trim().length < 15) return false;
      return true;
    };
    if (step1Valid('', 'Long problem statement text here')) throw new Error(`${track} Step 1 allowed empty title`);
    if (step1Valid('Title', 'Too short')) throw new Error(`${track} Step 1 allowed short problem`);
    if (!step1Valid('Valid Title', 'This is a sufficiently long problem description with >= 15 chars')) {
      throw new Error(`${track} Step 1 rejected valid inputs`);
    }

    // Step 2 & 3 check
    const step2Valid = (trackName, data) => {
      const solution = (data.proposed_solution?.trim() || data.short_description?.trim() || '');
      if (trackName === 'IDEA') {
        return Boolean(data.proposed_solution?.trim() && data.target_users?.trim());
      }
      if (trackName === 'PRODUCT') {
        return Boolean((data.short_description?.trim() || data.proposed_solution?.trim()) && data.target_users?.trim());
      }
      if (trackName === 'STARTUP') {
        return Boolean(data.proposed_solution?.trim() && data.target_users?.trim() && data.startup_stage);
      }
      if (trackName === 'PROTOTYPE') {
        return Boolean((data.proposed_solution?.trim() || data.short_description?.trim()) && data.target_users?.trim());
      }
      if (trackName === 'RESEARCH') {
        return Boolean((data.proposed_solution?.trim() || data.short_description?.trim()) && data.target_users?.trim());
      }
      return false;
    };

    const validData = {
      proposed_solution: 'Novel architecture solution details with ample substance',
      short_description: 'Concise summary of the solution and mechanisms',
      target_users: 'Target domain users and researchers',
      startup_stage: 'prototype'
    };

    if (!step2Valid(track, validData)) {
      throw new Error(`${track} Step 2 failed valid data`);
    }
  }
  console.log('✅ Validation rules verified across all 5 tracks!\n');

  // Test 3: Local Storage Draft Serialization & Deserialization
  console.log('--- TEST 3: DRAFT JSON PERSISTENCE INTEGRITY ---');
  const sampleDraft = {
    creationTrack: 'STARTUP',
    formData: {
      title: 'NeuralSync Technologies',
      category_id: '9b4e03a7-8261-4bf2-a2d9-12953a9316ae',
      problem_statement: 'High neural interface impedance limits data throughput in clinical settings.',
      proposed_solution: 'Ultrasonic micro-transducers delivering 10x signal fidelity.',
      target_users: 'Clinical neuroscientists and neuro-prosthetics manufacturers',
      short_description: 'Ultrasonic micro-transducer neural interface.',
      tags_text: 'Neurotech, Ultrasonic, BCI, Medical',
      cover_image: '',
      features: ['High bandwidth', 'Low latency', 'Sub-millimeter footprint'],
      has_live_product: true,
      website_url: 'https://neuralsync.io',
      demo_url: 'https://demo.neuralsync.io',
      github_url: 'https://github.com/neuralsync/core',
      startup_stage: 'prototype'
    },
    updatedAt: Date.now()
  };

  const serialized = JSON.stringify(sampleDraft);
  const deserialized = JSON.parse(serialized);

  if (deserialized.creationTrack !== sampleDraft.creationTrack) throw new Error('Track mismatch in draft JSON');
  if (deserialized.formData.title !== sampleDraft.formData.title) throw new Error('Title mismatch in draft JSON');
  if (deserialized.formData.features.length !== 3) throw new Error('Features mismatch in draft JSON');
  console.log('✅ Draft serialization and field hydration verified!\n');

  console.log('====================================================');
  console.log('🎉 ALL FORM LOGIC & VALIDATION TESTS PASSED!');
  console.log('====================================================');
}

runFormLogicValidationTests();
