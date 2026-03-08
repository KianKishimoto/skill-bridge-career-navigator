function normalizeText(value) {
  return (value || '').toString().trim().toLowerCase();
}

function hasCertMatch(requiredCert, userCerts) {
  return [...userCerts].some((userCert) => requiredCert.includes(userCert) || userCert.includes(requiredCert));
}

export function calculateMatchScore(profile = {}, target = {}) {
  const userSkills = new Set((profile.skills || []).map((s) => normalizeText(s)));
  const userCerts = new Set((profile.certifications || []).map((c) => normalizeText(c)));

  const requiredSkills = (target.requiredSkills || []).map((s) => normalizeText(s));
  const preferredSkills = (target.preferredSkills || []).map((s) => normalizeText(s));
  const requiredCerts = (target.certifications || []).map((c) => normalizeText(c));

  const matchedRequired = requiredSkills.filter((s) => userSkills.has(s));
  const matchedPreferred = preferredSkills.filter((s) => userSkills.has(s));
  const matchedCerts = requiredCerts.filter((c) => hasCertMatch(c, userCerts));

  const matchScore = requiredSkills.length
    ? Math.round((matchedRequired.length / requiredSkills.length) * 100)
    : 0;

  return {
    matchScore,
    matchedRequired,
    matchedPreferred,
    matchedCerts,
    requiredSkills,
    preferredSkills,
    requiredCerts,
  };
}
