#!/bin/bash

echo "🚀 Setting up Blog Sync Application..."
echo "======================================"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created from .env.example"
else
    echo "⚠️  .env file already exists"
fi

echo ""
echo "🔧 Configuration needed:"
echo "1. Add your Medium access token to .env file:"
echo "   VITE_MEDIUM_ACCESS_TOKEN=your_token_here"
echo ""
echo "📚 Important notes:"
echo "• Medium no longer issues new API tokens (as of 2024)"
echo "• If you don't have a token, the app will use mock data"
echo "• Dev.to and Hashnode sync buttons are ready for future implementation"
echo ""
echo "🎉 Setup complete! Run 'npm run dev' to start the application"