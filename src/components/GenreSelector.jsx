import { useRef } from 'react'
import { useHorizontalDragScroll } from '../hooks/useHorizontalDragScroll'
import './GenreSelector.css'

const GenreSelector = ({ genres, selectedGenres = [], onToggleGenre, onClearGenres }) => {
  const scrollRef = useRef(null)
  useHorizontalDragScroll(scrollRef)

  const selectedSet = new Set(selectedGenres)
  const selectedItems = selectedGenres
    .map((id) => genres.find((genre) => genre.id === id))
    .filter(Boolean)
  const unselectedItems = genres.filter((genre) => !selectedSet.has(genre.id))
  const noneSelected = selectedItems.length === 0

  return (
    <div className="genre-selector">
      <div className="genre-scroll" ref={scrollRef}>
        {selectedItems.length > 0 && (
          <div className="genre-selected-group">
            {selectedItems.map((genre) => (
              <button
                key={genre.id}
                type="button"
                className="genre-btn selected"
                onClick={() => onToggleGenre(genre.id)}
                aria-pressed="true"
                aria-label={`Remove ${genre.name} filter`}
              >
                <span className="genre-btn-label">{genre.name}</span>
                <span className="genre-remove" aria-hidden="true">
                  ×
                </span>
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          className={`genre-btn ${noneSelected ? 'active' : ''}`}
          onClick={onClearGenres}
          aria-pressed={noneSelected}
        >
          {noneSelected ? 'All' : 'Clear Genres'}
        </button>

        {unselectedItems.map((genre) => (
          <button
            key={genre.id}
            type="button"
            className="genre-btn"
            onClick={() => onToggleGenre(genre.id)}
            aria-pressed="false"
          >
            {genre.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export default GenreSelector
