import { useMemo, useState } from 'react';
import {
  analyzeGeneralRolePivot,
  analyzeRolePivot,
  getAvailableGeneralRoles,
} from '../services/rolePivot';

export default function RolePivot({ profile, jobs }) {
  const [targetMode, setTargetMode] = useState('job');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedGeneralRole, setSelectedGeneralRole] = useState('');

  const generalRoles = useMemo(() => getAvailableGeneralRoles(jobs || []), [jobs]);
  const selectedJob = jobs?.find((j) => j.id === selectedJobId);

  const analysis = useMemo(() => {
    if (!profile) return null;

    if (targetMode === 'general') {
      return selectedGeneralRole
        ? analyzeGeneralRolePivot(profile, jobs || [], selectedGeneralRole)
        : null;
    }

    return selectedJob ? analyzeRolePivot(profile, selectedJob) : null;
  }, [jobs, profile, selectedGeneralRole, selectedJob, targetMode]);

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
        Compare your profile to a specific job or a general role and see what to work on
      </p>

      <div className="pivot-mode-tabs" role="tablist" aria-label="Role pivot target type">
        <button
          type="button"
          className={targetMode === 'job' ? 'active' : ''}
          onClick={() => setTargetMode('job')}
        >
          Specific job
        </button>
        <button
          type="button"
          className={targetMode === 'general' ? 'active' : ''}
          onClick={() => setTargetMode('general')}
        >
          General role
        </button>
      </div>

      {targetMode === 'job' ? (
        <div className="pivot-select">
          <label htmlFor="pivot-job">Target Job:</label>
          <select
            id="pivot-job"
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
          >
            <option value="">Select a job...</option>
            {(jobs || []).map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} @ {j.company}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="pivot-select">
          <label htmlFor="pivot-general-role">Target General Role:</label>
          <select
            id="pivot-general-role"
            value={selectedGeneralRole}
            onChange={(e) => setSelectedGeneralRole(e.target.value)}
          >
            <option value="">Select a general role...</option>
            {generalRoles.map((role) => (
              <option key={role.key} value={role.key}>
                {role.label} ({role.jobCount} job{role.jobCount === 1 ? '' : 's'})
              </option>
            ))}
          </select>
        </div>
      )}

      {analysis && (
        <div className="pivot-analysis">
          <div className="match-summary">
            <span className={`match-pct score-${Math.floor(analysis.matchPercent / 25)}`}>
              {analysis.matchPercent}% match
            </span>
            <span>{analysis.targetRole} at {analysis.targetCompany}</span>
          </div>

          {targetMode === 'general' && (
            <p className="muted pivot-context">
              This compares your resume against shared requirements from {analysis.jobsCompared} matching
              job listing{analysis.jobsCompared === 1 ? '' : 's'}.
            </p>
          )}

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
