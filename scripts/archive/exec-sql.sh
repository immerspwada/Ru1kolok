#!/bin/bash

# Script to execute SQL directly on remote Supabase database
# Usage: ./scripts/exec-sql.sh <sql-file-path>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if SQL file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please provide a SQL file path${NC}"
    echo "Usage: ./scripts/exec-sql.sh <sql-file-path>"
    echo "Example: ./scripts/exec-sql.sh supabase/migrations/20240101000000_initial_schema.sql"
    exit 1
fi

SQL_FILE="$1"

# Check if file exists
if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}Error: File not found: $SQL_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}=== Executing SQL on Supabase ===${NC}"
echo -e "${YELLOW}File: $SQL_FILE${NC}"

# Load environment variables
if [ -f ".env.local" ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check if we have the required environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}Error: Missing Supabase credentials in .env.local${NC}"
    echo "Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

# Extract project ref from URL
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed -E 's/https:\/\/([^.]+).*/\1/')

echo -e "${YELLOW}Project: $PROJECT_REF${NC}"
echo -e "${YELLOW}Executing SQL...${NC}"

# Execute SQL using psql through Supabase
# Note: This requires the project to be linked
supabase db execute --file "$SQL_FILE" --project-ref "$PROJECT_REF"

echo ""
echo -e "${GREEN}✓ SQL executed successfully!${NC}"
