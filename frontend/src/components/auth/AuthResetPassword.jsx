/**
 * Auth Reset Password Page
 */

import React, { useEffect, useState } from 'react';
import {
  Button,
  PasswordInput,
  InlineNotification,
  Loading,
  Tile,
  Link,
} from '@carbon/react';

import authService from '../../services/authService';
import './AuthPages.scss';

export function AuthResetPassword() {
  const [isLoading, setIsLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    let active = true;

    const hydrateSession = async () => {
      const { session, error: sessionError } = await authService.getSession();
      if (!active) return;
      if (sessionError) {
        setError(sessionError);
        setIsLoading(false);
        return;
      }
      if (!session) {
        setError('Sifre sifirlama oturumu bulunamadi. Linki yeniden acin.');
        setIsLoading(false);
        return;
      }
      setSessionReady(true);
      setIsLoading(false);
    };

    hydrateSession();

    const unsubscribe = authService.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session) {
        setSessionReady(true);
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!password || !confirmPassword) {
      setError('Tum alanlari doldurun.');
      return;
    }
    if (password.length < 8) {
      setError('Sifre en az 8 karakter olmalidir.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Sifreler eslesmiyor.');
      return;
    }

    setIsLoading(true);
    const result = await authService.updatePassword(password);
    if (!result.success) {
      setError(result.error || 'Sifre guncellenemedi.');
      setIsLoading(false);
      return;
    }

    setSuccess('Sifreniz guncellendi. Giris sayfasina yonlendiriliyorsunuz.');
    setIsLoading(false);
    setTimeout(() => {
      window.location.assign('/');
    }, 1200);
  };

  return (
    <div className="auth-page">
      <Tile className="auth-card">
        <h1 className="auth-card__title">Sifre Sifirlama</h1>
        <p className="auth-card__subtitle">
          Yeni sifrenizi belirleyin ve hesabiniza tekrar giris yapin.
        </p>

        {error && (
          <InlineNotification
            kind="error"
            title="Hata"
            subtitle={error}
            lowContrast
            hideCloseButton
            className="auth-card__notification"
          />
        )}

        {success && (
          <InlineNotification
            kind="success"
            title="Basarili"
            subtitle={success}
            lowContrast
            hideCloseButton
            className="auth-card__notification"
          />
        )}

        {isLoading && <Loading withOverlay />}

        <form onSubmit={handleSubmit} className="auth-card__form">
          <PasswordInput
            id="reset-password"
            labelText="Yeni sifre"
            placeholder="En az 8 karakter"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={!sessionReady}
          />

          <PasswordInput
            id="reset-password-confirm"
            labelText="Yeni sifre (tekrar)"
            placeholder="Sifreyi yeniden girin"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            disabled={!sessionReady}
          />

          <div className="auth-card__actions">
            <Button type="submit" kind="primary" disabled={!sessionReady || isLoading}>
              Sifreyi guncelle
            </Button>
            <Link href="/" className="auth-card__back">
              Ana sayfaya don
            </Link>
          </div>
        </form>
      </Tile>
    </div>
  );
}

export default AuthResetPassword;
