import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import Search from './components/Search'
import BlogList from './components/BlogList'
import SyncButtons from './components/SyncButtons'
import ScrapingStatus from './components/ScrapingStatus'
import CacheManager from './components/CacheManager'
import ApiStatus from './components/ApiStatus'
import PostExportModal from './components/PostExportModal'
import mediumApi from './services/mediumApi'
import mediumScraper from './services/mediumScraper'
import cacheService from './services/cacheService'
import devtoApi from './services/devtoApi'
import hashnodeApi from './services/hashnodeApi'


function App() {
  const [blogs, setBlogs] = useState([])
  const [filteredBlogs, setFilteredBlogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [syncStatus, setSyncStatus] = useState({})
  const [error, setError] = useState(null)
  const [exportModal, setExportModal] = useState({ show: false, post: null, platform: null })

  // Load blogs from cache first, then optionally sync new posts
  useEffect(() => {
    loadBlogsFromCache()
  }, [])

  const loadBlogsFromCache = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const cachedPosts = await cacheService.getCachedPosts()
      
      if (cachedPosts.length > 0) {
        console.log(`Loaded ${cachedPosts.length} posts from cache`)
        setBlogs(cachedPosts)
        setFilteredBlogs(cachedPosts)
        setError(`Loaded ${cachedPosts.length} posts from cache`)
      } else {
        console.log('No cached posts found')
        setError('No posts found - click "Sync New Posts" to load from Medium')
        setBlogs([])
        setFilteredBlogs([])
      }
    } catch (error) {
      console.error('Error loading from cache:', error)
      setError('Error loading cached posts - please try syncing')
      setBlogs([])
      setFilteredBlogs([])
    } finally {
      setIsLoading(false)
    }
  }

  const refreshPosts = async () => {
    const username = import.meta.env.VITE_MEDIUM_USERNAME
    const enableScraping = import.meta.env.VITE_ENABLE_SCRAPING === 'true'
    
    if (!enableScraping || !username) {
      throw new Error('Scraping not configured. Please set VITE_MEDIUM_USERNAME in .env')
    }
    
    try {
      // Get current cached posts
      const cachedPosts = await cacheService.getCachedPosts()
      
      // Try Medium API first (if configured)
      if (mediumApi.isConfigured()) {
        console.log('Syncing from Medium API...')
        const response = await mediumApi.getAllPosts()
        
        const transformedBlogs = response.data.map((post, index) => ({
          id: post.id || index + 1,
          title: post.title,
          description: post.content ? post.content.substring(0, 200) + '...' : 'No description available',
          publishedAt: new Date(post.publishedAt || post.createdAt).toISOString().split('T')[0],
          tags: post.tags || [],
          readingTime: `${Math.ceil((post.content?.length || 1000) / 200)} min read`,
          claps: post.virtues?.clap || 0,
          responses: post.virtues?.response || 0,
          synced: {
            devto: false,
            hashnode: false
          },
          published: {
            devto: false,
            hashnode: false
          }
        }))
        
        // Merge with cached posts and save
        const mergedPosts = cacheService.mergePosts(cachedPosts, transformedBlogs)
        await cacheService.savePosts(mergedPosts)
        
        setBlogs(mergedPosts)
        setFilteredBlogs(mergedPosts)
        setError(`Synced from Medium API - ${transformedBlogs.length} new posts`)
        return
      }

      // Try scraping for new posts only
      console.log(`Syncing new posts from @${username}...`)
      const newPosts = await mediumScraper.getNewPosts(username, cachedPosts)
      
      if (newPosts.length > 0) {
        // Merge new posts with cached posts
        const mergedPosts = cacheService.mergePosts(cachedPosts, newPosts)
        await cacheService.savePosts(mergedPosts)
        
        setBlogs(mergedPosts)
        setFilteredBlogs(mergedPosts)
        setError(`Sync complete - found ${newPosts.length} new posts`)
      } else {
        setError('Sync complete - no new posts found')
      }
      
    } catch (err) {
      console.error('Error syncing posts:', err)
      throw err
    }
  }

  // Filter blogs based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredBlogs(blogs)
    } else {
      const filtered = blogs.filter(blog =>
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredBlogs(filtered)
    }
  }, [searchTerm, blogs])

  const handleSync = async (blogId, platform) => {
    const blog = blogs.find(b => b.id === blogId)
    if (!blog) {
      console.error('Blog post not found:', blogId)
      return
    }

    setSyncStatus(prev => ({
      ...prev,
      [`${blogId}-${platform}`]: 'syncing'
    }))

    try {
      let result = null
      
      // Check if API is configured before attempting sync
      if (platform === 'devto') {
        if (!devtoApi.isConfigured()) {
          throw new Error('Dev.to API key not configured. Please add VITE_DEVTO_API_KEY to your .env file.')
        }
        
        // Check if article already exists
        const exists = await devtoApi.articleExists(blog)
        if (exists) {
          throw new Error('Article already exists on Dev.to')
        }
        
        result = await devtoApi.publishArticle(blog)
        
      } else if (platform === 'hashnode') {
        if (!hashnodeApi.isConfigured()) {
          throw new Error('Hashnode API key not configured. Please add VITE_HASHNODE_API_KEY to your .env file.')
        }
        
        // Check if article already exists
        const exists = await hashnodeApi.articleExists(blog)
        if (exists) {
          throw new Error('Article already exists on Hashnode')
        }
        
        result = await hashnodeApi.publishArticle(blog)
      } else {
        throw new Error(`Unknown platform: ${platform}`)
      }

      if (result.success) {
        console.log(`Successfully synced "${blog.title}" to ${platform}:`, result.url)
        
        // Update blog sync status in memory and cache
        const updatedBlogs = blogs.map(b => 
          b.id === blogId 
            ? { 
                ...b, 
                synced: { 
                  ...b.synced, 
                  [platform]: true 
                },
                urls: {
                  ...b.urls,
                  [platform]: result.url
                }
              }
            : b
        )
        
        setBlogs(updatedBlogs)
        await cacheService.savePosts(updatedBlogs)

        setSyncStatus(prev => ({
          ...prev,
          [`${blogId}-${platform}`]: 'success'
        }))
        
        // Show success message longer for real syncs
        setTimeout(() => {
          setSyncStatus(prev => {
            const newStatus = { ...prev }
            delete newStatus[`${blogId}-${platform}`]
            return newStatus
          })
        }, 5000)
        
      } else {
        throw new Error('Sync failed - no success response')
      }

    } catch (err) {
      console.error(`Sync to ${platform} failed:`, err.message)
      
      // Instead of showing error, show export modal for manual sync
      setExportModal({ 
        show: true, 
        post: blog, 
        platform: platform 
      })
      
      // Clear syncing status immediately
      setSyncStatus(prev => {
        const newStatus = { ...prev }
        delete newStatus[`${blogId}-${platform}`]
        return newStatus
      })
    }
  }

  const handleBulkSync = async (platform) => {
    const unsyncedBlogs = blogs.filter(blog => !blog.synced[platform])
    
    for (const blog of unsyncedBlogs) {
      await handleSync(blog.id, platform)
      // Small delay between syncs
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  const handleManualStatusChange = async (blogId, platform, isPublished) => {
    try {
      // Update blog publication status in memory
      const updatedBlogs = blogs.map(b => 
        b.id === blogId 
          ? { 
              ...b, 
              published: { 
                ...b.published, 
                [platform]: isPublished 
              }
            }
          : b
      )
      
      setBlogs(updatedBlogs)
      
      // Update filtered blogs to reflect changes immediately
      const updatedFilteredBlogs = filteredBlogs.map(b => 
        b.id === blogId 
          ? { 
              ...b, 
              published: { 
                ...b.published, 
                [platform]: isPublished 
              }
            }
          : b
      )
      setFilteredBlogs(updatedFilteredBlogs)
      
      // Save to cache
      await cacheService.savePosts(updatedBlogs)
      
      console.log(`Marked post "${updatedBlogs.find(b => b.id === blogId)?.title}" as ${isPublished ? 'published' : 'not published'} on ${platform}`)
      
    } catch (err) {
      console.error('Error updating publication status:', err)
      setError('Failed to update publication status')
    }
  }

  return (
    <div className="terminal">
      <div className="terminal-window">
        <Header />
        
        <div className="terminal-content">

          <ScrapingStatus 
            isLoading={isLoading}
            error={error}
            postsCount={blogs.length}
            username={import.meta.env.VITE_MEDIUM_USERNAME}
          />

          <CacheManager 
            onRefresh={refreshPosts}
            isLoading={isLoading}
          />

          <ApiStatus />

          <Search 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            totalBlogs={blogs.length}
            filteredCount={filteredBlogs.length}
          />

          <SyncButtons 
            blogs={blogs}
            onBulkSync={handleBulkSync}
            isLoading={isLoading}
          />

          <BlogList 
            blogs={filteredBlogs}
            isLoading={isLoading}
            onSync={handleSync}
            syncStatus={syncStatus}
            onManualStatusChange={handleManualStatusChange}
          />
        </div>
      </div>

      {/* Export Modal */}
      {exportModal.show && (
        <PostExportModal
          post={exportModal.post}
          platform={exportModal.platform}
          onClose={() => setExportModal({ show: false, post: null, platform: null })}
        />
      )}
    </div>
  )
}

export default App