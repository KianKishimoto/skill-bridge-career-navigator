import { useState, useEffect } from 'react';
import ResumeUpload from './components/ResumeUpload';
import ProfileView from './components/ProfileView';
import ProfileEdit from './components/ProfileEdit';
import JobMatches from './components/JobMatches';
import CertificationRecommendations from './components/CertificationRecommendations';
import RolePivot from './components/RolePivot';
import {
  extractResumeFromFile,
  extractResumeFromText,
} from './services/api';
import './App.css';

const JOB_LISTINGS_URL = '/data/job-listings.json';
const CERTIFICATIONS_URL = '/data/certifications.json';

function App() {
  const [profile, setProfile] = useState(null);
  const [jobListings, setJobListings] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [extractionSource, setExtractionSource] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [targetRole, setTargetRole] = useState('');

  useEffect(() => {
    fetch(JOB_LISTINGS_URL)
      .then((r) => r.json())
      .then(setJobListings)
      .catch(() => setJobListings([]));
    fetch(CERTIFICATIONS_URL)
      .then((r) => r.json())
      .then(setCertifications)
      .catch(() => setCertifications([]));
  }, []);

  const handleExtract = async ({ type, file, text }) => {
    setIsLoading(true);
    setError('');
    try {
      const result =
        type === 'file'
          ? await extractResumeFromFile(file)
          : await extractResumeFromText(text);
      setProfile(result);
      setExtractionSource(result.source || 'ai');
    } catch (err) {
      setError(err.message || 'Failed to extract resume');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = (updated) => {
    setProfile(updated);
    setEditing(false);
  };

  const uniqueRoles = [...new Set((jobListings || []).map((j) => j.title))];

  return (
    <div className="app">
      <header>
        <h1>Skill-Bridge Career Navigator</h1>
        <p>Bridge the gap between your skills and your dream role</p>
      </header>

      <main>
        <section className="upload-section">
          <ResumeUpload onExtract={handleExtract} isLoading={isLoading} />
          {error && <p className="error banner">{error}</p>}
        </section>

        {profile && (
          <>
            <section className="profile-section">
              <ProfileView
                profile={profile}
                extractionSource={extractionSource}
                onEdit={() => setEditing(true)}
              />
            </section>

            {editing && (
              <ProfileEdit
                profile={profile}
                onSave={handleSaveProfile}
                onCancel={() => setEditing(false)}
              />
            )}

            <section className="filters">
              <input
                type="search"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All roles</option>
                {uniqueRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <div className="target-role">
                <label>Target role for certs:</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                >
                  <option value="">Any</option>
                  {uniqueRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section className="results">
              <JobMatches
                profile={profile}
                jobs={jobListings}
                searchTerm={searchTerm}
                roleFilter={roleFilter}
              />
              <CertificationRecommendations
                profile={profile}
                certifications={certifications}
                targetRole={targetRole || undefined}
              />
              <RolePivot profile={profile} jobs={jobListings} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
