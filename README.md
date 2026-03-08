# Skill-Bridge Career Navigator

A career navigation platform that uses resume input to provide personalized job matches, certification recommendations, and role-pivot analysis.

## Quick Start

### Prerequisites
- Node.js 18+
- OpenAI API key

### Run Commands
1. Copy `.env.example` to `.env` and add your `OPENAI_API_KEY`
2. `npm run dev:all` — starts Vite (port 5173) and API server (port 3001)
3. Or run separately: `npm run server` (terminal 1) and `npm run dev` (terminal 2)

### Test Commands
`npm run test`

## Features
- Resume upload (PDF/TXT) or paste text
- AI-powered skill/experience extraction (OpenAI) with rule-based fallback
- Job matching against synthetic job listings
- Certification recommendations based on skill gaps
- Role pivot analysis — compare your profile to target roles

## Project Structure
- `server/` — Express API for resume extraction
- `public/data/` — Synthetic job listings and certifications (JSON)
- `src/` — React frontend
