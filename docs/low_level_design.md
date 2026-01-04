# Low-Level Design Document

This document provides a detailed breakdown of the user interface, including pages, fields, buttons, and their specific functionalities, as well as the underlying logic and data models.

## 1. Landing Page (`LandingPage.tsx`)

**Route**: `/` (Initial View)

### UI Elements
-   **Hero Section**:
    -   Title: "Build Your Story with an AI Resume Builder"
    -   Subtitle: "Craft a professional, ATS-friendly resume in minutes."
-   **Primary Action**:
    -   **Button**: `Start Building`
        -   **Functionality**: Navigates the user to the **Artifact Selector** view.

## 2. Artifact Selector (`ArtifactSelector.tsx`)

**Route**: Internal State (`currentView === 'selector'`)

### UI Elements
-   **Selection Cards**:
    1.  **Build Resume**
        -   **Icon**: Document/Resume icon.
        -   **Badges**: "ATS-Friendly", "AI Enhanced", "Multiple Templates".
        -   **Action**: Clicking the card navigates to the **Resume Builder** view.
    2.  **Build Cover Letter**
        -   **Icon**: Envelope/Letter icon.
        -   **Badges**: "Data Sync", "AI Powered", "Professional".
        -   **Action**: Clicking the card navigates to the **Cover Letter Builder** view.

## 3. Resume Builder View

**Route**: Internal State (`currentView === 'resume'`)
**Layout**: Header (Top), Three-Column Grid (Editor, Preview, Customization).

### 3.1. Header (`Header.tsx`)

**Global Actions**:
-   **ATS Score / Resume Score** (Dropdown Item):
    -   **Functionality**: Opens the **ATS Modal** to analyze the resume against a job description.
-   **Import JSON** (Button):
    -   **Functionality**: Opens a file picker to upload a `resume.json` file. Parses the file and populates the application state.
-   **Export JSON** (Button):
    -   **Functionality**: Downloads the current resume state as a `resume.json` file.
-   **Preview** (Button):
    -   **Functionality**: Opens the generated PDF in a new browser tab for review.
-   **Download PDF** (Button):
    -   **Functionality**: Generates a high-quality PDF of the resume and triggers a file download (`[Name]_Resume.pdf`).

### 3.2. Editor Panel (`EditorPanel.tsx`)

**Location**: Left Column
**Structure**: Accordion-based list of sections.

#### Sections & Components:

1.  **API Integration** (`ApiKeySection.tsx`)
    -   **Gemini API Key**: Input field for user's API key (stored locally).

2.  **Basics** (`BasicsSection.tsx`)
    -   **Name, Headline, Email, Phone, Location, Website, Photo URL**.

3.  **Summary** (`SummarySection.tsx`)
    -   **Summary**: Textarea with **AI Enhance** button.

4.  **Work Experience** (`ExperienceSection.tsx`)
    -   **Company, Position, Location, Dates, Current Checkbox**.
    -   **Summary/Achievements**: Textarea with **AI Enhance** button.

5.  **Education** (`EducationSection.tsx`)
    -   **Institution, Degree, Area of Study, Dates, Score**.

6.  **Skills** (`SkillsSection.tsx`)
    -   **Category Name**: (e.g., "Frontend").
    -   **Keywords**: Comma-separated list.

7.  **Projects** (`ProjectsSection.tsx`)
    -   **Name, Role, Description (AI Enhanced), Link**.

8.  **Other Sections**:
    -   **Social Profiles** (`ProfilesSection.tsx`)
    -   **Certifications** (`CertificationsSection.tsx`)
    -   **Languages** (`LanguagesSection.tsx`)
    -   **Interests** (`InterestsSection.tsx`)
    -   **References** (`ReferencesSection.tsx`)

### 3.3. Preview Panel (`PreviewPanel.tsx`)

**Location**: Center Column
**Functionality**:
-   Renders the resume in real-time based on the selected **Template** and **Data**.
-   **Supported Templates**:
    -   `ModernTemplate.tsx`
    -   `ProfessionalTemplate.tsx`
    -   `CreativeTemplate.tsx`
    -   `CorporateTemplate.tsx`
    -   `ElegantTemplate.tsx`
    -   `DefaultTemplate.tsx`

### 3.4. Customization Panel (`CustomizationPanel.tsx`)

**Location**: Right Column
**Tabs**:
1.  **Templates** (`TemplateTab.tsx`): Selector for the visual template.
2.  **Layout** (`LayoutTab.tsx`): Margins, Page Format (A4/Letter).
3.  **Typography** (`TypographyTab.tsx`): Font families, Sizes, Line Heights.
4.  **Colors** (`ColorTab.tsx`): Primary and Accent color pickers.

## 4. Cover Letter Builder

