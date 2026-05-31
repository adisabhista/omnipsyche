# Deploy OmniPsyche to Google Cloud Platform

This guide prepares a production deployment with:

- Cloud Run for the Next.js service
- Cloud SQL for PostgreSQL
- Secret Manager for application secrets
- Artifact Registry for container images
- GitHub Actions with Workload Identity Federation (WIF)
- A separate Cloud Run Job for Prisma migrations

OmniPsyche uses Gemini API key authentication. Vertex AI credentials are not
required.

## 1. Choose project values

The examples use Jakarta:

```bash
export PROJECT_ID="your-gcp-project-id"
export REGION="asia-southeast2"
export REPOSITORY="omnipsyche"
export SERVICE="omnipsyche"
export MIGRATION_JOB="omnipsyche-migrate"
export SQL_INSTANCE="omnipsyche-postgres"
export DB_NAME="omnipsyche"
export DB_USER="omnipsyche"
export RUNTIME_SERVICE_ACCOUNT="omnipsyche-runner@$PROJECT_ID.iam.gserviceaccount.com"
export DEPLOYER_SERVICE_ACCOUNT="github-actions-deployer@$PROJECT_ID.iam.gserviceaccount.com"

gcloud config set project "$PROJECT_ID"
```

## 2. Enable required APIs

```bash
gcloud services enable \
  artifactregistry.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  sqladmin.googleapis.com \
  sts.googleapis.com
```

Enable `cloudbuild.googleapis.com` only if Cloud Build will also be used.

## 3. Create Artifact Registry

```bash
gcloud artifacts repositories create "$REPOSITORY" \
  --repository-format=docker \
  --location="$REGION" \
  --description="OmniPsyche containers"
```

## 4. Create Cloud SQL PostgreSQL

Create a PostgreSQL instance, database, and application user. Choose a strong
password and store it outside the repository.

```bash
gcloud sql instances create "$SQL_INSTANCE" \
  --database-version=POSTGRES_16 \
  --region="$REGION"

gcloud sql databases create "$DB_NAME" \
  --instance="$SQL_INSTANCE"

gcloud sql users create "$DB_USER" \
  --instance="$SQL_INSTANCE" \
  --password="REPLACE_WITH_STRONG_PASSWORD"

export CLOUD_SQL_INSTANCE_CONNECTION_NAME="$PROJECT_ID:$REGION:$SQL_INSTANCE"
```

Cloud Run connects through a Unix socket. Build the production `DATABASE_URL`
with URL-encoded user and password values:

```text
postgresql://DB_USER:DB_PASSWORD@localhost:5432/DB_NAME?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
```

## 5. Create Secret Manager secrets

Create these secrets:

```text
DATABASE_URL
AUTH_SECRET
NEXTAUTH_SECRET
GEMINI_API_KEY
DEVIL_AI_API_KEY
```

Use stable, randomly generated values for both auth secrets. Do not commit
secret values.

Example:

```bash
printf '%s' 'REPLACE_WITH_DATABASE_URL' | \
  gcloud secrets create DATABASE_URL --data-file=-

printf '%s' 'REPLACE_WITH_STABLE_AUTH_SECRET' | \
  gcloud secrets create AUTH_SECRET --data-file=-

printf '%s' 'REPLACE_WITH_STABLE_NEXTAUTH_SECRET' | \
  gcloud secrets create NEXTAUTH_SECRET --data-file=-

printf '%s' 'REPLACE_WITH_GEMINI_API_KEY' | \
  gcloud secrets create GEMINI_API_KEY --data-file=-

printf '%s' 'REPLACE_WITH_DEVIL_AI_API_KEY' | \
  gcloud secrets create DEVIL_AI_API_KEY --data-file=-
```

For an existing secret, add a version instead:

```bash
printf '%s' 'NEW_VALUE' | gcloud secrets versions add SECRET_NAME --data-file=-
```

## 6. Create runtime service account

```bash
gcloud iam service-accounts create omnipsyche-runner \
  --display-name="OmniPsyche Cloud Run runtime"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$RUNTIME_SERVICE_ACCOUNT" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$RUNTIME_SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"
```

Cloud Run writes logs without an additional Logs Writer grant in the standard
runtime setup.

## 7. Create GitHub Actions deployer service account

```bash
gcloud iam service-accounts create github-actions-deployer \
  --display-name="GitHub Actions Cloud Run deployer"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$DEPLOYER_SERVICE_ACCOUNT" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$DEPLOYER_SERVICE_ACCOUNT" \
  --role="roles/artifactregistry.writer"

gcloud iam service-accounts add-iam-policy-binding \
  "$RUNTIME_SERVICE_ACCOUNT" \
  --member="serviceAccount:$DEPLOYER_SERVICE_ACCOUNT" \
  --role="roles/iam.serviceAccountUser"
```

