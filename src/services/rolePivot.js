export function analyzeRolePivot(profile, targetJob) {
  const userSkills = new Set(
    (profile.skills || []).map((s) => s.toLowerCase?.() || String(s).toLowerCase())
  );
  const userCerts = new Set(
    (profile.certifications || []).map((c) => c.toLowerCase?.() || String(c).toLowerCase())
  );

  const requiredSkills = (targetJob.requiredSkills || []).map((s) => s.toLowerCase());
  const preferredSkills = (targetJob.preferredSkills || []).map((s) => s.toLowerCase());
  const requiredCerts = (targetJob.certifications || []).map((c) => c.toLowerCase());

  const missingRequired = requiredSkills.filter((s) => !userSkills.has(s));
  const missingPreferred = preferredSkills.filter((s) => !userSkills.has(s));
  const missingCerts = requiredCerts.filter(
    (c) => ![...userCerts].some((uc) => c.includes(uc) || uc.includes(c))
  );

  const matchedRequired = requiredSkills.filter((s) => userSkills.has(s));
  const matchPercent =
    requiredSkills.length > 0
      ? Math.round((matchedRequired.length / requiredSkills.length) * 100)
      : 0;

  return {
    targetRole: targetJob.title,
    targetCompany: targetJob.company,
    matchPercent,
    missingSkills: [...new Set([...missingRequired, ...missingPreferred])],
    missingCertifications: missingCerts,
    transferableSkills: matchedRequired,
    suggestedFocus: [
      ...missingRequired.map((s) => ({ skill: s, priority: 'high' })),
      ...missingPreferred.map((s) => ({ skill: s, priority: 'medium' })),
    ],
  };
}
