import { useState, useMemo } from 'react';
import { matchJobsToProfile } from '../services/jobMatching';

export default function JobMatches({ profile, jobs, searchTerm, roleFilter }) {
  const [expandedId, setExpandedId] = useState(null);

  const filteredAndMatched = useMemo(() => {
    let result = matchJobsToProfile(profile || {}, jobs || []);

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
  }, [profile, jobs, searchTerm, roleFilter]);

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
            <p className="job-desc">{job.description}</p>
            {expandedId === job.id && (
              <div className="job-details">
                <div>
                  <strong>Required:</strong>{' '}
                  {(job.requiredSkills || []).join(', ')}
                </div>
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
