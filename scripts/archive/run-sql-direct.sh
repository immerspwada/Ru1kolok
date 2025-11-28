#!/bin/bash

# Script to run SQL directly via psql connection
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SQL_FILE="${1:-scripts/combined-migration.sql}"

if [ ! -f "$SQL_FILE" ]; then
    echo -e "${RED}Error: SQL file not found: $SQL_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}=== Running SQL via Direct Connection ===${NC}"
echo -e "${YELLOW}File: $SQL_FILE${NC}"

# Get database connection string from Supabase
PROJECT_REF="erovdghgvhjdqcmulnfa"
DB_PASSWORD="${SUPABASE_DB_PASSWORD}"

if [ -z "$DB_PASSWORD" ]; then
    echo -e "${YELLOW}Enter your database password:${NC}"
    read -s DB_PASSWORD
fi

# Connection string
DB_URL="postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"

echo -e "${YELLOW}Executing SQL...${NC}"

# Run SQL using psql
PGPASSWORD="$DB_PASSWORD" psql "$DB_URL" -f "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ SQL executed successfully!${NC}"
else
    echo ""
    echo -e "${RED}✗ Failed to execute SQL${NC}"
    exit 1
fi
