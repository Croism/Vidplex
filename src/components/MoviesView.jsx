import { useState, useEffect } from 'react'
import GenreSelector from './GenreSelector'
import ContentRow from './ContentRow'
import { fetchMovieGenres, fetchMoviesByGenre, fetchMultiplePages, fetchMultiplePagesByGenre, fetchPopularMovies } from '../services/tmdb'
import './MoviesView.css'

const MoviesView = ({ onPlay, onMoreInfo, continueWatching = [] }) => {
  const [genres, setGenres] = useState([])
  const [selectedGenres, setSelectedGenres] = useState([])
  const [movies, setMovies] = useState([])
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
        const genresData = await fetchMovieGenres()
        setGenres(genresData.genres || genresData || [])
      } catch (error) {
        console.error('Error loading genres:', error)
      }
    }
    loadGenres()
  }, [])

  useEffect(() => {
    const loadMovies = async () => {
      setLoading(true)
      try {
        let moviesData = []
        if (selectedGenres.length === 0) {
          moviesData = await fetchMultiplePages(fetchPopularMovies, 3)
        } else {
          moviesData = await fetchMultiplePagesByGenre(fetchMoviesByGenre, selectedGenres, 5)
        }
        const moviesWithType = moviesData.map(movie => ({
          ...movie,
          media_type: 'movie',
          type: 'movie'
        }))
        setMovies(moviesWithType)
      } catch (error) {
        console.error('Error loading movies:', error)
        setMovies([])
      } finally {
        setLoading(false)
      }
    }

    loadMovies()
  }, [selectedGenres])

  const selectedNames = selectedGenres
    .map((id) => genres.find((genre) => genre.id === id)?.name)
    .filter(Boolean)
    .join(', ')

  return (
    <div className="movies-view">
      <GenreSelector
        genres={genres}
        selectedGenres={selectedGenres}
        onToggleGenre={handleToggleGenre}
        onClearGenres={handleClearGenres}
      />
      
      {loading ? (
        <div className="loading-container">
          <p>Loading movies...</p>
        </div>
      ) : (
        <div className="movies-content">
          {selectedGenres.length === 0 ? (
            <>
              <ContentRow
                title="Popular Movies"
                items={movies.slice(0, 20)}
                onPlay={onPlay}
                onMoreInfo={onMoreInfo}
                continueWatching={continueWatching}
              />
              <ContentRow
                title="More Popular Movies"
                items={movies.slice(20, 40)}
                onPlay={onPlay}
                onMoreInfo={onMoreInfo}
                continueWatching={continueWatching}
              />
              {movies.length > 40 && (
                <ContentRow
                  title="Even More Movies"
                  items={movies.slice(40)}
                  onPlay={onPlay}
                  onMoreInfo={onMoreInfo}
                  continueWatching={continueWatching}
                />
              )}
            </>
          ) : (
            <>
              <ContentRow
                title={`${selectedNames} Movies`}
                items={movies.slice(0, 20)}
                onPlay={onPlay}
                onMoreInfo={onMoreInfo}
                continueWatching={continueWatching}
              />
              {movies.length > 20 && (
                <ContentRow
                  title="More Movies"
                  items={movies.slice(20, 40)}
                  onPlay={onPlay}
                  onMoreInfo={onMoreInfo}
                  continueWatching={continueWatching}
                />
              )}
              {movies.length > 40 && (
                <ContentRow
                  title="Even More Movies"
                  items={movies.slice(40)}
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

export default MoviesView
