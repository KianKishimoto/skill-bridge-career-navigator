function normalizeText(value) {
  return (value || '').toString().trim().toLowerCase();
}

function normalizeNonEmpty(values = []) {
  return values.map((value) => normalizeText(value)).filter(Boolean);
}

function hasCertMatch(requiredCert, userCerts) {
  return [...userCerts].some((userCert) => requiredCert.includes(userCert) || userCert.includes(requiredCert));
}

export function calculateMatchScore(profile = {}, target = {}) {
  const userSkills = new Set(normalizeNonEmpty(profile.skills || []));
  const userCerts = new Set(normalizeNonEmpty(profile.certifications || []));

  const requiredSkills = normalizeNonEmpty(target.requiredSkills || []);
  const preferredSkills = normalizeNonEmpty(target.preferredSkills || []);
  const requiredCerts = normalizeNonEmpty(target.certifications || []);

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
