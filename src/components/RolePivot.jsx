import { useState } from 'react';
import { analyzeRolePivot } from '../services/rolePivot';

export default function RolePivot({ profile, jobs }) {
  const [selectedJobId, setSelectedJobId] = useState('');
  const selectedJob = jobs?.find((j) => j.id === selectedJobId);
  const analysis = selectedJob && profile
    ? analyzeRolePivot(profile, selectedJob)
    : null;

  if (!profile) {
    return (
      <div className="card">
        <p className="muted">Upload a resume to analyze role pivots</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Role Pivot Analysis</h2>
      <p className="subtitle">
        Compare your profile to a target role and see what to work on
      </p>

      <div className="pivot-select">
        <label htmlFor="pivot-job">Target Role:</label>
        <select
          id="pivot-job"
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
        >
          <option value="">Select a role...</option>
          {(jobs || []).map((j) => (
            <option key={j.id} value={j.id}>
              {j.title} @ {j.company}
            </option>
          ))}
        </select>
      </div>

      {analysis && (
        <div className="pivot-analysis">
          <div className="match-summary">
            <span className={`match-pct score-${Math.floor(analysis.matchPercent / 25)}`}>
              {analysis.matchPercent}% match
            </span>
            <span>{analysis.targetRole} at {analysis.targetCompany}</span>
          </div>

          {analysis.transferableSkills?.length > 0 && (
            <section>
              <h4>✓ Transferable Skills</h4>
              <div className="tag-list">
                {analysis.transferableSkills.map((s, i) => (
                  <span key={i} className="tag">{s}</span>
                ))}
              </div>
            </section>
          )}

          {analysis.missingSkills?.length > 0 && (
            <section>
              <h4>Skills to Develop</h4>
              <ul>
                {analysis.missingSkills.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </section>
          )}

          {analysis.missingCertifications?.length > 0 && (
            <section>
              <h4>Certifications to Pursue</h4>
              <ul>
                {analysis.missingCertifications.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
