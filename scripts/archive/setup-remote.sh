#!/bin/bash

# Script to help setup Supabase Remote connection
# This script will guide you through the setup process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Supabase Remote Setup Assistant                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Supabase CLI is installed
echo -e "${CYAN}[1/5] Checking Supabase CLI...${NC}"
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}✗ Supabase CLI is not installed${NC}"
    echo ""
    echo -e "${YELLOW}Install it with:${NC}"
    echo "  brew install supabase/tap/supabase"
    echo ""
    exit 1
else
    SUPABASE_VERSION=$(supabase --version)
    echo -e "${GREEN}✓ Supabase CLI installed: $SUPABASE_VERSION${NC}"
fi

echo ""

# Check if .env.local exists and has values
echo -e "${CYAN}[2/5] Checking environment variables...${NC}"
if [ ! -f ".env.local" ]; then
    echo -e "${RED}✗ .env.local file not found${NC}"
    exit 1
fi

# Check if env vars are set
SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d '=' -f2)
ANON_KEY=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local | cut -d '=' -f2)
SERVICE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d '=' -f2)

if [[ "$SUPABASE_URL" == "your-supabase-url" ]] || [[ -z "$SUPABASE_URL" ]]; then
    echo -e "${RED}✗ NEXT_PUBLIC_SUPABASE_URL not configured${NC}"
    echo ""
    echo -e "${YELLOW}Please update .env.local with your Supabase credentials:${NC}"
    echo "1. Go to https://supabase.com/dashboard"
    echo "2. Select your project"
    echo "3. Go to Settings > API"
    echo "4. Copy the values to .env.local"
    echo ""
    echo -e "${YELLOW}Need to create a project? Visit:${NC}"
    echo "https://supabase.com/dashboard"
    echo ""
    exit 1
else
    echo -e "${GREEN}✓ Environment variables configured${NC}"
    # Extract project ref from URL
    PROJECT_REF=$(echo $SUPABASE_URL | sed -E 's/https:\/\/([^.]+).*/\1/')
    echo -e "${BLUE}  Project: $PROJECT_REF${NC}"
fi

echo ""

# Check if project is linked
echo -e "${CYAN}[3/5] Checking project link...${NC}"
if [ ! -f "supabase/.temp/project-ref" ]; then
    echo -e "${YELLOW}⚠ Project not linked yet${NC}"
    echo ""
    echo -e "${YELLOW}Let's link your project now!${NC}"
    echo -e "${BLUE}Project Reference ID: $PROJECT_REF${NC}"
    echo ""
    read -p "Press Enter to continue with linking..."
    
    supabase link --project-ref "$PROJECT_REF"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Project linked successfully!${NC}"
    else
        echo -e "${RED}✗ Failed to link project${NC}"
        exit 1
    fi
else
    LINKED_REF=$(cat supabase/.temp/project-ref)
    echo -e "${GREEN}✓ Project linked: $LINKED_REF${NC}"
fi

echo ""

# Check migrations
echo -e "${CYAN}[4/5] Checking migrations...${NC}"
if [ ! -d "supabase/migrations" ] || [ -z "$(ls -A supabase/migrations)" ]; then
    echo -e "${YELLOW}⚠ No migrations found${NC}"
else
    MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l | tr -d ' ')
    echo -e "${GREEN}✓ Found $MIGRATION_COUNT migration(s)${NC}"
    ls -1 supabase/migrations/*.sql 2>/dev/null | while read file; do
        echo -e "${BLUE}  - $(basename $file)${NC}"
    done
fi

echo ""

# Ask if user wants to push migrations
echo -e "${CYAN}[5/5] Ready to push migrations${NC}"
echo ""
echo -e "${YELLOW}Do you want to push migrations to remote database now?${NC}"
read -p "Push migrations? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${BLUE}Pushing migrations to remote database...${NC}"
    supabase db push
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║  ✓ Setup Complete!                                    ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${BLUE}Next steps:${NC}"
        echo "1. Verify tables in Supabase Dashboard > Database > Tables"
        echo "2. Check migrations in Dashboard > Database > Migrations"
        echo "3. Start your Next.js app: npm run dev"
        echo ""
        echo -e "${BLUE}Useful commands:${NC}"
        echo "  npm run db:push   - Push new migrations"
        echo "  npm run db:status - Check connection status"
        echo ""
    else
        echo -e "${RED}✗ Failed to push migrations${NC}"
        exit 1
    fi
else
    echo ""
    echo -e "${YELLOW}Skipped migration push${NC}"
    echo -e "${BLUE}You can push migrations later with:${NC}"
    echo "  npm run db:push"
    echo ""
fi
