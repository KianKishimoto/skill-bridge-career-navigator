import { recommendCertifications } from '../services/certificationRecommendations';

export default function CertificationRecommendations({
  profile,
  certifications,
  targetRole,
}) {
  const recommendations = recommendCertifications(
    profile || {},
    certifications || [],
    targetRole
  );

  if (!profile) {
    return (
      <div className="card">
        <p className="muted">Upload a resume to see certification recommendations</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Recommended Certifications</h2>
      <p className="subtitle">
        Focus on these to close skill gaps
        {targetRole && ` for ${targetRole}`}
      </p>

      <div className="cert-list">
        {recommendations.length === 0 ? (
          <p className="muted">No additional certifications recommended at this time.</p>
        ) : (
          recommendations.map((cert) => (
            <div key={cert.id} className="cert-card">
              <h4>{cert.name}</h4>
              <p className="provider">{cert.provider}</p>
              <div className="cert-meta">
                <span>⏱ {cert.timeToComplete}</span>
                <span>💰 {cert.cost}</span>
              </div>
              {cert.newSkillsCovered?.length > 0 && (
                <p className="new-skills">
                  New skills: {cert.newSkillsCovered.join(', ')}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
