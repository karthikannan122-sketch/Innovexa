import { StorageService } from './storage.js';

/**
 * INNOVEXA AI Service
 * Core capabilities:
 * 1. AI Idea Analyzer & Readiness Score (Feature 1 & Feature 7)
 * 2. Smart Tag Generation (Feature 2)
 * 3. Similar Project Discovery (Feature 3)
 * 4. AI Review Questions (Feature 4)
 * 5. AI Feedback Summary (Feature 5)
 * 6. Project Improvement Assistant (Feature 6)
 * 7. Smart Project Description Assistant (Feature 8)
 * 8. AI-Powered Personalized Discovery (Feature 9)
 */

// Helper to call Gemini API if key is present
async function callGeminiJson(prompt, systemInstruction) {
  const apiKey = StorageService.getGeminiApiKey();
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemInstruction}\n\n${prompt}` }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('[Gemini API non-200 status]:', response.status);
      return null;
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    try {
      return JSON.parse(candidateText);
    } catch {
      const match = candidateText.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      return null;
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('[Gemini API exception]:', err.message);
    return null;
  }
}

export const AIService = {
  // =========================================================================
  // 1. AI IDEA ANALYZER & READINESS SCORE (Feature 1 & 7)
  // =========================================================================
  async analyzeIdea(projectData, availableCategories = []) {
    const title = projectData.title || 'Untitled Specimen';
    const description = projectData.description || projectData.short_description || projectData.problem_statement || '';
    const problem = projectData.problem_statement || '';
    const solution = projectData.proposed_solution || '';
    const targetUsers = projectData.target_users || '';
    const projectType = projectData.project_type || projectData.creation_type || 'idea';

    // 1. Try Gemini AI
    const systemPrompt = `You are an elite venture innovation evaluator for early-stage ideas and products.
Analyze the innovation concept and return a valid JSON object matching this schema:
{
  "summary": "Concise 2-sentence summary of the concept",
  "problem_clarity": {
    "score": number (0-20),
    "level": "High" | "Moderate" | "Needs Refinement",
    "explanation": "Short critique of problem definition"
  },
  "solution_clarity": {
    "score": number (0-20),
    "level": "High" | "Moderate" | "Needs Refinement",
    "explanation": "Short critique of solution clarity"
  },
  "target_audience": "Specific identified target users and beneficiaries",
  "innovation_potential": {
    "level": "High" | "Moderate" | "Emerging",
    "explanation": "Market impact and uniqueness evaluation"
  },
  "key_strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "potential_gaps": ["Gap or risk 1", "Gap or risk 2"],
  "improvement_suggestions": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "suggested_category": {
    "name": "Category Name from available categories",
    "reason": "Why this category fits best"
  },
  "readiness_score": {
    "total": number (0-100),
    "breakdown": {
      "problem_clarity": number (0-20),
      "solution_clarity": number (0-20),
      "target_audience": number (0-15),
      "implementation_details": number (0-15),
      "uniqueness": number (0-15),
      "completeness": number (0-15)
    }
  }
}`;

    const userPrompt = `Innovation Title: ${title}
