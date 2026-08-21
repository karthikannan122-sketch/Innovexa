/**
 * Official Innovation Taxonomy Categories
 * Standard reference categories used for discipline selection and matchmaking.
 */
export const INITIAL_CATEGORIES = [
  {
    id: '93fe2938-c843-4fa4-8b01-b07d59990023',
    name: 'Technology',
    slug: 'technology',
    description: 'Autonomous agents, foundation models, perception pipelines, distributed web, and software systems.',
    icon: 'BrainCircuit',
    accentColor: '#9B8AE5' // Soft Lavender
  },
  {
    id: '9dbbcd45-778e-411c-92cc-debee85d7137',
    name: 'Education',
    slug: 'education',
    description: 'Adaptive learning environments, spatial comprehension tools, and pedagogical software.',
    icon: 'BookOpen',
    accentColor: '#7186D8' // Soft Periwinkle
  },
  {
    id: '19b552c7-2ed6-44fe-9846-5d1501b1104f',
    name: 'Healthcare',
    slug: 'healthcare',
    description: 'Clinical diagnostics, bioinformatics, patient experience systems, and medtech hardware.',
    icon: 'Activity',
    accentColor: '#D86B9A' // Rose Pink
  },
  {
    id: 'e6fa521c-f84c-42f6-9c7d-88447ee259cc',
    name: 'Business',
    slug: 'business',
    description: 'Early-stage venture discovery, product-market fit validation, fintech, and founder collaboration.',
    icon: 'Rocket',
    accentColor: '#E9B45B' // Warm Amber
  },
  {
    id: '913ce065-82bd-4101-a508-22bf41eaf0d5',
    name: 'Environment',
    slug: 'environment',
    description: 'Clean energy, carbon tracking, circular manufacturing, and regenerative bio-materials.',
    icon: 'Leaf',
    accentColor: '#69B89A' // Soft Green
  },
  {
    id: '3d3d928f-2a11-4639-83d5-865730960135',
    name: 'Social Impact',
    slug: 'social-impact',
    description: 'Civic technology, public goods funding, accessibility tools, and transparent governance.',
    icon: 'Globe',
    accentColor: '#58B8AD' // Fresh Teal
  }
];

// Two Curated Platform-Level Demo Projects (No demo users or fake personal activity)
export const INITIAL_FEATURED_DEMOS = [
  {
    id: 'demo_smartstudy_ai',
    title: 'SmartStudy AI',
    tagline: 'Turn scattered study material into a structured learning experience.',
    short_description: 'Turn scattered study material into a structured learning experience.',
    category_id: 'cat_education',
    category_name: 'Education',
    creation_type: 'IDEA',
    innovation_type: 'IDEA',
    project_stage: 'concept',
    development_stage: 'CONCEPT',
    status: 'UNDER_VALIDATION',
    launch_status: 'validating',
    is_demo: true,
    is_featured_example: true,
    demo_project_type: 'idea_example',
    demo_badge_label: 'FEATURED DEMO',
    problem_statement: 'Students use multiple sources for notes, videos, PDFs, and assignments, making learning fragmented and difficult to manage.',
    proposed_solution: 'A centralized intelligent study workspace that organizes learning materials and helps students follow a structured learning path.',
    target_users: 'College students, University students, Self-learners',
    description: 'Students often struggle to organize notes, identify important topics, and create effective study plans from large amounts of learning material. SmartStudy AI is a concept for a learning platform that helps students organize study resources, identify key concepts, generate personalized learning plans, and collect feedback on the usefulness of the learning experience.',
    features: [
      'Automated study planning based on syllabus schedules',
      'Intelligent cross-resource note organization',
      'AI-driven concept extraction & summaries',
      'Interactive progress tracking & spaced repetition cues'
    ],
    tags: ['Education', 'AI', 'Learning Workspace', 'Study Notes', 'Concept'],
    validation_target: 10,
    valid_reviews_count: 2,
    upvotes_count: 18,
    version: 1,
    has_live_product: false,
    website_url: null,
    demo_url: null,
    next_community_action: 'follow',
    user_id: 'platform_demo_desk',
    creator_name: 'INNOVEXA Editorial Desk',
    creator_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    created_at: new Date('2026-08-01T09:00:00Z').toISOString(),
    updated_at: new Date('2026-08-01T09:00:00Z').toISOString()
  },
  {
    id: 'demo_canva',
    title: 'Canva',
    tagline: 'A visual communication platform for creating designs, presentations, and digital content.',
    short_description: 'A visual communication platform for creating designs, presentations, and digital content.',
    category_id: 'cat_design',
    category_name: 'Design',
    creation_type: 'PRODUCT',
    innovation_type: 'PRODUCT',
    project_stage: 'live',
    development_stage: 'LIVE',
    status: 'PUBLISHED',
    launch_status: 'published',
    is_demo: true,
    is_featured_example: true,
    demo_project_type: 'product_example',
    demo_badge_label: 'FEATURED PRODUCT EXAMPLE',
    problem_statement: 'Traditional visual design tools required steep learning curves and heavy desktop hardware, locking non-designers out of creating professional digital content.',
    proposed_solution: 'An intuitive, accessible browser-based design ecosystem featuring collaborative templates, brand asset controls, and one-click multi-format export.',
    target_users: 'Designers, Marketers, Content Creators, Teams, Educators, Students',
    description: 'Canva is used as an example of a live digital product that allows users to explore how INNOVEXA displays an established product, its features, community discussion, and external launch destination.',
    features: [
      'Drag-and-drop graphic & presentation editor',
      '100M+ visual assets, fonts, and customizable templates',
      'Real-time multi-user team collaboration & brand kits',
      'Magic Studio AI generative tools',
      'Direct multi-channel web & print publishing'
    ],
    tags: ['Design', 'Productivity', 'Visual Communication', 'Creative Studio', 'Live Product'],
    validation_target: 10,
    valid_reviews_count: 8,
    upvotes_count: 54,
    version: 2,
    has_live_product: true,
    website_url: 'https://www.canva.com',
    demo_url: 'https://www.canva.com',
    next_community_action: 'follow',
    user_id: 'platform_demo_desk',
    creator_name: 'Canva (Product Specimen)',
    creator_avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100',
    published_at: new Date('2026-08-01T09:00:00Z').toISOString(),
    created_at: new Date('2026-08-01T09:00:00Z').toISOString(),
    updated_at: new Date('2026-08-01T09:00:00Z').toISOString()
  }
];

