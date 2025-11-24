#!/bin/bash

# Test Rate Limiting Behavior
# This script helps verify that rate limiting is working correctly

echo "🧪 Testing Supabase Rate Limiting"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local not found"
    echo "Please run this script from the sports-club-management directory"
    exit 1
fi

echo "📋 Test Instructions:"
echo ""
echo "1. Open your browser to http://localhost:3000/register"
echo "2. Try to register with these test emails (one at a time):"
echo "   - ratelimit1@test.com"
echo "   - ratelimit2@test.com"
echo "   - ratelimit3@test.com"
echo "   - ratelimit4@test.com"
echo "   - ratelimit5@test.com"
echo ""
echo "3. Expected behavior:"
echo "   ✅ First 2-3 attempts: Should work (or show 'email already exists')"
echo "   ⏱️  After 3-5 attempts: Should show rate limit error"
echo "   ✅ After waiting 1-2 minutes: Should work again"
echo ""
echo "4. Check the console logs for the actual Supabase error message"
echo ""

# Check if dev server is running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Dev server is running on port 3000"
else
    echo "⚠️  Dev server is not running"
    echo "Start it with: npm run dev"
    exit 1
fi

echo ""
echo "🔍 Monitoring server logs..."
echo "Press Ctrl+C to stop"
echo ""

# Tail the dev server logs (if using PM2 or similar)
# Otherwise, just show instructions
echo "💡 Watch your terminal where 'npm run dev' is running"
echo "Look for lines starting with '[signUp] Supabase error:'"
echo ""
echo "Common rate limit error messages from Supabase:"
echo "  - 'Email rate limit exceeded'"
echo "  - 'Too many requests'"
echo "  - 'Rate limit exceeded'"
