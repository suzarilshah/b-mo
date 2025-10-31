#!/bin/bash
# Script to verify database schema using NeonDB connection

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Verifying database schema...${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Get database URL from .env
DB_URL=$(grep "VITE_NEON_DATABASE_URL" .env | cut -d'=' -f2- | tr -d '"' | tr -d "'")

if [ -z "$DB_URL" ]; then
    echo -e "${RED}Error: VITE_NEON_DATABASE_URL not found in .env${NC}"
    exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql is not installed${NC}"
    echo "Install PostgreSQL client tools to use this script"
    exit 1
fi

# Run verification queries
echo -e "${YELLOW}Running schema verification...${NC}"
psql "$DB_URL" -f "$(dirname "$0")/verify-schema.sql"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Schema verification completed!${NC}"
else
    echo -e "${RED}Schema verification failed. Check the errors above.${NC}"
    exit 1
fi