// 1. Core Real Users Sample Data
export const INITIAL_USERS = [
  {
    id: 'usr_karthick_founder',
    name: 'Karthick Founder',
    email: 'karthick@innovexa.io',
    password: 'Password123!',
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Karthick%20Founder&backgroundColor=20212a,e76f82,7186d8`,
    bio: 'Founder & AI Systems Architect building next-generation clinical diagnostic and decentralized intelligence platforms.',
    headline: 'Founder & AI Systems Architect',
    organization: 'INNOVEXA Systems & Labs',
    role: ['I CREATE IDEAS', 'FOUNDER'],
    interests: ['AI & MACHINE LEARNING', 'HEALTHCARE', 'WEB TECHNOLOGY'],
    skills: ['Autonomous AI', 'Edge Telemetry', 'Distributed Systems', 'React', 'Python'],
    preferred_domains: ['Healthcare', 'Artificial Intelligence', 'Web Technology'],
    credits: 140,
    reputation_score: 140,
    reputation_tier: 'TRUSTED CREATOR',
    onboarding_completed: true,
    created_at: new Date('2026-08-01T08:00:00Z').toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'usr_sarah_reviewer',
    name: 'Sarah Reviewer',
    email: 'sarah.reviewer@innovexa.io',
    password: 'Password123!',
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Sarah%20Reviewer&backgroundColor=20212a,58b8ad,9b8ae5`,
    bio: 'Senior Biomedical Systems Engineer & Peer Validator evaluating early-stage clinical telemetry and AI workflows.',
    headline: 'Senior Biomedical Systems Engineer & Validator',
    organization: 'Distributed Health Lab',
    role: ['I VALIDATE INNOVATIONS'],
    interests: ['AI & MACHINE LEARNING', 'HEALTHCARE', 'PRODUCTIVITY'],
    skills: ['Clinical Systems', 'HL7 FHIR', 'Signal Processing', 'Validation'],
    preferred_domains: ['Healthcare', 'AI & Machine Learning'],
    credits: 80,
    reputation_score: 80,
    reputation_tier: 'TRUSTED REVIEWER',
    onboarding_completed: true,
    created_at: new Date('2026-08-02T09:30:00Z').toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'usr_alex_validator',
    name: 'Alex Tech Validator',
    email: 'alex.validator@innovexa.io',
    password: 'Password123!',
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Alex%20Tech&backgroundColor=20212a,7186d8,69b89a`,
    bio: 'Full-Stack Distributed Systems Architect & Peer Reviewer focused on low-latency WebGPU routing and edge security.',
    headline: 'Distributed Systems Architect',
    organization: 'Open Matrix Institute',
    role: ['I VALIDATE INNOVATIONS'],
    interests: ['WEB TECHNOLOGY', 'CYBERSECURITY', 'AI & MACHINE LEARNING'],
    skills: ['WebGPU', 'P2P Networks', 'Zero-Knowledge Cryptography', 'Rust'],
    preferred_domains: ['Web Technology', 'Cybersecurity'],
    credits: 65,
    reputation_score: 65,
    reputation_tier: 'ACTIVE REVIEWER',
    onboarding_completed: true,
    created_at: new Date('2026-08-03T11:00:00Z').toISOString(),
    updated_at: new Date().toISOString()
  }
];

// 2. Real Project Specimens Created by User A (plus curated platform demos)
export const INITIAL_USER_PROJECTS = [
  {
    id: 'inno_pulsemind_ai',
    project_id: 'inno_pulsemind_ai',
    title: 'PulseMind Health AI',
    tagline: 'Autonomous multi-modal edge AI model for real-time cardiac triage and ECG telemetry.',
    short_description: 'Autonomous multi-modal edge AI model providing real-time rhythm triage, automated hazard alerts, and prioritized risk scores.',
    category_id: 'cat_health',
    category_name: 'Healthcare',
    creation_type: 'IDEA',
    innovation_type: 'IDEA',
    project_stage: 'idea',
    development_stage: 'CONCEPT',
    status: 'UNDER_VALIDATION',
    launch_status: 'validating',
    is_demo: false,
    is_featured_example: false,
    problem_statement: 'Cardiologists spend hours manually cross-referencing multi-lead ECGs and EHR histories, causing diagnostic delays during acute critical cardiac events.',
    proposed_solution: 'Autonomous multi-modal edge AI model providing real-time rhythm triage, automated ST-elevation hazard alerts, and prioritized risk scores.',
    target_users: 'Cardiologists, Emergency Physicians, Intensive Care Teams, Paramedics',
    features: [
      'Real-time multi-lead rhythm classification under 15ms',
      'Automated ST-elevation hazard alerts with high sensitivity',
      'HL7 FHIR & DICOM telemetry integration for hospital EHRs',
      'Edge offline inference capability for transport monitors'
    ],
    tags: ['Healthcare', 'AI', 'Cardiology', 'ECG', 'Telemetry', 'EdgeAI'],
    validation_target: 10,
    valid_reviews_count: 2,
    upvotes_count: 16,
    comments_count: 2,
    version: 1,
    has_live_product: false,
    website_url: null,
    demo_url: null,
    next_community_action: 'follow',
    user_id: 'usr_karthick_founder',
    creator_id: 'usr_karthick_founder',
    creator_name: 'Karthick Founder',
    creator_avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Karthick%20Founder&backgroundColor=20212a,e76f82,7186d8`,
    created_at: new Date('2026-08-10T10:00:00Z').toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'inno_neuromesh',
    project_id: 'inno_neuromesh',
    title: 'NeuroMesh Distributed Layer',
    tagline: 'Peer-to-peer federated neural routing layer utilizing local WebGPU acceleration.',
    short_description: 'Peer-to-peer federated neural routing layer utilizing local WebGPU acceleration on edge devices.',
    category_id: 'cat_ai',
    category_name: 'AI & Machine Learning',
    creation_type: 'PRODUCT',
    innovation_type: 'PRODUCT',
    project_stage: 'prototype',
    development_stage: 'PROTOTYPE',
    status: 'UNDER_VALIDATION',
    launch_status: 'validating',
    is_demo: false,
    is_featured_example: false,
    problem_statement: 'Centralized model inference faces heavy bandwidth bottlenecks, server costs, and privacy vulnerabilities during continuous real-time data streaming.',
    proposed_solution: 'Decentralized WebGPU-based peer tensor computation mesh enabling client devices to collaborate on localized inference tasks privately.',
    target_users: 'Edge AI Engineers, Robotics Developers, IoT System Architects',
    features: [
      'Zero-install WebGPU client neural pipeline',
      'Encrypted peer-to-peer gradient aggregation protocol',
      'Sub-10ms localized routing over WebRTC data channels',
      'Automatic fallback to quantization when resource-constrained'
    ],
    tags: ['AI', 'WebGPU', 'P2P', 'Edge', 'FederatedLearning', 'Decentralized'],
    validation_target: 10,
    valid_reviews_count: 1,
    upvotes_count: 11,
    comments_count: 1,
    version: 1,
    has_live_product: true,
    website_url: 'https://neuromesh.dev',
    demo_url: 'https://neuromesh.dev/demo',
    next_community_action: 'prototype',
    user_id: 'usr_karthick_founder',
    creator_id: 'usr_karthick_founder',
    creator_name: 'Karthick Founder',
    creator_avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Karthick%20Founder&backgroundColor=20212a,e76f82,7186d8`,
    created_at: new Date('2026-08-12T14:00:00Z').toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const INITIAL_INNOVATIONS = [
  ...INITIAL_USER_PROJECTS,
  ...INITIAL_FEATURED_DEMOS
];

// 3. Real Reviews Connecting User B & User C to User A's Projects
export const INITIAL_REVIEWS = [
  {
    id: 'rev_pulsemind_sarah',
    project_id: 'inno_pulsemind_ai',
    innovation_id: 'inno_pulsemind_ai',
    reviewer_id: 'usr_sarah_reviewer',
    reviewer_name: 'Sarah Reviewer',
    reviewer_avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Sarah%20Reviewer&backgroundColor=20212a,58b8ad,9b8ae5`,
    problem_relevance: 'YES',
    would_use: 'YES',
    rating: 5,
    overall_feedback: 'Exceptional clinical thesis. Diagnostic triage latency is a critical bottleneck in acute emergency cardiology, and automated ST-elevation classification directly addresses clinical fatigue.',
    suggestion: 'Ensure HL7 FHIR and DICOM telemetry export compliance is validated early, and prioritize zero-latency edge offline mode for transport monitors.',
    liked_features: 'Exceptional clinical thesis. Diagnostic triage latency is a critical bottleneck in acute emergency cardiology, and automated ST-elevation classification directly addresses clinical fatigue.',
    improvement_suggestions: 'Ensure HL7 FHIR and DICOM telemetry export compliance is validated early, and prioritize zero-latency edge offline mode for transport monitors.',
    solves_real_problem: 'YES',
    is_relevant: 'YES',
    review_status: 'VALID',
    created_at: new Date('2026-08-15T10:15:00Z').toISOString()
  },
  {
    id: 'rev_pulsemind_alex',
    project_id: 'inno_pulsemind_ai',
    innovation_id: 'inno_pulsemind_ai',
    reviewer_id: 'usr_alex_validator',
    reviewer_name: 'Alex Tech Validator',
    reviewer_avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Alex%20Tech&backgroundColor=20212a,7186d8,69b89a`,
    problem_relevance: 'YES',
    would_use: 'YES',
    rating: 4,
    overall_feedback: 'Impressive multi-modal telemetry processing. Edge execution minimizes cloud egress costs and prevents sensitive ECG data leakage.',
    suggestion: 'Implement an automated hardware disconnect failover logger in case wearable biosensors drop connectivity during waveform capture.',
    liked_features: 'Impressive multi-modal telemetry processing. Edge execution minimizes cloud egress costs and prevents sensitive ECG data leakage.',
    improvement_suggestions: 'Implement an automated hardware disconnect failover logger in case wearable biosensors drop connectivity during waveform capture.',
    solves_real_problem: 'YES',
    is_relevant: 'YES',
    review_status: 'VALID',
    created_at: new Date('2026-08-16T11:45:00Z').toISOString()
  },
  {
    id: 'rev_neuromesh_sarah',
    project_id: 'inno_neuromesh',
    innovation_id: 'inno_neuromesh',
    reviewer_id: 'usr_sarah_reviewer',
    reviewer_name: 'Sarah Reviewer',
    reviewer_avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Sarah%20Reviewer&backgroundColor=20212a,58b8ad,9b8ae5`,
    problem_relevance: 'YES',
    would_use: 'YES',
    rating: 5,
    overall_feedback: 'High-potential decentralized architecture. WebGPU execution for local tensor slicing makes edge devices truly autonomous without central compute dependence.',
    suggestion: 'Benchmark memory overhead on low-power ARM devices and document bandwidth usage during federated weight synchronization.',
    liked_features: 'High-potential decentralized architecture. WebGPU execution for local tensor slicing makes edge devices truly autonomous without central compute dependence.',
    improvement_suggestions: 'Benchmark memory overhead on low-power ARM devices and document bandwidth usage during federated weight synchronization.',
    solves_real_problem: 'YES',
    is_relevant: 'YES',
    review_status: 'VALID',
    created_at: new Date('2026-08-17T09:20:00Z').toISOString()
  }
];

