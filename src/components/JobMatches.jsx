import { useEffect, useState, useMemo } from 'react';
import { getAiJobMatches } from '../services/api';
import { matchJobsToProfile, mergeAiJobMatchScores } from '../services/jobMatching';

const renderList = (items) => {
  if (!items?.length) return null;
  return (
    <ul className="job-details-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
};

export default function JobMatches({ profile, jobs, searchTerm, roleFilter }) {
  const [expandedId, setExpandedId] = useState(null);
  const [aiResult, setAiResult] = useState({ key: '', matches: [] });

  const getDescriptionPreview = (description = '') => {
    const trimmedDescription = description.trim();
    if (trimmedDescription.length <= 180) {
      return trimmedDescription;
    }

    return `${trimmedDescription.slice(0, 180)}...`;
  };

  const baseMatches = useMemo(() => matchJobsToProfile(profile || {}, jobs || []), [profile, jobs]);
  const profileKey = useMemo(() => JSON.stringify({ profile: profile || {}, jobs: jobs || [] }), [profile, jobs]);

  useEffect(() => {
    let isCancelled = false;

    if (!profile || !(jobs || []).length) {
      return () => {
        isCancelled = true;
      };
    }

    getAiJobMatches(profile, jobs)
      .then((result) => {
        if (!isCancelled) {
          setAiResult({ key: profileKey, matches: result.matches || [] });
        }
      })
      .catch(() => {
        // Keep fallback-only matches when AI is unavailable.
      });

    return () => {
      isCancelled = true;
    };
  }, [profile, jobs, profileKey]);

  const filteredAndMatched = useMemo(() => {
    const scopedAiMatches = aiResult.key === profileKey ? aiResult.matches : [];
    let result = mergeAiJobMatchScores(baseMatches, scopedAiMatches);

    if (searchTerm?.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(term) ||
          j.company.toLowerCase().includes(term) ||
          (j.requiredSkills || []).some((s) => s.toLowerCase().includes(term))
      );
    }

    if (roleFilter?.trim()) {
      const filter = roleFilter.toLowerCase();
      result = result.filter((j) => j.title.toLowerCase().includes(filter));
    }

    return result;
  }, [baseMatches, aiResult, profileKey, searchTerm, roleFilter]);

  if (!profile) {
    return (
      <div className="card">
        <p className="muted">Upload a resume to see job matches</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Job Matches</h2>
      <p className="subtitle">
        {filteredAndMatched.length} job{filteredAndMatched.length !== 1 ? 's' : ''} found
      </p>

      <div className="job-list">
        {filteredAndMatched.map((job) => (
          <div
            key={job.id}
            className={`job-card ${expandedId === job.id ? 'expanded' : ''}`}
            onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
          >
            <div className="job-header">
              <div>
                <h3>{job.title}</h3>
                <p className="company">{job.company} · {job.location}</p>
              </div>
              <span className={`match-badge score-${Math.floor(job.matchScore / 25)}`}>
                {job.matchScore}% match
              </span>
            </div>
            <p className="job-desc">{getDescriptionPreview(job.description)}</p>
            {expandedId === job.id && (
              <div className="job-details">
                <div>
                  <strong>Full description:</strong>
                  <p className="job-full-desc">{job.description}</p>
                </div>
                <div className="job-meta-grid">
                  <div><strong>Salary:</strong> {job.salaryEstimate || 'Not listed'}</div>
                  <div><strong>Employment type:</strong> {job.employmentType || 'Not listed'}</div>
                  <div><strong>Required experience:</strong> {job.requiredExperience || 'Not listed'}</div>
                  <div><strong>Team:</strong> {job.team || 'Not listed'}</div>
                  <div><strong>Posted date:</strong> {job.postedDate || 'Not listed'}</div>
                  <div><strong>Match source:</strong> Weighted skills/certs baseline {job.matchSource === 'ai' ? ' + AI insights' : ''}</div>
                </div>
                {job.aiInsights && (
                  <div>
                    <strong>AI fit breakdown:</strong>
                    <ul className="job-details-list">
                      <li>Holistic AI match: {job.aiMatchScore}%</li>
                      <li>Experience fit: {job.aiInsights.experienceScore}%</li>
                      <li>Skills fit: {job.aiInsights.skillsScore}%</li>
                      <li>Role alignment: {job.aiInsights.roleAlignmentScore}%</li>
                    </ul>
                    {job.aiInsights.reasoning && <p>{job.aiInsights.reasoning}</p>}
                  </div>
                )}
                <div>
                  <strong>Required skills:</strong>
                  {renderList(job.requiredSkills)}
                </div>
                {job.preferredSkills?.length > 0 && (
                  <div>
                    <strong>Preferred skills:</strong>
                    {renderList(job.preferredSkills)}
                  </div>
                )}
                {job.responsibilities?.length > 0 && (
                  <div>
                    <strong>Responsibilities:</strong>
                    {renderList(job.responsibilities)}
                  </div>
                )}
                {job.minimumQualifications?.length > 0 && (
                  <div>
                    <strong>Minimum qualifications:</strong>
                    {renderList(job.minimumQualifications)}
                  </div>
                )}
                {job.preferredQualifications?.length > 0 && (
                  <div>
                    <strong>Preferred qualifications:</strong>
                    {renderList(job.preferredQualifications)}
                  </div>
                )}
                {job.benefits?.length > 0 && (
                  <div>
                    <strong>Benefits:</strong>
                    {renderList(job.benefits)}
                  </div>
                )}
                {job.missingSkills?.length > 0 && (
                  <div className="missing">
                    <strong>You're missing:</strong>{' '}
                    {job.missingSkills.join(', ')}
                  </div>
                )}
                {job.certifications?.length > 0 && (
                  <div>
                    <strong>Certifications:</strong>{' '}
                    {job.certifications.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
