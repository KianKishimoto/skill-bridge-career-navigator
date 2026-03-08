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

  const weightedParts = [];

  if (requiredSkills.length > 0) {
    weightedParts.push({
      weight: 0.7,
      value: matchedRequired.length / requiredSkills.length,
    });
  }

  if (preferredSkills.length > 0) {
    weightedParts.push({
      weight: 0.2,
      value: matchedPreferred.length / preferredSkills.length,
    });
  }

  if (requiredCerts.length > 0) {
    weightedParts.push({
      weight: 0.1,
      value: matchedCerts.length / requiredCerts.length,
    });
  }

  const totalWeight = weightedParts.reduce((sum, part) => sum + part.weight, 0);
  const score = totalWeight
    ? (weightedParts.reduce((sum, part) => sum + part.weight * part.value, 0) / totalWeight) * 100
    : 0;

  return {
    matchScore: Math.round(score),
    matchedRequired,
    matchedPreferred,
    matchedCerts,
    requiredSkills,
    preferredSkills,
    requiredCerts,
  };
}

