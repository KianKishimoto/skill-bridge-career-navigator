import { describe, it, expect } from 'vitest';
import { matchJobsToProfile } from './jobMatching';

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

  it('bases match score on required skills so it aligns with role pivot percentage', () => {
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

    expect(result[0].matchScore).toBe(100);
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

  it('handles null/undefined profile gracefully', () => {
    const result = matchJobsToProfile(null, mockJobs);
    expect(result).toHaveLength(2);
    expect(result[0].matchScore).toBe(0);
  });
});