Project Type: ${projectType}
Description: ${description}
Problem Statement: ${problem}
Proposed Solution: ${solution}
Target Users: ${targetUsers}
Available Categories: ${availableCategories.map(c => c.name).join(', ')}`;

    const geminiResult = await callGeminiJson(userPrompt, systemPrompt);
    if (geminiResult && geminiResult.summary && geminiResult.readiness_score) {
      return {
        ...geminiResult,
        generated_by: 'GEMINI_AI',
        generated_at: new Date().toISOString()
      };
    }

    // 2. Resilient Rule-Based Fallback Engine
    const wordCount = description.split(/\s+/).filter(Boolean).length;
    const hasProblem = problem.trim().length > 10;
    const hasSolution = solution.trim().length > 10;
    const hasTarget = targetUsers.trim().length > 5;

    let probScore = hasProblem ? 18 : Math.min(20, Math.max(10, Math.round(wordCount * 0.4)));
    let solScore = hasSolution ? 17 : Math.min(20, Math.max(10, Math.round(wordCount * 0.35)));
    let audScore = hasTarget ? 13 : 9;
    let impScore = projectData.launch_url || projectData.features?.length > 0 ? 12 : 8;
    let uniqScore = title.length > 5 ? 12 : 9;
    let compScore = (hasProblem && hasSolution && hasTarget) ? 14 : 10;

    const totalReadiness = probScore + solScore + audScore + impScore + uniqScore + compScore;

    // Auto-detect best matching category from keywords
    const lowerText = `${title} ${description} ${problem} ${solution}`.toLowerCase();
    let matchedCat = availableCategories[0] || { name: 'Technology', id: '93fe2938-c843-4fa4-8b01-b07d59990023' };
    
    if (lowerText.includes('health') || lowerText.includes('med') || lowerText.includes('ecg') || lowerText.includes('patient') || lowerText.includes('bio') || lowerText.includes('doctor')) {
      const h = availableCategories.find(c => c.name.toLowerCase().includes('health'));
      if (h) matchedCat = h;
    } else if (lowerText.includes('carbon') || lowerText.includes('eco') || lowerText.includes('green') || lowerText.includes('sustain') || lowerText.includes('solar') || lowerText.includes('climate')) {
      const e = availableCategories.find(c => c.name.toLowerCase().includes('environment'));
      if (e) matchedCat = e;
    } else if (lowerText.includes('learn') || lowerText.includes('school') || lowerText.includes('student') || lowerText.includes('teach') || lowerText.includes('course') || lowerText.includes('study')) {
      const ed = availableCategories.find(c => c.name.toLowerCase().includes('education'));
      if (ed) matchedCat = ed;
    } else if (lowerText.includes('fintech') || lowerText.includes('bank') || lowerText.includes('payment') || lowerText.includes('market') || lowerText.includes('saas') || lowerText.includes('b2b')) {
      const b = availableCategories.find(c => c.name.toLowerCase().includes('business'));
      if (b) matchedCat = b;
    }

    return {
      summary: `${title} is a ${projectType} focusing on ${description.slice(0, 100) || 'solving key community workflows through specialized automation'}.`,
      problem_clarity: {
        score: probScore,
        level: probScore >= 16 ? 'High' : (probScore >= 12 ? 'Moderate' : 'Needs Refinement'),
        explanation: hasProblem ? 'Clear articulation of the pain point with verifiable scope.' : 'Problem definition is present but could benefit from quantifiable metric baselines.'
      },
      solution_clarity: {
        score: solScore,
        level: solScore >= 15 ? 'High' : 'Moderate',
        explanation: hasSolution ? 'Proposed architecture outlines a direct technical and workflow remedy.' : 'Solution workflow is outlined; recommend adding concrete feature milestones.'
      },
      target_audience: targetUsers || 'Early-adopter professionals, industry operators, and collaborative innovation teams.',
      innovation_potential: {
        level: totalReadiness >= 75 ? 'High' : 'Moderate',
        explanation: 'Addresses a verified friction area with strong productization leverage.'
      },
      key_strengths: [
        'Direct problem-solution alignment with clear utility',
        'Target domain has identifiable validation opportunities',
        'Modular feature scope allows for rapid iterative prototyping'
      ],
      potential_gaps: [
        'Clarify regulatory, data acquisition, or API dependency constraints',
        'Specify initial user acquisition channel or validation cohort size'
      ],
      improvement_suggestions: [
        'Define a measurable key result (e.g. 30% reduction in turnaround time)',
        'Gather structured peer validator feedback from domain specialists on INNOVEXA',
        'Include live demo endpoints or prototype links to accelerate validation'
      ],
      suggested_category: {
        id: matchedCat.id,
        name: matchedCat.name,
        reason: `Keyword analysis indicates strong affinity with ${matchedCat.name} innovation patterns.`
      },
      readiness_score: {
        total: totalReadiness,
        breakdown: {
          problem_clarity: probScore,
          solution_clarity: solScore,
          target_audience: audScore,
          implementation_details: impScore,
          uniqueness: uniqScore,
          completeness: compScore
        }
      },
      generated_by: 'HEURISTIC_AI',
      generated_at: new Date().toISOString()
    };
  },

  // =========================================================================
  // 2. SMART TAG GENERATION (Feature 2)
  // =========================================================================
  async generateTags(projectData) {
    const title = projectData.title || '';
    const desc = projectData.description || projectData.short_description || projectData.problem_statement || '';
    const categoryName = projectData.category_name || '';

    const systemPrompt = `Extract 4 to 6 concise, modern, relevant taxonomy tags for this project.
