import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use machine IP for Android emulator (better than 10.0.0.2), localhost for web/iOS simulator
const getApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    // Use the host machine's WiFi IP address for Android emulator
    return 'http://192.168.1.102:5175/api';
  }
  return 'http://localhost:5175/api';
};

const API_URL = getApiUrl();

console.log('API_URL:', API_URL);

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Callback for handling auth errors
let authErrorHandler = null;

export const setAuthErrorHandler = (handler) => {
  authErrorHandler = handler;
};

// Add auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      console.log('Auth interceptor - token exists:', !!token);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Authorization header set');
      }
      
      // If data is FormData, remove Content-Type header to let axios set it with boundary
      if (config.data instanceof FormData) {
        console.log('FormData detected - removing Content-Type header to allow axios to set boundary');
        console.log('FormData entries:', Array.from(config.data.entries()));
        delete config.headers['Content-Type'];
      }
    } catch (error) {
      console.warn('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API Error:', error.response?.status, error.message);
    if (error.response?.status === 401) {
      // Token expired, call the auth error handler
      if (authErrorHandler) {
        await authErrorHandler();
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;