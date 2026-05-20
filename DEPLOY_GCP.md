# Operation Cloud Ascendance: Deployment Guide (GCP)

This guide deploys **OmniPsyche** to **Google Cloud Run** using Vertex AI for Gemini. OmniPsyche uses IAM/service account authentication and does not use Gemini API keys.

## Prerequisites

1. Google Cloud CLI installed and authenticated.
2. Docker running locally if building locally.
3. A Google Cloud project with billing enabled.
4. A Cloud Run service account with the **Vertex AI User** role (`roles/aiplatform.user`).

## Step 1: Setup & Configuration

Set project and region variables for the session:

```bash
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"
export SERVICE_NAME="omnipsyche"
export SERVICE_ACCOUNT="omnipsyche-run@$PROJECT_ID.iam.gserviceaccount.com"

gcloud config set project $PROJECT_ID
```

## Step 2: Enable Required APIs

Enable Artifact Registry, Cloud Build, Cloud Run, and Vertex AI:

```bash
gcloud services enable \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    aiplatform.googleapis.com
```

## Step 3: Create or Configure the Cloud Run Service Account

Create a service account if you do not already have one:

```bash
gcloud iam service-accounts create omnipsyche-run \
    --display-name="OmniPsyche Cloud Run"
```

Grant Vertex AI access:

```bash
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/aiplatform.user"
```

## Step 4: Create Artifact Registry Repository

Create a Docker repository for container images:

```bash
gcloud artifacts repositories create omnipsyche-repo \
    --repository-format=docker \
    --location=$REGION \
    --description="Docker repository for OmniPsyche"
```

## Step 5: Build & Push Container

Using Cloud Build:

```bash
gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/omnipsyche-repo/$SERVICE_NAME:latest .
```

Or build and push locally:

```bash
gcloud auth configure-docker $REGION-docker.pkg.dev
docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/omnipsyche-repo/$SERVICE_NAME:latest .
docker push $REGION-docker.pkg.dev/$PROJECT_ID/omnipsyche-repo/$SERVICE_NAME:latest
```

## Step 6: Deploy to Cloud Run

Deploy the container with Vertex AI environment variables:

```bash
gcloud run deploy $SERVICE_NAME \
    --image $REGION-docker.pkg.dev/$PROJECT_ID/omnipsyche-repo/$SERVICE_NAME:latest \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --service-account $SERVICE_ACCOUNT \
    --port 3000 \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --set-env-vars GOOGLE_VERTEX_AI_PROJECT_ID="$PROJECT_ID",GOOGLE_VERTEX_AI_LOCATION="us-central1",GOOGLE_GENAI_USE_VERTEXAI="true",GEMINI_PERSONALITY_MODEL="gemini-2.0-flash"
```

Do not set `GEMINI_API_KEY` or `NEXT_PUBLIC_GEMINI_API_KEY`.

## Step 7: Verification

After deployment, open the Cloud Run service URL and test:

1. Narrative Mirror.
2. Grand Synthesis.
3. Server logs for Vertex AI permission or model-region errors.

If Vertex AI returns a permission error, confirm the deployed service account has `roles/aiplatform.user`. If the model is unavailable, set `GOOGLE_VERTEX_AI_LOCATION` and `GEMINI_PERSONALITY_MODEL` to a supported pairing for your project.

Fallback compatibility names are also supported by the server: `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_LOCATION`, and `VERTEX_AI_MODEL`.
