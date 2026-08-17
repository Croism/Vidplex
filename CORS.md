# CORS Configuration Guide

This application implements CORS (Cross-Origin Resource Sharing) handling to ensure proper communication with external APIs.

## Implementation Details

### 1. Vite Proxy Configuration (Development)

In development mode, Vite automatically proxies API requests through `/api/tmdb` to avoid CORS issues:

- **Proxy Path**: `/api/tmdb/*` → `https://api.themoviedb.org/3/*`
- **CORS Headers**: Automatically added by the proxy
- **Change Origin**: Enabled to properly handle cross-origin requests

### 2. Production Mode

In production builds, the application makes direct requests to the TMDB API. The TMDB API supports CORS, so direct requests should work without issues.

### 3. CORS Headers in Fetch Requests

All API requests include proper CORS headers:
- `mode: 'cors'` - Enables CORS requests
- `credentials: 'omit'` - Doesn't send cookies (for security)
- `Accept: 'application/json'` - Specifies expected response type

### 4. Error Handling

The application includes specific error handling for CORS-related issues:
- Detects CORS errors by checking for `TypeError` with 'fetch' in the message
- Provides user-friendly error messages
- Logs detailed error information for debugging

## Usage

### Development
```bash
npm run dev
```
The Vite proxy automatically handles CORS during development.

### Production
```bash
npm run build
npm run preview
```
Direct API calls are made, relying on the TMDB API's CORS support.

## Troubleshooting

If you encounter CORS errors:

1. **Development Mode**: Ensure Vite dev server is running and proxy is configured correctly
2. **Production Mode**: Verify the TMDB API allows requests from your domain
3. **Browser Console**: Check for specific CORS error messages
4. **Network Tab**: Inspect request headers and response headers

## CORS Utility Functions

The `src/utils/cors.js` file provides utility functions:
- `corsFetch()` - Wrapper for fetch with CORS headers
- `checkCorsSupport()` - Checks if CORS is supported
- `handleCorsError()` - Provides user-friendly error messages

