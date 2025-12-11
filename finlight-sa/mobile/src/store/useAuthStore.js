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
    const token = data.accessToken || data.token;
    const refreshToken = data.refreshToken;
    const expiresIn = data.expiresIn || 3600; // Default 1 hour
    const tokenExpiresAt = new Date(Date.now() + (expiresIn * 1000));

    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('refreshToken', refreshToken || '');
    await AsyncStorage.setItem('tokenExpiresAt', tokenExpiresAt.toISOString());
    await AsyncStorage.setItem('userData', JSON.stringify(data.user));
    await AsyncStorage.setItem('businessData', JSON.stringify(data.business));

    set({
      user: data.user,
      business: data.business,
      token: token,
      refreshToken: refreshToken,
      tokenExpiresAt: tokenExpiresAt,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  loadAuth: async () => {
    try {
      console.log('Loading auth data...');

      // Add timeout to AsyncStorage operations
      const getItemWithTimeout = async (key) => {
        return await Promise.race([
          AsyncStorage.getItem(key),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout getting ${key}`)), 2000)
          )
        ]);
      };

      const [token, refreshToken, tokenExpiresAt, userData, businessData] = await Promise.all([
        getItemWithTimeout('authToken').catch(() => null),
        getItemWithTimeout('refreshToken').catch(() => null),
        getItemWithTimeout('tokenExpiresAt').catch(() => null),
        getItemWithTimeout('userData').catch(() => null),
        getItemWithTimeout('businessData').catch(() => null),
      ]);

      console.log('Auth data loaded:', { hasToken: !!token, hasUserData: !!userData, hasBusinessData: !!businessData });

      // Check if data exists and is not "undefined" string
      if (token && token !== 'undefined' && userData && userData !== 'undefined' && businessData && businessData !== 'undefined') {
        try {
          const expiresAt = tokenExpiresAt ? new Date(tokenExpiresAt) : null;

          set({
            user: JSON.parse(userData),
            business: JSON.parse(businessData),
            token,
            refreshToken,
            tokenExpiresAt: expiresAt,
            isAuthenticated: true,
            isLoading: false,
          });

          console.log('Auth data restored successfully');
        } catch (parseError) {
          console.error('Error parsing stored data:', parseError);
          // Clear invalid data
          await get().clearAuthData();
          set({ isLoading: false });
        }
      } else {
        console.log('No valid auth data found, user not authenticated');
        // Clear any invalid data
        await get().clearAuthData();
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading auth:', error);
      // Ensure loading always completes
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const result = await apiLogin(email, password);

    if (result.success) {
      await get().setAuth(result.data);
      return { success: true };
    }

    return result;
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
    await get().clearAuthData();

    set({
      user: null,
      business: null,
      token: null,
      refreshToken: null,
      tokenExpiresAt: null,
      isAuthenticated: false,
    });
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