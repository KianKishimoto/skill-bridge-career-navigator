import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { PDFParse } from 'pdf-parse';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

const loadEnvFromFile = () => {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .forEach((line) => {
      const separatorIndex = line.indexOf('=');
      if (separatorIndex <= 0) return;

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    });
};

loadEnvFromFile();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are allowed'));
    }
  },
});

const extractJsonFromText = (text) => {
  if (!text) {
    throw new Error('Empty AI response');
  }

  const cleaned = text.trim();
  const fencedJson = cleaned.match(/```(?:json)?\n([\s\S]*?)\n```/i);
  const rawJson = fencedJson ? fencedJson[1] : cleaned;

  return JSON.parse(rawJson);
};

const normalizeModelName = (modelName) => (
  modelName.startsWith('models/') ? modelName : `models/${modelName}`
);

const parseGeminiErrorCode = (errorBody) => {
  try {
    const parsed = JSON.parse(errorBody);
    return parsed?.error?.status;
  } catch {
    return null;
  }
};

const listSupportedGeminiModels = async (apiKey) => {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini model listing failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const models = data?.models || [];
  return models
    .filter((model) => model?.supportedGenerationMethods?.includes('generateContent'))
    .map((model) => model.name)
    .filter(Boolean);
};

const pickPreferredGeminiModel = (availableModels) => {
  const preferredModels = [
    // 'models/gemini-2.0-flash',
    // 'models/gemini-2.0-flash-lite',
    'models/gemini-2.5-flash-latest',
    'models/gemini-2.5-flash',
  ];

  return preferredModels.find((model) => availableModels.includes(model)) || availableModels[0];
};

const buildGeminiRequest = (resumeText) => ({
  generationConfig: {
    temperature: 0.2,
    responseMimeType: 'application/json',
  },
  contents: [
    {
      parts: [
        {
          text: `Extract structured data from the resume. Return ONLY valid JSON with this exact structure:
{
  "skills": ["skill1", "skill2"],
  "experience": [{"title": "Job Title", "company": "Company", "years": number}],
  "education": ["degree or institution"],
  "certifications": ["cert1", "cert2"]
}
Use empty arrays for missing sections. Skills should be technical (e.g., Python, AWS, React).

Resume:
${resumeText}`,
        },
      ],
    },
  ],
});

const buildJobMatchRequest = ({ profile, jobs }) => ({
  generationConfig: {
    temperature: 0.1,
    responseMimeType: 'application/json',
  },
  contents: [
    {
      parts: [
        {
          text: `You are scoring job fit for a candidate profile.
Return ONLY valid JSON with this exact structure:
{
  "matches": [
    {
      "jobId": "string",
      "matchScore": 0,
      "experienceScore": 0,
      "skillsScore": 0,
      "roleAlignmentScore": 0,
      "reasoning": "short explanation"
    }
  ]
}

Scoring rules:
- All score fields are integers from 0 to 100.
- Consider required experience, relevance of past experience to job responsibilities/description, and skills overlap.
- A high score requires strong alignment across skills and experience, not just keyword overlap.
- Keep reasoning to 1 concise sentence.

Candidate profile JSON:
${JSON.stringify(profile)}

Jobs JSON:
${JSON.stringify(jobs)}`,
        },
      ],
    },
  ],
});

const requestGeminiExtraction = async ({ apiKey, model, resumeText }) => {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/${normalizeModelName(model)}:generateContent?key=${apiKey}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildGeminiRequest(resumeText)),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const errorCode = parseGeminiErrorCode(errorBody);
    const error = new Error(`Gemini API request failed (${response.status}): ${errorBody}`);
    error.status = response.status;
    error.code = errorCode;
    throw error;
  }

  const data = await response.json();
  const content = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('\n');
  return extractJsonFromText(content);
};

