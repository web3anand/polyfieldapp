/**
 * API Service Layer
 * Centralized API client for backend communication
 * 
 * TODO: Replace mock data with actual API calls when backend is ready
 */

import { env } from '../config/env';

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
  status: number;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// API Client class
class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = env.apiBaseUrl;
    this.timeout = env.apiTimeout;
  }

  /**
   * Check if error is a connection error (backend not available)
   */
  private isConnectionError(error: unknown): boolean {
    if (error instanceof TypeError) {
      return error.message.includes('Failed to fetch') || 
             error.message.includes('ERR_CONNECTION_REFUSED') ||
             error.message.includes('NetworkError');
    }
    return false;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Skip API calls if no backend is configured (empty baseURL)
    // This prevents 404s in production when backend doesn't exist
    if (!this.baseURL || this.baseURL.trim() === '') {
      if (env.isDevelopment) {
        console.info(`Skipping API call to ${endpoint} - no backend configured (VITE_API_BASE_URL not set)`);
      }
      return {
        data: [] as T,
        status: 0,
        error: 'Backend not configured',
      };
    }

    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.timeout),
    };

    try {
      const response = await fetch(url, config);
      
      // Handle 404s before trying to parse response
      if (response.status === 404) {
        if (env.isDevelopment) {
          console.warn(`Backend endpoint ${endpoint} not found (404). Returning empty data.`);
        }
        // Return empty data instead of throwing error
        return {
          data: [] as T,
          status: 404,
          error: 'Endpoint not found',
        };
      }

      // Handle non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw {
          message: data.message || 'An error occurred',
          status: response.status,
          errors: data.errors,
        } as ApiError;
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      // Handle connection errors gracefully (backend not available)
      if (this.isConnectionError(error)) {
        if (env.isDevelopment) {
          console.warn(`Backend not available at ${url}. This is expected if the backend isn't running yet.`);
        }
        // Return empty data instead of throwing error
        return {
          data: [] as T,
          status: 0,
          error: 'Backend not available',
        };
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw {
          message: 'Request timeout',
          status: 408,
        } as ApiError;
      }
      throw error;
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// API Endpoints (to be implemented when backend is ready)
export const apiEndpoints = {
  // Markets
  markets: {
    list: '/api/markets',
    get: (id: string) => `/api/markets/${id}`,
  },
  
  // Positions
  positions: {
    list: '/api/positions',
    get: (id: string) => `/api/positions/${id}`,
    create: '/api/positions',
    update: (id: string) => `/api/positions/${id}`,
    close: (id: string) => `/api/positions/${id}/close`,
  },
  
  // Closed Positions
  closedPositions: {
    list: '/api/positions/closed',
    get: (id: string) => `/api/positions/closed/${id}`,
  },
  
  // User
  user: {
    profile: '/api/user/profile',
    update: '/api/user/profile',
    stats: '/api/user/stats',
  },
  
  // Transactions
  transactions: {
    list: '/api/transactions',
    create: '/api/transactions',
  },
  
  // Trades
  trades: {
    list: '/api/trades',
    history: '/api/trades/history',
  },
} as const;

