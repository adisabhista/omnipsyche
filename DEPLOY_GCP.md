# 🚀 Operation Cloud Ascendance: Deployment Guide (GCP)

This guide outlines the steps to deploy **OmniPsyche** to **Google Cloud Run** using the Google Cloud CLI (`gcloud`).

## Prerequisites

1.  **Google Cloud SDK**: Ensure `gcloud` CLI is installed and authenticated.
2.  **Docker**: Ensure Docker is running locally (if building locally).
3.  **GCP Project**: You need an active Google Cloud Project with billing enabled.

## Step 1: Setup & Configuration

Set your project ID and region variables for the session:

```bash
# Replace with your actual Project ID
export PROJECT_ID="your-gcp-project-id"
export REGION="asia-southeast2" # Jakarta region (or us-central1)
export SERVICE_NAME="omnipsyche"

gcloud config set project $PROJECT_ID
```

## Step 2: Enable Required APIs

Enable the Artifact Registry and Cloud Run APIs:

```bash
gcloud services enable artifactregistry.googleapis.com run.googleapis.com
```

## Step 3: Create Artifact Registry Repository

Create a Docker repository to store your container images:

```bash
gcloud artifacts repositories create omnipsyche-repo \
    --repository-format=docker \
    --location=$REGION \
    --description="Docker repository for OmniPsyche"
```

## Step 4: Build & Push Container

Build the image using Cloud Build (no local Docker required) or local Docker.

**Option A: Using Cloud Build (Recommended - Easiest)**
This uploads your source code and builds it on Google's servers.

```bash
gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/omnipsyche-repo/$SERVICE_NAME:latest .
```

**Option B: Local Build & Push**
```bash
# Configure Docker to authenticate with GCP
gcloud auth configure-docker $REGION-docker.pkg.dev

# Build
docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/omnipsyche-repo/$SERVICE_NAME:latest .

# Push
docker push $REGION-docker.pkg.dev/$PROJECT_ID/omnipsyche-repo/$SERVICE_NAME:latest
```

## Step 5: Deploy to Cloud Run

Deploy the container to Cloud Run. **Crucial:** This is where we inject the Gemini API Key.

```bash
gcloud run deploy $SERVICE_NAME \
    --image $REGION-docker.pkg.dev/$PROJECT_ID/omnipsyche-repo/$SERVICE_NAME:latest \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --port 3000 \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --set-env-vars NEXT_PUBLIC_GEMINI_API_KEY="YOUR_ACTUAL_API_KEY_HERE"
```

*Note: Replace `YOUR_ACTUAL_API_KEY_HERE` with your real Gemini API key.*

## Step 6: Verification

Once deployed, the command will output a **Service URL** (e.g., `https://omnipsyche-xyz-uc.a.run.app`).

1.  Open the URL in your browser.
2.  Test the "Narrative Mirror" or "Grand Synthesis" features.
3.  Verify that the analysis completes without timeout (Cloud Run allows up to 60 mins, default is 5 mins).

---

**Mission Accomplished.** 🛸
