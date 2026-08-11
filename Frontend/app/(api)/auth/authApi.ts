// app/(api)/auth/authApi.ts
import api from '@/lib/api';
import { tokenCache } from '@/lib/auth';
import { AUTH_TOKEN_KEY } from '@/lib/constants';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  createdAt?: string;
}

interface AuthResponse {
  data: {
    token: string;
    user: User;
  };
  message?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export const loginUser = async (data: LoginData): Promise<AuthResponse> => {
  try {
    console.log('Making login request:', {
      url: '/auth/login',
      data: { email: data.email, password: '***' }
    });

    const response = await api.post<AuthResponse>('/auth/login', data);
    
    console.log('Full Login API response data:', response.data); // Debugging

    console.log('Login API response:', {
      status: response.status,
      data: response.data.data ? { 
        token: response.data.data.token ? 'exists' : 'missing',
        user: response.data.data.user ? 'exists' : 'missing'
      } : 'no data'
    });

    if (!response.data.data) {
      throw new Error('No response data received');
    }

    const { token, user } = response.data.data;

    if (!token) {
      throw new Error('No token received from server');
    }

    if (!user) {
      throw new Error('No user data received from server');
    }

    console.log('Attempting to save token...');
    const saved = await tokenCache.saveToken(AUTH_TOKEN_KEY, token);
    
    if (!saved) {
      console.error('Failed to save token to secure storage');
      throw new Error('Failed to save authentication token');
    }
    
    console.log('Login process completed successfully');
    return response.data;
  } catch (error: any) {
    console.error('Login error details:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
      } : 'No response',
      isAxiosError: error.isAxiosError,
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,
      } : 'No config'
    });

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('An unexpected error occurred during login');
    }
  }
};

export const registerUser = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    console.log('Making register request:', {
      url: '/auth/register',
      data: { 
        name: data.name, 
        email: data.email, 
        password: '***', 
        phone: data.phone 
      }
    });

    const response = await api.post<AuthResponse>('/auth/register', data);
    
    console.log('Full Register API response data:', response.data); // Debugging

    console.log('Register API response:', {
      status: response.status,
      data: response.data.data ? { 
        token: response.data.data.token ? 'exists' : 'missing',
        user: response.data.data.user ? 'exists' : 'missing'
      } : 'no data'
    });

    if (!response.data.data) {
      throw new Error('No response data received');
    }

    const { token, user } = response.data.data;

    if (!token) {
      throw new Error('No token received from server');
    }

    if (!user) {
      throw new Error('No user data received from server');
    }

    console.log('Attempting to save token...');
    const saved = await tokenCache.saveToken(AUTH_TOKEN_KEY, token);
    
    if (!saved) {
      console.error('Failed to save token to secure storage');
      throw new Error('Failed to save authentication token');
    }
    
    console.log('Registration process completed successfully');
    return response.data;
  } catch (error: any) {
    console.error('Registration error details:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
      } : 'No response',
      isAxiosError: error.isAxiosError,
      config: error.config ? {
        url: error.config.url,
        method: error.config.method,
      } : 'No config'
    });

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error('An unexpected error occurred during registration');
    }
  }
};
