# VidPlex - Netflix Clone

A single-page React application that mimics the Netflix UI with a dark green theme. Built entirely client-side with no authentication required.

## Features

- **Dark Mode UI**: Black background (#141414) with green accents (#228C22)
- **Hero Section**: Random trending content with play and info buttons
- **Content Rows**: Horizontal scrolling carousels for different categories
- **Continue Watching**: Tracks playback progress using localStorage
- **Search**: Real-time search across movies and TV shows
- **Video Player**: Full-screen video player with Vidking integration
- **Detail Modal**: Detailed information about movies and TV shows

## Tech Stack

- React 18
- Vite
- TMDB API for content data
- Vidking for video embeds
- localStorage for state persistence

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Build

```bash
npm run build
```

## Project Structure

```
src/
  ├── components/       # React components
  │   ├── Navbar.jsx
  │   ├── Hero.jsx
  │   ├── ContentRow.jsx
  │   ├── SearchResults.jsx
  │   ├── VideoPlayer.jsx
  │   └── DetailModal.jsx
  ├── services/        # API services
  │   └── tmdb.js
  ├── hooks/          # Custom hooks
  │   └── useLocalStorage.js
  ├── App.jsx          # Main app component
  ├── main.jsx         # Entry point
  └── index.css       # Global styles
```

## Features in Detail

### Continue Watching
- Automatically tracks when you start watching a video
- Stores progress, season, and episode information
- Displays as the first row on the home screen

### Search
- Real-time search with 500ms debounce
- Searches both movies and TV shows
- Displays results in a grid layout

### Video Player
- Full-screen overlay modal
- Supports both movies and TV shows
- Season/episode selector for TV shows
- Integrates with Vidking for video playback

## Styling

All text uses the JetBrains Mono font family. The color scheme follows:
- Background: #141414 (black)
- Accent: #228C22 (green)
- Text: #ffffff (white)

## License

This is a demo project for educational purposes.
