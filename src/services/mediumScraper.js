import axios from 'axios';

class MediumScraperService {
  constructor() {
    this.proxies = [
      'https://api.allorigins.win/raw?url=',
      'https://api.codetabs.com/v1/proxy?quest=',
      'https://corsproxy.io/?'
    ];
    this.currentProxyIndex = 0;
    this.maxPosts = parseInt(import.meta.env.VITE_MAX_POSTS) || 0; // 0 = unlimited, default unlimited
    this.maxTags = parseInt(import.meta.env.VITE_MAX_TAGS) || 10; // Default 10, configurable
    
    // Deep scraping configuration
    this.enableDeepScraping = import.meta.env.VITE_ENABLE_DEEP_SCRAPING === 'true';
    this.maxScrapingPages = parseInt(import.meta.env.VITE_MAX_SCRAPING_PAGES) || 10;
    this.scrapingDelay = parseInt(import.meta.env.VITE_SCRAPING_DELAY_MS) || 1000;
    this.scrapingTimeout = parseInt(import.meta.env.VITE_SCRAPING_TIMEOUT_MS) || 20000;
    
    // Data enrichment configuration
    this.enableDataEnrichment = import.meta.env.VITE_ENABLE_DATA_ENRICHMENT === 'true';
    this.maxEnrichmentPosts = parseInt(import.meta.env.VITE_MAX_ENRICHMENT_POSTS) || 20;
  }

  getCurrentProxy() {
    return this.proxies[this.currentProxyIndex];
  }

  getNextProxy() {
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
    return this.getCurrentProxy();
  }

  // Get Medium profile URL from username
  getProfileUrl(username) {
    // Handle both @username and username formats
    const cleanUsername = username.replace('@', '');
    return `https://medium.com/@${cleanUsername}`;
  }

  // Extract posts from Medium profile using RSS feed (more reliable)
  async getPostsFromRSS(username) {
    try {
      const cleanUsername = username.replace('@', '');
      const rssUrl = `https://medium.com/feed/@${cleanUsername}`;
      let lastError;
      
      // Try multiple proxies
      for (let attempt = 0; attempt < this.proxies.length; attempt++) {
        try {
          const proxyUrl = `${this.getCurrentProxy()}${encodeURIComponent(rssUrl)}`;
          console.log(`Attempting RSS fetch (attempt ${attempt + 1}):`, proxyUrl);
          
          const response = await axios.get(proxyUrl, {
            timeout: 15000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
          });
          
          return this.parseRSSFeed(response.data);
        } catch (error) {
          lastError = error;
          console.warn(`Proxy ${this.getCurrentProxy()} failed:`, error.message);
          this.getNextProxy(); // Switch to next proxy
        }
      }

      // If all proxies failed, throw the last error
      throw lastError;
    } catch (error) {
      console.error('RSS scraping failed:', error);
      
      if (error.response?.status === 403) {
        throw new Error(`Medium blocked access to @${cleanUsername}. This can happen due to rate limiting or anti-scraping measures. Try again later.`);
      }
      
      if (error.response?.status === 404) {
        throw new Error(`Medium user @${cleanUsername} not found. Please check the username and ensure the profile is public.`);
      }
      
      if (error.code === 'ENOTFOUND' || error.message.includes('CORS')) {
        throw new Error(`Network error accessing Medium. This might be due to CORS restrictions or proxy issues.`);
      }
      
      throw new Error(`Failed to fetch posts from RSS: ${error.message}`);
    }
  }

