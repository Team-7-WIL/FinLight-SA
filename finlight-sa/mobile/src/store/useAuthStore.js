import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, register as apiRegister } from '../config/authApi';
import { setAuthErrorHandler } from '../config/api';

const useAuthStore = create((set, get) => ({
  user: null,
  business: null,
  token: null,
  refreshToken: null,
  tokenExpiresAt: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (data) => {
    try {
      // Handle both camelCase and PascalCase from backend
      const token = data.accessToken || data.AccessToken || data.token;
      const refreshToken = data.refreshToken || data.RefreshToken;
      const expiresIn = data.expiresIn || data.ExpiresIn || 3600; // Default 1 hour
      const tokenExpiresAt = new Date(Date.now() + (expiresIn * 1000));
      
      // Handle both camelCase and PascalCase for user and business
      const user = data.user || data.User;
      const business = data.business || data.DefaultBusiness || data.defaultBusiness;

      if (!token) {
        console.error('No token found in auth data:', data);
        throw new Error('No access token provided');
      }

      if (!user) {
        console.error('No user found in auth data:', data);
        throw new Error('No user data provided');
      }

      if (!business) {
        console.error('No business found in auth data:', data);
        throw new Error('No business data provided');
      }

      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('refreshToken', refreshToken || '');
      await AsyncStorage.setItem('tokenExpiresAt', tokenExpiresAt.toISOString());
      await AsyncStorage.setItem('userData', JSON.stringify(user));
      await AsyncStorage.setItem('businessData', JSON.stringify(business));

      set({
        user: user,
        business: business,
        token: token,
        refreshToken: refreshToken,
        tokenExpiresAt: tokenExpiresAt,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error in setAuth:', error);
      throw error;
    }
  },

  loadAuth: async () => {
    try {
      console.log('Loading auth data...');

      // Don't auto-login - clear all stored auth data on app start
      // This forces user to login manually each time
      await get().clearAuthData();
      
      set({ isLoading: false });
      console.log('App started - user must login manually');
    } catch (error) {
      console.error('Error loading auth:', error);
      // Ensure loading always completes
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      const result = await apiLogin(email, password);

      if (result.success && result.data) {
        await get().setAuth(result.data);
        return { success: true };
      }

      return result;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  },

  register: async (userData) => {
    const result = await apiRegister(userData);

    if (result.success) {
      await get().setAuth(result.data);
      return { success: true };
    }

    return result;
  },

  clearAuthData: async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('tokenExpiresAt');
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('businessData');
  },

  logout: async () => {
    console.log('🔓 Logging out user...');
    await get().clearAuthData();

    set({
      user: null,
      business: null,
      token: null,
      refreshToken: null,
      tokenExpiresAt: null,
      isAuthenticated: false,
    });
    
    console.log('✅ Logout complete - isAuthenticated is now false');
  },

  isTokenExpired: () => {
    const { tokenExpiresAt } = get();
    if (!tokenExpiresAt) return true;
    return new Date() >= tokenExpiresAt;
  },

  refreshTokenIfNeeded: async () => {
    const { token, refreshToken, isTokenExpired } = get();

    if (!token || !refreshToken || !isTokenExpired()) {
      return true; // Token is still valid
    }

    try {
      const response = await fetch(`${apiClient.defaults.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: token,
          refreshToken: refreshToken,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await get().setAuth(result.data);
          return true;
        }
      }

      // Refresh failed, logout user
      await get().logout();
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await get().logout();
      return false;
    }
  },

  handleAuthError: async () => {
    // Try to refresh token first
    const refreshed = await get().refreshTokenIfNeeded();
    if (!refreshed) {
      // Clear auth data when token refresh fails
      await get().logout();
    }
  },
}));

// Set up the auth error handler for the API client
setAuthErrorHandler(() => {
  const store = useAuthStore.getState();
  store.handleAuthError();
});

export default useAuthStore;