import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import pdf from 'pdf-parse';
import OpenAI from 'openai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

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

const extractWithAI = async (resumeText) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const openai = new OpenAI({ apiKey });
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Extract structured data from the resume. Return ONLY valid JSON with this exact structure:
{
  "skills": ["skill1", "skill2"],
  "experience": [{"title": "Job Title", "company": "Company", "years": number}],
  "education": ["degree or institution"],
  "certifications": ["cert1", "cert2"]
}
Use empty arrays for missing sections. Skills should be technical (e.g., Python, AWS, React).`,
      },
      { role: 'user', content: resumeText },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');
  return JSON.parse(content);
};

const extractWithFallback = (resumeText) => {
  const skills = [];
  const experience = [];
  const education = [];
  const certifications = [];

  const skillKeywords = [
    'AWS', 'Azure', 'GCP', 'Python', 'JavaScript', 'Java', 'React', 'Node.js',
    'Kubernetes', 'Docker', 'Terraform', 'SQL', 'Linux', 'CI/CD', 'Git',
    'REST', 'API', 'Machine Learning', 'Data', 'Spark', 'Kafka'
  ];

  const lines = resumeText.split(/\n/).map(l => l.trim()).filter(Boolean);
  const lowerText = resumeText.toLowerCase();

  skillKeywords.forEach(skill => {
    if (lowerText.includes(skill.toLowerCase())) {
      skills.push(skill);
    }
  });

  const certPatterns = [
    /AWS Certified[^,\n]*/gi,
    /CKA|CKAD|CKS/gi,
    /CISSP|CEH|Security\+/gi,
    /Terraform Associate/gi,
    /([A-Z][a-z]+ Certified[^,\n]*)/g,
  ];

  certPatterns.forEach(pattern => {
    const matches = resumeText.match(pattern);
    if (matches) {
      matches.forEach(m => certifications.push(m.trim()));
    }
  });

  const expPattern = /(\d+)\+?\s*years?|(\d+)\s*-\s*(\d+)\s*years?|experience|worked at|employed at/gi;
  if (expPattern.test(resumeText)) {
    experience.push({ title: 'Experience detected', company: 'Various', years: 1 });
  }

  return {
    skills: [...new Set(skills)],
    experience: experience.length ? experience : [{ title: 'See resume', company: 'N/A', years: 0 }],
    education: education.length ? education : ['See resume'],
    certifications: [...new Set(certifications)],
  };
};

app.post('/api/extract-resume', upload.single('resume'), async (req, res) => {
  try {
    let resumeText = '';

    if (req.file) {
      if (req.file.mimetype === 'application/pdf') {
        const data = await pdf(req.file.buffer);
        resumeText = data.text;
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
  res.json({ status: 'ok', aiConfigured: !!process.env.OPENAI_API_KEY });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
