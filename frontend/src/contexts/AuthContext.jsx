/**
 * AuthContext - User Authentication Context
 * 
 * Provides authentication state and methods throughout the app.
 * Integrates with backend API for login/register/logout.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

// Auth Context
const AuthContext = createContext(null);

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const hydrateSession = async () => {
      const { session, error: sessionError } = await authService.getSession();
      if (!active) return;
      if (sessionError) {
        setIsLoading(false);
        return;
      }
      if (session?.access_token) {
        localStorage.setItem('carbonac_token', session.access_token);
      } else {
        localStorage.removeItem('carbonac_token');
      }
      setUser(mapSupabaseUser(session?.user));
      setIsLoading(false);
    };

    hydrateSession();

    const unsubscribe = authService.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.access_token) {
        localStorage.setItem('carbonac_token', session.access_token);
      } else {
        localStorage.removeItem('carbonac_token');
      }
      setUser(mapSupabaseUser(session?.user));
      setIsLoading(false);
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  // Check authentication status
  const checkAuth = async () => {
    const { session } = await authService.getSession();
    if (session?.access_token) {
      localStorage.setItem('carbonac_token', session.access_token);
    } else {
      localStorage.removeItem('carbonac_token');
    }
    setUser(mapSupabaseUser(session?.user));
  };

  // Login
  const login = useCallback(async (email, password) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await authService.signIn(email, password);
      if (!result.success) {
        throw new Error(result.error || 'Giriş başarısız');
      }

      const session = result.session;
      if (session?.access_token) {
        localStorage.setItem('carbonac_token', session.access_token);
      }
      setUser(mapSupabaseUser(result.user));
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    let redirected = false;

    try {
      const result = await authService.signInWithOAuth('google');
      if (!result.success) {
        throw new Error(result.error || 'Google ile giriş başarısız');
      }
      if (!result.url) {
        throw new Error('OAuth yönlendirme adresi bulunamadı');
      }
      redirected = true;
      window.location.assign(result.url);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      if (!redirected) {
        setIsLoading(false);
      }
    }
  }, []);

  // Register
  const register = useCallback(async (name, email, password) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await authService.signUp(email, password, { fullName: name });
      if (!result.success) {
        throw new Error(result.error || 'Kayıt başarısız');
      }

      const session = result.session;
      if (session?.access_token) {
        localStorage.setItem('carbonac_token', session.access_token);
        setUser(mapSupabaseUser(result.user));
      } else {
        setUser(null);
      }
      return {
        success: true,
        message: result.message,
        needsVerification: !session,
      };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    const result = await authService.signOut();
    if (!result.success) {
      console.error('Logout error:', result.error);
    }
    localStorage.removeItem('carbonac_token');
    setUser(null);
  }, []);

  // Forgot password
  const forgotPassword = useCallback(async (email) => {
    setError(null);

    try {
      const result = await authService.resetPassword(email);
      if (!result.success) {
        throw new Error(result.error || 'İstek başarısız');
      }
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (updates) => {
    try {
      const result = await authService.updateProfile(updates);
      if (!result.success) {
        throw new Error(result.error || 'Güncelleme başarısız');
      }
      setUser(mapSupabaseUser(result.user));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    loginWithGoogle,
    register,
    logout,
    forgotPassword,
    updateProfile,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth Hook
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

function mapSupabaseUser(user) {
  if (!user) return null;
  const metadata = user.user_metadata || {};
  const name =
    metadata.full_name ||
    metadata.name ||
    metadata.company ||
    (user.email ? user.email.split('@')[0] : 'Kullanıcı');
  return {
    id: user.id,
    name,
    email: user.email,
    metadata,
  };
}
