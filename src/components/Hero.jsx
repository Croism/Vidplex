import { getImageUrl } from '../services/tmdb'
import './Hero.css'

const Hero = ({ item, onPlay, onMoreInfo }) => {
  const backgroundImage = getImageUrl(item.backdrop_path, 'w1280')
  const title = item.title || item.name
  const overview = item.overview || ''

  return (
    <div className="hero">
      {backgroundImage && (
        <img
          className="hero-backdrop"
          src={backgroundImage}
          alt=""
          decoding="async"
          draggable="false"
        />
      )}
      <div className="hero-gradient" />
      <div className="hero-content">
        <h1 className="hero-title">{title}</h1>
        <p className="hero-overview">{overview}</p>
        <div className="hero-buttons">
          <button className="hero-btn play-btn" onClick={() => onPlay(item)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Play
          </button>
          <button className="hero-btn info-btn" onClick={() => onMoreInfo(item)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            More Info
          </button>
        </div>
      </div>
    </div>
  )
}

export default Hero