const requestGeminiJobMatch = async ({ apiKey, model, profile, jobs }) => {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/${normalizeModelName(model)}:generateContent?key=${apiKey}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildJobMatchRequest({ profile, jobs })),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const errorCode = parseGeminiErrorCode(errorBody);
    const error = new Error(`Gemini API request failed (${response.status}): ${errorBody}`);
    error.status = response.status;
    error.code = errorCode;
    throw error;
  }

  const data = await response.json();
  const content = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('\n');
  return extractJsonFromText(content);
};

const extractWithAI = async (resumeText) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const configuredModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

  try {
    return await requestGeminiExtraction({
      apiKey,
      model: configuredModel,
      resumeText,
    });
  } catch (error) {
    const shouldRetryWithDetectedModel = (
      !process.env.GEMINI_MODEL
      && error.status === 404
      && error.code === 'NOT_FOUND'
    );

    if (!shouldRetryWithDetectedModel) {
      throw error;
    }

    const availableModels = await listSupportedGeminiModels(apiKey);
    const detectedModel = pickPreferredGeminiModel(availableModels);

    if (!detectedModel) {
      throw new Error('No Gemini models with generateContent support are available for this API key');
    }

    return requestGeminiExtraction({ apiKey, model: detectedModel, resumeText });
  }
};

const matchJobsWithAI = async (profile, jobs) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const configuredModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

  try {
    return await requestGeminiJobMatch({
      apiKey,
      model: configuredModel,
      profile,
      jobs,
    });
  } catch (error) {
    const shouldRetryWithDetectedModel = (
      !process.env.GEMINI_MODEL
      && error.status === 404
      && error.code === 'NOT_FOUND'
    );

    if (!shouldRetryWithDetectedModel) {
      throw error;
    }

    const availableModels = await listSupportedGeminiModels(apiKey);
    const detectedModel = pickPreferredGeminiModel(availableModels);

    if (!detectedModel) {
      throw new Error('No Gemini models with generateContent support are available for this API key');
    }

    return requestGeminiJobMatch({ apiKey, model: detectedModel, profile, jobs });
  }
};

const clampScore = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
};

const sanitizeAiJobMatches = (jobs, aiResponse) => {
  const jobsById = new Map((jobs || []).map((job) => [String(job.id), job]));
  const aiMatches = Array.isArray(aiResponse?.matches) ? aiResponse.matches : [];
  const aiById = new Map(
    aiMatches
      .filter((match) => match?.jobId !== undefined && match?.jobId !== null)
      .map((match) => [String(match.jobId), match])
  );

  return (jobs || []).map((job) => {
    const aiMatch = aiById.get(String(job.id));
    if (!aiMatch || !jobsById.has(String(job.id))) {
      return null;
    }

    return {
      jobId: String(job.id),
      matchScore: clampScore(aiMatch.matchScore),
      experienceScore: clampScore(aiMatch.experienceScore),
      skillsScore: clampScore(aiMatch.skillsScore),
      roleAlignmentScore: clampScore(aiMatch.roleAlignmentScore),
      reasoning: typeof aiMatch.reasoning === 'string' ? aiMatch.reasoning.trim() : '',
    };
  }).filter(Boolean);
};


