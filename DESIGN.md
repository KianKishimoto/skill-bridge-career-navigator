# Skill-Bridge Career Navigator — Design Document

## 1) Product Goal
Skill-Bridge Career Navigator helps job seekers convert unstructured resume content into practical career actions:
- identify likely job matches,
- uncover skill gaps,
- recommend certifications, and
- evaluate pivot opportunities into adjacent roles.

The application is designed around curated project datasets plus AI-assisted extraction/scoring to provide consistent, explainable recommendations.

---

## 2) Core User Flow
1. **Resume intake**
   - User uploads a PDF/TXT resume or pastes raw resume text.
2. **Profile extraction**
   - Backend extracts structured profile data (skills, experience, education, certifications) using Gemini.
   - If needed, fallback logic keeps the experience usable when AI output is unavailable.
3. **Profile review/edit**
   - User can review extracted profile and manually correct fields for accuracy.
4. **Career guidance output**
   - Job matches are scored and ranked.
   - Certification recommendations are generated based on missing skills and (optionally) a selected target role.
   - Role pivot analysis compares current profile fit against alternate role paths.

---

## 3) Functional Design
### 3.1 Resume Processing
- Accepts `.pdf` and `.txt` files.
- Uses in-memory upload handling with size limits.
- Parses text from documents, then sends normalized text into AI extraction.

### 3.2 Profile Model
The extracted/edited profile is represented in a structured JSON shape:
- `skills: string[]`
- `experience: { title, company, years }[]`
- `education: string[]`
- `certifications: string[]`

This consistent shape enables all downstream modules (matching, recommendations, pivots) to run against the same schema.

### 3.3 Job Matching
- Uses project job listing data from JSON files.
- Supports search and role filters in UI.
- Produces score breakdowns (overall match, skills, experience, role alignment).
- Supports AI-based scoring for richer reasoning where configured.

### 3.4 Certification Recommendations
- Compares candidate profile against certification metadata.
- Highlights likely valuable certifications based on inferred skill gaps and role intent.
- Allows narrowing recommendations by target role.

### 3.5 Role Pivot Analysis
- Evaluates fit for adjacent or aspirational roles from the project dataset.
- Surfaces potential transition paths and where upskilling would help most.

---

## 4) Technical Architecture
### 4.1 Frontend
- **Framework:** React (Vite)
- **Responsibilities:**
  - Resume input UX
  - profile display/editing
  - filtering and interaction controls
  - rendering matched jobs, certification suggestions, and pivot analysis

### 4.2 Backend API
- **Runtime:** Node.js + Express
- **Responsibilities:**
  - file upload handling
  - PDF/TXT text extraction
  - calling Gemini APIs for extraction/matching
  - normalizing AI responses and returning stable JSON to frontend

### 4.3 Data Layer
- **Current state:** curated JSON data under `public/data/`
  - `job-listings.json`
  - `certifications.json`
- **Rationale:** predictable scoring inputs and simple contributor setup.

### 4.4 AI Integration
- **Provider:** Google Gemini API
- **Usage:**
  - resume-to-JSON extraction
  - job-fit scoring and reasoning
- **Design considerations:**
  - strict response shape requirements
  - JSON extraction/sanitization
  - fallback/retry behavior for model availability issues

---

## 5) Tech Stack
### Frontend
- React 19
- Vite
- React Router DOM (available for future route expansion)
- CSS (component/page styling)

### Backend
- Node.js
- Express
- Multer (uploads)
- pdf-parse (PDF extraction)
- CORS

### Tooling & Quality
- ESLint
- Vitest + Testing Library
- Concurrently (run frontend + backend together)

---

## 6) Non-Functional Considerations
### Performance
- In-memory processing is fast for small files; upload limits reduce risk of oversized inputs.

### Reliability
- Defensive parsing and model fallback logic reduce hard failures from AI response variability.
- User profile editing acts as a correction layer when extraction is imperfect.

### Security & Privacy
- API key stays server-side in environment configuration.
- No persistent database currently reduces long-term data retention concerns.
- Future production version should add input sanitization, auth, and secure storage policies.

### UX
- Search/filter/target-role controls make outputs actionable rather than static.

---

## 7) Known Constraints
- Resume parsing quality depends on document quality and text extractability.
- Non-text PDFs (scans/images) may degrade extraction accuracy without OCR.
- AI model quality and availability can affect extraction/match consistency.

---

## 8) Future Enhancements
Planned and suggested improvements to make the system more useful:

### High Priority (aligned with README direction)
1. **Resume and cover-letter review assistant**
   - Add AI critique, rewrite suggestions, and tailoring guidance per target role.
2. **Improved UX flow**
   - Better progression between upload → profile verification → recommendations.
   - More guided onboarding and clearer scoring explanations.

### Data & Intelligence
3. **Live job market integration**
   - Connect to real job APIs and normalize external listings.
4. **Skill graph + gap progression**
   - Model prerequisite relationships and suggest a phased learning roadmap.
5. **Confidence scoring**
   - Show extraction confidence and highlight uncertain fields for user confirmation.
6. **Salary and location alignment**
   - Add compensation and region preferences into ranking logic.

### Personalization
7. **Saved profiles and progress tracking**
   - Persist user profile history and track completion of recommended certifications.
8. **Goal-based planning**
   - Let users define target role + timeframe and generate milestone plans.
9. **Learning platform links**
   - Map recommendations to concrete courses (free/paid) and estimated completion time.

### Platform & Collaboration
10. **Auth + multi-user support**
    - Secure accounts, private workspaces, and optional mentor/career-coach sharing.
11. **Export and reporting**
    - Export profile insights as PDF/JSON and generate shareable application packets.
12. **Internationalization and accessibility hardening**
    - Multi-language UI and stronger WCAG compliance.

### Engineering Maturity
13. **Database-backed architecture**
    - Persist users, profiles, recommendations, and historical scores.
14. **Observability and analytics**
    - Add structured logs, metrics, error dashboards, and product analytics.
15. **Evaluation harness for AI prompts**
    - Build repeatable test fixtures and prompt regression checks for output quality.