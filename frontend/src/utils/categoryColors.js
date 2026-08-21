/**
 * Category & Brand Theme System
 * INNOVEXA — Premium Editorial Innovation Platform
 * 
 * Palette:
 * - Canvas Background: Warm Soft Ivory #F6F3EE
 * - Secondary Background: Soft Cream #EEE9E1
 * - Card Background: Warm White #FCFBF8
 * - Primary Text: Deep Charcoal #24242B
 * - Secondary Text: Muted Slate #6D6B73
 * - Dark Surface: #20212A
 * - Dark Secondary: #2B2D38
 * 
 * Modular Accents:
 * - Primary / Reviews: Coral Rose #E76F82, Light Coral #F3A3AD
 * - Products / Tech: Soft Periwinkle Blue #7186D8
 * - Ideas: Soft Lavender #9B8AE5
 * - Startups: Fresh Teal #58B8AD
 * - Community: Warm Apricot #F0A45D
 * - Insights: Rose Pink #D86B9A
 * - Success: Soft Green #69B89A
 * - Warning: Warm Amber #E9B45B
 * - Error: Muted Red #D96666
 */

export const BRAND_COLORS = {
  coral: '#E76F82',       // Primary Accent - Coral Rose
  lightCoral: '#F3A3AD',  // Light Coral
  lavender: '#9B8AE5',    // Ideas - Soft Lavender
  periwinkle: '#7186D8',  // Products - Soft Periwinkle Blue
  teal: '#58B8AD',        // Startups - Fresh Teal
  apricot: '#F0A45D',     // Community - Warm Apricot
  rosePink: '#D86B9A',    // Insights - Rose Pink
  green: '#69B89A',       // Success / Validated - Soft Green
  amber: '#E9B45B',       // Warning - Warm Amber
  red: '#D96666',         // Error - Muted Red
  
  // Base Surfaces & Inks
  base: '#F6F3EE',        // Warm Soft Ivory
  secondaryBase: '#EEE9E1', // Soft Cream
  surface: '#FCFBF8',     // Warm White
  darkSurface: '#20212A', // Dark Surface
  darkSecondary: '#2B2D38', // Dark Secondary
  textPrimary: '#24242B', // Deep Charcoal
  textSecondary: '#6D6B73', // Muted Slate
  border: 'rgba(36, 36, 43, 0.09)'
};

export const CATEGORY_INKS = {
  cat_ai: {
    id: 'cat_ai',
    name: 'AI & Machine Learning',
    hex: '#9B8AE5', // Soft Lavender
    lightBg: '#F5F2FC',
    glow: 'rgba(155, 138, 229, 0.25)',
    tagClass: 'tag-ink-ai',
    label: 'AI & Intelligence',
    concept: 'Neural Synthesis'
  },
  cat_devtools: {
    id: 'cat_devtools',
    name: 'Developer Tools & Infra',
    hex: '#7186D8', // Soft Periwinkle Blue
    lightBg: '#F0F3FC',
    glow: 'rgba(113, 134, 216, 0.25)',
    tagClass: 'tag-ink-devtools',
    label: 'DevTools & Infra',
    concept: 'Systems Architecture'
  },
  cat_health: {
    id: 'cat_health',
    name: 'Healthcare & Biotech',
    hex: '#58B8AD', // Fresh Teal
    lightBg: '#EEF8F6',
    glow: 'rgba(88, 184, 173, 0.25)',
    tagClass: 'tag-ink-health',
    label: 'Health & Bio',
    concept: 'Adaptive Wellbeing'
  },
  cat_environment: {
    id: 'cat_environment',
    name: 'CleanTech & Sustainability',
    hex: '#69B89A', // Soft Green
    lightBg: '#EFF7F3',
    glow: 'rgba(105, 184, 154, 0.25)',
    tagClass: 'tag-ink-environment',
    label: 'Sustainability',
    concept: 'Renewable Systems'
  },
  cat_edu: {
    id: 'cat_edu',
    name: 'EdTech & Learning',
    hex: '#F0A45D', // Warm Apricot
    lightBg: '#FDF6EE',
    glow: 'rgba(240, 164, 93, 0.25)',
    tagClass: 'tag-ink-edu',
    label: 'Education',
    concept: 'Knowledge Vectors'
  },
  cat_fintech: {
    id: 'cat_fintech',
    name: 'FinTech & Commerce',
    hex: '#7186D8', // Soft Periwinkle
    lightBg: '#F0F3FC',
    glow: 'rgba(113, 134, 216, 0.25)',
    tagClass: 'tag-ink-fintech',
    label: 'FinTech',
    concept: 'Decentralized Value'
  },
  cat_saas: {
    id: 'cat_saas',
    name: 'B2B SaaS & Enterprise',
    hex: '#D86B9A', // Rose Pink
    lightBg: '#FAF0F5',
    glow: 'rgba(216, 107, 154, 0.25)',
    tagClass: 'tag-ink-saas',
    label: 'Enterprise SaaS',
    concept: 'Modular Workflow'
  },
  cat_security: {
    id: 'cat_security',
    name: 'Cybersecurity & Privacy',
    hex: '#E76F82', // Coral Rose
    lightBg: '#FDF1F3',
    glow: 'rgba(231, 111, 130, 0.25)',
    tagClass: 'tag-ink-security',
    label: 'Security & Trust',
    concept: 'Zero-Trust Protocol'
  }
};

/**
 * Get category ink definition by ID or name
 */
export function getCategoryInk(categoryId, categoryName = '') {
  if (categoryId && CATEGORY_INKS[categoryId]) {
    return CATEGORY_INKS[categoryId];
  }

  const lower = (categoryName || '').toLowerCase();
  if (lower.includes('ai') || lower.includes('intelligence') || lower.includes('machine') || lower.includes('neural')) return CATEGORY_INKS.cat_ai;
  if (lower.includes('fintech') || lower.includes('finance') || lower.includes('crypto')) return CATEGORY_INKS.cat_fintech;
  if (lower.includes('health') || lower.includes('bio') || lower.includes('med')) return CATEGORY_INKS.cat_health;
  if (lower.includes('edu') || lower.includes('learn')) return CATEGORY_INKS.cat_edu;
  if (lower.includes('dev') || lower.includes('tool') || lower.includes('infra') || lower.includes('code')) return CATEGORY_INKS.cat_devtools;
  if (lower.includes('saas') || lower.includes('enterprise') || lower.includes('cloud')) return CATEGORY_INKS.cat_saas;
  if (lower.includes('clean') || lower.includes('green') || lower.includes('climate') || lower.includes('sustain')) return CATEGORY_INKS.cat_environment;
  if (lower.includes('security') || lower.includes('privacy') || lower.includes('cyber')) return CATEGORY_INKS.cat_security;

  return CATEGORY_INKS.cat_ai;
}
