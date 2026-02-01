/**
 * Auth Callback Page
 */

import React, { useEffect, useState } from 'react';
import { InlineNotification, Loading, Tile, Button } from '@carbon/react';
import { auth } from '../../lib/supabase';
import './AuthPages.scss';

export function AuthCallback() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Oturum aciliyor...');
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const finalize = async () => {
      const { session, error: sessionError } = await auth.getSession();
      if (!active) return;
      if (sessionError) {
        setError(sessionError.message || 'Oturum acma basarisiz.');
        setStatus('error');
        return;
      }
      if (session?.access_token) {
        localStorage.setItem('carbonac_token', session.access_token);
        setStatus('success');
        setMessage('Giris tamamlandi. Ana sayfaya yonlendiriliyorsunuz.');
        setTimeout(() => {
          window.location.assign('/');
        }, 1000);
        return;
      }
      setError('Oturum bulunamadi. Giris islemini tekrar deneyin.');
      setStatus('error');
    };

    finalize();

    const { data } = auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.access_token) {
        localStorage.setItem('carbonac_token', session.access_token);
        setStatus('success');
        setMessage('Giris tamamlandi. Ana sayfaya yonlendiriliyorsunuz.');
        setTimeout(() => {
          window.location.assign('/');
        }, 1000);
      }
    });

    return () => {
      active = false;
      data?.subscription?.unsubscribe?.();
    };
  }, []);

  return (
    <div className="auth-page">
      <Tile className="auth-card">
        <h1 className="auth-card__title">Giris Tamamlaniyor</h1>
        <p className="auth-card__subtitle">{message}</p>

        {status === 'error' && (
          <InlineNotification
            kind="error"
            title="Hata"
            subtitle={error}
            lowContrast
            hideCloseButton
            className="auth-card__notification"
          />
        )}

        {status === 'loading' && <Loading withOverlay />}

        {status === 'error' && (
          <div className="auth-card__actions">
            <Button kind="primary" onClick={() => window.location.assign('/')}
            >
              Ana sayfaya don
            </Button>
          </div>
        )}
      </Tile>
    </div>
  );
}

export default AuthCallback;
