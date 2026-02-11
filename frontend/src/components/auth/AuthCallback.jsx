/**
 * Auth Callback Page
 */

import React, { useEffect, useState } from 'react';
import { InlineNotification, Loading, Tile, Button } from '@carbon/react';
import { auth, supabase } from '../../lib/supabase';
import './AuthPages.scss';

export function AuthCallback() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Oturum açılıyor...');
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const finalize = async () => {
      // When we use `skipBrowserRedirect: true`, Supabase returns an OAuth URL and
      // then redirects back with a `?code=...` parameter (PKCE). We must exchange
      // that code for a session explicitly.
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const getParam = (key) => searchParams.get(key) || hashParams.get(key);

      const code = getParam('code');
      const authType = getParam('type');
      const errorParam = getParam('error');
      const errorDescription = getParam('error_description');

      if (errorParam || errorDescription) {
        setError(errorDescription || errorParam || 'Oturum açma başarısız.');
        setStatus('error');
        return;
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!active) return;
        if (exchangeError) {
          setError(exchangeError.message || 'Oturum açma başarısız.');
          setStatus('error');
          return;
        }
      }

      const { session, error: sessionError } = await auth.getSession();
      if (!active) return;
      if (sessionError) {
        setError(sessionError.message || 'Oturum açma başarısız.');
        setStatus('error');
        return;
      }
      if (session?.access_token) {
        localStorage.setItem('carbonac_token', session.access_token);
        setStatus('success');
        setMessage('Giriş tamamlandı. Ana sayfaya yönlendiriliyorsunuz.');
        setTimeout(() => {
          window.location.assign('/');
        }, 1000);
        return;
      }

      if (authType === 'signup' || authType === 'invite' || authType === 'magiclink') {
        setStatus('success');
        setMessage('E-posta doğrulandı. Şimdi giriş yapabilirsiniz.');
        return;
      }

      setError('Oturum bulunamadı. Giriş işlemini tekrar deneyin.');
      setStatus('error');
    };

    finalize();

    const { data } = auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.access_token) {
        localStorage.setItem('carbonac_token', session.access_token);
        setStatus('success');
        setMessage('Giriş tamamlandı. Ana sayfaya yönlendiriliyorsunuz.');
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
        <h1 className="auth-card__title">Giriş Tamamlanıyor</h1>
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
              Ana sayfaya dön
            </Button>
          </div>
        )}

        {status === 'success' && (
          <div className="auth-card__actions">
            <Button kind="primary" onClick={() => window.location.assign('/')}
            >
              Ana sayfaya dön
            </Button>
          </div>
        )}
      </Tile>
    </div>
  );
}

export default AuthCallback;
