// lib/api.ts
import axios from "axios";
import { tokenCache } from "./auth";
import { CONFIG, AUTH_TOKEN_KEY } from "./constants";

const api = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  validateStatus: (status) => status >= 200 && status < 500,
});

// Add request logging
api.interceptors.request.use(
  async (config) => {
    console.log('API Request:', {
      method: config.method,
      url: config.url,
      headers: config.headers,
      data: config.data ? '(data exists)' : '(no data)'
    });
    
    const token = await tokenCache.getToken(AUTH_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response logging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data ? '(data exists)' : '(no data)'
    });
    return response;
  },
  async (error) => {
    console.error('API Response Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      await tokenCache.removeToken(AUTH_TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

export default api;