const extractWithFallback = (resumeText) => {
  const skills = [];
  const experience = [];
  const education = [];
  const knownSkillBank = [
    'AWS', 'Azure', 'GCP',
    'Python', 'JavaScript', 'TypeScript', 'Java', 'C#', 'C++', 'Ruby', 'PHP', 'Swift', 'Kotlin',
    'React', 'Angular', 'Vue', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring Boot',
    'Kubernetes', 'Docker', 'Terraform', 'Ansible', 'Helm', 'ArgoCD', 'Jenkins', 'GitHub Actions', 'CI/CD',
    'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Snowflake',
    'Linux', 'Git', 'REST', 'GraphQL',
    'Machine Learning', 'Data Analysis', 'Pandas', 'NumPy', 'Spark', 'Kafka', 'Airflow'
  ];

  knownSkillBank.forEach((skill) => {
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const hasSkill = new RegExp(`(^|[^a-z0-9])${escapedSkill}([^a-z0-9]|$)`, 'i').test(resumeText);
    if (hasSkill) {
      skills.push(skill);
    }
  });

  const degreePatterns = [
    /\b(Ph\.?D\.?|Doctorate|DPhil)\b/gi,
    /\b(Master(?:'s)?(?:\s+of\s+[A-Za-z&\s.]+)?|M\.?S\.?|M\.?A\.?|MBA|M\.?Eng\.?|M\.?Sc\.?)\b/gi,
    /\b(Bachelor(?:'s)?(?:\s+of\s+[A-Za-z&\s.]+)?|B\.?S\.?|B\.?A\.?|B\.?Eng\.?|B\.?Sc\.?)\b/gi,
    /\b(Associate(?:'s)?(?:\s+Degree)?)\b/gi,
    /\b(High School Diploma|GED)\b/gi,
  ];

  degreePatterns.forEach((pattern) => {
    const matches = resumeText.match(pattern);
    if (matches) {
      matches.forEach((match) => education.push(match.replace(/\s+/g, ' ').trim()));
    }
  });

  const expPattern = /(\d+)\+?\s*years?|(\d+)\s*-\s*(\d+)\s*years?|experience|worked at|employed at/gi;
  if (expPattern.test(resumeText)) {
    experience.push({ title: 'Experience detected', company: 'Various', years: 1 });
  }

  return {
    skills: [...new Set(skills)],
    experience: experience.length ? experience : [{ title: 'See resume', company: 'N/A', years: 0 }],
    education: education.length ? [...new Set(education)] : ['See resume'],
    certifications: [],
  };
};

app.post('/api/extract-resume', upload.single('resume'), async (req, res) => {
  try {
    let resumeText = '';

    if (req.file) {
      if (req.file.mimetype === 'application/pdf') {
        const parser = new PDFParse({ data: req.file.buffer });
        const result = await parser.getText();
        resumeText = result?.text ?? '';
      } else if (req.file.mimetype === 'text/plain') {
        resumeText = req.file.buffer.toString('utf-8');
      }
    } else if (req.body?.text) {
      resumeText = req.body.text;
    }

    if (!resumeText || resumeText.trim().length < 20) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Please provide a resume file (PDF/TXT) or paste at least 20 characters of resume text.',
      });
    }

    let result;
    let source = 'ai';
    try {
      result = await extractWithAI(resumeText);
    } catch (aiError) {
      console.warn('AI extraction failed, using fallback:', aiError.message);
      result = extractWithFallback(resumeText);
      source = 'fallback';
    }
    res.json({ ...result, source });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Extraction failed',
      message: err.message || 'An unexpected error occurred.',
    });
  }
});

app.post('/api/extract-resume/text', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length < 20) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Please provide at least 20 characters of resume text.',
      });
    }

    let result;
    let source = 'ai';
    try {
      result = await extractWithAI(text);
    } catch (aiError) {
      console.warn('AI extraction failed, using fallback:', aiError.message);
      result = extractWithFallback(text);
      source = 'fallback';
    }
    res.json({ ...result, source });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Extraction failed',
      message: err.message || 'An unexpected error occurred.',
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', aiConfigured: !!process.env.GEMINI_API_KEY });
});

app.post('/api/job-matches/ai', async (req, res) => {
  try {
    const { profile, jobs } = req.body || {};
    if (!profile || typeof profile !== 'object') {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Profile is required.',
      });
    }

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'A non-empty jobs array is required.',
      });
    }

    const aiResponse = await matchJobsWithAI(profile, jobs);
    const matches = sanitizeAiJobMatches(jobs, aiResponse);

    if (!matches.length) {
      throw new Error('AI job matching returned no usable matches');
    }

    res.json({ source: 'ai', matches });
  } catch (err) {
    console.warn('AI job match failed:', err.message);
    res.status(500).json({
      error: 'AI job match failed',
      message: err.message || 'Unable to compute AI-based job matches.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
