Candidate Name: Kian Kishimoto
Scenario Chosen: Skill-Bridge Career Navigator
Estimated Time Spent: 4 hr

Quick Start:
● Prerequisites: Node.js 18+, Gemini API key
● Run Commands: 
cp .env-example .env
npm run dev:all

● Test Commands:
npm run test

AI Disclosure:
● Did you use an AI assistant (Copilot, ChatGPT, etc.)? Yes
● How did you verify the suggestions? Manual review of changes in pull requests
● Give one example of a suggestion you rejected or changed: Code was importing a nonexistent class from a module so I went in and fixed it 
Tradeoffs & Prioritization:
● What did you cut to stay within the 4–6 hour limit? Separating the content into multiple tabs, cover letter/resume review/improvement. 
● What would you build next if you had more time? Probably the cover letter/resume review. I would also refine the user experience and add more flow to the program.
● Known limitations: Since we were only supposed to use synthetic data the program is unable to actually scrape the web for data, also if the resume is weirdly formatted or for some reason is just an image in pdf form the parser will have a hard time. 

# Candidate Name: Kian Kishimoto



# Scenario Chosen:

## Skill-Bridge Career Navigator

A career navigation platform that uses resume input to provide personalized job matches, certification recommendations, and role-pivot analysis.

# Quick Start

## Prerequisites
- Node.js 18+
- Gemini API key

## Run Commands
1. Copy `.env.example` to `.env` and add your `GEMINI_API_KEY`
   - Optional: set `GEMINI_MODEL` (defaults to `gemini-2.0-flash`)
2. `npm run dev:all` — starts Vite (port 5173) and API server (port 3001)
3. Or run separately: `npm run server` (terminal 1) and `npm run dev` (terminal 2)

## Test Commands
`npm run test`

# AI Disclosure:

##

## Features
- Resume upload (PDF/TXT) or paste text
- AI-powered skill/experience extraction (Gemini) with rule-based fallback
- Job matching against synthetic job listings
- Certification recommendations based on skill gaps
- Role pivot analysis — compare your profile to target roles

## Project Structure
- `server/` — Express API for resume extraction
- `public/data/` — Synthetic job listings and certifications (JSON)
- `src/` — React frontend
