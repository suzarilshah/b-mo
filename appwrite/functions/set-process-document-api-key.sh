#!/bin/bash
# Set APPWRITE_API_KEY for process-document function

cd "$(dirname "$0")/../.."

API_KEY=$(grep "^VITE_APPWRITE_API_KEY=" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$API_KEY" ]; then
    echo "Error: VITE_APPWRITE_API_KEY not found in .env"
    exit 1
fi

echo "Setting APPWRITE_API_KEY..."
appwrite functions create-variable \
  --function-id=process-document \
  --key=APPWRITE_API_KEY \
  --value="$API_KEY" \
  --secret=true

echo "Done!"

