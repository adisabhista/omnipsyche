# OmniPsyche: The Integrated Self Architect

![OmniPsyche Banner](public/banner.jpg)

**OmniPsyche** is an advanced personality synthesis engine that integrates multiple psychological frameworks into a unified, holistic profile. It uses Gemini through **Google Cloud Vertex AI** from server-side Next.js API routes and stores backend test data in PostgreSQL through Prisma.

## Key Features

* **Multi-Framework Integration**: Synthesizes data from MBTI, Enneagram, Big Five, Attitudinal Psyche, Socionics, Instinctual Variants, Four Temperaments, and RIASEC.
* **Grand Synthesis Engine**: Uses a specialized AI persona to find intersections, conflicts, and synergies between personality frameworks.
* **Narrative Mirror**: Analyzes free-form writing to hypothesize personality types.
* **Strategic Career Pathing**: Provides career and college major recommendations based on cognitive and vocational profile.
* **Dynamic UI**: A futuristic interface built with Next.js and Tailwind CSS.

## Getting Started

1. Clone the repository:
    ```bash
    git clone https://github.com/adisabhista/omnipsyche.git
    cd omnipsyche
    ```

2. Enable Vertex AI API in your Google Cloud project.

3. Install the Google Cloud CLI:
    https://cloud.google.com/sdk/docs/install

4. Authenticate local Application Default Credentials:
    ```bash
    gcloud auth application-default login
    gcloud config set project YOUR_PROJECT_ID
    ```

5. Start PostgreSQL locally and create an `omnipsyche` database.

6. Copy `.env.example` to `.env.local` and set your project ID:
    ```bash
    cp .env.example .env.local
    ```

    `.env.local` should contain:
    ```env
    DATABASE_URL="postgresql://postgres:postgres@localhost:5432/omnipsyche?schema=public"

    NEXTAUTH_URL="http://localhost:3000"
    NEXTAUTH_SECRET="omnipsyche-local-development-secret-change-me"
    AUTH_SECRET="omnipsyche-local-development-secret-change-me"

    GOOGLE_APPLICATION_CREDENTIALS=""
    GOOGLE_VERTEX_AI_PROJECT_ID="YOUR_PROJECT_ID"
    GOOGLE_VERTEX_AI_LOCATION="us-central1"
    GEMINI_PERSONALITY_MODEL="gemini-2.5-flash"

    GOOGLE_CLOUD_PROJECT=""
    GOOGLE_CLOUD_LOCATION="us-central1"
    VERTEX_AI_MODEL="gemini-2.5-flash"
    GOOGLE_GENAI_USE_VERTEXAI="true"

    DEVIL_AI_API_KEY=""
    DEVIL_AI_BASE_URL="https://api.devil.ai/v1"
    DEVIL_AI_LANG="en"
    ```

7. Install dependencies, run the database migration, and start the development server:
    ```bash
    npm install
    npx prisma migrate dev --name add_auth
    npx prisma generate
    npm run dev
    ```

8. Open `http://localhost:3000/register`, create a user, then sign in at `http://localhost:3000/login`.

Do not use `GEMINI_API_KEY` or `NEXT_PUBLIC_GEMINI_API_KEY`. OmniPsyche does not require a Gemini API key and does not expose AI credentials to the browser.

Fallback compatibility names are also supported on the server: `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_LOCATION`, and `VERTEX_AI_MODEL`.

For Devil.ai MBTI tests, keep `DEVIL_AI_API_KEY` server-side only. If Devil.ai Indonesian test questions appear blank, use `DEVIL_AI_LANG="en"` because `lang=id` may have incomplete question translations. Restart the dev server and create a new test link after changing this value; old `test_url` links keep their original language.

## Backend Test Checklist

Use the local server at `http://localhost:3000` after running the Prisma migration.

