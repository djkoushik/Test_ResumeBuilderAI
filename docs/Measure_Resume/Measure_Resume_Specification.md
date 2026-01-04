# Measure Resume Specification

This document details the configuration, workflow, and logic behind the "Measure Resume" feature, specifically how it processes Job Descriptions (JD) and calculates the ATS Score.

## 1. Overview & Configuration

### Endpoint
- **URL**: `/api/measure-resume`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Input Parameters**:
  - `resume` (File): The resume file (PDF or DOCX).
  - `jobDescription` (Text): The raw text of the job description.

### Server Configuration
- **Platform**: Vercel Serverless Function.
- **Body Parser**: Disabled (`bodyParser: false`) to allow `multer` to handle file uploads directly.
- **Parsing Logic**: The system uses `pdf-parse` (via `resumeParser.ts`) to extract raw text content from the uploaded resume file.

---

## 2. Workflow Architecture

1.  **Input Handling**:
    -   The API receives the file and JD text.
    -   It verifies the presence of both inputs.
2.  **Text Extraction**:
    -   The uploaded resume is passed to the `parseResume` service.
    -   This service extracts all readable text from the document buffer.
3.  **ATS Analysis**:
    -   The extracted resume text and the provided JD text are sent to `calculateATSScoreFromText` in `atsService.ts`.
4.  **Response Generation**:
    -   The service returns a JSON object containing the total score (0-100), a breakdown by category (Hard Constraints, Skills, Semantic), and a gap analysis of missing skills.

---

## 3. Job Description Parsing (Phase 0 & 1)

The system "divides" and processes the Job Description using a multi-phase approach within `atsService.ts`.

### A. Experience Extraction
The system scans the JD text for experience patterns using Regex:
-   **Pattern**: `(\d+)[\s-]*to[\s-]*(\d+)\s*years?` (e.g., "3-5 years")
-   **Pattern**: `(\d+)\+?\s*years?` (e.g., "4+ years")
-   **Result**: Establishes a `min` and `max` experience range.

### B. Skill Extraction & Classification
The system identifies skills using a predefined `standardSkills` list and contextual keywords.

1.  **Scanning**: The JD text is scanned for known skills and their aliases (defined in `canonicalMap`).
2.  **Classification (Critical vs. Bonus)**:
    -   **Explicit**: If `required_skills` are provided in the input object (rare in raw text mode), they are **Critical**.
    -   **Heuristic / Contextual**:
        -   The system looks for keywords like **"bonus"**, **"plus"**, **"preferred"**, **"nice to have"**, or **"desirable"** within 50 characters of a found skill.
        -   **Matches**: Classified as **Bonus Skills**.
        -   **No Match**: Classified as **Critical Skills**.
3.  **Fallback**: If no distinction is found, all extracted skills are treated as **Critical**.

---

## 4. ATS Score Calculation (Phase 4)

The final ATS Score is a weighted sum of three distinct components.

**Formula**:
```javascript
Total Score = (0.4 × Hard Constraints) + (0.35 × Skill Match) + (0.25 × Semantic Match)
```

### Component A: Hard Constraints (40%)
Checks for non-negotiable requirements like experience and education.

1.  **Experience Match**:
    -   **Within Range**: Score = **1.0** (100%)
    -   **Senior (Over Qualified)**: Score = **0.9** (90%)
    -   **Under Qualified**: Score reduces proportionally: `1.0 - ((Required - Actual) / Required)`
2.  **Education Check**:
    -   Scans resume for terms: "education", "university", "college", "degree".
    -   **Missing**: Applies a **0.8x** multiplier to the Hard Constraint score.

### B. Skill Match (35%)
Compares the candidate's skills against the extracted JD skills.

1.  **Normalization & Mapping**:
    -   Candidate skills are normalized (lowercased, trimmed).
    -   **Fuzzy Matching**: Uses `Fuse.js` (threshold 0.3) to match misspelled or varied skills to the canonical list.
2.  **Scoring Logic**:
    -   **Critical Matches**: Count of matching critical skills.
    -   **Bonus Matches**: Count of matching bonus skills.
    -   **Weighting**:
        -   If Bonus skills exist: **(Critical % × 0.8) + (Bonus % × 0.2)**
        -   If only Critical skills: **Critical %**
3.  **Critical Penalty**:
    -   If the candidate matches **less than 50%** of the Critical skills, the entire Skill Match score is **halved (multiplied by 0.5)**.

### Component C: Semantic Match (25%)
A "Bag of Words" similarity check for broader context.

1.  **Tokenization**: Splits JD and Resume text into words, removing duplicates and common "stop words" (e.g., "and", "the").
2.  **Overlap**: Calculates the percentage of unique JD tokens that appear in the Resume text.
3.  **Score**: `Matching Tokens / Total Unique JD Tokens`.

---

## 5. Metadata & Gap Analysis

The output file also calculates actionable feedback:

-   **Gap Analysis**: Returns the top 5 missing **Critical** skills and top 5 missing **Bonus** skills.
-   **Experience Flag**: A text warning if the candidate is under-qualified or significantly over-qualified.
