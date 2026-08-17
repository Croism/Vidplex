import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import ContentRow from './components/ContentRow'
import SearchResults from './components/SearchResults'
import VideoPlayer from './components/VideoPlayer'
import DetailModal from './components/DetailModal'
import MoviesView from './components/MoviesView'
import TVShowsView from './components/TVShowsView'
import SettingsModal from './components/SettingsModal'
import { 
  fetchTrending, 
  fetchTopRated, 
  fetchByGenre, 
  fetchSearch, 
  fetchMultiplePages, 
  fetchPopularMovies, 
  fetchPopularTV, 
  fetchMovieDetails,
  fetchPopularMoviesByDateRange,
  fetchPopularMoviesByYear,
  fetchUpcomingMovies,
} from './services/tmdb'
import { useLocalStorage } from './hooks/useLocalStorage'

const DEFAULT_SETTINGS = {
  fontSize: 'medium',
  fontFamily: "'JetBrains Mono', monospace",
  accentColor: '#228C22',
}

function App() {
  const [activeView, setActiveView] = useState('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [trending, setTrending] = useState([])
  const [topRated, setTopRated] = useState([])
  const [actionMovies, setActionMovies] = useState([])
  const [comedyMovies, setComedyMovies] = useState([])
  const [comingSoon, setComingSoon] = useState([])
  const [newPopular, setNewPopular] = useState([])
  const [popularThisMonth, setPopularThisMonth] = useState([])
  const [popularLastMonth, setPopularLastMonth] = useState([])
  const [popularLastYear, setPopularLastYear] = useState([])
  const [popularTenYearsAgo, setPopularTenYearsAgo] = useState([])
  const [newPopularHeroItem, setNewPopularHeroItem] = useState(null)
  const [heroItem, setHeroItem] = useState(null)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [continueWatching, setContinueWatching] = useLocalStorage('continueWatching', [])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [pendingSettings, setPendingSettings] = useState(DEFAULT_SETTINGS)

  // Load settings from session cookie on mount
  useEffect(() => {
    if (typeof document === 'undefined') return
    const cookies = document.cookie.split('; ').filter(Boolean)
    const found = cookies.find((c) => c.startsWith('vidplex_settings='))
    if (found) {
      try {
        const value = decodeURIComponent(found.split('=')[1])
        const parsed = JSON.parse(value)
        setSettings((prev) => ({ ...prev, ...parsed }))
        setPendingSettings((prev) => ({ ...prev, ...parsed }))
      } catch (e) {
        console.error('Failed to parse settings cookie', e)
      }
    }
  }, [])

  // Apply settings to document when they change
  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    const body = document.body

    // Font size
    const sizeMap = { small: '14px', medium: '16px', large: '20px' }
    const fontSize = sizeMap[settings.fontSize] || '16px'
    root.style.setProperty('--app-font-size', fontSize)
    root.style.fontSize = fontSize

    // Font family
    body.style.fontFamily = settings.fontFamily || "'JetBrains Mono', monospace"

    // Accent colour
    root.style.setProperty('--accent-color', settings.accentColor || '#228C22')
  }, [settings])

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch trending for hero (daily)
        const dailyTrending = await fetchTrending('day')
        if (dailyTrending.length > 0) {
          const randomHero = dailyTrending[Math.floor(Math.random() * dailyTrending.length)]
          setHeroItem(randomHero)
        }

        // Fetch weekly trending for "Trending Now" row
        const weeklyTrending = await fetchTrending('week')
        setTrending(weeklyTrending)

        const topRatedData = await fetchTopRated()
        setTopRated(topRatedData)

        const actionData = await fetchByGenre(28)
        setActionMovies(actionData)

        const comedyData = await fetchByGenre(35)
        setComedyMovies(comedyData)

        // Coming Soon: upcoming movies with future release dates
        const upcomingRaw = await fetchMultiplePages(fetchUpcomingMovies, 2)
        const today = new Date()
        const upcomingFiltered = (upcomingRaw || []).filter((movie) => {
          if (!movie.release_date) return false
          const rd = new Date(movie.release_date)
          return !Number.isNaN(rd.getTime()) && rd > today
        })
        const upcomingWithMeta = upcomingFiltered.map((movie) => ({
          ...movie,
          media_type: 'movie',
          type: 'movie',
          isComingSoon: true,
        }))
        setComingSoon(upcomingWithMeta)
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim()) {
        try {
          const [movieResults, tvResults] = await Promise.all([
            fetchSearch('movie', searchQuery),
            fetchSearch('tv', searchQuery)
          ])

          // Normalize search results so movies and TV shows have a proper type/media_type
          const normalizedMovieResults = (movieResults || []).map((movie) => ({
            ...movie,
            media_type: 'movie',
            type: 'movie',
          }))

          const normalizedTVResults = (tvResults || []).map((show) => ({
            ...show,
            media_type: 'tv',
            type: 'tv',
          }))

          // Combine and sort by rating (vote_average) from highest to lowest
          const combinedResults = [...normalizedMovieResults, ...normalizedTVResults].sort(
            (a, b) => (b.vote_average || 0) - (a.vote_average || 0)
          )

          setSearchResults(combinedResults)
        } catch (error) {
          console.error('Search error:', error)
        }
      } else {
        setSearchResults(null)
      }
    }

    const timeoutId = setTimeout(performSearch, 500)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Clear search results when switching views
  useEffect(() => {
    if (activeView !== 'home' && searchQuery === '') {
      setSearchResults(null)
    }
  }, [activeView, searchQuery])

  useEffect(() => {
    // Load "New & Popular" content
    const loadNewPopular = async () => {
      try {
        // Base combined list (movies + TV) for the grid
        const [popularMovies, popularTV] = await Promise.all([
          fetchMultiplePages(fetchPopularMovies, 2),
          fetchMultiplePages(fetchPopularTV, 2)
        ])
        // Ensure items have correct type
        const moviesWithType = popularMovies.map(movie => ({
          ...movie,
          media_type: 'movie',
          type: 'movie'
        }))
        const tvWithType = popularTV.map(show => ({
          ...show,
          media_type: 'tv',
          type: 'tv'
        }))
        const combined = [...moviesWithType, ...tvWithType].sort(
          (a, b) => (b.vote_average || 0) - (a.vote_average || 0)
        )
        setNewPopular(combined)

        // Time-based popular movie rows
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() // 0-based

        const formatDate = (date) => date.toISOString().split('T')[0]

        // This month
        const startThisMonth = new Date(year, month, 1)
        const endThisMonth = new Date(year, month + 1, 0)

        // Last month
        const startLastMonth = new Date(year, month - 1, 1)
        const endLastMonth = new Date(year, month, 0)

        const lastYear = year - 1
        const tenYearsAgo = year - 10

        const [
          thisMonthMovies,
          lastMonthMovies,
          lastYearMovies,
          tenYearsMovies,
        ] = await Promise.all([
          fetchPopularMoviesByDateRange(
            formatDate(startThisMonth),
            formatDate(endThisMonth)
          ),
          fetchPopularMoviesByDateRange(
            formatDate(startLastMonth),
            formatDate(endLastMonth)
          ),
          fetchPopularMoviesByYear(lastYear),
          fetchPopularMoviesByYear(tenYearsAgo),
        ])

        const withMovieType = (items) =>
          (items || []).map((movie) => ({
            ...movie,
            media_type: 'movie',
            type: 'movie',
          }))

        const thisMonthTyped = withMovieType(thisMonthMovies)
        const lastMonthTyped = withMovieType(lastMonthMovies)
        const lastYearTyped = withMovieType(lastYearMovies)
        const tenYearsTyped = withMovieType(tenYearsMovies)

        setPopularThisMonth(thisMonthTyped)
        setPopularLastMonth(lastMonthTyped)
        setPopularLastYear(lastYearTyped)
        setPopularTenYearsAgo(tenYearsTyped)

        // Pick a hero for New & Popular (most popular movie this month if available,
        // otherwise fall back to first item from the combined list)
        const heroCandidate =
          thisMonthTyped[0] || combined.find((i) => i.media_type === 'movie') || combined[0] || null
        setNewPopularHeroItem(heroCandidate)
      } catch (error) {
        console.error('Error loading new & popular:', error)
      }
    }
    
    if (activeView === 'new-popular') {
      loadNewPopular()
    }
  }, [activeView])

  const handlePlay = async (item) => {
    setSelectedVideo(item)
    const itemType = item.media_type || item.type || 'movie'
    
    // For movies, fetch details to get runtime if not already in continue watching
    let runtime = null
    let watchedTime = 0
    let progress = 0
    
    if (itemType === 'movie') {
      const existing = continueWatching.find(cw => cw.id === item.id && cw.type === itemType)
      if (existing && existing.runtime) {
        runtime = existing.runtime
        watchedTime = existing.watched_time || 0
        progress = existing.progress || 0
      } else {
        // Fetch movie details to get runtime
        try {
          const details = await fetchMovieDetails(item.id)
          runtime = details.runtime
        } catch (error) {
          console.error('Error fetching movie details:', error)
        }
      }
    }
    
    // Add to continue watching
    const existingIndex = continueWatching.findIndex(cw => cw.id === item.id && cw.type === itemType)
    const continueItem = {
      id: item.id,
      title: item.title || item.name,
      poster_path: item.poster_path,
      type: itemType,
      progress: progress,
      last_watched: Date.now(),
      season: item.season || 1,
      episode: item.episode || 1
    }
    
    // Add movie-specific fields
    if (itemType === 'movie' && runtime) {
      continueItem.runtime = runtime
      continueItem.watched_time = watchedTime
    }
    
    if (existingIndex >= 0) {
      const updated = [...continueWatching]
      updated[existingIndex] = continueItem
      setContinueWatching(updated)
    } else {
      setContinueWatching([continueItem, ...continueWatching])
    }
  }

  const handleMoreInfo = (item) => {
    setSelectedDetail(item)
  }

  const handleClosePlayer = () => {
    setSelectedVideo(null)
  }

  const handleCloseDetail = () => {
    setSelectedDetail(null)
  }

  const saveSettingsCookie = (value) => {
    if (typeof document === 'undefined') return
    const encoded = encodeURIComponent(JSON.stringify(value))
    document.cookie = `vidplex_settings=${encoded}; path=/`
  }

  const handleOpenSettings = () => {
    setPendingSettings(settings)
    setSettingsOpen(true)
  }

  const handleApplySettings = () => {
    setSettings(pendingSettings)
    saveSettingsCookie(pendingSettings)
    setSettingsOpen(false)
  }

  const handleApplyDefaultSettings = () => {
    setSettings(DEFAULT_SETTINGS)
    setPendingSettings(DEFAULT_SETTINGS)
    if (typeof document !== 'undefined') {
      document.cookie = 'vidplex_settings=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
    setSettingsOpen(false)
  }

  const handleDiscardSettings = () => {
    setPendingSettings(settings)
    setSettingsOpen(false)
  }

  const renderView = () => {
    if (searchResults) {
      return (
        <SearchResults 
          results={searchResults} 
          onPlay={handlePlay}
          onMoreInfo={handleMoreInfo}
          continueWatching={continueWatching}
        />
      )
    }

    switch (activeView) {
      case 'movies':
        return (
          <MoviesView
            onPlay={handlePlay}
            onMoreInfo={handleMoreInfo}
            continueWatching={continueWatching}
          />
        )
      
      case 'tv-shows':
        return (
          <TVShowsView
            onPlay={handlePlay}
            onMoreInfo={handleMoreInfo}
            continueWatching={continueWatching}
          />
        )
      
      case 'new-popular':
        return (
          <>
            {newPopularHeroItem && (
              <Hero
                item={newPopularHeroItem}
                onPlay={handlePlay}
                onMoreInfo={handleMoreInfo}
              />
            )}

            <ContentRow
              title="Most Popular This Month"
              items={popularThisMonth}
              onPlay={handlePlay}
              onMoreInfo={handleMoreInfo}
              continueWatching={continueWatching}
            />

            <ContentRow
              title="Most Popular Last Month"
              items={popularLastMonth}
              onPlay={handlePlay}
              onMoreInfo={handleMoreInfo}
              continueWatching={continueWatching}
            />

            <ContentRow
              title="Most Popular Last Year"
              items={popularLastYear}
              onPlay={handlePlay}
              onMoreInfo={handleMoreInfo}
              continueWatching={continueWatching}
            />

            <ContentRow
              title="Most Popular 10 Years Ago"
              items={popularTenYearsAgo}
              onPlay={handlePlay}
              onMoreInfo={handleMoreInfo}
              continueWatching={continueWatching}
            />

            <SearchResults
              results={newPopular}
              onPlay={handlePlay}
              onMoreInfo={handleMoreInfo}
              continueWatching={continueWatching}
              title="New & Popular"
            />
          </>
        )
      
      case 'home':
      default:
        return (
          <>
            {heroItem && (
              <Hero 
                item={heroItem} 
                onPlay={handlePlay}
                onMoreInfo={handleMoreInfo}
              />
            )}
            
            {continueWatching.length > 0 && (
              <ContentRow
                title="Continue Watching"
                items={continueWatching}
                onPlay={handlePlay}
                onMoreInfo={handleMoreInfo}
                continueWatching={continueWatching}
              />
            )}
            
            <ContentRow
              title="Trending Now"
              items={trending}
              onPlay={handlePlay}
              onMoreInfo={handleMoreInfo}
              continueWatching={continueWatching}
            />
            
            <ContentRow
              title="Top Rated Movies"
              items={topRated}
              onPlay={handlePlay}
              onMoreInfo={handleMoreInfo}
              continueWatching={continueWatching}
            />
            
            <ContentRow
              title="Action Movies"
              items={actionMovies}
              onPlay={handlePlay}
              onMoreInfo={handleMoreInfo}
              continueWatching={continueWatching}
            />
            
            <ContentRow
              title="Comedy Hits"
              items={comedyMovies}
              onPlay={handlePlay}
              onMoreInfo={handleMoreInfo}
              continueWatching={continueWatching}
            />

            <ContentRow
              title="Coming Soon"
              items={comingSoon}
              onPlay={handlePlay}
              onMoreInfo={handleMoreInfo}
              continueWatching={continueWatching}
            />
          </>
        )
    }
  }

  return (
    <div className="app">
      <Navbar 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery}
        activeView={activeView}
        setActiveView={setActiveView}
      />
      
      {renderView()}

      <footer className="app-footer">
        <span>Made by Ermin</span>
        <button
          type="button"
          className="app-footer-settings"
          onClick={handleOpenSettings}
        >
          Settings
        </button>
      </footer>

      {selectedVideo && (
        <VideoPlayer 
          item={selectedVideo}
          continueWatching={continueWatching}
          setContinueWatching={setContinueWatching}
          onClose={handleClosePlayer}
          accentColor={settings.accentColor}
        />
      )}

      {selectedDetail && (
        <DetailModal 
          item={selectedDetail}
          onClose={handleCloseDetail}
          onPlay={handlePlay}
          continueWatching={continueWatching}
          setContinueWatching={setContinueWatching}
        />
      )}

      <SettingsModal
        isOpen={settingsOpen}
        pendingSettings={pendingSettings}
        setPendingSettings={setPendingSettings}
        onApply={handleApplySettings}
        onApplyDefaults={handleApplyDefaultSettings}
        onDiscard={handleDiscardSettings}
      />
    </div>
  )
}

export default App

