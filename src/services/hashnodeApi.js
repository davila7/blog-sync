import axios from 'axios';

class HashnodeApiService {
  constructor() {
    this.apiKey = import.meta.env.VITE_HASHNODE_API_KEY;
    this.publicationId = import.meta.env.VITE_HASHNODE_PUBLICATION_ID;
    this.baseUrl = 'https://gql.hashnode.com';
    this.headers = {
      'Content-Type': 'application/json'
      // Removed 'User-Agent' as browsers don't allow setting this header
    };
    
    if (this.apiKey) {
      this.headers['Authorization'] = this.apiKey;
    }
  }

  // Check if Hashnode API is configured
  isConfigured() {
    return !!this.apiKey && this.apiKey.trim().length > 0;
  }

  // Get user info to validate API key
  async getUserInfo() {
    if (!this.isConfigured()) {
      throw new Error('Hashnode API key not configured');
    }

    // For now, just validate the API key format and assume it's valid
    // Real validation would require a backend proxy due to CORS
    const apiKeyPattern = /^[a-f0-9-]{30,}$/;
    
    if (!apiKeyPattern.test(this.apiKey)) {
      throw new Error('Invalid Hashnode API key format');
    }
    
    // Return success for properly formatted keys
    console.log('Hashnode API key format validated (full validation requires backend)');
    return {
      success: true,
      user: { 
        name: 'Unknown User', 
        note: 'API key format valid - full validation requires backend proxy' 
      }
    };
  }

  // Get user's articles from Hashnode
  async getUserArticles() {
    if (!this.isConfigured()) {
      throw new Error('Hashnode API key not configured');
    }

    try {
      const query = `
        query UserPosts {
          me {
            posts(first: 50) {
              edges {
                node {
                  id
                  title
                  slug
                  url
                  publishedAt
                  tags {
                    name
                  }
                }
              }
            }
          }
        }
      `;

      const response = await axios.post(this.baseUrl, {
        query: query
      }, {
        headers: this.headers,
        timeout: 15000
      });
      
      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }
      
      return response.data.data.me.posts.edges.map(edge => edge.node);
    } catch (error) {
      console.error('Failed to fetch Hashnode articles:', error);
      throw new Error(`Failed to fetch articles: ${error.message}`);
    }
  }

  // Publish article to Hashnode
  async publishArticle(post) {
    if (!this.isConfigured()) {
      throw new Error('Hashnode API key not configured. Please add VITE_HASHNODE_API_KEY to your .env file');
    }

    // Browser-based applications cannot directly call Hashnode API due to CORS
    // This requires a backend server to proxy the requests
    throw new Error(`
      Hashnode API calls require a backend proxy due to CORS restrictions.
      
      To implement this, you need:
      1. A backend server (Node.js/Express, Python/Flask, etc.)
      2. GraphQL proxy endpoints that forward requests to Hashnode API
      3. Update this frontend to call your backend instead
      
      For now, you can manually copy your posts to Hashnode:
      Title: ${post.title}
      URL: ${post.url}
      Tags: ${post.tags.join(', ')}
    `);
  }

  // Convert Medium post to Hashnode format
  convertToHashnodeFormat(post) {
    // Create Hashnode compatible tags
    const tags = post.tags
      .filter(tag => tag && tag.length > 0)
      .map(tag => ({
        name: tag.toLowerCase().replace(/[^a-z0-9\s]/g, ''),
        slug: tag.toLowerCase().replace(/[^a-z0-9]/g, '')
      }))
      .slice(0, 5); // Hashnode allows up to 5 tags

    return {
      title: post.title,
      contentMarkdown: this.generateMarkdownContent(post),
      tags: tags,
      publishedAt: new Date().toISOString(),
      slug: this.generateSlug(post.title),
      ...(this.publicationId && { publicationId: this.publicationId }),
      originalArticleURL: post.url, // Reference to original Medium post
      subtitle: post.description?.replace('...', '') || ''
    };
  }

  // Generate markdown content for Hashnode
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

  // Generate URL-friendly slug
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }

  // Check if article already exists on Hashnode
  async articleExists(post) {
    // Cannot check due to CORS restrictions in browser environment
    // Return false to allow sync attempt (will show proper error message)
    console.log('Skipping duplicate check due to CORS limitations');
    return false;
  }

  // Get configuration help
  getConfigurationHelp() {
    return {
      message: "Hashnode API not configured",
      instructions: [
        "1. Go to https://hashnode.com/settings/developer",
        "2. Generate a new Personal Access Token",
        "3. Add it to your .env file: VITE_HASHNODE_API_KEY=your_token_here",
        "4. Optionally add your publication ID: VITE_HASHNODE_PUBLICATION_ID=your_pub_id",
        "5. Restart the application"
      ],
      documentsUrl: "https://apidocs.hashnode.com/"
    };
  }
}

export default new HashnodeApiService();