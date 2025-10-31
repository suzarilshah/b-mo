#!/bin/bash
# Script to set ALL missing secret environment variables for process-document function
# Run this script to set the variables from your .env file

cd "$(dirname "$0")/../.."

if [ ! -f .env ]; then
    echo "Error: .env file not found"
    exit 1
fi

echo "Setting environment variables for process-document function..."

# Read values from .env (remove VITE_ prefix if present)
AZURE_DOC_KEY=$(grep "AZURE_DOCUMENT_INTELLIGENCE_KEY" .env | cut -d'=' -f2- | sed 's/^VITE_//')
AZURE_EMB_KEY=$(grep "AZURE_EMBEDDINGS_API_KEY" .env | cut -d'=' -f2- | sed 's/^VITE_//')
NEON_DB_URL=$(grep "NEON_DATABASE_URL" .env | cut -d'=' -f2- | sed 's/^VITE_//')

if [ -z "$AZURE_DOC_KEY" ]; then
    echo "Error: AZURE_DOCUMENT_INTELLIGENCE_KEY not found in .env"
    exit 1
fi

if [ -z "$AZURE_EMB_KEY" ]; then
    echo "Error: AZURE_EMBEDDINGS_API_KEY not found in .env"
    exit 1
fi

if [ -z "$NEON_DB_URL" ]; then
    echo "Error: NEON_DATABASE_URL not found in .env"
    exit 1
fi

echo "Updating AZURE_DOCUMENT_INTELLIGENCE_KEY..."
appwrite functions update-variable \
  --function-id=process-document \
  --variable-id=6905181ca83685245d4d \
  --key=AZURE_DOCUMENT_INTELLIGENCE_KEY \
  --value="$AZURE_DOC_KEY" \
  --secret=true

echo "Updating AZURE_EMBEDDINGS_API_KEY..."
appwrite functions update-variable \
  --function-id=process-document \
  --variable-id=6905182020fd3a6c4d8a \
  --key=AZURE_EMBEDDINGS_API_KEY \
  --value="$AZURE_EMB_KEY" \
  --secret=true

echo "Updating NEON_DATABASE_URL..."
appwrite functions update-variable \
  --function-id=process-document \
  --variable-id=690518244cffd57c2793 \
  --key=NEON_DATABASE_URL \
  --value="$NEON_DB_URL" \
  --secret=true

echo ""
echo "✅ All variables updated!"
echo ""
echo "⚠️  IMPORTANT: You MUST redeploy the function for changes to take effect:"
echo "   cd appwrite/functions/process-document"
echo "   appwrite functions create-deployment --function-id=process-document --entrypoint=index.ts --activate=true --code=."

