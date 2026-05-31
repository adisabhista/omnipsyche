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

- Use Gemini API key authentication server-side, not Vertex AI.
- Preferred environment variables:
  - `GEMINI_API_KEY`
  - `GEMINI_API_PRIMARY_MODEL`
  - `GEMINI_API_FALLBACK_MODEL`
  - `ENABLE_AI_MODEL_FALLBACK`
- Default primary model:
  - `gemini-3.5-flash`
- Default fallback model:
  - `gemini-2.5-flash`
