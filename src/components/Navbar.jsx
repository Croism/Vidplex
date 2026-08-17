import { useState, useEffect } from 'react'
import './Navbar.css'

const Navbar = ({ searchQuery, setSearchQuery, activeView, setActiveView }) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    let frameId = 0

    const updateScrolled = () => {
      frameId = 0
      setIsScrolled((prev) => {
        const next = window.scrollY > 50
        return prev === next ? prev : next
      })
    }

    const handleScroll = () => {
      if (frameId) return
      frameId = window.requestAnimationFrame(updateScrolled)
    }

    updateScrolled()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (frameId) window.cancelAnimationFrame(frameId)
    }
  }, [])

  const handleSearchClick = () => {
    setIsSearchExpanded(true)
  }

  const handleSearchBlur = () => {
    if (!searchQuery) {
      setIsSearchExpanded(false)
    }
  }

  const handleNavClick = (e, view) => {
    e.preventDefault()
    setActiveView(view)
    setSearchQuery('') // Clear search when navigating
    setIsSearchExpanded(false) // Hide search bar and show icon again
    setIsMobileMenuOpen(false) // Close mobile menu
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-content">
          <div className="navbar-left">
            <button 
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isMobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </>
                )}
              </svg>
            </button>
            <div className="navbar-logo">
              <span className="logo-text" onClick={() => handleNavClick({ preventDefault: () => {} }, 'home')} style={{ cursor: 'pointer' }}>VidPlex</span>
            </div>
          </div>
          
          <div className={`navbar-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            <a 
              href="#home" 
              className={`nav-link ${activeView === 'home' ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, 'home')}
            >
              Home
            </a>
            <a 
              href="#tv-shows" 
              className={`nav-link ${activeView === 'tv-shows' ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, 'tv-shows')}
            >
              TV Shows
            </a>
            <a 
              href="#movies" 
              className={`nav-link ${activeView === 'movies' ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, 'movies')}
            >
              Movies
            </a>
            <a 
              href="#new-popular" 
              className={`nav-link ${activeView === 'new-popular' ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, 'new-popular')}
            >
              New & Popular
            </a>
          </div>

          <div className="navbar-search">
            {isSearchExpanded ? (
              <input
                type="text"
                className="search-input"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={handleSearchBlur}
                autoFocus
              />
            ) : (
              <button className="search-icon-btn" onClick={handleSearchClick} aria-label="Search">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </button>
            )}
          </div>
        </div>
      </nav>
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}
    </>
  )
}

export default Navbar

