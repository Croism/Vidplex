import { getImageUrl } from '../services/tmdb'
import './SearchResults.css'

const SearchResults = ({ results, onPlay, onMoreInfo, continueWatching = [], title = 'Search Results' }) => {
  const today = new Date()

  const seen = new Set()

  const visibleResults = (results || []).filter((item) => {
    if (!item.poster_path) return false
    const itemType = item.media_type || item.type || 'movie'
    const key = `${item.id}-${itemType}`
    if (seen.has(key)) return false
    seen.add(key)

    const releaseDate = item.release_date || item.first_air_date

    if (itemType === 'movie' && releaseDate) {
      const rd = new Date(releaseDate)
      if (!Number.isNaN(rd.getTime()) && rd > today) {
        // Hide future movies from search
        return false
      }
    }

    return true
  })

  if (!visibleResults || visibleResults.length === 0) {
    return (
      <div className="search-results">
        <div className="no-results">
          <p>No results found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="search-results">
      <h2 className="search-title">{title}</h2>
      <div className="search-grid">
        {visibleResults.map((item) => {
          const posterUrl = getImageUrl(item.poster_path)
          const itemTitle = item.title || item.name
          const itemType = item.media_type || item.type || 'movie'
          const isInContinueWatching = continueWatching.some(
            (cw) => cw.id === item.id && cw.type === itemType
          )
          
          return (
            <div 
              key={`${item.id}-${itemType}`}
              className="search-card"
              onClick={() => onMoreInfo(item)}
            >
              {isInContinueWatching && (
                <div className="continue-badge">
                  <svg
                    className="continue-badge-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 12a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
              )}
              {posterUrl && (
                <img 
                  src={posterUrl} 
                  alt={itemTitle}
                  className="search-poster"
                  width="200"
                  height="300"
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SearchResults

