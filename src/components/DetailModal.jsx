import { useState, useEffect } from 'react'
import { getImageUrl, GENRES, fetchMovieDetails, fetchTVDetails, fetchMovieVideos, fetchTVVideos } from '../services/tmdb'
import './DetailModal.css'

const DetailModal = ({ item, onClose, onPlay, continueWatching = [], setContinueWatching }) => {
  const [details, setDetails] = useState(null)
  const [trailer, setTrailer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [trailerLoading, setTrailerLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('info')
  const [selectedSeason, setSelectedSeason] = useState(1)
  const [selectedEpisode, setSelectedEpisode] = useState(1)

  const itemType = item.media_type || item.type || 'movie'
  const itemId = item.id
  const isInContinueWatching = continueWatching.some(
    (cw) => cw.id === itemId && cw.type === itemType
  )

  const handleRemoveFromContinueWatching = () => {
    if (!setContinueWatching) return
    setContinueWatching((prev) => prev.filter(
      (cw) => !(cw.id === itemId && cw.type === itemType)
    ))
  }

  useEffect(() => {
    const loadDetails = async () => {
      try {
        setLoading(true)
        setTrailer(null) // Reset trailer when item changes
        setActiveTab('info') // Reset to info tab
        const data = itemType === 'tv'
          ? await fetchTVDetails(itemId)
          : await fetchMovieDetails(itemId)
        setDetails(data)
        
        // For TV shows, set default season/episode
        if (itemType === 'tv' && data.seasons && data.seasons.length > 0) {
          // Find first season with episodes
          const firstSeasonWithEpisodes = data.seasons.find(s => s.episode_count > 0 && s.season_number > 0)
          if (firstSeasonWithEpisodes) {
            setSelectedSeason(firstSeasonWithEpisodes.season_number)
            setSelectedEpisode(1)
          }
        }
      } catch (error) {
        console.error('Error loading details:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDetails()
  }, [itemId, itemType])

  useEffect(() => {
    const loadTrailer = async () => {
      if (activeTab === 'trailer' && !trailerLoading) {
        try {
          setTrailerLoading(true)
          const videos = itemType === 'tv'
            ? await fetchTVVideos(itemId)
            : await fetchMovieVideos(itemId)
          
          if (!videos || !videos.results || videos.results.length === 0) {
            console.log('No videos found')
            setTrailer(null)
            return
          }
          
          // Find YouTube trailer (prefer official trailer, then any trailer)
          const trailerVideo = videos.results.find(video => 
            video.site === 'YouTube' && 
            video.type === 'Trailer'
          ) || videos.results.find(video => 
            video.site === 'YouTube' && 
            (video.type === 'Teaser' || video.type === 'Trailer')
          )
          
          if (trailerVideo && trailerVideo.key) {
            console.log('Found trailer with key:', trailerVideo.key)
            setTrailer(trailerVideo)
          } else {
            console.log('No YouTube trailer found')
            setTrailer(null)
          }
        } catch (error) {
          console.error('Error loading trailer:', error)
          setTrailer(null)
        } finally {
          setTrailerLoading(false)
        }
      }
    }

    loadTrailer()
  }, [activeTab, itemId, itemType])

  // Update episode when season changes
  useEffect(() => {
    if (itemType === 'tv' && details && details.seasons) {
      const season = details.seasons.find(s => s.season_number === selectedSeason)
      if (season && season.episode_count > 0) {
        setSelectedEpisode(1)
      }
    }
  }, [selectedSeason, details, itemType])

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (loading) {
    return (
      <div className="detail-modal-overlay" onClick={handleBackdropClick}>
        <div className="detail-modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="loading">Loading...</div>
        </div>
      </div>
    )
  }

  const displayItem = details || item
  const backdropUrl = getImageUrl(displayItem.backdrop_path, 'w1280')
  const title = displayItem.title || displayItem.name
  const overview = displayItem.overview || 'No overview available.'
  const releaseDate = displayItem.release_date || displayItem.first_air_date

  // Determine if this item is "coming soon" (future-dated movie)
  let isComingSoon = Boolean(item.isComingSoon)
  if (!isComingSoon && itemType === 'movie' && releaseDate) {
    const rd = new Date(releaseDate)
    if (!Number.isNaN(rd.getTime())) {
      const today = new Date()
      if (rd > today) {
        isComingSoon = true
      }
    }
  }
  const genres = displayItem.genre_ids 
    ? displayItem.genre_ids.map(id => GENRES[id]).filter(Boolean)
    : (displayItem.genres || []).map(g => g.name)

  return (
    <div className="detail-modal-overlay" onClick={handleBackdropClick}>
      <div 
        className="detail-modal-container"
        style={{
          backgroundImage: backdropUrl 
            ? `linear-gradient(to bottom, rgba(20, 20, 20, 0.95) 0%, rgba(20, 20, 20, 0.8) 100%), url(${backdropUrl})`
            : 'linear-gradient(to bottom, rgba(20, 20, 20, 0.95) 0%, rgba(20, 20, 20, 0.8) 100%)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="modal-content">
          <h1 className="modal-title">{title}</h1>
          
          <div className="modal-meta">
            {releaseDate && (
              <span className="meta-item">{new Date(releaseDate).getFullYear()}</span>
            )}
            {genres.length > 0 && (
              <span className="meta-item">{genres.join(', ')}</span>
            )}
            {displayItem.vote_average && (
              <span className="meta-item">⭐ {displayItem.vote_average.toFixed(1)}</span>
            )}
          </div>

          {/* Tabs */}
          <div className="modal-tabs">
            <button 
              className={`modal-tab ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              Info
            </button>
            <button 
              className={`modal-tab ${activeTab === 'trailer' ? 'active' : ''}`}
              onClick={() => setActiveTab('trailer')}
            >
              Trailer
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'info' && (
            <div className="tab-content">
              <p className="modal-overview">{overview}</p>

              {itemType === 'tv' && details && details.seasons && (
                <div className="season-episode-selector">
                  <div className="selector-group">
                    <label className="selector-label">
                      Season:
                      <select 
                        value={selectedSeason} 
                        onChange={(e) => setSelectedSeason(Number(e.target.value))}
                        className="selector-select"
                      >
                        {details.seasons
                          .filter(season => season.season_number > 0 && season.episode_count > 0)
                          .map(season => (
                            <option key={season.season_number} value={season.season_number}>
                              Season {season.season_number} {season.name ? `(${season.name})` : ''} ({season.episode_count} episodes)
                            </option>
                          ))}
                      </select>
                    </label>
                    <label className="selector-label">
                      Episode:
                      <select 
                        value={selectedEpisode} 
                        onChange={(e) => setSelectedEpisode(Number(e.target.value))}
                        className="selector-select"
                      >
                        {(() => {
                          const season = details.seasons.find(s => s.season_number === selectedSeason)
                          const episodeCount = season ? season.episode_count : 0
                          return Array.from({ length: episodeCount }, (_, i) => i + 1).map(ep => (
                            <option key={ep} value={ep}>Episode {ep}</option>
                          ))
                        })()}
                      </select>
                    </label>
                  </div>
                </div>
              )}

              {(!isComingSoon || isInContinueWatching) && (
                <div className="modal-actions">
                  {!isComingSoon && (
                    <button 
                      className="modal-btn play-btn" 
                      onClick={() => {
                        const playItem = {
                          ...item,
                          season: itemType === 'tv' ? selectedSeason : undefined,
                          episode: itemType === 'tv' ? selectedEpisode : undefined
                        }
                        onPlay(playItem)
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      Play
                    </button>
                  )}

                  {isInContinueWatching && (
                    <button
                      className="modal-btn info-btn"
                      onClick={handleRemoveFromContinueWatching}
                    >
                      Remove from Continue Watching
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'trailer' && (
            <div className="tab-content trailer-content">
              {trailerLoading ? (
                <div className="trailer-loading">
                  <p>Loading trailer...</p>
                </div>
              ) : trailer ? (
                <div className="trailer-embed">
                  <iframe
                    src={`https://www.youtube.com/embed/${trailer.key}?autoplay=0&rel=0`}
                    title={`${title} Trailer`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="trailer-iframe"
                  />
                </div>
              ) : (
                <div className="trailer-unavailable">
                  <p>No trailer is available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DetailModal

