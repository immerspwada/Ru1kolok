#!/bin/bash

# ============================================================================
# Setup Storage RLS Policies via psql
# ============================================================================

set -e

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check required environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL not found in .env.local"
  exit 1
fi

# Extract project ref and construct database URL
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed -E 's/https:\/\/([^.]+).*/\1/')
DB_URL="postgresql://postgres.${PROJECT_REF}:${SUPABASE_SERVICE_ROLE_KEY}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

echo "╔═══════════════════════════════════════════════════════╗"
echo "║  Setup Storage RLS Policies                           ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "Project: $PROJECT_REF"
echo ""

# Execute SQL file
echo "Executing storage RLS policies..."
psql "$DB_URL" -f scripts/42-storage-rls-policies.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "╔═══════════════════════════════════════════════════════╗"
  echo "║  ✓ Storage RLS Policies Configured Successfully       ║"
  echo "╚═══════════════════════════════════════════════════════╝"
  echo ""
  echo "✅ Users can now upload documents during registration"
  exit 0
else
  echo ""
  echo "╔═══════════════════════════════════════════════════════╗"
  echo "║  ✗ Failed to Configure Policies                       ║"
  echo "╚═══════════════════════════════════════════════════════╝"
  exit 1
fi
