#!/bin/bash

echo "🚀 Setting up Blog Sync Application..."
echo "======================================"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
VITE_MEDIUM_USERNAME=your_medium_username
VITE_ENABLE_SCRAPING=true
VITE_MAX_POSTS=0
VITE_CACHE_MAX_AGE_HOURS=24
EOF
    echo "✅ .env file created"
else
    echo "⚠️  .env file already exists"
fi

# Create data directory
if [ ! -d "data" ]; then
    echo "📁 Creating data directory..."
    mkdir -p data
    touch data/.gitkeep
    echo "✅ Data directory created"
fi

echo ""
echo "🔧 Configuration needed:"
echo "1. Update your Medium username in .env file:"
echo "   VITE_MEDIUM_USERNAME=your_username_here"
echo ""
echo "📚 Features:"
echo "• Scrapes Medium posts via RSS feeds and web scraping"
echo "• File-based JSON cache system for performance"
echo "• Export/import cache functionality"
echo "• Search and sync status tracking"
echo ""
echo "🎉 Setup complete! Run 'npm run dev' to start the application"