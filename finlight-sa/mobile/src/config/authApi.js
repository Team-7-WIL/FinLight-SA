import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5175/api';

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
    const response = await authApiClient.post('/auth/login', { email, password });

    if (response.data.success) {
      return { success: true, data: response.data.data };
    }

    return { success: false, error: response.data.message };
  } catch (error) {
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
