export function matchJobsToProfile(profile, jobs) {
  const safeProfile = profile || {};

  const userSkills = new Set(
    (safeProfile.skills || []).map((s) => s.toLowerCase?.() || String(s).toLowerCase())
  );
  const userCerts = new Set(
    (safeProfile.certifications || []).map((c) => c.toLowerCase?.() || String(c).toLowerCase())
  );

  return (jobs || []).map((job) => {
    const requiredSkills = job.requiredSkills || [];
    const required = requiredSkills.map((s) => s.toLowerCase());
    const preferred = (job.preferredSkills || []).map((s) => s.toLowerCase());
    const jobCerts = (job.certifications || []).map((c) => c.toLowerCase());

    const requiredMatch = required.filter((s) => userSkills.has(s)).length;
    const preferredMatch = preferred.filter((s) => userSkills.has(s)).length;
    const certMatch = jobCerts.filter((c) =>
      [...userCerts].some((uc) => c.includes(uc) || uc.includes(c))
    ).length;

    const requiredTotal = required.length || 1;
    const matchScore =
      (requiredMatch / requiredTotal) * 60 +
      (preferredMatch / Math.max(preferred.length, 1)) * 25 +
      (certMatch / Math.max(jobCerts.length, 1)) * 15;

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
      missingSkills,
      missingCerts,
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}
