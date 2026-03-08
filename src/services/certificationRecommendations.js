export function recommendCertifications(profile, certifications, targetRole) {
  const userSkills = new Set(
    (profile.skills || []).map((s) => s.toLowerCase?.() || String(s).toLowerCase())
  );
  const userCerts = new Set(
    (profile.certifications || []).map((c) => c.toLowerCase?.() || String(c).toLowerCase())
  );

  const targetLower = (targetRole || '').toLowerCase();

  return certifications
    .filter((cert) => {
      const certName = cert.name.toLowerCase();
      const hasCert = [...userCerts].some((uc) => certName.includes(uc) || uc.includes(certName));
      if (hasCert) return false;

      const roleMatch =
        !targetLower ||
        (cert.relevanceRoles || []).some((r) => r.toLowerCase().includes(targetLower));

      return roleMatch;
    })
    .map((cert) => {
      const skillsCovered = cert.skillsCovered || [];
      const newSkills = skillsCovered.filter(
        (s) => !userSkills.has(s.toLowerCase?.() || String(s).toLowerCase())
      );
      const impactScore =
        newSkills.length * 15 +
        (cert.relevanceRoles || []).filter((r) =>
          targetLower ? r.toLowerCase().includes(targetLower) : true
        ).length * 10;

      return {
        ...cert,
        impactScore,
        newSkillsCovered: newSkills,
      };
    })
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 5);
}