The deployer creates revisions and configures Secret Manager references. Grant
Secret Manager Viewer if deployment reports that secret metadata cannot be
read:

```bash
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$DEPLOYER_SERVICE_ACCOUNT" \
  --role="roles/secretmanager.viewer"
```

## 8. Configure Workload Identity Federation

Create a workload identity pool and GitHub provider. Restrict the provider to
this repository:

```bash
export PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
export WIF_POOL="github-actions"
export WIF_PROVIDER="github"

gcloud iam workload-identity-pools create "$WIF_POOL" \
  --location="global" \
  --display-name="GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc "$WIF_PROVIDER" \
  --location="global" \
  --workload-identity-pool="$WIF_POOL" \
  --display-name="GitHub" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository == 'adisabhista/omnipsyche'"

gcloud iam service-accounts add-iam-policy-binding \
  "$DEPLOYER_SERVICE_ACCOUNT" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$WIF_POOL/attribute.repository/adisabhista/omnipsyche"
```

The provider identifier for GitHub is:

```text
projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions/providers/github
```

## 9. Configure GitHub repository variables

Add these repository variables in GitHub:

```text
GCP_PROJECT_ID
GCP_REGION
GCP_WORKLOAD_IDENTITY_PROVIDER
GCP_SERVICE_ACCOUNT
CLOUD_RUN_SERVICE
CLOUD_RUN_RUNTIME_SERVICE_ACCOUNT
CLOUD_RUN_MIGRATION_JOB
ARTIFACT_REGISTRY_REPOSITORY
CLOUD_SQL_INSTANCE_CONNECTION_NAME
NEXTAUTH_URL
AUTH_URL
```

Suggested initial values:

```text
GCP_REGION=asia-southeast2
CLOUD_RUN_SERVICE=omnipsyche
CLOUD_RUN_MIGRATION_JOB=omnipsyche-migrate
ARTIFACT_REGISTRY_REPOSITORY=omnipsyche
```

Do not add a service-account JSON key as a GitHub secret. WIF supplies
short-lived credentials.

## 10. Deploy and migrate

Push to `master` or manually run the `Deploy to Cloud Run` workflow. The
workflow:

1. authenticates to Google Cloud through WIF;
2. builds and pushes the service and migrator images;
3. deploys and executes the single-task migration job with
   `prisma migrate deploy`;
4. deploys the service only after migrations succeed.

Do not run `prisma migrate dev` in production. Do not start the application
with `prisma migrate deploy && node server.js`; Cloud Run can start multiple
instances concurrently.

## 11. Allow public access once

After the first service deployment, allow public requests once. NextAuth still
protects application pages.

```bash
gcloud run services add-iam-policy-binding "$SERVICE" \
  --region="$REGION" \
  --member="allUsers" \
  --role="roles/run.invoker"
```

CI deliberately does not modify public IAM policy on every deploy.

## 12. Set the final authentication URL

Set both GitHub variables to the Cloud Run URL or custom domain:

```text
NEXTAUTH_URL=https://YOUR_SERVICE_URL
AUTH_URL=https://YOUR_SERVICE_URL
```

Redeploy after changing them. Keep `AUTH_SECRET` and `NEXTAUTH_SECRET` stable;
changing them can invalidate existing sessions.

## 13. Verify production

Check:

```text
GET /api/health
```

Then test:

1. register and log in;
2. build a profile;
3. generate an analysis;
4. check profile consistency;
5. generate book recommendations;
6. open career and history pages;
7. inspect Cloud Run service and migration-job logs.

## Troubleshooting

### Prisma P2021: table does not exist

Confirm `DATABASE_URL`, Cloud SQL connection name, and migration job logs.
Run the migration job again after fixing configuration.

### NextAuth displays guest state

Confirm `AUTH_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `AUTH_URL`.
Changing auth secrets invalidates previous sessions.

### Cloud SQL connection fails

Confirm the Unix-socket `DATABASE_URL`, `CLOUD_SQL_INSTANCE_CONNECTION_NAME`,
runtime service account, and `roles/cloudsql.client`.

### Gemini API fails

Confirm `GEMINI_API_KEY`, primary model, and fallback model configuration.

### Devil.ai fails

Confirm `DEVIL_AI_API_KEY`, `DEVIL_AI_BASE_URL`, and `DEVIL_AI_LANG`.
