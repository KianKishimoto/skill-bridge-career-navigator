import { calculateMatchScore } from './matchScoring';

function normalizeText(value) {
  return (value || '').toString().trim().toLowerCase();
}

export function getGeneralRoleKey(title) {
  const normalized = normalizeText(title)
    .replace(/\b(jr\.?|junior|sr\.?|senior|lead|principal|staff)\b/g, '')
    .replace(/\b(i|ii|iii|iv|v|\d+)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized || normalizeText(title);
}

function toDisplayTitle(value) {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getAvailableGeneralRoles(jobs = []) {
  const grouped = jobs.reduce((acc, job) => {
    const key = getGeneralRoleKey(job.title);
    if (!key) return acc;
    if (!acc.has(key)) {
      acc.set(key, {
        key,
        label: toDisplayTitle(key),
        jobs: [],
      });
    }
    acc.get(key).jobs.push(job);
    return acc;
  }, new Map());

  return [...grouped.values()]
    .map((entry) => ({
      key: entry.key,
      label: entry.label,
      jobCount: entry.jobs.length,
      jobs: entry.jobs,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function buildAnalysis(profile, target, metadata = {}) {
  const userSkills = new Set((profile.skills || []).map((s) => normalizeText(s)));
  const userCerts = new Set((profile.certifications || []).map((c) => normalizeText(c)));

  const requiredSkills = (target.requiredSkills || []).map((s) => normalizeText(s));
  const preferredSkills = (target.preferredSkills || []).map((s) => normalizeText(s));
  const requiredCerts = (target.certifications || []).map((c) => normalizeText(c));

  const missingRequired = requiredSkills.filter((s) => !userSkills.has(s));
  const missingPreferred = preferredSkills.filter((s) => !userSkills.has(s));
  const missingCerts = requiredCerts.filter(
    (c) => ![...userCerts].some((uc) => c.includes(uc) || uc.includes(c))
  );

  const score = calculateMatchScore(profile, target);
  const matchedRequired = score.matchedRequired;
  const matchPercent = score.matchScore;

  return {
    targetRole: metadata.targetRole || target.title,
    targetCompany: metadata.targetCompany || target.company,
    matchPercent,
    missingSkills: [...new Set([...missingRequired, ...missingPreferred])],
    missingCertifications: [...new Set(missingCerts)],
    transferableSkills: [...new Set(matchedRequired)],
    suggestedFocus: [
      ...missingRequired.map((s) => ({ skill: s, priority: 'high' })),
      ...missingPreferred.map((s) => ({ skill: s, priority: 'medium' })),
    ],
    jobsCompared: metadata.jobsCompared || 1,
  };
}

export function analyzeRolePivot(profile, targetJob) {
  return buildAnalysis(profile, targetJob);
}

export function analyzeGeneralRolePivot(profile, jobs = [], generalRoleKey) {
  const roleJobs = jobs.filter((job) => getGeneralRoleKey(job.title) === generalRoleKey);
  if (!roleJobs.length) {
    return null;
  }

  const requiredSkillCounts = new Map();
  const preferredSkillCounts = new Map();
  const certCounts = new Map();

  roleJobs.forEach((job) => {
    (job.requiredSkills || []).forEach((skill) => {
      const key = normalizeText(skill);
      requiredSkillCounts.set(key, (requiredSkillCounts.get(key) || 0) + 1);
    });
    (job.preferredSkills || []).forEach((skill) => {
      const key = normalizeText(skill);
      preferredSkillCounts.set(key, (preferredSkillCounts.get(key) || 0) + 1);
    });
    (job.certifications || []).forEach((cert) => {
      const key = normalizeText(cert);
      certCounts.set(key, (certCounts.get(key) || 0) + 1);
    });
  });

  const sortByDemand = (a, b, counts) => counts.get(b) - counts.get(a) || a.localeCompare(b);
  const aggregateTarget = {
    requiredSkills: [...requiredSkillCounts.keys()].sort((a, b) => sortByDemand(a, b, requiredSkillCounts)),
    preferredSkills: [...preferredSkillCounts.keys()].sort((a, b) => sortByDemand(a, b, preferredSkillCounts)),
    certifications: [...certCounts.keys()].sort((a, b) => sortByDemand(a, b, certCounts)),
  };

  return buildAnalysis(profile, aggregateTarget, {
    targetRole: toDisplayTitle(generalRoleKey),
    targetCompany: `Across ${roleJobs.length} role listing${roleJobs.length === 1 ? '' : 's'}`,
    jobsCompared: roleJobs.length,
  });
}