Return ONLY valid JSON in format: { "tags": ["Tag1", "Tag2", "Tag3", "Tag4"] }`;
    const userPrompt = `Title: ${title}\nCategory: ${categoryName}\nDescription: ${desc}`;

    const geminiResult = await callGeminiJson(userPrompt, systemPrompt);
    if (geminiResult && Array.isArray(geminiResult.tags) && geminiResult.tags.length > 0) {
      return geminiResult.tags.slice(0, 6);
    }

    // Heuristic Fallback
    const tags = new Set();
    const text = `${title} ${desc} ${categoryName}`.toLowerCase();

    if (text.includes('ai') || text.includes('ml') || text.includes('machine learning') || text.includes('model') || text.includes('neural')) {
      tags.add('AI & Machine Learning');
      tags.add('Automation');
    }
    if (text.includes('health') || text.includes('medical') || text.includes('cardio') || text.includes('ecg') || text.includes('patient')) {
      tags.add('Healthcare');
      tags.add('Clinical Validation');
    }
    if (text.includes('carbon') || text.includes('climate') || text.includes('sustain') || text.includes('eco') || text.includes('green')) {
      tags.add('CleanTech');
      tags.add('Sustainability');
    }
    if (text.includes('web') || text.includes('app') || text.includes('cloud') || text.includes('saas') || text.includes('platform')) {
      tags.add('Cloud Platform');
      tags.add('SaaS');
    }
    if (text.includes('data') || text.includes('analytics') || text.includes('telemetry') || text.includes('insight')) {
      tags.add('Data Analytics');
    }
    if (categoryName) {
      tags.add(categoryName);
    }

    tags.add('Innovation');

    return Array.from(tags).slice(0, 6);
  },

  // =========================================================================
  // 3. SIMILAR PROJECT DISCOVERY (Feature 3)
  // =========================================================================
  findSimilarProjects(currentProject, allProjects = []) {
    if (!currentProject || !Array.isArray(allProjects) || allProjects.length === 0) {
      return [];
    }

    const currentId = currentProject.id;
    const currentCat = currentProject.category_id || currentProject.category_name || '';
    const currentType = (currentProject.project_type || currentProject.creation_type || 'idea').toLowerCase();
    const currentCorpus = `${currentProject.title || ''} ${currentProject.description || ''} ${currentProject.short_description || ''} ${currentProject.problem_statement || ''} ${currentProject.proposed_solution || ''} ${currentProject.category_name || ''}`;
    const currentWords = new Set(
      currentCorpus
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 3)
    );

    const candidates = allProjects
      .filter(p => p.id !== currentId && (p.status === 'published' || p.status === 'under_validation' || !p.status))
      .map(p => {
        let score = 0;
        const reasons = [];

        // Category match (+35%)
        if (p.category_id && currentCat && (p.category_id === currentCat || p.category_name === currentCat)) {
          score += 35;
          reasons.push(`both in ${p.category_name || 'the same category'}`);
        } else if (p.category_name && currentProject.category_name && p.category_name.toLowerCase() === currentProject.category_name.toLowerCase()) {
          score += 35;
          reasons.push(`both in ${p.category_name}`);
        }

        // Project type match (+15%)
        const pType = (p.project_type || p.creation_type || 'idea').toLowerCase();
        if (pType === currentType) {
          score += 15;
          reasons.push(`both are ${pType} stage specimens`);
        }

        // Keyword overlap (+50% max)
        const pCorpus = `${p.title || ''} ${p.description || ''} ${p.short_description || ''} ${p.problem_statement || ''} ${p.proposed_solution || ''} ${p.category_name || ''}`;
        const pWords = pCorpus
          .toLowerCase()
          .replace(/[^a-z0-9 ]/g, ' ')
          .split(/\s+/)
          .filter(w => w.length >= 3);

        let overlapCount = 0;
        pWords.forEach(w => {
          if (currentWords.has(w)) overlapCount++;
        });

        const overlapScore = Math.min(50, overlapCount * 8);
        score += overlapScore;

        if (overlapCount > 0) {
          reasons.push(`share ${overlapCount} core concept keywords`);
        }

        // Base relevance floor
        const percentage = Math.min(96, Math.max(55, Math.round(score)));
        const reasonText = reasons.length > 0
          ? `Related because ${reasons.join(' and ')}.`
          : `Related through shared platform innovation taxonomy.`;

        return {
          ...p,
          similarity_score: percentage,
          similarity_reason: reasonText
        };
      })
      .sort((a, b) => b.similarity_score - a.similarity_score);

    return candidates.slice(0, 4);
  },

  // =========================================================================
  // 4. AI REVIEW QUESTIONS (Feature 4)
  // =========================================================================
  async generateReviewQuestions(projectData) {
    const title = projectData.title || 'Specimen';
    const category = projectData.category_name || 'Technology';
    const desc = projectData.description || projectData.short_description || '';
    const pType = projectData.project_type || projectData.creation_type || 'idea';

    const systemPrompt = `You are designing 4 targeted, insightful validation review questions for a peer reviewer evaluating this project on INNOVEXA.
