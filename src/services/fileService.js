// File service for handling JSON cache files
// Since we're in a browser environment, we'll use the File API and provide
// manual import/export functionality

class FileService {
  constructor() {
    this.dataPath = './data';
    this.cacheFileName = 'posts-cache.json';
    this.metadataFileName = 'cache-metadata.json';
  }

  // Create default cache structure
  createDefaultCache() {
    return {
      version: '1.0',
      posts: [],
      metadata: {
        lastUpdated: new Date().toISOString(),
        postCount: 0,
        username: null
      }
    };
  }

  // Save cache data to local file (user download)
  async exportCacheToFile(cacheData) {
    try {
      const dataToExport = {
        ...this.createDefaultCache(),
        ...cacheData,
        exportedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medium-posts-${cacheData.metadata?.username || 'cache'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('Cache exported successfully');
      return true;
    } catch (error) {
      console.error('Error exporting cache:', error);
      return false;
    }
  }

  // Import cache from file
  async importCacheFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const cacheData = JSON.parse(e.target.result);
          
          // Validate cache structure
          if (!cacheData.posts || !Array.isArray(cacheData.posts)) {
            throw new Error('Invalid cache file format: missing posts array');
          }

          resolve(cacheData);
        } catch (error) {
          reject(new Error(`Error parsing cache file: ${error.message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };

      reader.readAsText(file);
    });
  }

  // Generate cache file path for auto-save
  getCacheFilePath(username) {
    return `/Users/danipower/Proyectos/Github/blog-sync/data/posts-cache-${username}.json`;
  }

  // Get metadata file path
  getMetadataFilePath(username) {
    return `/Users/danipower/Proyectos/Github/blog-sync/data/metadata-${username}.json`;
  }

  // Create cache file content
  createCacheFileContent(posts, username) {
    return {
      version: '1.0',
      posts: posts,
      metadata: {
        lastUpdated: new Date().toISOString(),
        postCount: posts.length,
        username: username,
        source: 'medium-scraper'
      }
    };
  }

  // Download template files for manual management
  downloadTemplate() {
    const template = this.createDefaultCache();
    template.posts = [
      {
        id: "example-1",
        title: "Example Blog Post",
        description: "This is an example blog post for demonstration purposes...",
        publishedAt: "2024-01-15",
        tags: ["example", "template"],
        readingTime: "5 min read",
        claps: 0,
        responses: 0,
        url: "https://medium.com/@user/example-post",
        synced: {
          devto: false,
          hashnode: false
        }
      }
    ];
    template.metadata.postCount = 1;
    template.metadata.username = "your_username";

    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medium-posts-template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  }

  // Instructions for manual file management
  getFileManagementInstructions() {
    const username = import.meta.env.VITE_MEDIUM_USERNAME || 'your_username';
    
    return {
      title: 'File-based Cache Management',
      instructions: [
        '1. Cache files are stored in the /data directory',
        `2. Main cache file: posts-cache-${username}.json`,
        `3. Metadata file: metadata-${username}.json`,
        '4. Use "Export" to download current cache',
        '5. Use "Import" to load cache from file',
        '6. Files are automatically created when syncing posts'
      ],
      paths: {
        cache: this.getCacheFilePath(username),
        metadata: this.getMetadataFilePath(username)
      }
    };
  }
}

export default new FileService();