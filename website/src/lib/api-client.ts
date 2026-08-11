import axios, { AxiosError, AxiosInstance } from 'axios';

type ApiResponse<T = any> = {
  data: T;
  message?: string;
  success: boolean;
};

export type ApiError = {
  message: string;
  status?: number;
  data?: any;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://20.251.153.107:3001';

// Create a simple axios instance without interceptors first
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Add request interceptor for auth token
apiClient.interceptors.request.use(
  (config) => {
    // Only run in browser
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('adminToken');
      if (token) {
        config.headers = config.headers || {};
        // Use type assertion to avoid TypeScript errors
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      window.location.href = '/sign-in';
    }
    
    const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

export { apiClient };

export const endpoints = {
  auth: {
    login: '/api/admins/auth/login',
    profile: '/api/admin/profile',
  },
  users: '/api/users',
  rooms: '/api/rooms',
  transports: '/api/transports',
  bookings: {
    room: '/api/room-bookings',
    transport: '/api/transport-bookings',
  },
  notifications: '/api/notifications',
} as const;

// Helper function to handle API errors consistently
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || 'An error occurred';
  }
  return error instanceof Error ? error.message : 'An unknown error occurred';
};
