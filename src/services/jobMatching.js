const normalizeStringArray = (items) => (
  (Array.isArray(items) ? items : [])
    .map((item) => (item ?? '').toString().trim())
    .filter(Boolean)
);

export function matchJobsToProfile(profile, jobs) {
  const safeProfile = profile || {};

  const userSkills = new Set(
    normalizeStringArray(safeProfile.skills).map((s) => s.toLowerCase())
  );
  const userCerts = new Set(
    normalizeStringArray(safeProfile.certifications).map((c) => c.toLowerCase())
  );

  return (jobs || []).map((job) => {
    const requiredSkills = normalizeStringArray(job?.requiredSkills);
    const required = requiredSkills.map((s) => s.toLowerCase());
    const preferred = normalizeStringArray(job?.preferredSkills).map((s) => s.toLowerCase());
    const jobCerts = normalizeStringArray(job?.certifications).map((c) => c.toLowerCase());

    const requiredMatch = required.filter((s) => userSkills.has(s)).length;
    const preferredMatch = preferred.filter((s) => userSkills.has(s)).length;
    const certMatch = jobCerts.filter((c) =>
      [...userCerts].some((uc) => c.includes(uc) || uc.includes(c))
    ).length;

    const requiredTotal = required.length || 1;
    // Keep Job Matches % aligned with Role Pivot's required-skills match percentage.
    const matchScore = (requiredMatch / requiredTotal) * 100;

    const missingSkills = requiredSkills.filter(
      (skill) => !userSkills.has(skill.toLowerCase())
    );
    const missingCerts = jobCerts.filter(
      (c) => ![...userCerts].some((uc) => c.includes(uc) || uc.includes(c))
    );

    return {
      ...job,
      matchScore: Math.round(matchScore),
      matchedSkills: requiredMatch,
      totalRequired: required.length,
      preferredMatchedSkills: preferredMatch,
      totalPreferred: preferred.length,
      matchedCertifications: certMatch,
      totalCertifications: jobCerts.length,
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
        matchScore: ai.matchScore,
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
