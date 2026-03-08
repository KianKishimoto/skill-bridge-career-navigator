import { describe, it, expect } from 'vitest';
import {
  analyzeGeneralRolePivot,
  analyzeRolePivot,
  getAvailableGeneralRoles,
  getGeneralRoleKey,
} from './rolePivot';

const profile = {
  skills: ['Python', 'SQL', 'AWS'],
  certifications: ['AWS Certified Data Analytics'],
};

const jobs = [
  {
    id: 'job-1',
    title: 'Data Engineer I',
    company: 'A',
    requiredSkills: ['Python', 'SQL', 'Airflow'],
    preferredSkills: ['dbt'],
    certifications: ['AWS Certified Data Analytics'],
  },
  {
    id: 'job-2',
    title: 'Senior Data Engineer',
    company: 'B',
    requiredSkills: ['Python', 'Spark', 'SQL'],
    preferredSkills: ['Kafka'],
    certifications: ['Databricks Certified'],
  },
  {
    id: 'job-3',
    title: 'DevOps Engineer',
    company: 'C',
    requiredSkills: ['Docker'],
    preferredSkills: [],
    certifications: [],
  },
];

describe('rolePivot services', () => {
  it('normalizes titles into a general role key', () => {
    expect(getGeneralRoleKey('Data Engineer II')).toBe('data engineer');
    expect(getGeneralRoleKey('Senior Data Engineer')).toBe('data engineer');
  });

  it('returns grouped general roles', () => {
    const roles = getAvailableGeneralRoles(jobs);
    const dataEngineer = roles.find((r) => r.key === 'data engineer');

    expect(dataEngineer).toBeDefined();
    expect(dataEngineer.jobCount).toBe(2);
  });

  it('analyzes general role using all matching role listings', () => {
    const analysis = analyzeGeneralRolePivot(profile, jobs, 'data engineer');

    expect(analysis.targetRole).toBe('Data Engineer');
    expect(analysis.jobsCompared).toBe(2);
    expect(analysis.transferableSkills).toEqual(expect.arrayContaining(['python', 'sql']));
    expect(analysis.missingSkills).toEqual(expect.arrayContaining(['airflow', 'spark']));
    expect(analysis.missingCertifications).toContain('databricks certified');
  });

  it('keeps specific job analysis behavior intact', () => {
    const analysis = analyzeRolePivot(profile, jobs[0]);

    expect(analysis.targetRole).toBe('Data Engineer I');
    expect(analysis.matchPercent).toBe(57);
  });
});