// 4. Sample Assignments
export const INITIAL_ASSIGNMENTS = [
  {
    id: 'asgn_01_sarah_pulsemind',
    innovation_id: 'inno_pulsemind_ai',
    project_id: 'inno_pulsemind_ai',
    reviewer_id: 'usr_sarah_reviewer',
    title: 'PulseMind Health AI',
    category_name: 'Healthcare',
    match_score: 0.96,
    assignment_status: 'COMPLETED',
    created_at: new Date('2026-08-15T08:00:00Z').toISOString(),
    expires_at: new Date('2026-08-25T08:00:00Z').toISOString()
  },
  {
    id: 'asgn_02_sarah_smartstudy',
    innovation_id: 'demo_smartstudy_ai',
    project_id: 'demo_smartstudy_ai',
    reviewer_id: 'usr_sarah_reviewer',
    title: 'SmartStudy AI',
    category_name: 'Education',
    match_score: 0.88,
    assignment_status: 'ACTIVE',
    created_at: new Date('2026-08-18T08:00:00Z').toISOString(),
    expires_at: new Date('2026-08-28T08:00:00Z').toISOString()
  },
  {
    id: 'asgn_03_alex_pulsemind',
    innovation_id: 'inno_pulsemind_ai',
    project_id: 'inno_pulsemind_ai',
    reviewer_id: 'usr_alex_validator',
    title: 'PulseMind Health AI',
    category_name: 'Healthcare',
    match_score: 0.92,
    assignment_status: 'COMPLETED',
    created_at: new Date('2026-08-16T08:00:00Z').toISOString(),
    expires_at: new Date('2026-08-26T08:00:00Z').toISOString()
  }
];

