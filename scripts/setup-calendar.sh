#!/bin/bash

# LinearTime Calendar Integration Setup Script
# This script helps you set up calendar integrations for LinearTime

set -e

echo "🗓️  LinearTime Calendar Integration Setup"
echo "========================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local
    echo "✅ .env.local created"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "🔑 Generating encryption keys..."

# Generate encryption key
ENCRYPTION_KEY=$(openssl rand -hex 32)
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"

# Generate webhook secret
WEBHOOK_SECRET=$(openssl rand -hex 32)
echo "WEBHOOK_SECRET=$WEBHOOK_SECRET"

echo ""
echo "📋 Next Steps:"
echo "============="
echo ""
echo "1. Google Calendar Setup:"
echo "   - Go to https://console.cloud.google.com/"
echo "   - Create a new project or select existing"
echo "   - Enable Google Calendar API"
echo "   - Create OAuth 2.0 credentials"
echo "   - Add the Client ID and Secret to .env.local"
echo ""
echo "2. Microsoft Calendar Setup (Optional):"
echo "   - Go to https://portal.azure.com/"
echo "   - Register a new application"
echo "   - Add Microsoft Graph permissions"
echo "   - Add the Application ID and Secret to .env.local"
echo ""
echo "3. Update .env.local with:"
echo "   - ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo "   - WEBHOOK_SECRET=$WEBHOOK_SECRET"
echo "   - Your OAuth credentials"
echo ""
echo "4. Start the development server:"
echo "   pnpm dev"
echo ""
echo "5. Navigate to:"
echo "   http://localhost:3000/settings/integrations"
echo ""
echo "📚 Full documentation:"
echo "   docs/GOOGLE_CALENDAR_SETUP.md"
echo "   docs/CALENDAR_INTEGRATION.md"
echo ""

# Offer to open documentation
read -p "Would you like to open the setup documentation? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v code &> /dev/null; then
        code docs/GOOGLE_CALENDAR_SETUP.md
    elif command -v open &> /dev/null; then
        open docs/GOOGLE_CALENDAR_SETUP.md
    else
        echo "📄 Please open docs/GOOGLE_CALENDAR_SETUP.md manually"
    fi
fi

echo ""
echo "✨ Setup script complete!"
echo "Follow the steps above to complete your calendar integration setup."