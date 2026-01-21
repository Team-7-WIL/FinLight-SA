import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use 10.0.2.2 for Android emulator, localhost for web/iOS simulator
const getApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5175/api';
  }
  return 'http://localhost:5175/api';
};

const API_URL = getApiUrl();

console.log('Auth API_URL:', API_URL);

const authApiClient = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const login = async (email, password) => {
  try {
    console.log('Logging in with:', { email, password });
    const response = await authApiClient.post('/auth/login', { email, password });
    console.log('Login response:', response.data);

    if (response.data.success) {
      return { success: true, data: response.data.data };
    }

    return { success: false, error: response.data.message };
  } catch (error) {
    console.error('Login error details:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      fullError: error.message
    });
    return {
      success: false,
      error: error.response?.data?.message || 'Login failed'
    };
  }
};

export const register = async (userData) => {
  try {
    const response = await authApiClient.post('/auth/register', userData);

    if (response.data.success) {
      return { success: true, data: response.data.data };
    }

    return { success: false, error: response.data.message };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Registration failed'
    };
  }
};
