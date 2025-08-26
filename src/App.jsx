import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import Search from './components/Search'
import BlogList from './components/BlogList'
import SyncButtons from './components/SyncButtons'
import mediumApi from './services/mediumApi'

// Mock blog data for fallback
const mockBlogs = [
  {
    id: 1,
    title: "Getting Started with React Hooks: A Complete Guide",
    description: "Learn how to use React Hooks effectively in your applications with practical examples and best practices.",
    publishedAt: "2024-01-15",
    tags: ["react", "javascript", "hooks", "frontend"],
    readingTime: "8 min read",
    claps: 142,
    responses: 23,
    synced: {
      devto: true,
      hashnode: false
    }
  },
  {
    id: 2,
    title: "Building Scalable Node.js Applications with TypeScript",
    description: "Discover how to architect robust backend services using Node.js and TypeScript, including best practices for error handling and testing.",
    publishedAt: "2024-01-10",
    tags: ["nodejs", "typescript", "backend", "architecture"],
    readingTime: "12 min read",
    claps: 89,
    responses: 15,
    synced: {
      devto: false,
      hashnode: true
    }
  },
  {
    id: 3,
    title: "The Future of Web Development: Trends to Watch in 2024",
    description: "Explore the emerging technologies and frameworks that are shaping the future of web development this year.",
    publishedAt: "2024-01-08",
    tags: ["webdev", "trends", "future", "technology"],
    readingTime: "6 min read",
    claps: 201,
    responses: 34,
    synced: {
      devto: true,
      hashnode: true
    }
  },
  {
    id: 4,
    title: "Mastering CSS Grid: Layout Techniques for Modern Web Design",
    description: "Deep dive into CSS Grid layout system with practical examples and advanced techniques for creating responsive designs.",
    publishedAt: "2024-01-05",
    tags: ["css", "grid", "design", "frontend"],
    readingTime: "10 min read",
    claps: 156,
    responses: 19,
    synced: {
      devto: false,
      hashnode: false
    }
  },
  {
    id: 5,
    title: "API Design Best Practices: RESTful Services That Scale",
    description: "Learn how to design and implement RESTful APIs that are maintainable, scalable, and developer-friendly.",
    publishedAt: "2024-01-03",
    tags: ["api", "rest", "backend", "design"],
    readingTime: "9 min read",
    claps: 178,
    responses: 27,
    synced: {
      devto: true,
      hashnode: false
    }
  }
]

function App() {
  const [blogs, setBlogs] = useState([])
  const [filteredBlogs, setFilteredBlogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [syncStatus, setSyncStatus] = useState({})
  const [error, setError] = useState(null)

  // Load blogs from Medium API or fallback to mock data
  useEffect(() => {
    const loadBlogs = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        if (mediumApi.isConfigured()) {
          console.log('Loading blogs from Medium API...')
          const response = await mediumApi.getAllPosts()
          
          // Transform Medium API response to our format
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
            }
          }))
          
          setBlogs(transformedBlogs)
          setFilteredBlogs(transformedBlogs)
        } else {
          console.warn('Medium API not configured, using mock data')
          const config = mediumApi.getConfigurationHelp()
          setError(config.message + ' - Using mock data for demonstration')
          
          // Simulate API delay for mock data
          await new Promise(resolve => setTimeout(resolve, 1500))
          setBlogs(mockBlogs)
          setFilteredBlogs(mockBlogs)
        }
      } catch (err) {
        console.error('Error loading blogs:', err)
        setError(`Failed to load blog posts: ${err.message} - Using mock data`)
        
        // Fallback to mock data
        setBlogs(mockBlogs)
        setFilteredBlogs(mockBlogs)
      } finally {
        setIsLoading(false)
      }
    }

    loadBlogs()
  }, [])

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
    setSyncStatus(prev => ({
      ...prev,
      [`${blogId}-${platform}`]: 'syncing'
    }))

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update blog sync status
      setBlogs(prev => prev.map(blog => 
        blog.id === blogId 
          ? { ...blog, synced: { ...blog.synced, [platform]: true } }
          : blog
      ))

      setSyncStatus(prev => ({
        ...prev,
        [`${blogId}-${platform}`]: 'success'
      }))

      // Clear success status after 3 seconds
      setTimeout(() => {
        setSyncStatus(prev => {
          const newStatus = { ...prev }
          delete newStatus[`${blogId}-${platform}`]
          return newStatus
        })
      }, 3000)

    } catch (err) {
      setSyncStatus(prev => ({
        ...prev,
        [`${blogId}-${platform}`]: 'error'
      }))

      // Clear error status after 5 seconds
      setTimeout(() => {
        setSyncStatus(prev => {
          const newStatus = { ...prev }
          delete newStatus[`${blogId}-${platform}`]
          return newStatus
        })
      }, 5000)
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

  return (
    <div className="terminal">
      <div className="terminal-window">
        <Header />
        
        <div className="terminal-content">
          <div className="ascii-art">
            {`
 ██████╗ ██╗      ██████╗  ██████╗     ███████╗██╗   ██╗███╗   ██╗ ██████╗
 ██╔══██╗██║     ██╔═══██╗██╔════╝     ██╔════╝╚██╗ ██╔╝████╗  ██║██╔════╝
 ██████╔╝██║     ██║   ██║██║  ███╗    ███████╗ ╚████╔╝ ██╔██╗ ██║██║     
 ██╔══██╗██║     ██║   ██║██║   ██║    ╚════██║  ╚██╔╝  ██║╚██╗██║██║     
 ██████╔╝███████╗╚██████╔╝╚██████╔╝    ███████║   ██║   ██║ ╚████║╚██████╗
 ╚═════╝ ╚══════╝ ╚═════╝  ╚═════╝     ╚══════╝   ╚═╝   ╚═╝  ╚═══╝ ╚═════╝
            `}
          </div>

          <div className="terminal-command">
            <div className="terminal-command-header">
              <h1 className="terminal-command-title">
                <span className="terminal-prompt">$</span>
                blog-sync --platform medium --target all
              </h1>
            </div>
            <p className="terminal-command-subtitle">
              Synchronize Medium blog posts to Dev.to and Hashnode platforms
            </p>
          </div>

          {error && (
            <div className="terminal-error">
              <div className="terminal-error-title">Connection Error</div>
              <p>{error}</p>
            </div>
          )}

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
          />

          <div className="terminal-command" style={{ marginTop: '32px', opacity: 0.7 }}>
            <div className="terminal-flex">
              <span className="terminal-prompt success">✓</span>
              <span>Terminal session active - Ready for sync operations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App