// 5. Sample Community Comments
export const INITIAL_COMMENTS = [
  {
    id: 'comm_01_pulsemind',
    innovation_id: 'inno_pulsemind_ai',
    project_id: 'inno_pulsemind_ai',
    user_id: 'usr_sarah_reviewer',
    author_name: 'Sarah Reviewer',
    author_avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Sarah%20Reviewer&backgroundColor=20212a,58b8ad,9b8ae5`,
    content: 'Are you planning to test on PhysioNet PTB-XL ECG benchmark datasets for arrhythmia sensitivity evaluation?',
    created_at: new Date('2026-08-15T11:00:00Z').toISOString()
  },
  {
    id: 'comm_02_pulsemind_reply',
    innovation_id: 'inno_pulsemind_ai',
    project_id: 'inno_pulsemind_ai',
    user_id: 'usr_karthick_founder',
    author_name: 'Karthick Founder',
    author_avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Karthick%20Founder&backgroundColor=20212a,e76f82,7186d8`,
    content: 'Yes, exactly! PTB-XL and MIT-BIH Arrhythmia databases are our baseline validation training sets.',
    created_at: new Date('2026-08-15T11:45:00Z').toISOString()
  }
];

// 6. Sample Notifications for Creator User A
export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif_01_pulsemind_sarah',
    user_id: 'usr_karthick_founder',
    type: 'REVIEW_RECEIVED',
    message: 'Sarah Reviewer published a 5-star validation review on "PulseMind Health AI".',
    innovation_id: 'inno_pulsemind_ai',
    project_id: 'inno_pulsemind_ai',
    review_id: 'rev_pulsemind_sarah',
    is_read: false,
    read: false,
    created_at: new Date('2026-08-15T10:15:00Z').toISOString()
  },
  {
    id: 'notif_02_pulsemind_alex',
    user_id: 'usr_karthick_founder',
    type: 'REVIEW_RECEIVED',
    message: 'Alex Tech Validator published a review on "PulseMind Health AI".',
    innovation_id: 'inno_pulsemind_ai',
    project_id: 'inno_pulsemind_ai',
    review_id: 'rev_pulsemind_alex',
    is_read: false,
    read: false,
    created_at: new Date('2026-08-16T11:45:00Z').toISOString()
  },
  {
    id: 'notif_03_neuromesh_sarah',
    user_id: 'usr_karthick_founder',
    type: 'REVIEW_RECEIVED',
    message: 'Sarah Reviewer published a review on "NeuroMesh Distributed Layer".',
    innovation_id: 'inno_neuromesh',
    project_id: 'inno_neuromesh',
    review_id: 'rev_neuromesh_sarah',
    is_read: true,
    read: true,
    created_at: new Date('2026-08-17T09:20:00Z').toISOString()
  }
];

// 7. Initial Upvotes
export const INITIAL_UPVOTES = [
  'usr_sarah_reviewer_inno_pulsemind_ai',
  'usr_alex_validator_inno_pulsemind_ai',
  'usr_sarah_reviewer_inno_neuromesh'
];

