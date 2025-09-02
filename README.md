A CLI-inspired web application for synchronizing Medium blog posts to Dev.to and Hashnode platforms. Built with React and featuring an authentic terminal interface.

![Terminal Interface](https://img.shields.io/badge/UI-Terminal%20Inspired-green?style=for-the-badge&logo=terminal)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-5.0.0-646CFF?style=for-the-badge&logo=vite)

## Features

### **Authentic Terminal UI**
- Dark terminal theme with monospace fonts (JetBrains Mono)
- Command-line styled interface with prompts (`$`, `>`, `�`)
- ASCII art headers and terminal window aesthetics
- Blinking cursor effects and terminal loading animations
- Green/amber color scheme matching classic terminals

### **Medium Integration**
- Connect via Medium API access token
- Fetch and display all your Medium blog posts
- Real-time search and filtering by title, description, or tags
- Graceful fallback to mock data when API isn't configured

### **Sync Operations**
- **Individual Sync**: Sync specific posts to Dev.to or Hashnode
- **Bulk Sync**: Synchronize all unsynchronized posts at once
- **Status Tracking**: Visual indicators for sync status
- **Progress Monitoring**: Terminal-style progress feedback

### **Search & Filter**
- Command-line style search interface
- Filter by title, description, or tags
- Real-time results with terminal feedback
- Shows filtered vs total count

## Quick Start

### Prerequisites
- Node.js (16.0 or higher)
- npm or yarn
- Medium API access token (optional - app works with mock data)

### Installation

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd blog-sync
```

2. **Run setup script:**
```bash
./setup.sh
```

Or manually:
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

3. **Configure environment (optional):**
```bash
# Edit .env file
nano .env
```

Add your Medium access token:
```env
VITE_MEDIUM_ACCESS_TOKEN=your_medium_token_here
```

4. **Start development server:**
```bash
npm run dev
```

5. **Open your browser:**
The app will automatically open at `http://localhost:3000`

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Medium Configuration
VITE_MEDIUM_ACCESS_TOKEN=your_medium_access_token_here
VITE_MEDIUM_USERNAME=your_medium_username

# Scraping Configuration
VITE_ENABLE_SCRAPING=true

# Future integrations (not yet implemented)
VITE_DEVTO_API_KEY=your_devto_api_key
VITE_HASHNODE_API_KEY=your_hashnode_api_key
```

### **🔑 Medium Data Sources**

Since **Medium stopped issuing new API tokens in 2024**, this app provides multiple ways to get your posts:

#### **Option 1: Web Scraping (Recommended)**
```env
VITE_MEDIUM_USERNAME=your_username
VITE_ENABLE_SCRAPING=true
VITE_MAX_POSTS=0
VITE_MAX_TAGS=10
```
- Uses RSS feeds and HTML parsing to extract your posts
- No API key required - just your public username
- Works with any public Medium profile
- Automatically falls back between RSS and HTML scraping
- **VITE_MAX_POSTS=0**: Gets ALL posts (unlimited)
- **VITE_MAX_POSTS=50**: Limits to 50 posts
- **VITE_MAX_TAGS=10**: Limits tags per post

#### **Option 2: Medium API (If you have existing token)**
```env
VITE_MEDIUM_ACCESS_TOKEN=your_existing_token
```
- Only works if you have a pre-existing Medium API token
- More reliable but unavailable for new users

#### **Option 3: Mock Data**
- Automatically used when neither scraping nor API is configured
- Provides sample data for testing and demonstration

## Terminal UI Components

### Color Scheme
- **Background**: `#0d1117` (GitHub dark)
- **Primary Text**: `#c9d1d9` (Light gray)
- **Success**: `#00ff00` (Terminal green)
- **Warning**: `#ffb000` (Amber)
- **Error**: `#ff4444` (Red)
- **Muted**: `#8b949e` (Gray)

### Typography
- **Primary Font**: JetBrains Mono
- **Fallbacks**: Menlo, Monaco, Consolas, monospace
- **Sizes**: 14px base, with contextual scaling

### Interactive Elements
- Terminal-styled buttons with hover effects
- Command prompts with appropriate symbols
- Loading states with terminal animations
- Status indicators using colored dots

## Available Scripts

```bash
# Development
npm run dev          # Start development server (port 3000)

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Setup
./setup.sh          # Automated setup with dependencies and config
```

## API Integration

### Medium API
- **Base URL**: `https://api.medium.com/v1`
- **Authentication**: Bearer token via environment variable
- **Endpoints Used**:
  - `GET /me` - Get current user info
  - `GET /users/{userId}/posts` - Fetch user posts

### Future Integrations
The application is structured to easily add:
- **Dev.to API**: Ready for implementation
- **Hashnode API**: Ready for implementation
- **Other platforms**: Extensible service architecture

## Usage

### Basic Operations

1. **View Posts**: Posts load automatically on app start
2. **Search**: Use the command-line interface to filter posts
3. **Individual Sync**: Click sync buttons on specific posts
4. **Bulk Sync**: Use bulk operations for platform-wide synchronization

### Terminal Commands Simulation

The UI simulates these command equivalents:
```bash
# Search posts
$ blog-sync --search "react hooks" --platform medium

# Bulk sync to Dev.to
$ blog-sync --bulk --platform devto --filter unsync

# Sync specific post
$ blog-sync --post-id 123 --target hashnode
```

## Development Status

### Completed Features
- [x] Terminal-inspired UI design
- [x] Medium API integration with fallback
- [x] Search and filtering functionality
- [x] Mock sync operations with status tracking
- [x] Responsive design maintaining terminal aesthetics
- [x] Error handling with terminal-appropriate messaging

### Ready for Implementation
- [ ] Dev.to API integration
- [ ] Hashnode API integration
- [ ] Content transformation and mapping
- [ ] Batch processing with real API calls
- [ ] Sync conflict resolution

### Future Enhancements
- [ ] Multiple Medium account support
- [ ] Custom sync scheduling
- [ ] Content preview before sync
- [ ] Sync history and rollback
- [ ] Plugin system for additional platforms

## Troubleshooting

### Common Issues

**MIME type error on dev server:**
```bash
# Clear npm cache and reinstall
npm cache clean --force
npm install
npm run dev
```

** Medium API not working:**
- Verify your access token in `.env`
- Check that the token has proper permissions
- Remember: Medium stopped issuing new tokens in 2024

** Vite command not found:**
```bash
# Use npm scripts instead
npm run dev

# Or install globally
npm install -g vite
```

### Debug Mode
Enable additional logging by setting:
```env
VITE_DEBUG=true
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a Pull Request

### Development Guidelines
- Follow the terminal UI aesthetic
- Maintain the CLI-inspired interaction patterns
- Add comprehensive error handling
- Write tests for new features
- Update documentation for new functionality

## Support

For issues, questions, or contributions:
- Create an issue in the repository
- Follow the terminal theme when adding new features
- Test with both real API and mock data scenarios