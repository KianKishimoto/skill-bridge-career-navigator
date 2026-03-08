import { calculateMatchScore } from './matchScoring';

function normalizeText(value) {
  return (value || '').toString().trim().toLowerCase();
}

export function matchJobsToProfile(profile, jobs) {
  return (jobs || []).map((job) => {
    const score = calculateMatchScore(profile || {}, job);

    const missingSkills = (job.requiredSkills || []).reduce((missing, skill) => {
      const normalizedSkill = normalizeText(skill);
      if (!normalizedSkill) {
        return missing;
      }

      if (!score.matchedRequired.includes(normalizedSkill)) {
        missing.push(skill?.toString?.().trim?.() || normalizedSkill);
      }

      return missing;
    }, []);
    const missingCerts = score.requiredCerts.filter(
      (requiredCert) => !score.matchedCerts.includes(requiredCert)
    );

    return {
      ...job,
      matchScore: score.matchScore,
      matchedSkills: score.matchedRequired.length,
      totalRequired: score.requiredSkills.length,
      preferredMatchedSkills: score.matchedPreferred.length,
      totalPreferred: score.preferredSkills.length,
      matchedCertifications: score.matchedCerts.length,
      totalCertifications: score.requiredCerts.length,
      missingSkills,
      missingCerts,
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

export function mergeAiJobMatchScores(baseMatches, aiMatches) {
  if (!Array.isArray(baseMatches) || !Array.isArray(aiMatches) || !aiMatches.length) {
    return baseMatches || [];
  }

  const aiByJobId = new Map(aiMatches.map((match) => [String(match.jobId), match]));

  return baseMatches
    .map((job) => {
      const ai = aiByJobId.get(String(job.id));
      if (!ai) {
        return {
          ...job,
          matchSource: 'fallback',
        };
      }

      return {
        ...job,
        aiMatchScore: ai.matchScore,
        aiInsights: {
          experienceScore: ai.experienceScore,
          skillsScore: ai.skillsScore,
          roleAlignmentScore: ai.roleAlignmentScore,
          reasoning: ai.reasoning,
        },
        matchSource: 'ai',
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
