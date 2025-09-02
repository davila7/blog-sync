import React, { useState, useEffect } from 'react'
import mediumScraper from '../services/mediumScraper'

const PostExportModal = ({ post, platform, onClose }) => {
  const [fullContent, setFullContent] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!post) return null

  useEffect(() => {
    fetchFullContent()
  }, [post.url])

  const fetchFullContent = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Fetching full content for:', post.title)
      const content = await mediumScraper.getFullArticleContent(post.url)
      
      if (content) {
        setFullContent(content)
      } else {
        setError('Could not fetch full content')
      }
    } catch (err) {
      console.error('Error fetching content:', err)
      setError('Failed to fetch article content')
    } finally {
      setIsLoading(false)
    }
  }

  const getFormattedContent = () => {
    const contentToUse = isLoading ? 
      'Loading full article content...' : 
      error ? 
        `Error loading content: ${error}\n\nFallback to description:\n${post.description?.replace('...', '') || ''}` :
        fullContent?.content || post.description?.replace('...', '') || '';

    switch (platform) {
      case 'devto':
        return {
          title: '📝 Copy to Dev.to',
          instructions: [
            '1. Go to https://dev.to/new',
            '2. Paste the title and content below',
            '3. Add the tags',
            '4. Set canonical URL to reference your Medium post'
          ],
          content: {
            title: fullContent?.title || post.title,
            tags: post.tags.slice(0, 4).join(', '),
            body: contentToUse,
            canonical: post.url
          }
        }
      
      case 'hashnode':
        return {
          title: '📝 Copy to Hashnode',
          instructions: [
            '1. Go to https://hashnode.com/create',
            '2. Paste the title and content below',
            '3. Add the tags (max 5)',
            '4. Set original article URL'
          ],
          content: {
            title: fullContent?.title || post.title,
            tags: post.tags.slice(0, 5).join(', '),
            body: contentToUse,
            originalUrl: post.url
          }
        }
      
      default:
        return { title: 'Export Post', instructions: [], content: {} }
    }
  }

  const formatInfo = getFormattedContent()

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard')
    }).catch(err => {
      console.error('Failed to copy:', err)
    })
  }

  // Generate bookmarklet for auto-posting
  const generateBookmarklet = (content, platform) => {
    const bookmarkletCode = platform === 'devto' 
      ? generateDevToBookmarklet(content)
      : generateHashnodeBookmarklet(content)
    
    // Create downloadable bookmarklet
    const bookmarkletHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Auto-Post to ${platform === 'devto' ? 'Dev.to' : 'Hashnode'} - Bookmarklet</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #1a1a1a; color: #00ff00; }
        .bookmark { 
            display: inline-block; 
            padding: 10px 15px; 
            background: #333; 
            border: 1px solid #00ff00; 
            border-radius: 5px;
            text-decoration: none;
            color: #00ff00;
            margin: 10px 0;
        }
        .instructions { margin-top: 20px; line-height: 1.6; }
        .code { background: #2a2a2a; padding: 10px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>🚀 Auto-Post Bookmarklet for ${platform === 'devto' ? 'Dev.to' : 'Hashnode'}</h1>
    
    <p><strong>Drag this link to your bookmarks bar:</strong></p>
    
    <a href="${bookmarkletCode}" class="bookmark">
        📝 Auto-Fill ${platform === 'devto' ? 'Dev.to' : 'Hashnode'}
    </a>
    
    <div class="instructions">
        <h3>Instructions:</h3>
        <ol>
            <li>Drag the green button above to your browser's bookmarks bar</li>
            <li>Go to ${platform === 'devto' ? 'https://dev.to/new' : 'https://hashnode.com/create'}</li>
            <li>Click the bookmark you just added</li>
            <li>Watch the form auto-fill with your content! 🎉</li>
        </ol>
        
        <p><strong>Article:</strong> "${content.title}"</p>
        <p><strong>Tags:</strong> ${content.tags}</p>
        <p><strong>Words:</strong> ~${fullContent?.wordCount || 0}</p>
    </div>
</body>
</html>
    `
    
    // Download the bookmarklet HTML file
    const blob = new Blob([bookmarkletHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `auto-post-${platform}-bookmarklet.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    alert(`📁 Bookmarklet downloaded! Open the HTML file and drag the bookmark to your browser's bookmarks bar.`)
  }

  // Generate Dev.to bookmarklet JavaScript
  const generateDevToBookmarklet = (content) => {
    const js = `
      (function() {
        // Fill Dev.to form
        const titleField = document.querySelector('#article-form-title') || 
                          document.querySelector('input[placeholder*="title"]') ||
                          document.querySelector('textarea[placeholder*="title"]');
        
        const bodyField = document.querySelector('#article_body_markdown') ||
                         document.querySelector('textarea[placeholder*="Write your post"]') ||
                         document.querySelector('.CodeMirror textarea') ||
                         document.querySelector('textarea');
        
        const tagsField = document.querySelector('#tag-input') ||
                         document.querySelector('input[placeholder*="tag"]') ||
                         document.querySelector('input[name="tags"]');
        
        const canonicalField = document.querySelector('#article_canonical_url') ||
                              document.querySelector('input[placeholder*="canonical"]');
        
        // Fill fields
        if (titleField) {
          titleField.value = ${JSON.stringify(content.title)};
          titleField.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        if (bodyField) {
          bodyField.value = ${JSON.stringify(content.body)};
          bodyField.dispatchEvent(new Event('input', { bubbles: true }));
          
          // Handle CodeMirror if present
          if (bodyField.CodeMirror) {
            bodyField.CodeMirror.setValue(${JSON.stringify(content.body)});
          }
        }
        
        if (tagsField) {
          tagsField.value = ${JSON.stringify(content.tags)};
          tagsField.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        if (canonicalField) {
          canonicalField.value = ${JSON.stringify(content.canonical)};
          canonicalField.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        alert('✅ Dev.to form auto-filled! Review and publish when ready.');
      })();
    `
    
    return `javascript:${encodeURIComponent(js)}`
  }

  // Generate Hashnode bookmarklet JavaScript
  const generateHashnodeBookmarklet = (content) => {
    const js = `
      (function() {
        // Fill Hashnode form
        const titleField = document.querySelector('input[placeholder*="title"]') ||
                          document.querySelector('textarea[placeholder*="title"]') ||
                          document.querySelector('[data-testid="title-input"]');
        
        const bodyField = document.querySelector('textarea') ||
                         document.querySelector('.ql-editor') ||
                         document.querySelector('[data-testid="editor"]');
        
        const tagsInput = document.querySelector('input[placeholder*="tag"]') ||
                         document.querySelector('[data-testid="tags-input"]');
        
        // Fill fields
        if (titleField) {
          titleField.value = ${JSON.stringify(content.title)};
          titleField.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        if (bodyField) {
          if (bodyField.innerHTML !== undefined) {
            // Rich text editor
            bodyField.innerHTML = ${JSON.stringify(content.body.replace(/\\n/g, '<br>'))};
          } else {
            // Markdown editor
            bodyField.value = ${JSON.stringify(content.body)};
          }
          bodyField.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        if (tagsInput) {
          const tags = ${JSON.stringify(content.tags)}.split(', ');
          tags.forEach(tag => {
            tagsInput.value = tag;
            tagsInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          });
        }
        
        alert('✅ Hashnode form auto-filled! Review and publish when ready.');
      })();
    `
    
    return `javascript:${encodeURIComponent(js)}`
  }

  // Open platform with pre-filled data using URL parameters or localStorage
  const openPlatformWithData = (content, platform) => {
    // Store data in localStorage for the target site to pick up
    const dataKey = `blog-sync-${platform}-${Date.now()}`
    const postData = {
      title: content.title,
      body: content.body,
      tags: content.tags,
      canonical: content.canonical || content.originalUrl,
      timestamp: Date.now()
    }
    
    localStorage.setItem(dataKey, JSON.stringify(postData))
    
    // Generate JavaScript to inject into the target page
    const injectionScript = `
      // Blog Sync Auto-Fill Script
      setTimeout(() => {
        const data = ${JSON.stringify(postData)};
        
        ${platform === 'devto' ? `
        // Dev.to auto-fill
        const titleField = document.querySelector('#article-form-title') || document.querySelector('input[placeholder*="title"]');
        const bodyField = document.querySelector('#article_body_markdown') || document.querySelector('textarea');
        const tagsField = document.querySelector('#tag-input') || document.querySelector('input[placeholder*="tag"]');
        const canonicalField = document.querySelector('#article_canonical_url');
        
        if (titleField) { titleField.value = data.title; titleField.dispatchEvent(new Event('input', { bubbles: true })); }
        if (bodyField) { bodyField.value = data.body; bodyField.dispatchEvent(new Event('input', { bubbles: true })); }
        if (tagsField) { tagsField.value = data.tags; tagsField.dispatchEvent(new Event('input', { bubbles: true })); }
        if (canonicalField) { canonicalField.value = data.canonical; canonicalField.dispatchEvent(new Event('input', { bubbles: true })); }
        ` : `
        // Hashnode auto-fill
        const titleField = document.querySelector('input[placeholder*="title"]');
        const bodyField = document.querySelector('textarea') || document.querySelector('.ql-editor');
        
        if (titleField) { titleField.value = data.title; titleField.dispatchEvent(new Event('input', { bubbles: true })); }
        if (bodyField) { 
          if (bodyField.innerHTML !== undefined) {
            bodyField.innerHTML = data.body.replace(/\\n/g, '<br>');
          } else {
            bodyField.value = data.body;
          }
          bodyField.dispatchEvent(new Event('input', { bubbles: true })); 
        }
        `}
        
        console.log('Blog Sync: Form auto-filled!');
      }, 2000);
    `
    
    // Create a data URL with the injection script
    const scriptDataUrl = `data:text/javascript,${encodeURIComponent(injectionScript)}`
    
    // Open the platform
    const platformUrl = platform === 'devto' ? 'https://dev.to/new' : 'https://hashnode.com/create'
    const newWindow = window.open(platformUrl, '_blank')
    
    if (newWindow) {
      alert(`🚀 Opening ${platform === 'devto' ? 'Dev.to' : 'Hashnode'}! The form should auto-fill in a few seconds.
      
💡 If it doesn't work, try using the bookmarklet instead.`)
    } else {
      alert('❌ Popup blocked. Please enable popups or use the bookmarklet method.')
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: '8px',
        padding: '20px',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto',
        fontFamily: 'monospace'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-success)' }}>
              {formatInfo.title}
            </h3>
            {isLoading && (
              <span style={{ fontSize: '12px', color: 'var(--text-warning)' }}>
                🔄 Extracting rich content (images, formatting, links)...
              </span>
            )}
            {fullContent && (
              <span style={{ fontSize: '12px', color: 'var(--text-success)' }}>
                ✅ Rich Markdown ready ({fullContent.wordCount} words)
              </span>
            )}
            {error && (
              <span style={{ fontSize: '12px', color: 'var(--text-error)' }}>
                ⚠️ Using basic description
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-error)',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Instructions */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)' }}>
            Instructions:
          </h4>
          <ol style={{ margin: 0, paddingLeft: '16px', fontSize: '12px' }}>
            {formatInfo.instructions.map((instruction, index) => (
              <li key={index} style={{ marginBottom: '4px', color: 'var(--text-muted)' }}>
                {instruction}
              </li>
            ))}
          </ol>
        </div>

        {/* Content sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title */}
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <label style={{ fontWeight: '600', fontSize: '12px' }}>Title:</label>
              <button
                className="terminal-button"
                onClick={() => copyToClipboard(formatInfo.content.title)}
                style={{ fontSize: '10px', padding: '2px 6px' }}
              >
                Copy
              </button>
            </div>
            <textarea
              readOnly
              value={formatInfo.content.title}
              style={{
                width: '100%',
                minHeight: '40px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '4px',
                padding: '8px',
                fontSize: '11px',
                color: 'var(--text-primary)',
                fontFamily: 'monospace',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Tags */}
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <label style={{ fontWeight: '600', fontSize: '12px' }}>Tags:</label>
              <button
                className="terminal-button"
                onClick={() => copyToClipboard(formatInfo.content.tags)}
                style={{ fontSize: '10px', padding: '2px 6px' }}
              >
                Copy
              </button>
            </div>
            <textarea
              readOnly
              value={formatInfo.content.tags}
              style={{
                width: '100%',
                minHeight: '30px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '4px',
                padding: '8px',
                fontSize: '11px',
                color: 'var(--text-primary)',
                fontFamily: 'monospace'
              }}
            />
          </div>

          {/* Body Content */}
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <label style={{ fontWeight: '600', fontSize: '12px' }}>Content (Markdown):</label>
              <button
                className="terminal-button"
                onClick={() => copyToClipboard(formatInfo.content.body)}
                style={{ fontSize: '10px', padding: '2px 6px' }}
              >
                Copy
              </button>
            </div>
            <textarea
              readOnly
              value={formatInfo.content.body}
              style={{
                width: '100%',
                minHeight: '200px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '4px',
                padding: '8px',
                fontSize: '10px',
                color: 'var(--text-primary)',
                fontFamily: 'monospace',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Original URL */}
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <label style={{ fontWeight: '600', fontSize: '12px' }}>
                {platform === 'devto' ? 'Canonical URL:' : 'Original Article URL:'}
              </label>
              <button
                className="terminal-button"
                onClick={() => copyToClipboard(post.url)}
                style={{ fontSize: '10px', padding: '2px 6px' }}
              >
                Copy
              </button>
            </div>
            <input
              type="text"
              readOnly
              value={post.url}
              style={{
                width: '100%',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '4px',
                padding: '8px',
                fontSize: '11px',
                color: 'var(--text-primary)',
                fontFamily: 'monospace'
              }}
            />
          </div>
        </div>

        {/* Automation Options */}
        {fullContent && (
          <div style={{
            marginTop: '20px',
            padding: '12px',
            background: 'rgba(255, 215, 0, 0.05)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '4px'
          }}>
            <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-warning)' }}>
              🚀 One-Click Posting (Experimental)
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <button
                className="terminal-button"
                onClick={() => generateBookmarklet(formatInfo.content, platform)}
                style={{ fontSize: '10px', backgroundColor: 'var(--bg-warning)' }}
                title="Generate bookmarklet for auto-posting"
              >
                Generate Auto-Post Bookmarklet
              </button>
              
              <button
                className="terminal-button"
                onClick={() => openPlatformWithData(formatInfo.content, platform)}
                style={{ fontSize: '10px', backgroundColor: 'var(--bg-success)' }}
                title="Open platform with pre-filled data"
              >
                Open & Auto-Fill {platform === 'devto' ? 'Dev.to' : 'Hashnode'}
              </button>
            </div>
            
            <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
              💡 <strong>Auto-Post:</strong> Creates a bookmark that fills forms automatically when clicked on Dev.to/Hashnode
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '20px',
          padding: '12px',
          background: 'rgba(0, 255, 0, 0.05)',
          border: '1px solid rgba(0, 255, 0, 0.2)',
          borderRadius: '4px',
          fontSize: '10px',
          color: 'var(--text-muted)'
        }}>
          💡 <strong>Rich Content Extracted:</strong> 
          {fullContent ? (
            <>
              ✅ Images, formatting (bold, italic), links, code blocks, lists, and headings preserved in Markdown format.
              <br/>📋 Ready to paste directly into Dev.to or Hashnode editors.
            </>
          ) : (
            <>Loading full article content with all formatting and images...</>
          )}
          <br/>🔗 Includes proper attribution to your original Medium post.
        </div>
      </div>
    </div>
  )
}

export default PostExportModal