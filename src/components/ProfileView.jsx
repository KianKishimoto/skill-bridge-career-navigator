export default function ProfileView({ profile, onEdit, extractionSource }) {
  if (!profile) return null;

  const { skills = [], experience = [], education = [], certifications = [] } = profile;

  return (
    <div className="card profile-view">
      <div className="profile-header">
        <h2>Your Profile</h2>
        {extractionSource && (
          <span className={`badge ${extractionSource}`}>
            {extractionSource === 'ai' ? 'AI Extracted' : 'Rule-based'}
          </span>
        )}
        {onEdit && (
          <button type="button" className="edit-btn" onClick={onEdit}>
            Edit
          </button>
        )}
      </div>

      <section>
        <h3>Skills</h3>
        {skills.length > 0 ? (
          <div className="tag-list">
            {skills.map((s, i) => (
              <span key={i} className="tag">
                {s}
              </span>
            ))}
          </div>
        ) : (
          <p className="muted">No skills extracted</p>
        )}
      </section>

      <section>
        <h3>Experience</h3>
        {experience.length > 0 ? (
          <ul>
            {experience.map((exp, i) => (
              <li key={i}>
                {exp.title} at {exp.company}
                {exp.years != null && ` (${exp.years} year${exp.years !== 1 ? 's' : ''})`}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No experience extracted</p>
        )}
      </section>

      <section>
        <h3>Certifications</h3>
        {certifications.length > 0 ? (
          <div className="tag-list">
            {certifications.map((c, i) => (
              <span key={i} className="tag cert">
                {c}
              </span>
            ))}
          </div>
        ) : (
          <p className="muted">No certifications found</p>
        )}
      </section>

      {education?.length > 0 && (
        <section>
          <h3>Education</h3>
          <ul>
            {education.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
