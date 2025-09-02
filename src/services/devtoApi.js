import axios from 'axios';

class DevToApiService {
  constructor() {
    this.apiKey = import.meta.env.VITE_DEVTO_API_KEY;
    this.baseUrl = 'https://dev.to/api';
    
    // CORS proxies for browser environment
    this.proxies = [
      'https://api.allorigins.win/raw?url=',
      'https://api.codetabs.com/v1/proxy?quest=',
      'https://corsproxy.io/?'
    ];
    this.currentProxyIndex = 0;
    
    this.headers = {
      'Content-Type': 'application/json'
      // Removed 'User-Agent' as browsers don't allow setting this header
    };
    
    if (this.apiKey) {
      this.headers['api-key'] = this.apiKey;
    }
  }

  getCurrentProxy() {
    return this.proxies[this.currentProxyIndex];
  }

  getNextProxy() {
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
    return this.getCurrentProxy();
  }

  // Check if Dev.to API is configured
  isConfigured() {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  // Get user info to validate API key
  async getUserInfo() {
    if (!this.isConfigured()) {
      throw new Error('Dev.to API key not configured');
    }

    // For now, just validate the API key format and assume it's valid
    // Real validation would require a backend proxy due to CORS
    const apiKeyPattern = /^[a-zA-Z0-9]{20,}$/;
    
    if (!apiKeyPattern.test(this.apiKey)) {
      throw new Error('Invalid Dev.to API key format');
    }
    
    // Return success for properly formatted keys
    console.log('Dev.to API key format validated (full validation requires backend)');
    return {
      success: true,
      user: { 
        name: 'Unknown User', 
        note: 'API key format valid - full validation requires backend proxy' 
      }
    };
  }

  // Get user's articles from Dev.to
  async getUserArticles() {
    if (!this.isConfigured()) {
      throw new Error('Dev.to API key not configured');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/articles/me`, {
        headers: this.headers,
        timeout: 15000
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to fetch Dev.to articles:', error);
      throw new Error(`Failed to fetch articles: ${error.message}`);
    }
  }

  // Publish article to Dev.to
  async publishArticle(post) {
    if (!this.isConfigured()) {
      throw new Error('Dev.to API key not configured. Please add VITE_DEVTO_API_KEY to your .env file');
    }

    // Browser-based applications cannot directly call Dev.to API due to CORS
    // This requires a backend server to proxy the requests
    throw new Error(`
      Dev.to API calls require a backend proxy due to CORS restrictions.
      
      To implement this, you need:
      1. A backend server (Node.js/Express, Python/Flask, etc.)
      2. Proxy endpoints that forward requests to Dev.to API
      3. Update this frontend to call your backend instead
      
      For now, you can manually copy your posts to Dev.to:
      Title: ${post.title}
      URL: ${post.url}
      Tags: ${post.tags.join(', ')}
    `);
  }

  // Convert Medium post to Dev.to article format
  convertToDevToFormat(post) {
    // Create Dev.to compatible tags (max 4, no special chars)
    const tags = post.tags
      .filter(tag => tag && tag.length > 0)
      .map(tag => tag.replace(/[^a-z0-9]/g, '').toLowerCase())
      .filter(tag => tag.length > 0)
      .slice(0, 4);

    return {
      title: post.title,
      published: false, // Start as draft by default
      body_markdown: this.generateMarkdownContent(post),
      tags: tags,
      series: null,
      canonical_url: post.url, // Reference to original Medium post
      description: post.description?.replace('...', '') || ''
    };
  }

  // Generate markdown content for Dev.to
  generateMarkdownContent(post) {
    let markdown = '';
    
    // Add description
    if (post.description) {
      markdown += `${post.description.replace('...', '')}\n\n`;
    }
    
    // Add link to original
    markdown += `> **Originally published on [Medium](${post.url})**\n\n`;
    
    // Add placeholder content note
    markdown += `*This post was imported from Medium. Please visit the [original article](${post.url}) for the complete content.*\n\n`;
    
    // Add tags section
    if (post.tags && post.tags.length > 0) {
      markdown += `## Tags\n${post.tags.map(tag => `#${tag}`).join(' ')}\n\n`;
    }
    
    return markdown;
  }

  // Check if article already exists on Dev.to
  async articleExists(post) {
    // Cannot check due to CORS restrictions in browser environment
    // Return false to allow sync attempt (will show proper error message)
    console.log('Skipping duplicate check due to CORS limitations');
    return false;
  }

  // Get configuration help
  getConfigurationHelp() {
    return {
      message: "Dev.to API not configured",
      instructions: [
        "1. Go to https://dev.to/settings/extensions",
        "2. Generate a new API key",
        "3. Add it to your .env file: VITE_DEVTO_API_KEY=your_key_here",
        "4. Restart the application"
      ],
      documentsUrl: "https://docs.forem.com/api/"
    };
  }
}

export default new DevToApiService();