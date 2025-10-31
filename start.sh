#!/bin/bash

# B-mo Local Development Startup Script

echo "🚀 Starting B-mo Platform..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Please create a .env file with your configuration."
    echo "See README.md for required environment variables."
    echo ""
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18+ required. Current version: $(node -v)"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if database connection is configured
if grep -q "VITE_NEON_DATABASE_URL" .env 2>/dev/null; then
    echo "✅ Database configuration found"
else
    echo "⚠️  Warning: Database configuration not found in .env"
fi

# Check if Azure services are configured
if grep -q "VITE_AZURE_GPT5_ENDPOINT" .env 2>/dev/null; then
    echo "✅ Azure services configuration found"
else
    echo "⚠️  Warning: Azure services configuration not found in .env"
fi

# Check if Appwrite is configured
if grep -q "VITE_APPWRITE_ENDPOINT" .env 2>/dev/null; then
    echo "✅ Appwrite configuration found"
else
    echo "⚠️  Warning: Appwrite configuration not found in .env"
fi

echo ""
echo "🔧 Starting development server..."
echo "📱 Application will be available at: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the development server
npm run dev

