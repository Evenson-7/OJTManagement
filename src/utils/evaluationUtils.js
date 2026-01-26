// src/pages/tabs/evaluationUtils.js

// --- CONSTANTS ---

export const ratingScale = [
    { value: "E", label: "Excellent", range: "90-100", score: 95, color: "green" },
    { value: "A", label: "Above Standard", range: "85-89", score: 87, color: "blue" },
    { value: "S", label: "Standard", range: "80-84", score: 82, color: "yellow" },
    { value: "N", label: "Needs Improvement", range: "75-79", score: 77, color: "orange" },
    { value: "P", label: "Poor", range: "below 75", score: 70, color: "red" }
];

export const badgeDefinitions = [
    // ... (Your badge definitions remain here) ...
];

export const evaluationSections = {
    behaviorAtWork: {
      title: "I. BEHAVIOR AT WORK",
      items: [
        { id: "attention", text: "Attention and concentration on tasks" },
        { id: "motivation", text: "Motivation and initiative" },
        { id: "responsibility", text: "Sense of responsibility" },
        { id: "perseverance", text: "Perseverance and diligence" },
        { id: "confidence", text: "Self-confidence" },
        { id: "cleanliness", text: "Cleanliness and orderliness of workplace" },
        { id: "quality", text: "Quality of work" },
        { id: "relationships", text: "Relationship with others" },
        { id: "attendance", text: "Attendance" }
      ]
    },
    academicPerformance: {
      title: "II. ACADEMIC PERFORMANCE",
      items: [
        { id: "speaking", text: "Communication Skills - Speaking" },
        { id: "writing", text: "Communication Skills - Writing" },
        { id: "listening", text: "Communication Skills - Listening" },
        { id: "reading", text: "Communication Skills - Reading" },
        { id: "knowledge", text: "Knowledge of assigned tasks" },
        { id: "research", text: "Updating and research performance" },
        { id: "learning", text: "Ability to learn" }
      ]
    },
    socialBehavior: {
      title: "III. SOCIAL BEHAVIOR",
      items: [
        { id: "leadership", text: "Leadership potential" },
        { id: "maturity", text: "Maturity" },
        { id: "concern", text: "Concern for others" },
        { id: "criticism", text: "Acceptance of criticism" },
        { id: "expression", text: "Ability to express feelings" },
        { id: "judgment", text: "Judgment" },
        { id: "dependability", text: "Dependability" },
        { id: "respect", text: "Respect for others" },
        { id: "integrity", text: "Integrity" }
      ]
    },
    personality: {
      title: "IV. PERSONALITY",
      items: [
        { id: "grooming", text: "Grooming and appearance" },
        { id: "posture", text: "Posture" },
        { id: "attire", text: "Appropriateness of attire" },
        { id: "manners", text: "Manners and conduct" },
        { id: "tact", text: "Tact" }
      ]
    },
    costConsciousness: {
      title: "V. COST CONSCIOUSNESS",
      items: [
        { id: "timeManagement", text: "Time management" },
        { id: "materials", text: "Economy on the use of materials" },
        { id: "resources", text: "Conservation of resources" }
      ]
    }
};

export const essayQuestions = [
    { id: "talents", question: "1. What do you think are the intern's talents or strengths?", placeholder: "Describe..." },
    { id: "enhancement", question: "2. What aspects of the intern do you think need enhancement?", placeholder: "Identify areas..." },
    { id: "suggestions", question: "3. What suggestions can you give to further improve the intern?", placeholder: "Provide specific..." },
    { id: "otherRemarks", question: "4. Other Remarks:", placeholder: "Additional comments..." }
];


// --- HELPERS & CALCULATORS ---

export const calculateSectionScore = (sectionData) => {
    if (!sectionData || typeof sectionData !== 'object') return 0;
    const ratings = Object.values(sectionData).filter(r => r);
    if (ratings.length === 0) return 0;
    const totalScore = ratings.reduce((sum, rating) => {
      const ratingObj = ratingScale.find(r => r.value === rating);
      return sum + (ratingObj?.score || 0);
    }, 0);
    return Math.round(totalScore / ratings.length);
};

