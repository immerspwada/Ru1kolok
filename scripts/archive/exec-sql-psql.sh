#!/bin/bash

# Script to execute SQL using psql directly
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

echo -e "${BLUE}=== Executing SQL on Supabase Remote Database ===${NC}"
echo -e "${YELLOW}File: $SQL_FILE${NC}"
echo ""

# Project details
PROJECT_REF="erovdghgvhjdqcmulnfa"
REGION="aws-1-ap-south-1"

# Ask for database password
echo -e "${YELLOW}Enter your Supabase database password:${NC}"
echo -e "${BLUE}(This is the password you set when creating the project)${NC}"
read -s DB_PASSWORD
echo ""

# Connection details
DB_HOST="${REGION}.pooler.supabase.com"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres.${PROJECT_REF}"

echo -e "${YELLOW}Connecting to database...${NC}"
echo -e "${BLUE}Host: $DB_HOST${NC}"
echo ""

# Execute SQL
PGPASSWORD="$DB_PASSWORD" psql \
  "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require" \
  -f "$SQL_FILE" \
  -v ON_ERROR_STOP=1

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✓ SQL Executed Successfully!                         ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Database setup complete!${NC}"
    echo ""
    echo -e "${YELLOW}Verify in Supabase Dashboard:${NC}"
    echo "https://supabase.com/dashboard/project/erovdghgvhjdqcmulnfa/editor"
    echo ""
else
    echo ""
    echo -e "${RED}✗ Failed to execute SQL${NC}"
    exit 1
fi