// ============================================================================
// 8. INITIAL EXTERNAL INNOVATION DISCOVERIES (Discovered Signals)
// ============================================================================
export const INITIAL_EXTERNAL_SOURCES = [
  {
    id: 'src_sciencedaily_ai',
    name: 'ScienceDaily AI',
    url: 'https://www.sciencedaily.com/rss/computers_math/artificial_intelligence.xml',
    feed_type: 'RSS',
    category_hint: 'Artificial Intelligence',
    is_enabled: true,
    last_status: 'SUCCESS',
    last_fetched_at: new Date('2026-08-20T06:00:00Z').toISOString(),
    items_count: 14
  },
  {
    id: 'src_sciencedaily_health',
    name: 'ScienceDaily Health & Biotech',
    url: 'https://www.sciencedaily.com/rss/health_medicine.xml',
    feed_type: 'RSS',
    category_hint: 'Healthcare',
    is_enabled: true,
    last_status: 'SUCCESS',
    last_fetched_at: new Date('2026-08-20T06:00:00Z').toISOString(),
    items_count: 12
  },
  {
    id: 'src_sciencedaily_robotics',
    name: 'ScienceDaily Robotics',
    url: 'https://www.sciencedaily.com/rss/computers_math/robotics.xml',
    feed_type: 'RSS',
    category_hint: 'Robotics',
    is_enabled: true,
    last_status: 'SUCCESS',
    last_fetched_at: new Date('2026-08-20T06:00:00Z').toISOString(),
    items_count: 10
  },
  {
    id: 'src_mit_tech_review',
    name: 'MIT Technology Review',
    url: 'https://www.technologyreview.com/feed/',
    feed_type: 'RSS',
    category_hint: 'Artificial Intelligence',
    is_enabled: true,
    last_status: 'SUCCESS',
    last_fetched_at: new Date('2026-08-20T06:00:00Z').toISOString(),
    items_count: 15
  },
  {
    id: 'src_arxiv_ai',
    name: 'ArXiv AI Research',
    url: 'https://rss.arxiv.org/rss/cs.AI',
    feed_type: 'RSS',
    category_hint: 'Artificial Intelligence',
    is_enabled: true,
    last_status: 'SUCCESS',
    last_fetched_at: new Date('2026-08-20T06:00:00Z').toISOString(),
    items_count: 18
  },
  {
    id: 'src_nasa_tech',
    name: 'NASA Open Source & Tech Transfer',
    url: 'https://github.com/nasa',
    feed_type: 'OPEN_API',
    category_hint: 'Space Technology',
    is_enabled: true,
    last_status: 'SUCCESS',
    last_fetched_at: new Date('2026-08-20T06:00:00Z').toISOString(),
    items_count: 24
  },
  {
    id: 'src_eu_cordis',
    name: 'EU CORDIS Horizon Research',
    url: 'https://cordis.europa.eu/projects/en',
    feed_type: 'OPEN_DATA',
    category_hint: 'Cybersecurity',
    is_enabled: true,
    last_status: 'SUCCESS',
    last_fetched_at: new Date('2026-08-20T06:00:00Z').toISOString(),
    items_count: 19
  }
];

