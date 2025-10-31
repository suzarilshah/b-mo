# Deploy Appwrite Function: process-document

This guide explains how to deploy the `process-document` Appwrite Function that handles document processing (OCR, embeddings, NeonDB storage).

## Prerequisites

1. Appwrite CLI installed: `npm install -g appwrite-cli`
2. Logged in to Appwrite: `appwrite login`
3. Project initialized: `appwrite init project` (select project `b-mo`)

## Option 1: Using the Deployment Script

```bash
cd appwrite/functions
./deploy-process-document.sh
```

## Option 2: Manual Deployment via CLI

### Step 1: Create the Function

```bash
appwrite functions create \
  --functionId=process-document \
  --name="Process Document" \
  --runtime=node-18.0 \
  --execute="users" \
  --enabled=true
```

### Step 2: Deploy the Function Code

```bash
cd appwrite/functions/process-document

appwrite functions createDeployment \
  --functionId=process-document \
  --entrypoint="index.ts" \
  --activate=true \
  --code="."
```

### Step 3: Set Environment Variables

Go to **Appwrite Console > Functions > process-document > Settings > Environment Variables**

Add the following variables:

**Appwrite Variables:**
- `APPWRITE_ENDPOINT` = `https://sgp.cloud.appwrite.io/v1`
- `APPWRITE_PROJECT_ID` = `b-mo`
- `APPWRITE_API_KEY` = (your API key from .env)
- `APPWRITE_BUCKET_ID` = `invoices`

**Azure Variables:**
- `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT` = `https://flowfis.cognitiveservices.azure.com/`
- `AZURE_DOCUMENT_INTELLIGENCE_KEY` = (your key from .env)
- `AZURE_EMBEDDINGS_ENDPOINT` = `https://flowfi.services.ai.azure.com/models`
- `AZURE_EMBEDDINGS_API_KEY` = (your key from .env)
- `AZURE_EMBEDDINGS_MODEL` = `embed-v-4-0`
- `AZURE_EMBEDDINGS_DIMENSIONS` = `1024`

**Database Variable:**
- `NEON_DATABASE_URL` = (your connection string from .env)

## Option 3: Via Appwrite Console (Web UI)

1. Go to [Appwrite Console](https://sgp.cloud.appwrite.io)
2. Navigate to **Functions**
3. Click **Create Function**
4. Set:
   - Function ID: `process-document`
   - Name: `Process Document`
   - Runtime: `Node.js 18.0`
5. Click **Create**
6. Go to **Deployments** tab
7. Click **Create Deployment**
8. Upload or paste the code from `appwrite/functions/process-document/index.ts`
9. Set entrypoint to `index.ts`
10. Click **Deploy**
11. Go to **Settings** tab
12. Add all environment variables listed above
13. Enable the function

## Verify Deployment

After deployment, verify the function:

```bash
appwrite functions list
appwrite functions get --functionId=process-document
```

Test the function execution:

```bash
appwrite functions createExecution \
  --functionId=process-document \
  --data='{"fileId":"test","companyId":"test","uploadedBy":"test","fileName":"test.pdf","fileType":"application/pdf","fileSize":1000}'
```

## Troubleshooting

### Function Not Found
- Ensure the function ID matches exactly: `process-document`
- Check that you're in the correct project

### Deployment Fails
- Verify all dependencies are in `package.json`
- Check that `index.ts` has the correct export: `export default async function(context: any)`
- Ensure entrypoint is set to `index.ts`

### Environment Variables Not Working
- Variables must be set in Appwrite Console, not just in `.env`
- Restart the function after adding variables
- Check variable names match exactly (case-sensitive)

### Runtime Errors
- Check function logs in Appwrite Console
- Verify all API keys are correct
- Ensure NeonDB connection string is valid

## Function Overview

The `process-document` function:

1. **Downloads** file from Appwrite Storage
2. **Processes** with Azure Document Intelligence (OCR)
3. **Generates** embeddings using Azure Embeddings API
4. **Stores** document metadata and embeddings in NeonDB
5. **Returns** document ID and processing status

## Security Notes

- API keys should only be set in Appwrite Console environment variables
- Never commit `.env` files with real API keys
- Use different API keys for development and production