**Route**: Internal State (`currentView === 'coverLetter'`)
**Component**: `CoverLetterBuilder.tsx`

### 4.1. Structure
-   **Editor** (`CoverLetterEditor.tsx`):
    -   **Your Information**: Auto-synced from Resume Basics.
    -   **Recipient Information**: Name, Title, Company, Address.
    -   **Job Application Details**: Job Title, Date.
    -   **Letter Content**: Salutation, Body (AI Enhanced), Closing.
-   **Preview** (`CoverLetterPreview.tsx`):
    -   Real-time preview of the PDF output.
-   **Template Selector** (`TemplateSelector.tsx`):
    -   Choose from various cover letter designs.

## 5. ATS System (Applicant Tracking System)

**Purpose**: Analyze the user's resume against a specific job description to provide a compatibility score and gap analysis.

### 5.1. UI Components (`components/ats/`)
-   **ATSModal**: The main container dialog overlay.
-   **ATSDashboard**: The content area showing inputs and results.
    -   **Inputs**: Textarea for Job Description (JD).
    -   **Action**: "Analyze Resume" button.
-   **ATSScore**: Visual radial progress meter showing the overall match score (0-100%).
-   **ATSMetrics**: Breakdown of the score into:
    -   **Hard Constraints** (Experience, Education).
    -   **Skill Match** (Critical and Bonus skills).
    -   **Semantic Match** (Contextual relevance).
-   **ATSGapAnalysis**:
    -   **Critical Gaps**: Missing required skills.
    -   **Suggestions**: Bonus skills to improve the score.
    -   **Quick Add**: Clicking a missing skill adds it to the Resume Data automatically.

### 5.2. Backend API (`api/ats-score.ts`)
-   **Endpoint**: `POST /api/ats-score` (Vercel Serverless Function)
-   **Input**: `{ candidate: ResumeData, jobDescription: JobDescriptionInput }`
-   **Output**: `ATSScoreResult` (JSON)

### 5.3. Measure Resume API (`api/measure-resume.ts`)
-   **Endpoint**: `POST /api/measure-resume` (Vercel Serverless Function)
-   **Method**: `POST` (`multipart/form-data`)
-   **Input**:
    -   `resume`: File (PDF/DOCX)
    -   `jobDescription`: String (Raw Text)
-   **Process**:
    1.  **Upload**: Multer handles the file stream.
    2.  **Parsing**: `resumeParser.ts` extracts raw text from the file buffer (using `pdf-parse`).
    3.  **Scoring**: Calls `calculateATSScoreFromText` in `atsService.ts`.
-   **Output**: JSON object `{ success: true, data: ATSScoreResult, text_preview: string }`

### 5.4. Logic Engine (`services/atsService.ts`)
The scoring engine operates in 5 phases:
1.  **Extraction**: Parses the JD text to extract years of experience, required skills, and "bonus" keywords using regex and context analysis.
2.  **Normalization**: Standardizes skills to lowercase and maps them to canonical forms (e.g., "react.js" -> "react").
3.  **Mapping**: Uses fuzzy matching (`Fuse.js`) and a canonical map to fuzzy-match candidate skills to JD requirements.
4.  **Scoring**:
    -   **Hard Constraints (40%)**: Experience years match, Education presence.
    -   **Skill Match (35%)**: Ratio of matched critical and bonus skills.
    -   **Semantic Match (25%)**: Jaccard similarity or bag-of-words overlap of the full text.
5.  **Output**: Generates the final score, breakdown, and gap analysis.

## 6. Legal & Static Pages

**Routes**:
-   `/privacy-policy` -> `PrivacyPolicy.tsx`
-   `/terms-and-conditions` -> `TermsAndConditions.tsx`
-   `/contact` -> `ContactPage.tsx`

**Common Layout**:
-   Dedicated pages with a "Back to Home" navigation and the shared `Footer`.

## 7. Data Models & State

### 7.1. ResumeData
-   **Basics**: Personal info.
-   **Sections**: Arrays of objects (Experience, Education, Skills, etc.).
-   **Skills Structure**: `{ name: string, keywords: string[] }[]` (Categorized).
-   **Layout**: Stores column arrangements.

### 7.2. JobDescriptionInput (`atsService.ts`)
-   `title`: string
-   `description`: string (Raw Text)
-   `required_skills`: string[] (Optional explicit list)
-   `min_experience`: number
-   `max_experience`: number

### 7.3. ATSScoreResult
-   `score`: number (Total)
-   `breakdown`: `{ hard_constraints, skill_match, semantic_match }`
-   `gap_analysis`: `{ critical_missing: string[], bonus_missing: string[] }`
-   `metadata`: `{ experience_flag, total_jd_skills, matched_skills }`
