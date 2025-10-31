#!/bin/bash
# Script to set APPWRITE_API_KEY environment variable
# Run this script to set the API key from your .env file

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
    echo "Error: .env file not found"
    exit 1
fi

API_KEY=$(grep "VITE_APPWRITE_API_KEY" .env | cut -d'=' -f2-)

if [ -z "$API_KEY" ]; then
    echo "Error: VITE_APPWRITE_API_KEY not found in .env"
    exit 1
fi

echo "Setting APPWRITE_API_KEY environment variable..."
appwrite functions create-variable \
  --function-id=process-document \
  --key=APPWRITE_API_KEY \
  --value="$API_KEY" \
  --secret=true

echo "Done!"

