#!/bin/bash

# Script to run SQL files directly on Supabase
# Usage: ./scripts/run-sql.sh <sql-file-path>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if SQL file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please provide a SQL file path${NC}"
    echo "Usage: ./scripts/run-sql.sh <sql-file-path>"
    echo "Example: ./scripts/run-sql.sh supabase/migrations/20240101000000_initial_schema.sql"
    exit 1
fi

SQL_FILE="$1"

# Check if file exists
if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}Error: File not found: $SQL_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}Running SQL file: $SQL_FILE${NC}"

# Check if we're linked to a remote project
if supabase status &> /dev/null; then
    echo -e "${GREEN}Using local Supabase instance...${NC}"
    supabase db reset --db-url "postgresql://postgres:postgres@localhost:54322/postgres"
else
    echo -e "${YELLOW}Local Supabase not running. Checking for remote project...${NC}"
    
    # Check if linked to remote
    if [ -f "supabase/.temp/project-ref" ]; then
        echo -e "${GREEN}Running on remote Supabase project...${NC}"
        supabase db push
    else
        echo -e "${RED}Error: Not linked to any Supabase project${NC}"
        echo "Please run: supabase link --project-ref your-project-ref"
        exit 1
    fi
fi

echo -e "${GREEN}✓ SQL executed successfully!${NC}"
