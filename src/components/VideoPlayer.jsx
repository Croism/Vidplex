import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { fetchTVDetails, fetchMovieDetails } from '../services/tmdb'
import './VideoPlayer.css'

const DEFAULT_EMBED_COLOR = '228C22'

const toEmbedColor = (hex) => {
  if (!hex || typeof hex !== 'string') return DEFAULT_EMBED_COLOR
  let value = hex.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(value)) {
    value = value.split('').map((char) => char + char).join('')
  }
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return DEFAULT_EMBED_COLOR
  return value.toUpperCase()
}

const VideoPlayer = ({ item, continueWatching, setContinueWatching, onClose, accentColor }) => {
  const [season, setSeason] = useState(item.season || 1)
  const [episode, setEpisode] = useState(item.episode || 1)
  const [tvDetails, setTvDetails] = useState(null)
  const [movieDetails, setMovieDetails] = useState(null)
  const watchStartTime = useRef(null)
  const watchTimer = useRef(null)
  const wrapperRef = useRef(null)
  const [watchedTime, setWatchedTime] = useState(0)
  const [iframeSize, setIframeSize] = useState({ width: 1280, height: 720 })
  
  const itemType = item.media_type || item.type || 'movie'
  const tmdbId = item.id

  useEffect(() => {
    // Check if there's saved progress for this item
    const saved = continueWatching.find(
      cw => cw.id === tmdbId && cw.type === itemType
    )
    if (saved) {
      setSeason(saved.season || item.season || 1)
      setEpisode(saved.episode || item.episode || 1)
      if (itemType === 'movie' && saved.watched_time) {
        setWatchedTime(saved.watched_time)
      }
    } else if (item.season && item.episode) {
      setSeason(item.season)
      setEpisode(item.episode)
    }
  }, [tmdbId, itemType, continueWatching, item.season, item.episode])

  useEffect(() => {
    // Fetch TV show details to get actual seasons/episodes
    if (itemType === 'tv') {
      const loadTVDetails = async () => {
        try {
          const details = await fetchTVDetails(tmdbId)
          setTvDetails(details)
          
          // Validate selected season/episode
          if (details.seasons) {
            const validSeasons = details.seasons.filter(s => s.season_number > 0 && s.episode_count > 0)
            const currentSeasonData = validSeasons.find(s => s.season_number === season)
            
            if (!currentSeasonData) {
              // If selected season doesn't exist, use first valid season
              const firstValidSeason = validSeasons[0]
              if (firstValidSeason) {
                setSeason(firstValidSeason.season_number)
                setEpisode(1)
              }
            } else {
              // Validate episode number
              if (episode > currentSeasonData.episode_count) {
                setEpisode(1)
              }
            }
          }
        } catch (error) {
          console.error('Error loading TV details:', error)
        }
      }
      loadTVDetails()
    } else if (itemType === 'movie') {
      // Fetch movie details to get runtime
      const loadMovieDetails = async () => {
        try {
          const details = await fetchMovieDetails(tmdbId)
          setMovieDetails(details)
        } catch (error) {
          console.error('Error loading movie details:', error)
        }
      }
      loadMovieDetails()
    }
  }, [itemType, tmdbId, season, episode])

  // Track watch time for movies
  useEffect(() => {
    if (itemType === 'movie') {
      // Get base watched time from continue watching
      const saved = continueWatching.find(cw => cw.id === tmdbId && cw.type === itemType)
      const baseTime = saved?.watched_time || 0
      setWatchedTime(baseTime)
      
      // Start tracking watch time when video player opens
      watchStartTime.current = Date.now()
      
      // Update watched time every 5 seconds
      watchTimer.current = setInterval(() => {
        if (watchStartTime.current) {
          const elapsed = (Date.now() - watchStartTime.current) / 1000 / 60 // Convert to minutes
          setWatchedTime(baseTime + elapsed)
        }
      }, 5000) // Update every 5 seconds

      return () => {
        if (watchTimer.current) {
          clearInterval(watchTimer.current)
        }
      }
    }
  }, [itemType, tmdbId, continueWatching])

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const updateSize = () => {
      const width = Math.max(wrapper.clientWidth, 1)
      const height = Math.max(Math.round((width * 9) / 16), 180)
      setIframeSize((prev) => (
        prev && prev.width === width && prev.height === height
          ? prev
          : { width, height }
      ))
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(wrapper)
    window.addEventListener('orientationchange', updateSize)
    window.addEventListener('resize', updateSize)
    return () => {
      observer.disconnect()
      window.removeEventListener('orientationchange', updateSize)
      window.removeEventListener('resize', updateSize)
    }
  }, [])

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
    }
  }, [])

  const getVideoUrl = () => {
    const params = new URLSearchParams({
      color: toEmbedColor(accentColor),
      autoPlay: 'true',
      nextEpisode: 'true',
    })

    if (itemType === 'tv') {
      return `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}?${params}`
    }

    return `https://www.vidking.net/embed/movie/${tmdbId}?${params}`
  }

  const handleClose = () => {
    // Clear watch timer
    if (watchTimer.current) {
      clearInterval(watchTimer.current)
    }

    // Calculate final watched time
    let finalWatchedTime = watchedTime
    if (watchStartTime.current && itemType === 'movie') {
      const elapsed = (Date.now() - watchStartTime.current) / 1000 / 60 // Convert to minutes
      const saved = continueWatching.find(cw => cw.id === tmdbId && cw.type === itemType)
      const baseTime = saved?.watched_time || 0
      finalWatchedTime = baseTime + elapsed
      // Ensure we don't exceed runtime
      if (movieDetails && movieDetails.runtime) {
        finalWatchedTime = Math.min(finalWatchedTime, movieDetails.runtime)
      }
    }

    // Update continue watching with current progress
    const existingIndex = continueWatching.findIndex(
      cw => cw.id === tmdbId && cw.type === itemType
    )
    
    let progress = 0
    if (itemType === 'movie' && movieDetails && movieDetails.runtime) {
      // Calculate progress as watched_time / runtime
      progress = Math.min(finalWatchedTime / movieDetails.runtime, 1)
    }
    
    const updatedItem = {
      id: tmdbId,
      title: item.title || item.name,
      poster_path: item.poster_path,
      type: itemType,
      progress: progress,
      last_watched: Date.now(),
      season: season,
      episode: episode
    }

    // For movies, add runtime and watched_time
    if (itemType === 'movie' && movieDetails) {
      updatedItem.runtime = movieDetails.runtime
      updatedItem.watched_time = finalWatchedTime
    }

    if (existingIndex >= 0) {
      const updated = [...continueWatching]
      updated[existingIndex] = updatedItem
      setContinueWatching(updated)
    } else {
      setContinueWatching([updatedItem, ...continueWatching])
    }

    onClose()
  }

  return (
    <div className="video-player-overlay" onClick={handleClose}>
      <div className="video-player-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={handleClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div className="video-wrapper" ref={wrapperRef}>
          <iframe
            key={toEmbedColor(accentColor)}
            src={getVideoUrl()}
            className="video-iframe"
            title="Video player"
            width={iframeSize.width}
            height={iframeSize.height}
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share"
            referrerPolicy="origin"
            loading="eager"
            style={{ width: '100%', height: `${iframeSize.height}px` }}
          />
        </div>

        {itemType === 'tv' && (
          <div className="episode-controls">
            <div className="episode-selector">
              <label>
                Season:
                <select 
                  value={season} 
                  onChange={(e) => {
                    const newSeason = Number(e.target.value)
                    setSeason(newSeason)
                    setEpisode(1) // Reset to episode 1 when season changes
                  }}
                  className="episode-select"
                >
                  {tvDetails && tvDetails.seasons ? (
                    tvDetails.seasons
                      .filter(s => s.season_number > 0 && s.episode_count > 0)
                      .map(s => (
                        <option key={s.season_number} value={s.season_number}>
                          Season {s.season_number} {s.name ? `(${s.name})` : ''} ({s.episode_count} episodes)
                        </option>
                      ))
                  ) : (
                    <option value={1}>Season 1</option>
                  )}
                </select>
              </label>
              <label>
                Episode:
                <select 
                  value={episode} 
                  onChange={(e) => setEpisode(Number(e.target.value))}
                  className="episode-select"
                >
                  {(() => {
                    if (!tvDetails || !tvDetails.seasons) {
                      return <option value={1}>Episode 1</option>
                    }
                    const currentSeasonData = tvDetails.seasons.find(s => s.season_number === season)
                    const episodeCount = currentSeasonData ? currentSeasonData.episode_count : 0
                    return Array.from({ length: episodeCount }, (_, i) => i + 1).map(ep => (
                      <option key={ep} value={ep}>Episode {ep}</option>
                    ))
                  })()}
                </select>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VideoPlayer