export const INITIAL_EXTERNAL_INNOVATIONS = [
  {
    id: 'ext_nasa_openmct_07',
    title: 'NASA Open MCT: Next-Generation Mission Control & Data Visualization Framework',
    summary: 'NASA Open MCT (Mission Control Technologies) is an open-source data visualization suite built for desktop and mobile mission planning. It provides a flexible telemetry integration engine used by NASA for rover operations, satellite data streaming, and mission analytics.',
    ai_summary: 'NASA Open MCT (Mission Control Technologies) is an open-source data visualization suite built for desktop and mobile mission planning. It provides a flexible telemetry integration engine used by NASA for rover operations, satellite data streaming, and mission analytics.',
    source_name: 'NASA Open Source & Tech Transfer',
    source_url: 'https://github.com/nasa/openmct',
    category: 'Space Technology',
    tags: ['NASA', 'Telemetry', 'MissionControl', 'OpenSource', 'SpaceTech'],
    content_hash: '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
    is_active: true,
    is_external: true,
    likes_count: 142,
    views_count: 1250,
    published_at: new Date('2026-08-19T08:00:00Z').toISOString(),
    discovered_at: new Date('2026-08-19T09:00:00Z').toISOString(),
    created_at: new Date('2026-08-19T09:00:00Z').toISOString(),
    updated_at: new Date('2026-08-19T09:00:00Z').toISOString()
  },
  {
    id: 'ext_nasa_cfs_08',
    title: 'NASA Core Flight System (cFS): Reusable Spacecraft Flight Software Architecture',
    summary: 'The NASA Core Flight System is a platform-independent, reusable flight software development environment and application suite used for flagship spaceflight instruments and autonomous satellite control architectures.',
    ai_summary: 'The NASA Core Flight System is a platform-independent, reusable flight software development environment and application suite used for flagship spaceflight instruments and autonomous satellite control architectures.',
    source_name: 'NASA Open Source & Tech Transfer',
    source_url: 'https://github.com/nasa/cFS',
    category: 'Space Technology',
    tags: ['NASA', 'FlightSoftware', 'Spacecraft', 'EmbeddedSystems', 'AutonomousControl'],
    content_hash: '8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c',
    is_active: true,
    is_external: true,
    likes_count: 98,
    views_count: 940,
    published_at: new Date('2026-08-18T10:00:00Z').toISOString(),
    discovered_at: new Date('2026-08-18T11:30:00Z').toISOString(),
    created_at: new Date('2026-08-18T11:30:00Z').toISOString(),
    updated_at: new Date('2026-08-18T11:30:00Z').toISOString()
  },
  {
    id: 'ext_eu_cordis_quantum_09',
    title: 'EU Horizon Research: Fault-Tolerant Quantum Cryptographic Protocols for Distributed Infrastructure',
    summary: 'European Commission CORDIS research program develops post-quantum cryptographic primitives and hardware security modules to protect European electrical grids and financial transaction clearing networks against quantum decoherence attacks.',
    ai_summary: 'European Commission CORDIS research program develops post-quantum cryptographic primitives and hardware security modules to protect European electrical grids and financial transaction clearing networks against quantum decoherence attacks.',
    source_name: 'EU CORDIS Horizon Research',
    source_url: 'https://cordis.europa.eu/projects/en',
    category: 'Cybersecurity',
    tags: ['EURunResearch', 'QuantumComputing', 'PostQuantum', 'Cryptography', 'GridSecurity'],
    content_hash: '9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d',
    is_active: true,
    is_external: true,
    likes_count: 76,
    views_count: 610,
    published_at: new Date('2026-08-17T13:00:00Z').toISOString(),
    discovered_at: new Date('2026-08-17T14:30:00Z').toISOString(),
    created_at: new Date('2026-08-17T14:30:00Z').toISOString(),
    updated_at: new Date('2026-08-17T14:30:00Z').toISOString()
  },
  {
    id: 'ext_nasa_techport_energy_10',
    title: 'NASA TechPort: Solid-State Lithium-Sulfur Batteries for Aviation & Deep Space (SABERS)',
    summary: 'NASAs Solid-state Architecture Batteries for Enhanced Rechargeability and Safety (SABERS) project demonstrates sulfur-selenium battery cells achieving 500 Wh/kg energy density with zero thermal runaway propagation.',
    ai_summary: 'NASAs Solid-state Architecture Batteries for Enhanced Rechargeability and Safety (SABERS) project demonstrates sulfur-selenium battery cells achieving 500 Wh/kg energy density with zero thermal runaway propagation.',
    source_name: 'NASA Open Source & Tech Transfer',
    source_url: 'https://techport.nasa.gov',
    category: 'Sustainability',
    tags: ['NASA', 'SolidStateBattery', 'CleanEnergy', 'Aviation', 'MaterialsScience'],
    content_hash: '0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e',
    is_active: true,
    is_external: true,
    likes_count: 115,
    views_count: 1080,
    published_at: new Date('2026-08-16T15:00:00Z').toISOString(),
    discovered_at: new Date('2026-08-16T16:00:00Z').toISOString(),
    created_at: new Date('2026-08-16T16:00:00Z').toISOString(),
    updated_at: new Date('2026-08-16T16:00:00Z').toISOString()
  },
  {
    id: 'ext_dna_memory_01',
    title: 'Scientists turn DNA into a memory device that uses 100x less power',
    summary: 'Researchers demonstrate a pioneering molecular compute paradigm that utilizes synthetic DNA strands as non-volatile memory cells. The molecular architecture achieves 100x lower energy dissipation compared to silicon NAND flash while preserving data density at nanoscale biological dimensions.',
    ai_summary: 'Researchers demonstrate a pioneering molecular compute paradigm that utilizes synthetic DNA strands as non-volatile memory cells. The molecular architecture achieves 100x lower energy dissipation compared to silicon NAND flash while preserving data density at nanoscale biological dimensions.',
    source_name: 'ScienceDaily AI',
    source_url: 'https://www.sciencedaily.com/releases/2026/08/260819142010.htm',
    category: 'Artificial Intelligence',
    tags: ['SyntheticBiology', 'MolecularComputing', 'LowPower', 'Nanotechnology', 'DNAStorage'],
    content_hash: '9f8b7a6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a',
    is_active: true,
    is_external: true,
    likes_count: 38,
    views_count: 245,
    published_at: new Date('2026-08-19T14:20:00Z').toISOString(),
    discovered_at: new Date('2026-08-19T16:00:00Z').toISOString(),
    created_at: new Date('2026-08-19T16:00:00Z').toISOString(),
    updated_at: new Date('2026-08-19T16:00:00Z').toISOString()
  },
  {
    id: 'ext_fiber_optic_silicon_02',
    title: 'Caltech breakthrough brings fiber-optic performance to silicon microchips',
    summary: 'Integrated nanophotonic lasers fabricated directly onto standard CMOS silicon wafers allow optical interconnect speeds exceeding 4 Terabits per second. This eliminates copper interconnect resistance bottlenecks for high-throughput AI transformer clusters and distributed edge computing nodes.',
    ai_summary: 'Integrated nanophotonic lasers fabricated directly onto standard CMOS silicon wafers allow optical interconnect speeds exceeding 4 Terabits per second. This eliminates copper interconnect resistance bottlenecks for high-throughput AI transformer clusters and distributed edge computing nodes.',
    source_name: 'ScienceDaily Technology',
    source_url: 'https://www.sciencedaily.com/releases/2026/08/260818113000.htm',
    category: 'Web Technology',
    tags: ['Photonics', 'SiliconPhotonics', 'Semiconductors', 'Hardware', 'HighSpeedIO'],
    content_hash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    is_active: true,
    is_external: true,
    likes_count: 54,
    views_count: 412,
    published_at: new Date('2026-08-18T11:30:00Z').toISOString(),
    discovered_at: new Date('2026-08-18T13:00:00Z').toISOString(),
    created_at: new Date('2026-08-18T13:00:00Z').toISOString(),
    updated_at: new Date('2026-08-18T13:00:00Z').toISOString()
  },
  {
    id: 'ext_intrabodies_alzheimer_03',
    title: 'AI-designed "intrabodies" could unlock new intracellular treatments for neurodegeneration',
    summary: 'Structural generative diffusion models engineered intracellular antibodies capable of penetrating the blood-brain barrier and selectively neutralizing toxic protein aggregates in neuronal cells before synaptic apoptosis occurs.',
    ai_summary: 'Structural generative diffusion models engineered intracellular antibodies capable of penetrating the blood-brain barrier and selectively neutralizing toxic protein aggregates in neuronal cells before synaptic apoptosis occurs.',
    source_name: 'ScienceDaily Health & Biotech',
    source_url: 'https://www.sciencedaily.com/releases/2026/08/260817094500.htm',
    category: 'Healthcare',
    tags: ['Biotech', 'DrugDiscovery', 'GenerativeAI', 'Neuroscience', 'Therapeutics'],
    content_hash: '2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
    is_active: true,
    is_external: true,
    likes_count: 47,
    views_count: 320,
    published_at: new Date('2026-08-17T09:45:00Z').toISOString(),
    discovered_at: new Date('2026-08-17T12:00:00Z').toISOString(),
    created_at: new Date('2026-08-17T12:00:00Z').toISOString(),
    updated_at: new Date('2026-08-17T12:00:00Z').toISOString()
  },
  {
    id: 'ext_reasoning_collusion_04',
    title: 'Position: Collusion Risks Among AI Reasoning Agents Justify Autonomous Certification',
    summary: 'A new ArXiv research paper examines game-theoretic equilibrium shifts when autonomous multi-agent reasoning models interact in high-frequency financial and resource allocation environments, recommending formal verifiable safety certificates.',
    ai_summary: 'A new ArXiv research paper examines game-theoretic equilibrium shifts when autonomous multi-agent reasoning models interact in high-frequency financial and resource allocation environments, recommending formal verifiable safety certificates.',
    source_name: 'ArXiv AI Research',
    source_url: 'https://arxiv.org/abs/2608.18125',
    category: 'Artificial Intelligence',
    tags: ['AIAlignment', 'AutonomousAgents', 'GameTheory', 'Safety', 'MultiAgent'],
    content_hash: '3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
    is_active: true,
    is_external: true,
    likes_count: 62,
    views_count: 530,
    published_at: new Date('2026-08-16T18:00:00Z').toISOString(),
    discovered_at: new Date('2026-08-16T19:30:00Z').toISOString(),
    created_at: new Date('2026-08-16T19:30:00Z').toISOString(),
    updated_at: new Date('2026-08-16T19:30:00Z').toISOString()
  },
  {
    id: 'ext_mit_ai_self_improvement_05',
    title: 'Self-Improvement Paradigms in Autonomous Foundation Models',
    summary: 'MIT Technology Review analyzes recursive self-correction mechanisms in next-generation frontier reasoning models, evaluating recursive synthesis bounds and hallucination decay across sequential reasoning iterations.',
    ai_summary: 'MIT Technology Review analyzes recursive self-correction mechanisms in next-generation frontier reasoning models, evaluating recursive synthesis bounds and hallucination decay across sequential reasoning iterations.',
    source_name: 'MIT Technology Review',
    source_url: 'https://www.technologyreview.com/2026/08/15/1098765/ai-self-improvement-paradigms/',
    category: 'Artificial Intelligence',
    tags: ['FrontierAI', 'ReasoningModels', 'SyntheticData', 'MachineLearning'],
    content_hash: '4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
    is_active: true,
    is_external: true,
    likes_count: 89,
    views_count: 870,
    published_at: new Date('2026-08-15T15:00:00Z').toISOString(),
    discovered_at: new Date('2026-08-15T16:00:00Z').toISOString(),
    created_at: new Date('2026-08-15T16:00:00Z').toISOString(),
    updated_at: new Date('2026-08-15T16:00:00Z').toISOString()
  },
  {
    id: 'ext_soft_robotics_hydrogel_06',
    title: 'Hydrogel-Based Soft Actuators Enable Microscopic Surgical Dexterity',
    summary: 'Bio-compatible hydrogel actuators powered by localized ionic gradients achieve sub-millimeter precision in micro-surgical maneuvers, bypassing mechanical motor limitations in minimally invasive procedures.',
    ai_summary: 'Bio-compatible hydrogel actuators powered by localized ionic gradients achieve sub-millimeter precision in micro-surgical maneuvers, bypassing mechanical motor limitations in minimally invasive procedures.',
    source_name: 'ScienceDaily Robotics',
    source_url: 'https://www.sciencedaily.com/releases/2026/08/260814101500.htm',
    category: 'Robotics',
    tags: ['SoftRobotics', 'SurgicalRobotics', 'Hydrogels', 'BioEngineering', 'Sensors'],
    content_hash: '5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
    is_active: true,
    is_external: true,
    likes_count: 31,
    views_count: 198,
    published_at: new Date('2026-08-14T10:15:00Z').toISOString(),
    discovered_at: new Date('2026-08-14T11:00:00Z').toISOString(),
    created_at: new Date('2026-08-14T11:00:00Z').toISOString(),
    updated_at: new Date('2026-08-14T11:00:00Z').toISOString()
  }
];

