import { useState, useEffect } from 'react'
import GenreSelector from './GenreSelector'
import ContentRow from './ContentRow'
import { fetchTVGenres, fetchTVByGenre, fetchMultiplePages, fetchMultiplePagesByGenre, fetchPopularTV } from '../services/tmdb'
import './TVShowsView.css'

const TVShowsView = ({ onPlay, onMoreInfo, continueWatching = [] }) => {
  const [genres, setGenres] = useState([])
  const [selectedGenres, setSelectedGenres] = useState([])
  const [shows, setShows] = useState([])
  const [loading, setLoading] = useState(true)

  const handleToggleGenre = (genreId) => {
    setSelectedGenres((prev) => (
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    ))
  }

  const handleClearGenres = () => {
    setSelectedGenres([])
  }

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const genresData = await fetchTVGenres()
        setGenres(genresData.genres || genresData || [])
      } catch (error) {
        console.error('Error loading genres:', error)
      }
    }
    loadGenres()
  }, [])

  useEffect(() => {
    const loadShows = async () => {
      setLoading(true)
      try {
        let showsData = []
        if (selectedGenres.length === 0) {
          showsData = await fetchMultiplePages(fetchPopularTV, 3)
        } else {
          showsData = await fetchMultiplePagesByGenre(fetchTVByGenre, selectedGenres, 5)
        }
        const showsWithType = showsData.map(show => ({
          ...show,
          media_type: 'tv',
          type: 'tv'
        }))
        setShows(showsWithType)
      } catch (error) {
        console.error('Error loading TV shows:', error)
        setShows([])
      } finally {
        setLoading(false)
      }
    }

    loadShows()
  }, [selectedGenres])

  const selectedNames = selectedGenres
    .map((id) => genres.find((genre) => genre.id === id)?.name)
    .filter(Boolean)
    .join(', ')

  return (
    <div className="tv-shows-view">
      <GenreSelector
        genres={genres}
        selectedGenres={selectedGenres}
        onToggleGenre={handleToggleGenre}
        onClearGenres={handleClearGenres}
      />
      
      {loading ? (
        <div className="loading-container">
          <p>Loading TV shows...</p>
        </div>
      ) : (
        <div className="tv-shows-content">
          {selectedGenres.length === 0 ? (
            <>
              <ContentRow
                title="Popular TV Shows"
                items={shows.slice(0, 20)}
                onPlay={onPlay}
                onMoreInfo={onMoreInfo}
                continueWatching={continueWatching}
              />
              <ContentRow
                title="More Popular TV Shows"
                items={shows.slice(20, 40)}
                onPlay={onPlay}
                onMoreInfo={onMoreInfo}
                continueWatching={continueWatching}
              />
              {shows.length > 40 && (
                <ContentRow
                  title="Even More TV Shows"
                  items={shows.slice(40)}
                  onPlay={onPlay}
                  onMoreInfo={onMoreInfo}
                  continueWatching={continueWatching}
                />
              )}
            </>
          ) : (
            <>
              <ContentRow
                title={`${selectedNames} TV Shows`}
                items={shows.slice(0, 20)}
                onPlay={onPlay}
                onMoreInfo={onMoreInfo}
                continueWatching={continueWatching}
              />
              {shows.length > 20 && (
                <ContentRow
                  title="More TV Shows"
                  items={shows.slice(20, 40)}
                  onPlay={onPlay}
                  onMoreInfo={onMoreInfo}
                  continueWatching={continueWatching}
                />
              )}
              {shows.length > 40 && (
                <ContentRow
                  title="Even More TV Shows"
                  items={shows.slice(40)}
                  onPlay={onPlay}
                  onMoreInfo={onMoreInfo}
                  continueWatching={continueWatching}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default TVShowsView
