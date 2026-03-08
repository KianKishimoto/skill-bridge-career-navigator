import { describe, it, expect } from 'vitest';
import { matchJobsToProfile, mergeAiJobMatchScores } from './jobMatching';

const mockJobs = [
  {
    id: 'j1',
    title: 'Cloud Engineer',
    requiredSkills: ['AWS', 'Python', 'Docker'],
    preferredSkills: ['Kubernetes'],
    certifications: ['AWS Certified'],
  },
  {
    id: 'j2',
    title: 'Data Engineer',
    requiredSkills: ['Python', 'SQL', 'Spark'],
    preferredSkills: ['Airflow'],
    certifications: [],
  },
];

describe('matchJobsToProfile', () => {
  it('returns jobs sorted by match score with correct missing skills (happy path)', () => {
    const profile = {
      skills: ['AWS', 'Python', 'Docker'],
      certifications: ['AWS Certified'],
    };
    const result = matchJobsToProfile(profile, mockJobs);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('j1');
    expect(result[0].matchScore).toBeGreaterThanOrEqual(result[1].matchScore);
    expect(result[0].missingSkills).toHaveLength(0);
    expect(result[0].matchedSkills).toBe(3);
    expect(result[0].totalRequired).toBe(3);

    expect(result[1].missingSkills).toContain('SQL');
    expect(result[1].missingSkills).toContain('Spark');
  });

  it('uses weighted required, preferred, and certification scoring', () => {
    const profile = {
      skills: ['AWS', 'Python', 'Docker'],
      certifications: [],
    };
    const jobs = [
      {
        id: 'j3',
        title: 'Platform Engineer',
        requiredSkills: ['AWS', 'Python', 'Docker'],
        preferredSkills: ['Kubernetes', 'Terraform'],
        certifications: ['AWS Certified Solutions Architect'],
      },
    ];

    const result = matchJobsToProfile(profile, jobs);

    expect(result[0].matchScore).toBe(70);
    expect(result[0].matchedSkills).toBe(3);
    expect(result[0].preferredMatchedSkills).toBe(0);
    expect(result[0].matchedCertifications).toBe(0);
  });

  it('handles empty profile and edge cases', () => {
    const profile = { skills: [], certifications: [] };
    const result = matchJobsToProfile(profile, mockJobs);

    expect(result).toHaveLength(2);
    expect(result[0].missingSkills).toHaveLength(3);
    expect(result[0].matchScore).toBe(0);
    expect(result.every((j) => j.matchScore >= 0 && j.matchScore <= 100)).toBe(true);
  });


  it('ignores malformed job and profile skill values without crashing', () => {
    const profile = { skills: ['AWS', null, 42], certifications: [null, 'AWS Certified'] };
    const jobs = [
      {
        id: 'j-malformed',
        title: 'Cloud Engineer',
        requiredSkills: ['AWS', null, 123],
        preferredSkills: [undefined, 'Kubernetes'],
        certifications: [null, 'AWS Certified'],
      },
    ];

    const result = matchJobsToProfile(profile, jobs);

    expect(result).toHaveLength(1);
    expect(result[0].matchScore).toBe(50);
    expect(result[0].missingSkills).toEqual(['123']);
    expect(result[0].matchedCertifications).toBe(1);
  });
  it('handles null/undefined profile gracefully', () => {
    const result = matchJobsToProfile(null, mockJobs);
    expect(result).toHaveLength(2);
    expect(result[0].matchScore).toBe(0);
  });
});

describe('mergeAiJobMatchScores', () => {
  it('keeps required-skills match score stable while attaching AI insights', () => {
    const baseMatches = [
      { id: 'j1', matchScore: 60 },
      { id: 'j2', matchScore: 40 },
    ];
    const aiMatches = [
      {
        jobId: 'j2',
        matchScore: 88,
        experienceScore: 90,
        skillsScore: 85,
        roleAlignmentScore: 89,
        reasoning: 'Strong relevant delivery experience.',
      },
    ];

    const merged = mergeAiJobMatchScores(baseMatches, aiMatches);

    expect(merged[0].id).toBe('j1');

    const aiJob = merged.find((job) => job.id === 'j2');
    expect(aiJob.matchScore).toBe(40);
    expect(aiJob.aiMatchScore).toBe(88);
    expect(aiJob.matchSource).toBe('ai');
    expect(aiJob.aiInsights.experienceScore).toBe(90);

    const fallbackJob = merged.find((job) => job.id === 'j1');
    expect(fallbackJob.matchSource).toBe('fallback');
    expect(fallbackJob.matchScore).toBe(60);
  });
});
