# OmniPsyche Agent Instructions

## Product Direction

- OmniPsyche is a modular personality intelligence platform.
- The application must support future modules:
  - Tipologi
  - Bangun Profil
  - Analisis
  - Karier
  - Buku
  - Riwayat
- Do not keep the app as a single manual input page.
- Use Indonesian for all visible UI copy.

## Architecture

- Use Next.js App Router routes for application pages and server endpoints.
- Keep AI calls server-side.
- Do not expose credentials to the browser.

## AI and Environment

- Use Vertex AI through GCP, not a Gemini API key.
- Preferred environment variables:
  - `GOOGLE_VERTEX_AI_PROJECT_ID`
  - `GOOGLE_VERTEX_AI_LOCATION`
  - `GEMINI_PERSONALITY_MODEL`
- Default model:
  - `gemini-2.5-flash`