Return ONLY valid JSON: { "questions": ["Question 1", "Question 2", "Question 3", "Question 4"] }`;
    const userPrompt = `Project: ${title}\nCategory: ${category}\nType: ${pType}\nDescription: ${desc}`;

    const geminiResult = await callGeminiJson(userPrompt, systemPrompt);
    if (geminiResult && Array.isArray(geminiResult.questions) && geminiResult.questions.length >= 3) {
      return geminiResult.questions.slice(0, 5);
    }

    // Heuristic Fallback based on category and type
    const lower = `${title} ${desc} ${category}`.toLowerCase();
    const questions = [
      `How clearly does "${title}" define its core user pain point compared to existing alternatives?`,
      `Does the proposed implementation approach appear technically feasible and scalable?`
    ];

    if (lower.includes('health') || lower.includes('med') || lower.includes('patient') || lower.includes('doctor')) {
      questions.push(`What is the biggest regulatory or clinical data validation challenge this project will encounter?`);
      questions.push(`Would clinical practitioners or health consumers realistically adopt this workflow in practice?`);
    } else if (lower.includes('ai') || lower.includes('machine learning') || lower.includes('model')) {
      questions.push(`What is the proprietary advantage or uniqueness of the underlying AI model/architecture?`);
      questions.push(`How will edge performance, latency, or API token cost impact user adoption?`);
    } else if (lower.includes('carbon') || lower.includes('eco') || lower.includes('sustain')) {
      questions.push(`How verifiable and audit-proof is the environmental tracking methodology?`);
      questions.push(`What enterprise or consumer incentive model drives sustained engagement?`);
    } else {
      questions.push(`What specific feature or differentiator would make this idea significantly more compelling?`);
      questions.push(`Would you personally consider using or recommending this solution?`);
    }

    return questions;
  },

  // =========================================================================
  // 5. AI FEEDBACK SUMMARY & PRIORITY ACTIONS (Feature 5)
  // =========================================================================
  async generateFeedbackSummary(project, reviews = []) {
    if (!reviews || reviews.length === 0) {
      return {
        needsMoreReviews: true,
        message: 'More community feedback is needed to generate a meaningful AI insight report.',
        reviewsCount: 0
      };
    }

    const title = project.title || 'Project';
    const desc = project.description || project.short_description || '';

    const reviewTexts = reviews.map((r, idx) => 
      `Review ${idx + 1}: Rating ${r.rating || 5}/5 | Relevance: ${r.problem_relevance || 'YES'} | Would Use: ${r.would_use}\n` +
      `Feedback: ${r.overall_feedback || r.liked_features || 'N/A'}\n` +
      `Suggestions: ${r.suggestion || r.improvement_suggestions || 'N/A'}`
    ).join('\n\n');

    const systemPrompt = `Analyze the provided real user reviews for this innovation.
