import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "https://localhost:8081/api",
    timeout: 5000,
    withCredentials: true,
})

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
// Queue to store failed requests while token is being refreshed
let failedRequestsQueue = [];

/**
 * Process the queue of failed requests after successful token refresh
 * @param {Error|null} error - Error object if refresh failed, null if successful
 */
const processQueue = (error = null) => {
    failedRequestsQueue.forEach(promise => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve();
        }
    });
    
    failedRequestsQueue = [];
}

// Response interceptor to handle 401 errors and refresh tokens
api.interceptors.response.use(
    (response) => {
        // Pass through successful responses
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        // Check if error is 401 and not from the refresh endpoint itself
        if (error.response?.status === 401 && !originalRequest._retry) {
            console.log('401 error detected for:', originalRequest.url)
            
            // Prevent retry loop for the refresh endpoint
            if (originalRequest.url === "/account/web/refresh") {
                console.log('Refresh endpoint failed, clearing auth state')
                isRefreshing = false;
                processQueue(error);
                return Promise.reject(error);
            }
            
            // Mark request as retried to prevent infinite loops
            originalRequest._retry = true;
            
            if (!isRefreshing) {
                isRefreshing = true;
                
                try {
                    console.log('Attempting token refresh...')
                    // Call refresh endpoint (cookie-based, no body needed)
                    const response = await api.post("/account/web/refresh");
                    
                    if (response.data.success) {
                        console.log('Token refresh successful')
                        // Token refreshed successfully
                        isRefreshing = false;
                        processQueue(null);
                        
                        // Retry the original request
                        return api(originalRequest);
                    } else {
                        console.log('Token refresh failed - no success response')
                        // Refresh indicated failure
                        throw new Error("Token refresh failed");
                    }
                } catch (refreshError) {
                    console.log('Token refresh error:', refreshError)
                    // Refresh failed, reject all queued requests
                    isRefreshing = false;
                    processQueue(refreshError);
                    return Promise.reject(refreshError);
                }
            }
            
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
                failedRequestsQueue.push({
                    resolve: () => {
                        resolve(api(originalRequest));
                    },
                    reject: (err) => {
                        reject(err);
                    }
                });
            });
        }
        
        // For non-401 errors, reject normally
        return Promise.reject(error);
    }
);

export default api;
