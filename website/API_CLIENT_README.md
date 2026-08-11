# API Client Documentation

This document outlines the API client setup and usage in the application.

## Overview

The API client is a centralized HTTP client that handles all API requests to the backend. It includes request/response interceptors for authentication and error handling.

## Setup

The API client is configured in `src/lib/api-client.ts` and provides the following features:

- Base URL configuration
- Automatic JWT token handling
- Request/response interceptors
- Consistent error handling
- TypeScript support

## Configuration

The base URL is configured using the `NEXT_PUBLIC_API_BASE_URL` environment variable. If not set, it defaults to `http://20.251.153.107:3001`.

## Usage

### Making API Requests

Import the `apiClient` and `endpoints` from the API client module:

```typescript
import { apiClient, endpoints } from '@/lib/api-client';

// Example GET request
const fetchData = async () => {
  try {
    const response = await apiClient.get(endpoints.rooms);
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

// Example POST request
const createItem = async (data) => {
  try {
    const response = await apiClient.post(endpoints.bookings.room, data);
    return response.data;
  } catch (error) {
    console.error('Error creating item:', error);
    throw error;
  }
};
```

### Available Endpoints

The `endpoints` object contains all available API endpoints:

```typescript
{
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
}
```

### Error Handling

The API client includes error handling for common scenarios:

- **401 Unauthorized**: Automatically logs out the user and redirects to the login page
- **Network errors**: Returns a user-friendly error message
- **Server errors**: Returns the error message from the server if available

Example error handling:

```typescript
try {
  await apiClient.get('/some/endpoint');
} catch (error) {
  if (error.response?.status === 401) {
    // Handle unauthorized access
  } else {
    // Handle other errors
    console.error('API Error:', error.message);
  }
}
```

## Best Practices

1. Always use the `apiClient` for all API requests
2. Use the `endpoints` object for consistent endpoint references
3. Handle errors appropriately in your components
4. Use TypeScript types for request/response data when possible

## Authentication

The API client automatically includes the JWT token in the `Authorization` header for authenticated requests. The token is stored in `localStorage` after a successful login.