* Register a user at `/register`.
* Login at `/login`.
* Create a profile with `POST /api/profiles`.
* Generate an analysis with `POST /api/analyze` using either a full `profile` payload or `profileId`.
* Fetch analyses with `GET /api/analyses`.
* Run narrative prediction with `POST /api/narrative/predict`.
* Fetch narrative history with `GET /api/narrative/history`.

Useful backend commands:

```bash
npx prisma validate
npx prisma migrate dev --name add_auth
npx prisma generate
npx prisma studio
```

## Cloud Run Deployment

For production, deploy OmniPsyche to Cloud Run with a service account.

* Grant the Cloud Run service account the **Vertex AI User** role (`roles/aiplatform.user`).
* Set these Cloud Run environment variables:
    ```bash
    GOOGLE_VERTEX_AI_PROJECT_ID=YOUR_PROJECT_ID
    GOOGLE_VERTEX_AI_LOCATION=us-central1
    GEMINI_PERSONALITY_MODEL=gemini-2.5-flash
    GOOGLE_GENAI_USE_VERTEXAI=true
    ```
* Do not store service account JSON in the repository.
* Do not use API keys for Gemini access.

## Strict Personality Parsing & Consistency Audit

OmniPsyche implements a deterministic and highly resilient multi-framework personality parsing pipeline. This guarantees internal consistency between different typological frameworks and enforces a strict **JSON-only** policy.

### 📋 Core Parsing Rules

1. **Early Framework Declaration**: All frameworks used in the analysis must be fully declared in the `profile_data` block before they are cited or referenced anywhere in the narrative analysis.
2. **Mandatory Enneagram Wings**: If an Enneagram type is present, a wing is mandatory. If not explicitly provided, it is carefully inferred from the MBTI and Tritype:
   - For an **INTJ** with a **5x3** tritype (e.g., `513`), it is inferred as `5w4` (individualistic/abstract).
   - For an **INTJ** with a **5x6** or **5x1** tritype, it is inferred as `5w6` (systematic/vigilant).
3. **Socionics Independence**: Socionics types (e.g., `ILI`, `LII`) are treated as independent parallel frameworks (Model A with 8 functions) rather than plain MBTI aliases. Output notes explicitly state this distinction.
4. **RIASEC Strictness**: Holland RIASEC codes (e.g., `IRC`, `ICA`) are **never** inferred from other frameworks. They are only included if the user explicitly provided Holland/RIASEC/career interest codes.
5. **Attitudinal Psyche Independence**: Attitudinal Psyche types (e.g., `LVFE`, `FLVE`) are analyzed as separate, independent systems and are never framed as "confirming" or "proving" the MBTI.
6. **JSON-Only Guarantee**: The Vertex AI prompt strictly forbids markdown blocks, backticks, or prefix/suffix commentaries.

### 🔍 JSON Validation & Auto-Repair

- **Zod Schema Validation**: The AI response is parsed and strictly validated against the `personalityAnalysisSchema` defined in `src/lib/personality-json-schema.ts`.
- **Fail-Safe Repair Retry**: If the initial response violates the schema or is malformed, OmniPsyche automatically triggers a single-retry repair loop, passing the validation errors back to Vertex AI to heal the output.
- **Backward Compatibility**: The validated JSON is dynamically formatted into beautiful, structured markdown using `parsedJsonToMarkdown` before saving to the database's `markdown` field, ensuring the existing UI pages render correctly. Both the markdown and structured `parsedJson` are persisted.

### 🧪 Running the Parser Tests

We have included a dedicated CLI utility to verify parser extraction, wing inference, and RIASEC exclusion rules across cases 1-4:

```bash
npx tsx src/lib/test-personality.ts
```

## Tech Stack

* **Framework**: Next.js App Router
* **Database**: PostgreSQL with Prisma ORM
* **Styling**: Tailwind CSS, Framer Motion
* **AI Core**: Google Gen AI SDK with Vertex AI mode
* **Icons**: Lucide React

---

Built by Adis Abhista