Return ONLY valid JSON matching this schema:
{
  "sentiment": "Positive" | "Mixed" | "Needs Improvement",
  "strengths": ["Key strength 1", "Key strength 2", "Key strength 3"],
  "concerns": ["Key concern 1", "Key concern 2", "Key concern 3"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "priority_actions": {
    "high": "Single most critical high-priority action",
    "medium": "Important medium-priority improvement",
    "low": "Nice-to-have low-priority polish"
  },
  "summary": "Executive 2-paragraph summary synthesizing validator consensus"
}`;

    const userPrompt = `Project: ${title}\nDescription: ${desc}\n\nReal User Reviews (${reviews.length} total):\n${reviewTexts}`;

    const geminiResult = await callGeminiJson(userPrompt, systemPrompt);
    if (geminiResult && geminiResult.sentiment && geminiResult.priority_actions) {
      return {
        ...geminiResult,
        needsMoreReviews: false,
        reviewsCount: reviews.length,
        generated_by: 'GEMINI_AI',
        generated_at: new Date().toISOString()
      };
    }

    // Heuristic Feedback Summary
    let totalScore = 0;
    let wouldUseCount = 0;
    const strengths = [];
    const concerns = [];

    reviews.forEach(r => {
      totalScore += Number(r.rating || 4);
      if (r.would_use === true || r.would_use === 'YES') wouldUseCount++;
      if (r.overall_feedback) strengths.push(r.overall_feedback.trim());
      if (r.suggestion) concerns.push(r.suggestion.trim());
    });

    const avgRating = (totalScore / reviews.length).toFixed(1);
    const wouldUsePct = Math.round((wouldUseCount / reviews.length) * 100);

    let sentiment = 'Mixed';
    if (wouldUsePct >= 65 && Number(avgRating) >= 3.8) sentiment = 'Positive';
    else if (wouldUsePct < 40 || Number(avgRating) < 3.0) sentiment = 'Needs Improvement';

    const topStrengths = strengths.slice(0, 3).map(s => s.replace(/\.$/, ''));
    if (topStrengths.length === 0) {
      topStrengths.push('Identifies a clear real-world user friction area', 'Strong conceptual foundation with practical upside');
    }

    const topConcerns = concerns.slice(0, 3).map(c => c.replace(/\.$/, ''));
    if (topConcerns.length === 0) {
      topConcerns.push('Provide more specific technical architecture milestones', 'Clarify target user acquisition and deployment roadmap');
    }

    return {
      needsMoreReviews: false,
      reviewsCount: reviews.length,
      sentiment,
      strengths: topStrengths,
      concerns: topConcerns,
      recommendations: [
        `Address top reviewer feedback: "${topConcerns[0] || 'Refine initial feature specification'}"`,
        `Capitalize on recognized strength: "${topStrengths[0] || 'Expand core value proposition'}"`
      ],
      priority_actions: {
        high: `Clarify the technical methodology for "${topConcerns[0] || 'core solution execution'}"`,
        medium: 'Add visual workflow diagrams or prototype demos to accelerate reviewer validation',
        low: 'Refine branding and documentation clarity in the specimen overview'
      },
      summary: `Community consensus for "${title}" reflects an overall ${sentiment.toLowerCase()} trajectory across ${reviews.length} validator submissions with an average rating of ${avgRating}/5.0 and ${wouldUsePct}% adoption readiness.`,
      generated_by: 'HEURISTIC_AI',
      generated_at: new Date().toISOString()
    };
  },

  // =========================================================================
  // 6. PROJECT IMPROVEMENT ASSISTANT (Feature 6)
  // =========================================================================
  async generateImprovementPlan(project, reviews = []) {
    const title = project.title || 'Project';
    const desc = project.description || project.short_description || '';
    const category = project.category_name || 'Technology';

    const systemPrompt = `You are a startup incubator advisor. Formulate an actionable 5-pillar improvement plan for this project.
Return ONLY valid JSON matching this schema:
{
  "clarity": "Specific guidance on improving description and problem definition",
  "feasibility": "Actionable feedback on addressing implementation and technical hurdles",
  "differentiation": "How to stand out from existing and competing solutions",
  "user_value": "How to sharpen direct user value delivery and onboarding",
  "next_steps": ["Action 1", "Action 2", "Action 3", "Action 4"]
}`;

    const userPrompt = `Project: ${title}\nCategory: ${category}\nDescription: ${desc}\nExisting Review Count: ${reviews.length}`;

    const geminiResult = await callGeminiJson(userPrompt, systemPrompt);
    if (geminiResult && geminiResult.clarity && Array.isArray(geminiResult.next_steps)) {
      return {
        ...geminiResult,
        generated_by: 'GEMINI_AI',
        generated_at: new Date().toISOString()
      };
    }

    // Heuristic Improvement Plan
    return {
      clarity: `Structure the overview into three distinct pillars: 1) The exact pain point, 2) The unique solution mechanism, 3) The measurable outcome for the user.`,
      feasibility: `Break down development into 2-week validation milestones, establishing MVP feature boundaries before building secondary modules.`,
      differentiation: `Highlight your proprietary approach or proprietary data integration that sets "${title}" apart from incumbent tools in ${category}.`,
      user_value: `Quantify the time or cost savings delivered to early adopters (e.g. "Saves 4 hours weekly on manual triage").`,
      next_steps: [
        'Incorporate reviewer feedback into the revised project description',
        'Deploy an interactive demo or prototype URL for live validation',
        'Publish the updated specimen v1.1 on INNOVEXA to trigger peer re-validation',
        'Engage directly with validators in the project discussion ledger'
      ],
      generated_by: 'HEURISTIC_AI',
      generated_at: new Date().toISOString()
    };
  },

  // =========================================================================
  // 7. SMART PROJECT DESCRIPTION ASSISTANT (Feature 8)
  // =========================================================================
  async improveDescription(originalText, title = '', categoryName = '') {
    if (!originalText || originalText.trim().length < 5) {
      return {
        original: originalText || '',
        suggested: originalText || '',
        improvements: ['Please provide a description first to analyze.']
      };
    }

    const systemPrompt = `Improve this project description for an innovation platform. 
