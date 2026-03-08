import { useState } from 'react';

export default function ProfileEdit({ profile, onSave, onCancel }) {
  const [skills, setSkills] = useState(
    (profile?.skills || []).join(', ')
  );
  const [certifications, setCertifications] = useState(
    (profile?.certifications || []).join(', ')
  );
  const [validationError, setValidationError] = useState('');

  const handleSave = () => {
    setValidationError('');
    const skillsList = skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const certsList = certifications
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    if (skillsList.length === 0) {
      setValidationError('At least one skill is required');
      return;
    }

    onSave({
      ...profile,
      skills: skillsList,
      certifications: certsList,
    });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Profile</h2>
        <div className="form-group">
          <label htmlFor="skills">Skills (comma-separated)</label>
          <input
            id="skills"
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g. Python, AWS, React"
          />
        </div>
        <div className="form-group">
          <label htmlFor="certs">Certifications (comma-separated)</label>
          <input
            id="certs"
            type="text"
            value={certifications}
            onChange={(e) => setCertifications(e.target.value)}
            placeholder="e.g. AWS Certified, CKA"
          />
        </div>
        {validationError && <p className="error">{validationError}</p>}
        <div className="modal-actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
