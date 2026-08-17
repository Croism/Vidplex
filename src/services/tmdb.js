const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'
const TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1ZDQxYjYxZWJhMDZiMzUxYzQ4OTI0MTA0ZDg3OWM1NiIsIm5iZiI6MTc2NTI5NTAxOS4xNDgsInN1YiI6IjY5Mzg0M2FiMmJlZDUwNGEzNzA2OWVlOSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.etEw2AzXP9MsHBOxVWInXBXcmaoCda5qqrVBKTeEweU'

const headers = {
  'Authorization': `Bearer ${TMDB_TOKEN}`,
  'Accept': 'application/json',
}

const isLocalDevHost = () => {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host === '::1'
}

const getApiBase = () => {
  // The Vite /api/tmdb proxy only works on localhost. Dev tunnels intercept
  // /api/* and redirect to login, which breaks CORS — call TMDB directly.
  if (import.meta.env.DEV && isLocalDevHost()) return '/api/tmdb'
  return TMDB_BASE_URL
}

export const getImageUrl = (path, size = 'w500') => {
  if (!path) return null
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

export const getOriginalImageUrl = (path) => {
  return getImageUrl(path, 'original')
}

const fetchFromTMDB = async (endpoint) => {
  try {
    const url = `${getApiBase()}${endpoint}`
    const fetchOptions = {
      method: 'GET',
      headers,
      mode: 'cors',
      credentials: 'omit',
    }

    const response = await fetch(url, fetchOptions)
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.results || data
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('CORS error: Unable to fetch from TMDB API. This may be a CORS policy issue.')
      throw new Error('Network error: Please check your CORS configuration or use a proxy server.')
    }
    console.error('TMDB fetch error:', error)
    throw error
  }
}

export const fetchTrending = async (timeWindow = 'day') => {
  return fetchFromTMDB(`/trending/all/${timeWindow}`)
}

export const fetchTopRated = async () => {
  return fetchFromTMDB('/movie/top_rated')
}

export const fetchByGenre = async (genreId, type = 'movie', page = 1) => {
  const ids = Array.isArray(genreId) ? genreId.filter(Boolean).join(',') : genreId
  return fetchFromTMDB(`/discover/${type}?with_genres=${ids}&page=${page}`)
}

export const fetchMoviesByGenre = async (genreId, page = 1) => {
  return fetchByGenre(genreId, 'movie', page)
}

export const fetchTVByGenre = async (genreId, page = 1) => {
  return fetchByGenre(genreId, 'tv', page)
}

export const fetchMultiplePages = async (fetchFn, pages = 3) => {
  try {
    const promises = Array.from({ length: pages }, (_, i) => fetchFn(i + 1))
    const results = await Promise.all(promises)
    return results.flat()
  } catch (error) {
    console.error('Error fetching multiple pages:', error)
    return []
  }
}

export const fetchMultiplePagesByGenre = async (fetchFn, genreId, pages = 3) => {
  try {
    const promises = Array.from({ length: pages }, (_, i) => fetchFn(genreId, i + 1))
    const results = await Promise.all(promises)
    return results.flat()
  } catch (error) {
    console.error('Error fetching multiple pages by genre:', error)
    return []
  }
}

export const fetchMovieGenres = async () => {
  return fetchFromTMDB('/genre/movie/list')
}

export const fetchTVGenres = async () => {
  return fetchFromTMDB('/genre/tv/list')
}

export const fetchPopularMovies = async (page = 1) => {
  return fetchFromTMDB(`/movie/popular?page=${page}`)
}

export const fetchPopularTV = async (page = 1) => {
  return fetchFromTMDB(`/tv/popular?page=${page}`)
}

export const fetchUpcomingMovies = async (page = 1) => {
  return fetchFromTMDB(`/movie/upcoming?page=${page}`)
}

// Popular movies within a specific release date window (inclusive),
// sorted by popularity descending.
export const fetchPopularMoviesByDateRange = async (fromDate, toDate, page = 1) => {
  return fetchFromTMDB(
    `/discover/movie?sort_by=popularity.desc&include_adult=false&include_video=false&page=${page}` +
    `&primary_release_date.gte=${fromDate}&primary_release_date.lte=${toDate}`
  )
}

// Popular movies for a specific release year, sorted by popularity.
export const fetchPopularMoviesByYear = async (year, page = 1) => {
  return fetchFromTMDB(
    `/discover/movie?sort_by=popularity.desc&include_adult=false&include_video=false&page=${page}` +
    `&primary_release_year=${year}`
  )
}

export const fetchTopRatedTV = async (page = 1) => {
  return fetchFromTMDB(`/tv/top_rated?page=${page}`)
}

export const fetchSearch = async (type, query) => {
  return fetchFromTMDB(`/search/${type}?query=${encodeURIComponent(query)}`)
}

export const fetchMovieDetails = async (id) => {
  return fetchFromTMDB(`/movie/${id}`)
}

export const fetchTVDetails = async (id) => {
  return fetchFromTMDB(`/tv/${id}`)
}

export const fetchTVSeasonDetails = async (tvId, seasonNumber) => {
  return fetchFromTMDB(`/tv/${tvId}/season/${seasonNumber}`)
}

export const fetchMovieVideos = async (id) => {
  try {
    const url = `${API_BASE}/movie/${id}/videos`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...headers,
        'Accept': 'application/json',
      },
      mode: 'cors',
      credentials: 'omit',
    })
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }
    const data = await response.json()
    return data // Return full object with results property
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('CORS error: Unable to fetch movie videos.')
      throw new Error('Network error: Please check your CORS configuration.')
    }
    console.error('TMDB fetch error:', error)
    throw error
  }
}

export const fetchTVVideos = async (id) => {
  try {
    const url = `${API_BASE}/tv/${id}/videos`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...headers,
        'Accept': 'application/json',
      },
      mode: 'cors',
      credentials: 'omit',
    })
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`)
    }
    const data = await response.json()
    return data // Return full object with results property
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('CORS error: Unable to fetch TV videos.')
      throw new Error('Network error: Please check your CORS configuration.')
    }
    console.error('TMDB fetch error:', error)
    throw error
  }
}

export const GENRES = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
}