// ============================================================================
// 9. INITIAL COMMUNITY DISCUSSIONS / POSTS
// ============================================================================
export const INITIAL_COMMUNITY_POSTS = [
  {
    id: 'post_01_neuromorphic_scaling',
    user_id: 'usr_karthick_founder',
    author_name: 'Karthick Founder',
    author_avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Karthick%20Founder&backgroundColor=20212a,e76f82,7186d8',
    author_headline: 'Founder & AI Systems Architect',
    title: 'How can we solve spiking neural network synchronization across distributed edge hardware?',
    content: 'We are observing intermittent phase lag when distributing event-driven spiking neural networks across sub-watt IoT sensor nodes. Has anyone explored asynchronous clockless neuromorphic meshes or biological phase-locking models to eliminate clock drift?',
    post_type: 'QUESTION', // 'QUESTION' | 'DISCUSSION' | 'FEEDBACK_REQUEST' | 'COLLABORATION' | 'CHALLENGE'
    category_id: 'cat_ai',
    category_name: 'AI & Machine Learning',
    tags: ['Neuromorphic', 'EdgeComputing', 'Hardware', 'Sensors'],
    upvotes_count: 18,
    downvotes_count: 1,
    comments_count: 4,
    created_at: new Date('2026-08-18T09:30:00Z').toISOString(),
    updated_at: new Date('2026-08-18T09:30:00Z').toISOString()
  },
  {
    id: 'post_02_clinical_validation',
    user_id: 'usr_sarah_reviewer',
    author_name: 'Sarah Reviewer',
    author_avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Sarah%20Reviewer&backgroundColor=20212a,58b8ad,9b8ae5',
    author_headline: 'Biomedical Signal Validation Lead',
    title: 'Benchmarking AI diagnostic telemetry against PhysioNet PTB-XL datasets',
    content: 'Sharing our framework for validating ECG diagnostic algorithms before moving to real clinical trials. We found that synthetic data augmentation causes false positives in subtle QT prolongation detection.',
    post_type: 'DISCUSSION',
    category_id: 'cat_health',
    category_name: 'Healthcare & Biotech',
    tags: ['Cardiology', 'Biomarkers', 'ClinicalTrial', 'FDA'],
    upvotes_count: 24,
    downvotes_count: 0,
    comments_count: 6,
    created_at: new Date('2026-08-17T14:15:00Z').toISOString(),
    updated_at: new Date('2026-08-17T14:15:00Z').toISOString()
  },
  {
    id: 'post_03_aeroponic_feedback',
    user_id: 'usr_elena_agritech',
    author_name: 'Elena Rostova',
    author_avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Elena%20Rostova&backgroundColor=20212a,69b89a,e9b45b',
    author_headline: 'Agritech & Urban Systems Engineer',
    title: 'Seeking feedback on ultrasonic aeroponic nozzle nutrient clogging detection algorithm',
    content: 'We developed an acoustic resonance sensor that detects nutrient salt buildup in aeroponic root chambers 48 hours before nozzle blockage occurs. Looking for greenhouse engineers to review our data curves.',
    post_type: 'FEEDBACK_REQUEST',
    category_id: 'cat_sustainability',
    category_name: 'Sustainability',
    tags: ['Aeroponics', 'Agriculture', 'AcousticSensors', 'IoT'],
    upvotes_count: 15,
    downvotes_count: 0,
    comments_count: 2,
    created_at: new Date('2026-08-19T11:00:00Z').toISOString(),
    updated_at: new Date('2026-08-19T11:00:00Z').toISOString()
  }
];

