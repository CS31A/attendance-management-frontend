import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios'
import axios from 'axios'

interface RefreshTokenResponse {
  success: boolean
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

interface FailedRequestQueueItem {
  resolve: () => Promise<void> | void
  reject: (error: unknown) => void
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 10000,
  withCredentials: true,
})

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false
// Queue to store failed requests while token is being refreshed
let failedRequestsQueue: FailedRequestQueueItem[] = []

/**
 * Process the queue of failed requests after successful token refresh
 * @param {Error|null} error - Error object if refresh failed, null if successful
 */
function processQueue(error: unknown = null): void {
  failedRequestsQueue.forEach((promise) => {
    if (error) {
      promise.reject(error)
    }
    else {
      promise.resolve()
    }
  })

  failedRequestsQueue = []
}

// Response interceptor to handle 401 errors and refresh tokens
api.interceptors.response.use(
  (response) => {
    // Pass through successful responses
    return response
  },
  async (error: AxiosError<RefreshTokenResponse>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined
    if (!originalRequest) {
      return Promise.reject(error)
    }

    // Check if error is 401 and not from the refresh endpoint itself
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Prevent retry loop for the refresh endpoint and login endpoint
      if (
        originalRequest.url === '/account/web/refresh'
        || originalRequest.url === '/account/web/login'
      ) {
        isRefreshing = false
        processQueue(error)
        return Promise.reject(error)
      }

      // Mark request as retried to prevent infinite loops
      originalRequest._retry = true

      if (!isRefreshing) {
        isRefreshing = true

        try {
          // Call refresh endpoint (cookie-based, no body needed)
          const response = await api.post<RefreshTokenResponse>('/account/web/refresh')
          if (response.data.success) {
            // Token refreshed successfully
            isRefreshing = false
            processQueue(null)

            // Retry the original request
            return api(originalRequest)
          }
          else {
            // Refresh indicated failure
            throw new Error('Token refresh failed')
          }
        }
        catch (refreshError: unknown) {
          // Refresh failed, reject all queued requests
          isRefreshing = false
          processQueue(refreshError)
          return Promise.reject(refreshError)
        }
      }

      // If already refreshing, queue this request
      return new Promise<AxiosResponse>((resolve, reject) => {
        failedRequestsQueue.push({
          resolve: async () => {
            try {
              const response = await api(originalRequest)
              resolve(response)
            }
            catch (requestError: unknown) {
              reject(requestError)
            }
          },
          reject: (err: unknown) => {
            reject(err)
          },
        })
      })
    }

    // For non-401 errors, reject normally
    return Promise.reject(error)
  },
)

export default api
