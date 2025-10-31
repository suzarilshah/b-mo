#!/bin/bash
# Deployment script for process-document Appwrite Function

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Deploying process-document Appwrite Function...${NC}"

# Check if Appwrite CLI is installed
if ! command -v appwrite &> /dev/null; then
    echo -e "${RED}Error: Appwrite CLI is not installed.${NC}"
    echo "Install it with: npm install -g appwrite-cli"
    exit 1
fi

# Navigate to function directory
cd "$(dirname "$0")/process-document"

# Create the function (if it doesn't exist)
echo -e "${YELLOW}Creating function (if it doesn't exist)...${NC}"
appwrite functions create \
  --functionId=process-document \
  --name="Process Document" \
  --runtime=node-18.0 \
  --execute="users" \
  --enabled=true \
  || echo "Function may already exist, continuing..."

# Deploy the function
echo -e "${YELLOW}Deploying function code...${NC}"
appwrite functions createDeployment \
  --functionId=process-document \
  --entrypoint="index.ts" \
  --activate=true \
  --code="." \
  || echo -e "${RED}Deployment failed. Check the error above.${NC}"

# Set environment variables
echo -e "${YELLOW}Setting environment variables...${NC}"

# Note: Environment variables need to be set via Appwrite Console or CLI
# The following commands set each variable

ENV_VARS=(
  "APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1"
  "APPWRITE_PROJECT_ID=b-mo"
  "APPWRITE_BUCKET_ID=invoices"
  "AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://flowfis.cognitiveservices.azure.com/"
  "AZURE_EMBEDDINGS_ENDPOINT=https://flowfi.services.ai.azure.com/models"
  "AZURE_EMBEDDINGS_MODEL=embed-v-4-0"
  "AZURE_EMBEDDINGS_DIMENSIONS=1024"
)

# Note: The API keys should be set via Appwrite Console for security
# These are sensitive and should not be exposed in scripts

echo -e "${YELLOW}To set environment variables:${NC}"
echo "1. Go to Appwrite Console > Functions > process-document > Settings"
echo "2. Add the following environment variables:"
echo "   - APPWRITE_API_KEY (from your .env file)"
echo "   - AZURE_DOCUMENT_INTELLIGENCE_KEY (from your .env file)"
echo "   - AZURE_EMBEDDINGS_API_KEY (from your .env file)"
echo "   - NEON_DATABASE_URL (from your .env file)"
echo ""
for var in "${ENV_VARS[@]}"; do
  echo "   - $var"
done

echo -e "${GREEN}Function deployment script completed!${NC}"
echo -e "${YELLOW}Remember to set sensitive environment variables in Appwrite Console.${NC}"

