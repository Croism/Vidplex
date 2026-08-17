/**
 * CORS utility functions for handling cross-origin requests
 */

/**
 * Creates a fetch request with proper CORS headers
 * @param {string} url - The URL to fetch from
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} - Fetch response
 */
export const corsFetch = async (url, options = {}) => {
  const defaultOptions = {
    mode: 'cors',
    credentials: 'omit',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, mergedOptions)
    return response
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('CORS Error: Unable to make request. The server may not allow cross-origin requests.')
    }
    throw error
  }
}

/**
 * Checks if CORS is supported/enabled
 * @returns {boolean} - True if CORS appears to be working
 */
export const checkCorsSupport = async () => {
  try {
    const testUrl = 'https://api.themoviedb.org/3/configuration'
    const response = await fetch(testUrl, {
      method: 'OPTIONS',
      mode: 'cors',
    })
    return response.ok || response.status === 0
  } catch (error) {
    return false
  }
}

/**
 * Handles CORS errors gracefully
 * @param {Error} error - The error object
 * @returns {string} - User-friendly error message
 */
export const handleCorsError = (error) => {
  if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
    return 'Unable to connect to the API due to CORS restrictions. Please use a proxy server or enable CORS on the server.'
  }
  return error.message
}

