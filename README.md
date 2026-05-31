# OmniPsyche: The Integrated Self Architect

![OmniPsyche Banner](public/banner.jpg)

**OmniPsyche** is an advanced personality synthesis engine that integrates multiple psychological frameworks into a unified, holistic profile. It uses Gemini from server-side Next.js API routes and stores backend test data in PostgreSQL through Prisma.

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

2. Create a server-side Gemini API key in Google AI Studio.

3. Start PostgreSQL locally and create an `omnipsyche` database.

4. Copy `.env.example` to `.env.local` and set your Gemini API configuration:
    ```bash
    cp .env.example .env.local
    ```

    `.env.local` should contain:
    ```env
    DATABASE_URL="postgresql://postgres:postgres@localhost:5432/omnipsyche?schema=public"

    NEXTAUTH_URL="http://localhost:3000"
    NEXTAUTH_SECRET="omnipsyche-local-development-secret-change-me"
    AUTH_SECRET="omnipsyche-local-development-secret-change-me"

    GEMINI_API_KEY="your_api_key"
    GEMINI_API_PRIMARY_MODEL="gemini-3.5-flash"
    GEMINI_API_FALLBACK_MODEL="gemini-2.5-flash"
    ENABLE_AI_MODEL_FALLBACK="true"
    GEMINI_PERSONALITY_MODEL=""

    DEVIL_AI_API_KEY=""
    DEVIL_AI_BASE_URL="https://api.devil.ai/v1"
    DEVIL_AI_LANG="en"
    ```

5. Install dependencies, run the database migration, and start the development server:
    ```bash
    npm install
    npx prisma migrate dev
    npx prisma generate
    npm run dev
    ```

6. Open `http://localhost:3000/register`, create a user, then sign in at `http://localhost:3000/login`.

Do not use `NEXT_PUBLIC_` for AI keys. OmniPsyche keeps AI calls and credentials server-side.

`GEMINI_PERSONALITY_MODEL` is still supported as a legacy primary model alias when `GEMINI_API_PRIMARY_MODEL` is not set.

## AI Model Configuration

OmniPsyche now uses Gemini API key authentication, not Vertex AI. The app tries the primary model first and, when `ENABLE_AI_MODEL_FALLBACK="true"`, automatically uses the fallback model for Gemini model availability or access failures.

```env
GEMINI_API_KEY="your_api_key"
GEMINI_API_PRIMARY_MODEL="gemini-3.5-flash"
GEMINI_API_FALLBACK_MODEL="gemini-2.5-flash"
ENABLE_AI_MODEL_FALLBACK="true"
```

Vertex AI environment variables such as `GOOGLE_APPLICATION_CREDENTIALS`, `GOOGLE_CLOUD_PROJECT`, `GOOGLE_VERTEX_AI_PROJECT_ID`, and `GOOGLE_GENAI_USE_VERTEXAI` are no longer required for AI generation. Restart `npm run dev` after changing `.env.local`.

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
npx prisma migrate dev
npx prisma generate
npx prisma studio
```

For production or an existing deployed database, apply committed migrations without creating a new migration:

```bash
npx prisma migrate deploy
npx prisma generate
```

### Prisma Troubleshooting

If Prisma reports `P2021` (`table does not exist`), the database schema has not received the committed migrations. Confirm that `DATABASE_URL` points to the intended PostgreSQL database, then run:

```bash
npx prisma migrate deploy
npx prisma generate
```

For a local development database, use `npx prisma migrate dev` instead. Restart `npm run dev` after applying migrations.

## Production Deployment

OmniPsyche is prepared for deployment with:

* Cloud Run for the standalone Next.js service
* Cloud SQL PostgreSQL through a Unix socket
* Secret Manager for database, authentication, Gemini, and Devil.ai secrets
* Artifact Registry for Docker images
* GitHub Actions with Workload Identity Federation
* A separate Cloud Run Job for `prisma migrate deploy`

The deployment workflow builds a service image and a migration image. It runs
the migration job before releasing a new service revision. Migrations are not
executed during application startup because Cloud Run can start multiple
instances concurrently.

Production secrets:

```env
DATABASE_URL="postgresql://DB_USER:DB_PASSWORD@localhost:5432/DB_NAME?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME"
AUTH_SECRET="stable-secret"
NEXTAUTH_SECRET="stable-secret"
GEMINI_API_KEY="your_api_key"
DEVIL_AI_API_KEY="your_api_key"
```

Production non-secret environment:

```env
NEXTAUTH_URL="https://your-service-url"
AUTH_URL="https://your-service-url"
GEMINI_API_PRIMARY_MODEL="gemini-3.5-flash"
GEMINI_API_FALLBACK_MODEL="gemini-2.5-flash"
ENABLE_AI_MODEL_FALLBACK="true"
DEVIL_AI_BASE_URL="https://api.devil.ai/v1"
DEVIL_AI_LANG="en"
NODE_ENV="production"
```

Do not expose API keys with `NEXT_PUBLIC_` variables. Vertex AI service
account JSON and project/region variables are not required for AI generation.

The complete setup guide is in
[`docs/deployment-gcp.md`](docs/deployment-gcp.md).

## CI/CD

Pull requests and pushes to `master` or `main` run:

```bash
npm ci
npm run prisma:generate
npm run lint
npm run build
```

Pushes to `master` or `main` also trigger the Cloud Run deployment workflow.
GitHub uses short-lived Workload Identity Federation credentials, not a
service-account JSON key.

## Production Troubleshooting

### NextAuth shows guest state

Confirm that `AUTH_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `AUTH_URL`
are set consistently. Changing auth secrets invalidates existing sessions.

### Cloud SQL connection fails

Confirm the Unix-socket `DATABASE_URL`, Cloud SQL instance connection name,
and the runtime service account's Cloud SQL Client role.

### Gemini API fails

Confirm `GEMINI_API_KEY`, `GEMINI_API_PRIMARY_MODEL`, and
`GEMINI_API_FALLBACK_MODEL`.

### Devil.ai fails

Confirm `DEVIL_AI_API_KEY`, `DEVIL_AI_BASE_URL`, and `DEVIL_AI_LANG`.

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
6. **JSON-Only Guarantee**: The Gemini prompt strictly forbids markdown blocks, backticks, or prefix/suffix commentaries.

### 🔍 JSON Validation & Auto-Repair

- **Zod Schema Validation**: The AI response is parsed and strictly validated against the `personalityAnalysisSchema` defined in `src/lib/personality-json-schema.ts`.
- **Fail-Safe Repair Retry**: If the initial response violates the schema or is malformed, OmniPsyche automatically triggers a single-retry repair loop, passing the validation errors back to Gemini to heal the output.
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
* **AI Core**: Google Gen AI SDK with Gemini API key authentication
* **Icons**: Lucide React

---

Built by Adis Abhista
