import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = 'http://localhost:8000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This is important for sending cookies with requests
});

// Add interceptor to handle token expiration
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = Cookies.get('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        // Update tokens
        Cookies.set('accessToken', response.data.access, {
          secure: true,
          sameSite: 'lax',
        });
        Cookies.set('refreshToken', response.data.refresh, {
          secure: true,
          sameSite: 'lax',
        });

        // Update authorization header
        const newAccessToken = response.data.access;
        axiosInstance.defaults.headers.common[
          'Authorization'
        ] = `Bearer ${newAccessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Add request interceptor to always include the token if available
axiosInstance.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const apiService = {
  setAccessToken(token: string) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  clearAccessToken() {
    delete axiosInstance.defaults.headers.common['Authorization'];
  },

  // Auth endpoints
  async register(userData: {
    username: string;
    email: string;
    password: string;
  }) {
    const response = await axiosInstance.post('/auth/register/', userData);
    return response.data;
  },

  async login(credentials: { email: string; password: string }) {
    const response = await axiosInstance.post('/auth/login/', credentials);
    return response.data;
  },

  async refreshToken(refreshToken: string) {
    const response = await axiosInstance.post('/auth/token/refresh/', {
      refresh: refreshToken,
    });
    return response.data;
  },

  async getUserProfile() {
    const response = await axiosInstance.get('/auth/profile/');
    return response.data;
  },

  // Event endpoints
  async getEvents(params?: {
    start_date?: string;
    end_date?: string;
    show_occurrences?: boolean;
  }) {
    const response = await axiosInstance.get('/events/', { params });
    return response.data;
  },

  async getEvent(
    id: string,
    params?: {
      start_date?: string;
      end_date?: string;
      show_occurrences?: boolean;
    }
  ) {
    const response = await axiosInstance.get(`/events/${id}/`, { params });
    return response.data;
  },

  async createEvent(eventData: any) {
    const response = await axiosInstance.post('/events/', eventData);
    return response.data;
  },

  async updateEvent(id: string, eventData: any) {
    const response = await axiosInstance.put(`/events/${id}/`, eventData);
    return response.data;
  },

  async deleteEvent(id: string) {
    const response = await axiosInstance.delete(`/events/${id}/`);
    return response.data;
  },
};