export const calculateAllSectionScores = (evaluationData) => {
    if (!evaluationData) {
      return {
        behaviorAtWork: 0, academicPerformance: 0, socialBehavior: 0,
        personality: 0, costConsciousness: 0
      };
    }
    return {
      behaviorAtWork: calculateSectionScore(evaluationData.behaviorAtWork || {}),
      academicPerformance: calculateSectionScore(evaluationData.academicPerformance || {}),
      socialBehavior: calculateSectionScore(evaluationData.socialBehavior || {}),
      personality: calculateSectionScore(evaluationData.personality || {}),
      costConsciousness: calculateSectionScore(evaluationData.costConsciousness || {})
    };
};

export const calculateOverallScore = (evaluationData) => {
    if (!evaluationData) return 0;
    const sectionScores = evaluationData.sectionScores || calculateAllSectionScores(evaluationData);
    const sections = [
      { score: sectionScores.behaviorAtWork || 0, weight: 0.25 },
      { score: sectionScores.academicPerformance || 0, weight: 0.30 },
      { score: sectionScores.socialBehavior || 0, weight: 0.25 },
      { score: sectionScores.personality || 0, weight: 0.15 },
      { score: sectionScores.costConsciousness || 0, weight: 0.05 }
    ];
    let totalWeightedScore = 0;
    let totalWeight = 0;
    sections.forEach(section => {
      if (section.score > 0) {
        totalWeightedScore += section.score * section.weight;
        totalWeight += section.weight;
      }
    });
    return totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
};

export const getPerformanceRating = (score) => {
    if (score >= 95) return { label: "Outstanding", color: "text-green-700", bgColor: "bg-green-100", badge: "🌟" };
    if (score >= 90) return { label: "Excellent", color: "text-green-600", bgColor: "bg-green-100", badge: "🏆" };
    if (score >= 85) return { label: "Above Standard", color: "text-primary-600", bgColor: "bg-primary-100", badge: "⭐" };
    if (score >= 80) return { label: "Standard", color: "text-yellow-600", bgColor: "bg-yellow-100", badge: "✅" };
    if (score >= 75) return { label: "Needs Improvement", color: "text-orange-600", bgColor: "bg-orange-100", badge: "⚠️" };
    return { label: "Poor", color: "text-red-600", bgColor: "bg-red-100", badge: "❌" };
};

export const calculateConsistencyScore = (scores) => {
    if (scores.length < 2) return 100;
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    return Math.max(0, Math.round(100 - (standardDeviation * 2)));
};

export const getSectionIcon = (section) => {
    const icons = {
      behaviorAtWork: "💼", academicPerformance: "🎓", socialBehavior: "🤝",
      personality: "👤", costConsciousness: "💰"
    };
    return icons[section] || "📊";
};

export const getSectionSuggestions = (section) => {
    const suggestions = {
      behaviorAtWork: "Focus on time management and workplace organization skills",
      academicPerformance: "Enhance communication skills and task-specific knowledge",
      socialBehavior: "Develop leadership potential and teamwork abilities",
      personality: "Work on professional appearance and communication etiquette",
      costConsciousness: "Improve resource management and efficiency practices"
    };
    return suggestions[section] || "Continue developing skills in this area";
};

// --- ANALYTICS FUNCTIONS ---

export const calculateSupervisorAnalytics = (allEvaluations, assignedInterns) => {
    // ... (Your massive calculateSupervisorAnalytics function) ...
};

export const calculatePerformanceAnalytics = (userEvaluations, setPerformanceData) => {
    if (userEvaluations.length === 0) {
      setPerformanceData({
        overallTrend: [],
        sectionTrends: {
          behaviorAtWork: [], academicPerformance: [], socialBehavior: [],
          personality: [], costConsciousness: []
        },
        monthlyProgress: [], performanceInsights: {},
        improvementAreas: [], strengths: []
      });
      return;
    }

    // ... (Your massive calculatePerformanceAnalytics function) ...
};