import { memo, useRef } from 'react'
import { getImageUrl } from '../services/tmdb'
import { useHorizontalDragScroll } from '../hooks/useHorizontalDragScroll'
import './ContentRow.css'

const ContentRow = ({ title, items, onPlay, onMoreInfo, continueWatching = [] }) => {
  const scrollRef = useRef(null)
  const hasItems = Boolean(items && items.length)
  useHorizontalDragScroll(scrollRef, hasItems)

  if (!hasItems) return null

  return (
    <div className="content-row">
      <h2 className="row-title">{title}</h2>
      <div className="row-container">
        <div className="row-scroll" ref={scrollRef}>
          {(() => {
            const seen = new Set()
            let visibleIndex = 0
            return items.map((item) => {
            // Skip items without posters
            if (!item.poster_path) return null

            const itemType = item.media_type || item.type || 'movie'
            const dedupeKey = `${item.id}-${itemType}`
            if (seen.has(dedupeKey)) return null
            seen.add(dedupeKey)

            const itemTitle = item.title || item.name

            // Hide future-dated movies from all rows except the dedicated Coming Soon row
            const releaseDate = item.release_date || item.first_air_date
            if (
              itemType === 'movie' &&
              !item.isComingSoon &&
              releaseDate
            ) {
              const rd = new Date(releaseDate)
              if (!Number.isNaN(rd.getTime())) {
                const today = new Date()
                if (rd > today) {
                  return null
                }
              }
            }

            const posterUrl = getImageUrl(item.poster_path)
            const isInContinueWatching = continueWatching.some(
              (cw) => cw.id === item.id && cw.type === itemType
            )
            const isComingSoon = item.isComingSoon
            let comingSoonLabel = null
            if (isComingSoon && item.release_date) {
              const rd = new Date(item.release_date)
              if (!Number.isNaN(rd.getTime())) {
                comingSoonLabel = rd.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              }
            }
            
            const imagePriority = visibleIndex < 6
            visibleIndex += 1

            return (
              <div 
                key={`${item.id}-${itemType}`} 
                className="poster-card"
                onClick={() => onMoreInfo(item)}
              >
                {isComingSoon && comingSoonLabel && (
                  <div className="coming-soon-badge">
                    {comingSoonLabel}
                  </div>
                )}
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
                {posterUrl ? (
                  <img 
                    src={posterUrl} 
                    alt={itemTitle}
                    className="poster-image"
                    width="200"
                    height="300"
                    loading={imagePriority ? 'eager' : 'lazy'}
                    decoding="async"
                    draggable="false"
                  />
                ) : (
                  <div className="poster-placeholder">
                    <span>{itemTitle}</span>
                  </div>
                )}
              </div>
            )
          })
          })()}
        </div>
      </div>
    </div>
  )
}

export default memo(ContentRow)

