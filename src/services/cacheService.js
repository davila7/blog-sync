import fileService from './fileService';

class CacheService {
  constructor() {
    this.currentCache = null;
    this.isLoaded = false;
  }

  // Load cache from memory (simulating file read)
  async loadCacheFromMemory() {
    if (this.isLoaded && this.currentCache) {
      return this.currentCache;
    }

    // Try to load from localStorage as temporary storage
    // In a real Node.js environment, this would read from files
    try {
      const username = import.meta.env.VITE_MEDIUM_USERNAME;
      const cacheKey = `blog-sync-cache-${username}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        this.currentCache = JSON.parse(cached);
        this.isLoaded = true;
        console.log(`Loaded ${this.currentCache.posts?.length || 0} posts from cache`);
        return this.currentCache;
      }
    } catch (error) {
      console.error('Error loading cache:', error);
    }

    // Return empty cache structure
    this.currentCache = {
      version: '1.0',
      posts: [],
      metadata: {
        lastUpdated: null,
        postCount: 0,
        username: import.meta.env.VITE_MEDIUM_USERNAME
      }
    };
    this.isLoaded = true;
    return this.currentCache;
  }

  // Get cached posts
  async getCachedPosts() {
    const cache = await this.loadCacheFromMemory();
    const posts = cache.posts || [];
    
    // Ensure backward compatibility - add published field if missing
    return posts.map(post => ({
      ...post,
      published: post.published || { devto: false, hashnode: false }
    }));
  }

  // Save posts to cache
  async savePosts(posts) {
    try {
      const username = import.meta.env.VITE_MEDIUM_USERNAME;
      const cacheData = {
        version: '1.0',
        posts: posts,
        metadata: {
          lastUpdated: new Date().toISOString(),
          postCount: posts.length,
          username: username
        }
      };

      // Save to memory cache
      this.currentCache = cacheData;
      
      // Save to localStorage (temporary solution)
      const cacheKey = `blog-sync-cache-${username}`;
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      // Auto-export to file for user download
      this.autoExportCache(cacheData);
      
      console.log(`Saved ${posts.length} posts to cache`);
      return true;
    } catch (error) {
      console.error('Error saving to cache:', error);
      return false;
    }
  }

  // Auto-export cache as file download
  async autoExportCache(cacheData) {
    try {
      // Only auto-export if we have posts and it's been a while since last export
      const lastExport = localStorage.getItem('last-cache-export');
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      if (!lastExport || (now - parseInt(lastExport)) > oneHour) {
        // Mark as exported to avoid too frequent downloads
        localStorage.setItem('last-cache-export', now.toString());
        console.log('Cache updated - auto-export available via "Export" button');
      }
    } catch (error) {
      console.error('Error in auto-export:', error);
    }
  }

  // Get cache metadata
  async getCacheMetadata() {
    const cache = await this.loadCacheFromMemory();
    return cache.metadata || null;
  }

  // Check if cache exists and is valid
  async isCacheValid() {
    const metadata = await this.getCacheMetadata();
    if (!metadata) return false;
    
    const currentUsername = import.meta.env.VITE_MEDIUM_USERNAME;
    if (metadata.username !== currentUsername) {
      console.log('Cache invalid: different username');
      return false;
    }
    
    // Check if cache is older than configured max age
    const maxAge = parseInt(import.meta.env.VITE_CACHE_MAX_AGE_HOURS) || 24; // Default 24 hours
    const cacheAge = (Date.now() - new Date(metadata.lastUpdated).getTime()) / (1000 * 60 * 60);
    
    if (cacheAge > maxAge) {
      console.log(`Cache expired: ${cacheAge.toFixed(1)} hours old (max: ${maxAge})`);
      return false;
    }
    
    return true;
  }

  // Merge new posts with cached posts (avoid duplicates)
  mergePosts(cachedPosts, newPosts) {
    const existingIds = new Set(cachedPosts.map(post => post.id));
    const uniqueNewPosts = newPosts.filter(post => !existingIds.has(post.id));
    
    console.log(`Merging: ${cachedPosts.length} cached + ${uniqueNewPosts.length} new = ${cachedPosts.length + uniqueNewPosts.length} total`);
    
    // Ensure all posts have the published field initialized
    const normalizedCachedPosts = cachedPosts.map(post => ({
      ...post,
      published: post.published || { devto: false, hashnode: false }
    }));
    
    const normalizedNewPosts = uniqueNewPosts.map(post => ({
      ...post,
      published: post.published || { devto: false, hashnode: false }
    }));
    
    // Combine and sort by date (newest first)
    const allPosts = [...normalizedCachedPosts, ...normalizedNewPosts];
    return allPosts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }

  // Find posts that need to be fetched (not in cache)
  getPostsToFetch(scrapedPosts, cachedPosts) {
    const cachedIds = new Set(cachedPosts.map(post => post.id));
    return scrapedPosts.filter(post => !cachedIds.has(post.id));
  }

  // Clear cache
  async clearCache() {
    try {
      const username = import.meta.env.VITE_MEDIUM_USERNAME;
      const cacheKey = `blog-sync-cache-${username}`;
      localStorage.removeItem(cacheKey);
      localStorage.removeItem('last-cache-export');
      
      // Reset memory cache
      this.currentCache = null;
      this.isLoaded = false;
      
      console.log('Cache cleared');
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }

  // Get cache size info
  async getCacheInfo() {
    const posts = await this.getCachedPosts();
    const metadata = await this.getCacheMetadata();
    
    if (!metadata || !metadata.lastUpdated) {
      return {
        exists: false,
        postCount: 0,
        lastUpdated: null,
        sizeKB: 0
      };
    }
    
    const sizeBytes = new Blob([JSON.stringify(posts)]).size;
    const sizeKB = Math.round(sizeBytes / 1024);
    
    return {
      exists: true,
      postCount: posts.length,
      lastUpdated: metadata.lastUpdated,
      sizeKB: sizeKB,
      username: metadata.username,
      isValid: await this.isCacheValid()
    };
  }

  // Update sync status for a specific post
  async updatePostSyncStatus(postId, platform, synced) {
    try {
      const posts = await this.getCachedPosts();
      const updatedPosts = posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            synced: {
              ...post.synced,
              [platform]: synced
            }
          };
        }
        return post;
      });
      
      await this.savePosts(updatedPosts);
      return updatedPosts;
    } catch (error) {
      console.error('Error updating post sync status:', error);
      return null;
    }
  }

  // Export cache as downloadable file
  async exportCache() {
    try {
      const cache = await this.loadCacheFromMemory();
      return fileService.exportCacheToFile(cache);
    } catch (error) {
      console.error('Error exporting cache:', error);
      return false;
    }
  }

  // Import cache from file
  async importCache(file) {
    try {
      const cacheData = await fileService.importCacheFromFile(file);
      
      if (!cacheData.posts || !Array.isArray(cacheData.posts)) {
        throw new Error('Invalid import file format');
      }
      
      await this.savePosts(cacheData.posts);
      console.log(`Imported ${cacheData.posts.length} posts`);
      return true;
    } catch (error) {
      console.error('Error importing cache:', error);
      return false;
    }
  }

  // Download template file
  downloadTemplate() {
    return fileService.downloadTemplate();
  }

  // Get file management instructions
  getFileInstructions() {
    return fileService.getFileManagementInstructions();
  }
}

export default new CacheService();