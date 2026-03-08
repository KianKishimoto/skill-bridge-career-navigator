import { useState } from 'react';

const ALLOWED_TYPES = ['application/pdf', 'text/plain'];
const MAX_SIZE_MB = 5;

export default function ResumeUpload({ onExtract, isLoading }) {
  const [file, setFile] = useState(null);
  const [pasteText, setPasteText] = useState('');
  const [mode, setMode] = useState('file');
  const [error, setError] = useState('');

  const validateFile = (f) => {
    if (!f) return 'Please select a file';
    if (!ALLOWED_TYPES.includes(f.type)) {
      return 'Only PDF and TXT files are allowed';
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File must be under ${MAX_SIZE_MB}MB`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'file') {
      const err = validateFile(file);
      if (err) {
        setError(err);
        return;
      }
      try {
        await onExtract({ type: 'file', file });
      } catch (err) {
        setError(err.message || 'Extraction failed');
      }
    } else {
      const trimmed = pasteText.trim();
      if (trimmed.length < 20) {
        setError('Please paste at least 20 characters of your resume');
        return;
      }
      try {
        await onExtract({ type: 'text', text: trimmed });
      } catch (err) {
        setError(err.message || 'Extraction failed');
      }
    }
  };

  return (
    <div className="card">
      <h2>Upload or Paste Resume</h2>
      <div className="mode-tabs">
        <button
          type="button"
          className={mode === 'file' ? 'active' : ''}
          onClick={() => { setMode('file'); setError(''); }}
        >
          Upload File
        </button>
        <button
          type="button"
          className={mode === 'paste' ? 'active' : ''}
          onClick={() => { setMode('paste'); setError(''); }}
        >
          Paste Text
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {mode === 'file' && (
          <div className="file-input-wrap">
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setError('');
              }}
              disabled={isLoading}
            />
            {file && <p className="file-name">{file.name}</p>}
          </div>
        )}
        {mode === 'paste' && (
          <textarea
            placeholder="Paste your resume text here (at least 20 characters)..."
            value={pasteText}
            onChange={(e) => { setPasteText(e.target.value); setError(''); }}
            rows={8}
            disabled={isLoading}
          />
        )}
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Analyzing...' : 'Analyze Resume'}
        </button>
      </form>
    </div>
  );
}
