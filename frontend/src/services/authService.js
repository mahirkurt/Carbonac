/**
 * Authentication Service
 * Wraps Supabase auth with React-friendly hooks
 */

import { auth, supabase } from '../lib/supabase';

/**
 * Authentication service class
 */
class AuthService {
  /**
   * Sign up a new user
   * @param {string} email 
   * @param {string} password 
   * @param {object} metadata - Additional user data (name, company, etc.)
   */
  async signUp(email, password, metadata = {}) {
    try {
      const { data, error } = await auth.signUp(email, password, {
        full_name: metadata.fullName || metadata.name,
        company: metadata.company,
        job_title: metadata.jobTitle,
      });

      if (error) throw error;

      return {
        success: true,
        user: data.user,
        session: data.session,
        message: data.session 
          ? 'Hesabınız oluşturuldu!' 
          : 'Lütfen e-posta adresinizi doğrulayın.',
      };
    } catch (error) {
      return {
        success: false,
        error: this.parseError(error),
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email, password) {
    try {
      const { data, error } = await auth.signIn(email, password);

      if (error) throw error;

      return {
        success: true,
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      return {
        success: false,
        error: this.parseError(error),
      };
    }
  }

  /**
   * Sign in with OAuth provider
   * @param {'google' | 'github' | 'microsoft'} provider 
   */
  async signInWithOAuth(provider) {
    try {
      const { data, error } = await auth.signInWithOAuth(provider);

      if (error) throw error;

      return {
        success: true,
        url: data.url,
      };
    } catch (error) {
      return {
        success: false,
        error: this.parseError(error),
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOut() {
    try {
      const { error } = await auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.parseError(error),
      };
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    try {
      const { session, error } = await auth.getSession();
      if (error) throw error;
      return { session };
    } catch (error) {
      return { session: null, error: this.parseError(error) };
    }
  }

  /**
   * Get current user
   */
  async getUser() {
    try {
      const { user, error } = await auth.getUser();
      if (error) throw error;
      return { user };
    } catch (error) {
      return { user: null, error: this.parseError(error) };
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email) {
    try {
      const { data, error } = await auth.resetPassword(email);
      if (error) throw error;
      return {
        success: true,
        message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.',
      };
    } catch (error) {
      return {
        success: false,
        error: this.parseError(error),
      };
    }
  }

  /**
   * Update password (when logged in)
   */
  async updatePassword(newPassword) {
    try {
      const { data, error } = await auth.updatePassword(newPassword);
      if (error) throw error;
      return {
        success: true,
        message: 'Şifreniz başarıyla güncellendi.',
      };
    } catch (error) {
      return {
        success: false,
        error: this.parseError(error),
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      });
      if (error) throw error;
      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      return {
        success: false,
        error: this.parseError(error),
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    const { session } = await this.getSession();
    return !!session;
  }

  /**
   * Subscribe to auth state changes
   * @param {function} callback - (event, session) => void
   * @returns {function} unsubscribe function
   */
  onAuthStateChange(callback) {
    const { data } = auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return data.subscription.unsubscribe;
  }

  /**
   * Parse Supabase auth errors to user-friendly messages
   */
  parseError(error) {
    const errorMessages = {
      'Invalid login credentials': 'E-posta veya şifre hatalı.',
      'Email not confirmed': 'Lütfen e-posta adresinizi doğrulayın.',
      'User already registered': 'Bu e-posta adresi zaten kayıtlı.',
      'Password should be at least 6 characters': 'Şifre en az 6 karakter olmalıdır.',
      'Unable to validate email address: invalid format': 'Geçersiz e-posta formatı.',
      'Email rate limit exceeded': 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.',
      'For security purposes, you can only request this once every 60 seconds': 
        'Güvenlik nedeniyle 60 saniye beklemeniz gerekiyor.',
    };

    const message = error?.message || error?.error_description || 'Bir hata oluştu.';
    return errorMessages[message] || message;
  }
}

export const authService = new AuthService();
export default authService;