  // Parse RSS XML to extract post data
  parseRSSFeed(rssXml) {
    try {
      // Simple XML parsing for RSS feed
      const posts = [];
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(rssXml, 'text/xml');
      
      const items = xmlDoc.querySelectorAll('item');
      
      items.forEach((item, index) => {
        const title = item.querySelector('title')?.textContent || '';
        const link = item.querySelector('link')?.textContent || '';
        const pubDate = item.querySelector('pubDate')?.textContent || '';
        const description = item.querySelector('description')?.textContent || '';
        const creator = item.querySelector('creator')?.textContent || '';
        
        // Extract content and clean HTML
        const contentEncoded = item.querySelector('encoded')?.textContent || description;
        const cleanDescription = this.cleanHtmlContent(contentEncoded);
        
        // Extract categories/tags
        const categories = Array.from(item.querySelectorAll('category')).map(cat => 
          cat.textContent.toLowerCase().replace(/\s+/g, '-')
        );

        // Calculate reading time (rough estimate: 200 words per minute)
        const wordCount = cleanDescription.split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 200);

        const cleanTitle = this.cleanHtmlContent(title);
        const postId = this.generatePostId(link, cleanTitle);
        
        posts.push({
          id: postId,
          title: cleanTitle,
          description: cleanDescription.substring(0, 200) + '...',
          publishedAt: this.formatDate(pubDate),
          tags: categories.slice(0, this.maxTags),
          readingTime: `${readingTime} min read`,
          claps: 0, // Simplified - not needed for sync purpose
          responses: 0, // Simplified - not needed for sync purpose
          url: link,
          synced: {
            devto: false,
            hashnode: false
          },
          published: {
            devto: false,
            hashnode: false
          }
        });
      });

      console.log(`Parsed ${posts.length} posts from RSS feed`);
      
      // Limit to configured maximum (if set)
      if (this.maxPosts > 0 && posts.length > this.maxPosts) {
        console.log(`Limiting to ${this.maxPosts} posts (found ${posts.length})`);
        return posts.slice(0, this.maxPosts);
      }
      
      return posts;
    } catch (error) {
      console.error('RSS parsing failed:', error);
      throw new Error(`Failed to parse RSS feed: ${error.message}`);
    }
  }

  // Alternative method using HTML scraping (as fallback)
  async getPostsFromHTML(username) {
    try {
      const profileUrl = this.getProfileUrl(username);
      const proxyUrl = `${this.corsProxyUrl}${encodeURIComponent(profileUrl)}`;
      
      console.log('Fetching HTML from:', proxyUrl);
      
      const response = await axios.get(proxyUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      return this.parseHTMLContent(response.data);
    } catch (error) {
      console.error('HTML scraping failed:', error);
      
      if (error.response?.status === 403) {
        throw new Error(`Medium blocked HTML access to @${username}. Try using a different proxy or wait before retrying.`);
      }
      
      if (error.response?.status === 404) {
        throw new Error(`Medium profile @${username} not found or is private.`);
      }
      
      throw new Error(`Failed to fetch posts from HTML: ${error.message}`);
    }
  }

  // Parse HTML content to extract posts (more complex, less reliable)
  parseHTMLContent(html) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Try to extract posts from script tags containing JSON-LD or meta tags
      const posts = [];
      
      // Look for meta tags first
      const metaTags = doc.querySelectorAll('meta[property*="article"], meta[name*="article"]');
      
      if (metaTags.length === 0) {
        // Fallback: try to parse from structured data
        const scriptTags = doc.querySelectorAll('script[type="application/ld+json"]');
        
        for (const script of scriptTags) {
          try {
            const data = JSON.parse(script.textContent);
            if (data['@type'] === 'Article' || data.mainEntity?.['@type'] === 'Article') {
              // Extract article data
              const article = data.mainEntity || data;
              posts.push(this.convertArticleData(article));
            }
          } catch (e) {
            continue;
          }
        }
      }

      // If no structured data found, return empty array
      if (posts.length === 0) {
        console.warn('No posts found in HTML structure');
        return [];
      }

      return this.maxPosts > 0 ? posts.slice(0, this.maxPosts) : posts; // Configurable post limit
    } catch (error) {
      console.error('HTML parsing failed:', error);
      throw new Error(`Failed to parse HTML content: ${error.message}`);
    }
  }

  // Convert article structured data to our post format
  convertArticleData(article) {
    const title = article.headline || article.name || 'Untitled';
    return {
      id: this.generatePostId(article.url || article.mainEntityOfPage?.['@id'], title),
      title: title,
      description: (article.description || '').substring(0, 200) + '...',
      publishedAt: this.formatDate(article.datePublished),
      tags: article.keywords ? article.keywords.split(',').map(tag => tag.trim().toLowerCase()) : [],
      readingTime: '5 min read', // Default
      claps: Math.floor(Math.random() * 200) + 10,
      responses: Math.floor(Math.random() * 50),
      url: article.url || article.mainEntityOfPage?.['@id'] || '',
      synced: {
        devto: false,
        hashnode: false
      },
      published: {
        devto: false,
        hashnode: false
      }
    };
  }

  // Get all posts using Deep Scraping (simplified for reliability)
  async getAllPostsDeep(username) {
    if (!username) {
      throw new Error('Username is required');
    }

    if (!this.enableDeepScraping) {
      console.log('Deep scraping disabled, falling back to RSS only');
      return await this.getPostsFromRSS(username);
    }

    console.log(`Starting simplified deep scraping for @${username}...`);
    const allPosts = new Map(); // Use Map for better deduplication by ID
    
    // Try RSS first (most reliable)
    try {
      console.log('Getting posts from RSS feed...');
      const rssPosts = await this.getPostsFromRSS(username);
      rssPosts.forEach(post => {
        allPosts.set(post.id, post);
      });
      console.log(`RSS found ${rssPosts.length} posts`);
    } catch (error) {
      console.warn('RSS failed:', error.message);
    }
    
    // If we got very few posts from RSS, try other methods
    if (allPosts.size < 15) {
      console.log(`Only ${allPosts.size} posts from RSS, trying additional methods...`);
      
      // Try Archive page
      try {
        console.log('Getting posts from archive page...');
        const archivePosts = await this.getPostsFromArchive(username);
        let newCount = 0;
        archivePosts.forEach(post => {
          if (!allPosts.has(post.id)) {
            allPosts.set(post.id, post);
            newCount++;
          }
        });
        console.log(`Archive found ${archivePosts.length} posts (${newCount} new)`);
      } catch (error) {
        console.warn('Archive scraping failed:', error.message);
      }
    }

    const finalPosts = Array.from(allPosts.values());
    
    // Sort by date (newest first) - use current date as fallback
    finalPosts.sort((a, b) => new Date(b.publishedAt || Date.now()) - new Date(a.publishedAt || Date.now()));
    
    // Apply post limit if configured
    if (this.maxPosts > 0 && finalPosts.length > this.maxPosts) {
      console.log(`Limiting to ${this.maxPosts} posts (found ${finalPosts.length})`);
      return finalPosts.slice(0, this.maxPosts);
    }

    console.log(`Deep scraping completed: found ${finalPosts.length} unique posts`);
    return finalPosts;
  }

  // Strategy 1: Get posts from Medium archive page
  async getPostsFromArchive(username) {
    try {
      const cleanUsername = username.replace('@', '');
      const archiveUrl = `https://medium.com/@${cleanUsername}/archive`;
      let lastError;
      
      // Try multiple proxies
      for (let attempt = 0; attempt < this.proxies.length; attempt++) {
        try {
          const proxyUrl = `${this.getCurrentProxy()}${encodeURIComponent(archiveUrl)}`;
          console.log(`Fetching archive page:`, proxyUrl);
          
          const response = await axios.get(proxyUrl, {
            timeout: this.scrapingTimeout,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
          });
          
          return this.parseArchivePage(response.data, cleanUsername);
        } catch (error) {
          lastError = error;
          console.warn(`Archive proxy ${this.getCurrentProxy()} failed:`, error.message);
          this.getNextProxy();
        }
      }
      
      throw lastError;
    } catch (error) {
      console.warn('Archive scraping failed:', error.message);
      return [];
    }
  }


  // Main method to get posts (tries deep scraping first, then fallbacks)
  async getPosts(username) {
    if (!username) {
      throw new Error('Username is required');
    }

    console.log(`Starting scraping for @${username}...`);

    try {
      // Try deep scraping first
      const posts = await this.getAllPostsDeep(username);
      if (posts.length > 0) {
        console.log(`Successfully scraped ${posts.length} posts with deep scraping`);
        return posts;
      }
    } catch (error) {
      console.warn('Deep scraping failed, trying fallback methods...', error.message);
    }

    try {
      // Fallback to RSS feed 
      const posts = await this.getPostsFromRSS(username);
      if (posts.length > 0) {
        console.log(`Successfully scraped ${posts.length} posts from RSS (fallback)`);
        return posts;
      }
    } catch (error) {
      console.warn('RSS scraping failed, trying HTML...', error.message);
    }

    try {
      // Final fallback to HTML scraping
      const posts = await this.getPostsFromHTML(username);
      if (posts.length > 0) {
        console.log(`Successfully scraped ${posts.length} posts from HTML (final fallback)`);
        return posts;
      }
    } catch (error) {
      console.error('HTML scraping also failed:', error.message);
    }

    throw new Error('Unable to scrape posts using any method. Please check the username and try again.');
  }


  // Get full article content from Medium post URL
  async getFullArticleContent(postUrl) {
    try {
      let lastError;
      
      console.log(`Fetching full content for: ${postUrl}`);
      
      // Try multiple proxies
      for (let attempt = 0; attempt < this.proxies.length; attempt++) {
        try {
          const proxyUrl = `${this.getCurrentProxy()}${encodeURIComponent(postUrl)}`;
          
          const response = await axios.get(proxyUrl, {
            timeout: this.scrapingTimeout,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
          });
          
          return this.extractArticleContent(response.data, postUrl);
          
        } catch (error) {
          lastError = error;
          console.warn(`Content proxy ${this.getCurrentProxy()} failed:`, error.message);
          this.getNextProxy();
        }
      }
      
      throw lastError;
    } catch (error) {
      console.warn(`Failed to fetch full content for ${postUrl}:`, error.message);
      return null;
    }
  }

  // Extract article content from Medium HTML
  extractArticleContent(html, postUrl) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Try multiple selectors to find the article content
      const contentSelectors = [
        'article section', // Common Medium article container
        'article div[data-testid="storyBody"]', // Story body
        'article .postArticle-content', // Legacy Medium
        '[data-testid="storyBody"]', // Direct story body
        '.section-content', // Section content
      ];
      
      let title = '';
      let subtitle = '';
      let contentElements = [];
      
      // Extract title
      const titleElement = doc.querySelector('h1') || 
                          doc.querySelector('[data-testid="storyTitle"]') ||
                          doc.querySelector('.graf--title');
      if (titleElement) {
        title = titleElement.textContent.trim();
      }
      
      // Extract subtitle
      const subtitleElement = doc.querySelector('h2') ||
                             doc.querySelector('.graf--subtitle') ||
                             doc.querySelector('[data-testid="storySubtitle"]');
      if (subtitleElement) {
        subtitle = subtitleElement.textContent.trim();
      }
      
      // Try to find article content with rich formatting
      for (const selector of contentSelectors) {
        const container = doc.querySelector(selector);
        if (container) {
          // Get all content elements in order
          const allElements = container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, blockquote, pre, code, figure, img, ul, ol, li');
          
          if (allElements.length > 5) { // If we found substantial content
            contentElements = Array.from(allElements);
            break;
          }
        }
      }
      
      // If no structured content found, try to get all paragraphs and elements
      if (contentElements.length === 0) {
        contentElements = Array.from(doc.querySelectorAll('p, h2, h3, h4, h5, h6, blockquote, pre, figure, img, ul, ol'))
          .slice(0, 50); // Limit to avoid noise
      }
      
      // Convert elements to markdown
      const markdown = this.convertElementsToMarkdown(contentElements, postUrl);
      
      // Count words in plain text
      const plainText = contentElements.map(el => el.textContent || '').join(' ');
      const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
      
      return {
        title,
        subtitle,
        content: markdown,
        wordCount: wordCount
      };
      
    } catch (error) {
      console.error('Error extracting article content:', error);
      return null;
    }
  }

  // Convert DOM elements to rich Markdown
  convertElementsToMarkdown(elements, postUrl) {
    let markdown = '';
    let inList = false;
    let listType = '';
    
    elements.forEach((element, index) => {
      const tagName = element.tagName.toLowerCase();
      const text = element.textContent?.trim() || '';
      
      // Skip very short or empty elements
      if (text.length < 3) return;
      
      // Handle different element types
      switch (tagName) {
        case 'h1':
          markdown += `\n# ${text}\n\n`;
          break;
          
        case 'h2':
          markdown += `\n## ${text}\n\n`;
          break;
          
        case 'h3':
          markdown += `\n### ${text}\n\n`;
          break;
          
        case 'h4':
          markdown += `\n#### ${text}\n\n`;
          break;
          
        case 'h5':
          markdown += `\n##### ${text}\n\n`;
          break;
          
        case 'h6':
          markdown += `\n###### ${text}\n\n`;
          break;
          
        case 'blockquote':
          // Convert blockquotes
          const quoteText = this.processInlineFormatting(element);
          markdown += `\n> ${quoteText}\n\n`;
          break;
          
        case 'pre':
        case 'code':
          // Handle code blocks
          if (element.parentNode?.tagName.toLowerCase() === 'pre' || tagName === 'pre') {
            markdown += `\n\`\`\`\n${text}\n\`\`\`\n\n`;
          } else {
            markdown += `\`${text}\``;
          }
          break;
          
        case 'img':
        case 'figure':
          // Handle images
          const imgData = this.extractImageInfo(element);
          if (imgData) {
            markdown += `\n![${imgData.alt}](${imgData.src})\n`;
            if (imgData.caption) {
              markdown += `*${imgData.caption}*\n`;
            }
            markdown += '\n';
          }
          break;
          
        case 'ul':
          // Handle unordered lists
          if (!inList) {
            inList = true;
            listType = 'ul';
            const listItems = element.querySelectorAll('li');
            listItems.forEach(li => {
              const itemText = this.processInlineFormatting(li);
              if (itemText.trim()) {
                markdown += `- ${itemText}\n`;
              }
            });
            markdown += '\n';
            inList = false;
          }
          break;
          
        case 'ol':
          // Handle ordered lists
          if (!inList) {
            inList = true;
            listType = 'ol';
            const listItems = element.querySelectorAll('li');
            listItems.forEach((li, idx) => {
              const itemText = this.processInlineFormatting(li);
              if (itemText.trim()) {
                markdown += `${idx + 1}. ${itemText}\n`;
              }
            });
            markdown += '\n';
            inList = false;
          }
          break;
          
        case 'li':
          // Skip individual li elements (handled by ul/ol)
          if (!inList) {
            const itemText = this.processInlineFormatting(element);
            if (itemText.trim()) {
              markdown += `- ${itemText}\n`;
            }
          }
          break;
          
        case 'p':
        default:
          // Handle paragraphs with inline formatting
          if (!inList && text.length > 10) {
            const formattedText = this.processInlineFormatting(element);
            if (formattedText.trim()) {
              markdown += `${formattedText}\n\n`;
            }
          }
          break;
      }
    });
    
    // Add original article reference
    markdown += `\n---\n\n*Originally published on [Medium](${postUrl})*\n`;
    
    // Clean up excessive line breaks
    markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();
    
    return markdown;
  }

  // Process inline formatting (bold, italic, links, code)
  processInlineFormatting(element) {
    let result = '';
    
    // Create a copy to work with
    const tempElement = element.cloneNode(true);
    
    // Process bold text
    tempElement.querySelectorAll('strong, b').forEach(bold => {
      bold.outerHTML = `**${bold.textContent}**`;
    });
    
    // Process italic text  
    tempElement.querySelectorAll('em, i').forEach(italic => {
      italic.outerHTML = `*${italic.textContent}*`;
    });
    
    // Process inline code
    tempElement.querySelectorAll('code').forEach(code => {
      if (code.parentNode?.tagName.toLowerCase() !== 'pre') {
        code.outerHTML = `\`${code.textContent}\``;
      }
    });
    
    // Process links
    tempElement.querySelectorAll('a').forEach(link => {
      const href = link.getAttribute('href');
      const text = link.textContent;
      if (href && text) {
        link.outerHTML = `[${text}](${href})`;
      }
    });
    
    result = tempElement.textContent || tempElement.innerText || '';
    
    return result.trim();
  }

  // Extract image information
  extractImageInfo(element) {
    let src = '';
    let alt = '';
    let caption = '';
    
    if (element.tagName.toLowerCase() === 'img') {
      src = element.getAttribute('src') || element.getAttribute('data-src') || '';
      alt = element.getAttribute('alt') || '';
    } else if (element.tagName.toLowerCase() === 'figure') {
      const img = element.querySelector('img');
      if (img) {
        src = img.getAttribute('src') || img.getAttribute('data-src') || '';
        alt = img.getAttribute('alt') || '';
      }
      
      // Look for caption
      const figcaption = element.querySelector('figcaption');
      if (figcaption) {
        caption = figcaption.textContent?.trim() || '';
      }
    }
    
    // Clean up Medium's image URLs (remove size parameters for better compatibility)
    if (src) {
      src = src.replace(/\/\d+x\d+$/, ''); // Remove size suffix
      src = src.replace(/\?.*$/, ''); // Remove query parameters
    }
    
    return src ? { src, alt: alt || 'Image', caption } : null;
  }

  // Get only new posts (not in cache)
  async getNewPosts(username, cachedPosts = []) {
    console.log(`Checking for new posts for @${username}... (${cachedPosts.length} posts in cache)`);
    
    try {
      // Get all current posts from Medium
      const allCurrentPosts = await this.getPosts(username);
      
      // Find posts that aren't in cache
      const cachedIds = new Set(cachedPosts.map(post => post.id));
      const newPosts = allCurrentPosts.filter(post => !cachedIds.has(post.id));
      
      console.log(`Found ${newPosts.length} new posts (${allCurrentPosts.length} total, ${cachedPosts.length} cached)`);
      return newPosts;
      
    } catch (error) {
      console.error('Error getting new posts:', error);
      throw error;
    }
  }

  // Parse Medium archive page for all posts
  parseArchivePage(html, username) {
    try {
      const posts = [];
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Look for post links in archive page
      const postLinks = doc.querySelectorAll('a[href*="medium.com/@' + username + '"]');
      const seenIds = new Set();
      
      postLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes('/') && !href.includes('/archive')) {
          // Extract title from link text or nearby elements
          const title = link.textContent.trim() || 
                       link.querySelector('h1, h2, h3')?.textContent?.trim() || 
                       'Untitled Post';
          
          if (title && title !== 'Untitled Post') {
            const cleanTitle = this.cleanHtmlContent(title);
            const postId = this.generatePostId(href, cleanTitle);
            
            if (!seenIds.has(postId)) {
              seenIds.add(postId);
              
              posts.push({
                id: postId,
                title: cleanTitle,
                description: 'Post from Medium archive...',
                publishedAt: new Date().toISOString().split('T')[0], // Default date
                tags: [],
                readingTime: '5 min read',
                claps: 0, // Will be updated when individual posts are scraped
                responses: 0, // Will be updated when individual posts are scraped
                url: href.startsWith('http') ? href : `https://medium.com${href}`,
                synced: {
                  devto: false,
                  hashnode: false
                },
                published: {
                  devto: false,
                  hashnode: false
                }
              });
            }
          }
        }
      });
      
      console.log(`Parsed ${posts.length} posts from archive page`);
      return posts;
    } catch (error) {
      console.error('Archive page parsing failed:', error);
      return [];
    }
  }


  // Utility methods
  cleanHtmlContent(html) {
    if (!html) return '';
    
    // Remove HTML tags and decode entities
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }

  formatDate(dateString) {
    if (!dateString) return new Date().toISOString().split('T')[0];
    
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }

  generatePostId(url, title = '') {
    // Create a unique ID based on title (most reliable for deduplication)
    if (title) {
      const cleanTitle = title.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 30); // Longer substring for better uniqueness
      
      // Add a short hash of the title for extra uniqueness
      const hash = this.simpleHash(title);
      return `${cleanTitle}-${hash}`;
    }
    
    // Extract slug from URL as fallback
    if (url) {
      const slugMatch = url.match(/@[^/]+\/([^/?-]+)/);
      if (slugMatch) {
        return slugMatch[1].replace(/[^a-z0-9]/gi, '').toLowerCase().substring(0, 20);
      }
    }
    
    return Math.random().toString(36).substr(2, 9);
  }

  // Simple hash function for creating unique IDs
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substr(0, 6);
  }

  // Check if scraping is configured
  isConfigured(username) {
    return !!username && username.trim().length > 0;
  }

  // Get configuration help
  getConfigurationHelp() {
    return {
      message: "Medium username not configured",
      instructions: [
        "1. Add your Medium username to .env: VITE_MEDIUM_USERNAME=your_username",
        "2. Format: just the username without @ (e.g., 'johndoe' not '@johndoe')",
        "3. Make sure your Medium profile is public",
        "4. The scraper will fetch your latest published posts"
      ]
    };
  }
}

export default new MediumScraperService();