// ============================================================================
// 10. INITIAL COMMUNITY POST COMMENTS
// ============================================================================
export const INITIAL_COMMUNITY_COMMENTS = [
  {
    id: 'c_comm_01_post1',
    post_id: 'post_01_neuromorphic_scaling',
    user_id: 'usr_sarah_reviewer',
    author_name: 'Sarah Reviewer',
    author_avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Sarah%20Reviewer&backgroundColor=20212a,58b8ad,9b8ae5',
    content: 'Take a look at Poisson event routing using asynchronous handshake protocols (like 4-phase dual-rail signaling). It avoids the global clock bottleneck completely.',
    upvotes_count: 9,
    downvotes_count: 0,
    created_at: new Date('2026-08-18T10:15:00Z').toISOString()
  },
  {
    id: 'c_comm_02_post1_reply',
    post_id: 'post_01_neuromorphic_scaling',
    user_id: 'usr_karthick_founder',
    author_name: 'Karthick Founder',
    author_avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Karthick%20Founder&backgroundColor=20212a,e76f82,7186d8',
    content: 'Great pointer, Sarah! We are testing dual-rail asynchronous encoders now with promising 4x power reductions.',
    upvotes_count: 5,
    downvotes_count: 0,
    created_at: new Date('2026-08-18T11:00:00Z').toISOString()
  }
];

// ============================================================================
// 11. INITIAL COMMUNITY RESOURCES
// ============================================================================
export const INITIAL_COMMUNITY_RESOURCES = [
  {
    id: 'res_01_physionet_ecg',
    user_id: 'usr_sarah_reviewer',
    author_name: 'Sarah Reviewer',
    title: 'PhysioNet PTB-XL ECG Diagnostic Benchmark Dataset',
    description: 'Comprehensive clinical dataset of 21,837 clinical 12-lead ECG records from 18,885 patients, essential for validating cardiology neural architectures.',
    resource_url: 'https://physionet.org/content/ptb-xl/1.0.3/',
    resource_type: 'DATASET', // 'TOOL' | 'ARTICLE' | 'RESEARCH' | 'GITHUB' | 'API' | 'DATASET' | 'VIDEO' | 'COURSE' | 'OTHER'
    category_id: 'cat_health',
    category_name: 'Healthcare & Biotech',
    tags: ['Cardiology', 'ECG', 'ClinicalData', 'Benchmark'],
    upvotes_count: 32,
    downvotes_count: 0,
    bookmarks_count: 14,
    created_at: new Date('2026-08-16T12:00:00Z').toISOString()
  },
  {
    id: 'res_02_tonic_spiking',
    user_id: 'usr_karthick_founder',
    author_name: 'Karthick Founder',
    title: 'Tonic: Neuromorphic Event-Based Data Library for PyTorch',
    description: 'High-performance streaming data loaders and transformations for neuromorphic sensors (DVS, silicon cochlea) compatible with PyTorch Geometric.',
    resource_url: 'https://github.com/neuromorphs/tonic',
    resource_type: 'GITHUB',
    category_id: 'cat_ai',
    category_name: 'AI & Machine Learning',
    tags: ['Neuromorphic', 'PyTorch', 'EventCamera', 'OpenSource'],
    upvotes_count: 45,
    downvotes_count: 1,
    bookmarks_count: 28,
    created_at: new Date('2026-08-17T09:00:00Z').toISOString()
  },
  {
    id: 'res_03_zero_trust_mesh',
    user_id: 'usr_marcus_cyber',
    author_name: 'Marcus Vance',
    title: 'NIST Zero Trust Architecture Core Implementation Guidelines (SP 800-207)',
    description: 'Official technical specification for developing cryptographically isolated communication planes between autonomous IoT sensor swarms.',
    resource_url: 'https://csrc.nist.gov/publications/detail/sp/800-207/final',
    resource_type: 'RESEARCH',
    category_id: 'cat_security',
    category_name: 'Cybersecurity',
    tags: ['ZeroTrust', 'NIST', 'Cryptography', 'Protocols'],
    upvotes_count: 19,
    downvotes_count: 0,
    bookmarks_count: 8,
    created_at: new Date('2026-08-18T16:30:00Z').toISOString()
  }
];

// ============================================================================
// 12. INITIAL UNIFIED VOTES
// ============================================================================
export const INITIAL_VOTES = [
  {
    id: 'vote_01',
    user_id: 'usr_sarah_reviewer',
    target_type: 'review',
    target_id: 'rev_pulsemind_sarah',
    vote_type: 'upvote',
    created_at: new Date('2026-08-16T10:00:00Z').toISOString()
  },
  {
    id: 'vote_02',
    user_id: 'usr_alex_validator',
    target_type: 'review',
    target_id: 'rev_pulsemind_sarah',
    vote_type: 'upvote',
    created_at: new Date('2026-08-16T12:00:00Z').toISOString()
  },
  {
    id: 'vote_03',
    user_id: 'usr_karthick_founder',
    target_type: 'discussion',
    target_id: 'post_02_clinical_validation',
    vote_type: 'upvote',
    created_at: new Date('2026-08-17T15:00:00Z').toISOString()
  },
  {
    id: 'vote_04',
    user_id: 'usr_karthick_founder',
    target_type: 'resource',
    target_id: 'res_01_physionet_ecg',
    vote_type: 'upvote',
    created_at: new Date('2026-08-16T14:00:00Z').toISOString()
  }
];