Enhance clarity, professional impact, and readability while faithfully preserving the original meaning.
Return ONLY valid JSON:
{
  "suggested": "Polished, compelling description",
  "improvements": ["Highlight 1", "Highlight 2"]
}`;

    const userPrompt = `Title: ${title}\nCategory: ${categoryName}\nOriginal Description:\n${originalText}`;

    const geminiResult = await callGeminiJson(userPrompt, systemPrompt);
    if (geminiResult && geminiResult.suggested) {
      return {
        original: originalText,
        suggested: geminiResult.suggested,
        improvements: geminiResult.improvements || ['Enhanced clarity and value proposition framing'],
        generated_by: 'GEMINI_AI'
      };
    }

    // Heuristic Polish
    const cleaned = originalText
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/([a-z])\.\s*([a-z])/gi, '$1. $2');

    const firstSentence = cleaned.split(/[.!?]/)[0] || cleaned;
    const suggested = `${cleaned.charAt(0).toUpperCase() + cleaned.slice(1)} This solution empowers users through streamlined workflows, verifiable outcomes, and scalable architecture.`;

    return {
      original: originalText,
      suggested: suggested,
      improvements: [
        'Enhanced value proposition clarity',
        'Standardized sentence structure for executive readability'
      ],
      generated_by: 'HEURISTIC_AI'
    };
  },

  // =========================================================================
  // 8. AI-POWERED PERSONALIZED DISCOVERY (Feature 9)
  // =========================================================================
  getPersonalizedRecommendations(currentUser, allProjects = [], userLikes = []) {
    if (!currentUser || !Array.isArray(allProjects) || allProjects.length === 0) {
      return allProjects.slice(0, 4);
    }

    const userInterests = new Set((currentUser.interests || []).map(i => String(i).toLowerCase()));
    const userDisciplines = new Set((currentUser.preferred_domains || []).map(d => String(d).toLowerCase()));
    const likedProjectIds = new Set((userLikes || []).map(l => l.project_id || l.id));

    // Calculate affinity score for each project
    const scored = allProjects
      .filter(p => p.user_id !== currentUser.id && p.creator_id !== currentUser.id)
      .map(p => {
        let affinity = 0;
        const reasons = [];

        const catLower = (p.category_name || '').toLowerCase();
        if (userInterests.has(catLower) || Array.from(userInterests).some(i => catLower.includes(i))) {
          affinity += 40;
          reasons.push(`matches your interest in ${p.category_name}`);
        }

        if (userDisciplines.has(catLower) || Array.from(userDisciplines).some(d => catLower.includes(d))) {
          affinity += 30;
          reasons.push(`aligns with your expertise`);
        }

        if (likedProjectIds.has(p.id)) {
          affinity += 10;
        }

        // Higher engagement bonus
        const reviewsCount = Number(p.valid_reviews_count || 0);
        const upvotesCount = Number(p.upvotes_count || 0);
        affinity += Math.min(20, reviewsCount * 3 + upvotesCount * 2);

        return {
          ...p,
          recommendation_score: affinity,
          recommendation_reason: reasons.length > 0 ? reasons.join(' and ') : 'trending in community discovery'
        };
      })
      .sort((a, b) => b.recommendation_score - a.recommendation_score);

    return scored.slice(0, 4);
  }
};
