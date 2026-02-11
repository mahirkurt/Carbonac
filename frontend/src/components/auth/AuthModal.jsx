/**
 * AuthModal Component
 * 
 * Login and Register modal with form validation.
 */

import React, { useState } from 'react';
import {
  Modal,
  TextInput,
  PasswordInput,
  Button,
  InlineNotification,
  Loading,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Checkbox,
  Link,
} from '@carbon/react';

import {
  Login,
  UserFollow,
  Email,
} from '@carbon/icons-react';

import { useAuth } from '../../contexts/AuthContext';

import './AuthModal.scss';

export function AuthModal({ isOpen, onClose }) {
  const { login, loginWithGoogle, register, forgotPassword, isLoading, error } = useAuth();
  
  // Form state
  const [activeTab, setActiveTab] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // Forgot password form
  const [forgotEmail, setForgotEmail] = useState('');

  const resetForms = () => {
    setLoginEmail('');
    setLoginPassword('');
    setRegisterName('');
    setRegisterEmail('');
    setRegisterPassword('');
    setRegisterConfirmPassword('');
    setAcceptTerms(false);
    setForgotEmail('');
    setFormError(null);
    setSuccessMessage(null);
    setShowForgotPassword(false);
  };

  const handleClose = () => {
    resetForms();
    onClose();
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!loginEmail || !loginPassword) {
      setFormError('Lütfen tüm alanları doldurun');
      return;
    }

    const result = await login(loginEmail, loginPassword);
    if (result.success) {
      handleClose();
    } else {
      setFormError(result.error);
    }
  };

  const handleGoogleLogin = async () => {
    setFormError(null);
    const result = await loginWithGoogle();
    if (!result.success) {
      setFormError(result.error);
    }
  };

  // Register handler
  const handleRegister = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!registerName || !registerEmail || !registerPassword) {
      setFormError('Lütfen tüm alanları doldurun');
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setFormError('Şifreler eşleşmiyor');
      return;
    }

    if (registerPassword.length < 8) {
      setFormError('Şifre en az 8 karakter olmalıdır');
      return;
    }

    if (!acceptTerms) {
      setFormError('Kullanım koşullarını kabul etmelisiniz');
      return;
    }

    const result = await register(registerName, registerEmail, registerPassword);
    if (result.success) {
      if (result.needsVerification) {
        setSuccessMessage(result.message || 'E-posta doğrulama bağlantısı gönderildi.');
        return;
      }
      handleClose();
      return;
    }
    setFormError(result.error);
  };

  // Forgot password handler
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!forgotEmail) {
      setFormError('Lütfen e-posta adresinizi girin');
      return;
    }

    const result = await forgotPassword(forgotEmail);
    if (result.success) {
      setSuccessMessage('Şifre sıfırlama linki e-posta adresinize gönderildi');
    } else {
      setFormError(result.error);
    }
  };

  // Forgot password view
  if (showForgotPassword) {
    return (
      <Modal
        open={isOpen}
        onRequestClose={handleClose}
        modalHeading="Şifremi Unuttum"
        primaryButtonText="Sıfırlama Linki Gönder"
        secondaryButtonText="Geri"
        onRequestSubmit={handleForgotPassword}
        onSecondarySubmit={() => setShowForgotPassword(false)}
        className="auth-modal"
      >
        {isLoading && <Loading withOverlay />}
        
        <p className="auth-modal__description">
          E-posta adresinizi girin, şifre sıfırlama linki göndereceğiz.
        </p>

        {formError && (
          <InlineNotification
            kind="error"
            title="Hata"
            subtitle={formError}
            lowContrast
            hideCloseButton
            className="auth-modal__notification"
          />
        )}

        {successMessage && (
          <InlineNotification
            kind="success"
            title="Başarılı"
            subtitle={successMessage}
            lowContrast
            hideCloseButton
            className="auth-modal__notification"
          />
        )}

        <form onSubmit={handleForgotPassword}>
          <TextInput
            id="forgot-email"
            type="email"
            labelText="E-posta"
            placeholder="örnek@email.com"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
          />
        </form>
      </Modal>
    );
  }

  return (
    <Modal
      open={isOpen}
      onRequestClose={handleClose}
      passiveModal
      modalHeading=""
      className="auth-modal"
    >
      {isLoading && <Loading withOverlay />}

      <Tabs selectedIndex={activeTab} onChange={({ selectedIndex }) => {
        setActiveTab(selectedIndex);
        setFormError(null);
        setSuccessMessage(null);
      }}>
        <TabList aria-label="Auth tabs" className="auth-modal__tabs">
          <Tab>
            <Login size={16} style={{ marginRight: '0.5rem' }} />
            Giriş Yap
          </Tab>
          <Tab>
            <UserFollow size={16} style={{ marginRight: '0.5rem' }} />
            Kayıt Ol
          </Tab>
        </TabList>

        <TabPanels>
          {/* Login Panel */}
          <TabPanel>
            <div className="auth-modal__content">
              {formError && (
                <InlineNotification
                  kind="error"
                  title="Hata"
                  subtitle={formError}
                  lowContrast
                  hideCloseButton
                  className="auth-modal__notification"
                />
              )}

              <form onSubmit={handleLogin} className="auth-modal__form">
                <TextInput
                  id="login-email"
                  type="email"
                  labelText="E-posta"
                  placeholder="örnek@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />

                <PasswordInput
                  id="login-password"
                  labelText="Şifre"
                  placeholder="Şifrenizi girin"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />

                <Link 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); setShowForgotPassword(true); }}
                  className="auth-modal__forgot-link"
                >
                  Şifremi unuttum
                </Link>

                <Button
                  type="submit"
                  kind="primary"
                  size="lg"
                  renderIcon={Login}
                  disabled={isLoading}
                  className="auth-modal__submit"
                >
                  Giriş Yap
                </Button>

                <Button
                  type="button"
                  kind="tertiary"
                  size="lg"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="auth-modal__oauth"
                >
                  Google ile devam et
                </Button>
              </form>

              <div className="auth-modal__divider">
                <span>veya</span>
              </div>

              <p className="auth-modal__switch">
                Hesabınız yok mu?{' '}
                <Link href="#" onClick={(e) => { e.preventDefault(); setActiveTab(1); }}>
                  Kayıt olun
                </Link>
              </p>
            </div>
          </TabPanel>

          {/* Register Panel */}
          <TabPanel>
            <div className="auth-modal__content">
              {formError && (
                <InlineNotification
                  kind="error"
                  title="Hata"
                  subtitle={formError}
                  lowContrast
                  hideCloseButton
                  className="auth-modal__notification"
                />
              )}

              <form onSubmit={handleRegister} className="auth-modal__form">
                <TextInput
                  id="register-name"
                  type="text"
                  labelText="Ad Soyad"
                  placeholder="Adınız Soyadınız"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  required
                />

                <TextInput
                  id="register-email"
                  type="email"
                  labelText="E-posta"
                  placeholder="örnek@email.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                />

                <PasswordInput
                  id="register-password"
                  labelText="Şifre"
                  placeholder="En az 8 karakter"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                />

                <PasswordInput
                  id="register-confirm-password"
                  labelText="Şifre Tekrar"
                  placeholder="Şifrenizi tekrar girin"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  required
                />

                <Checkbox
                  id="accept-terms"
                  labelText={
                    <>
                      <Link href="/terms" target="_blank">Kullanım Koşulları</Link>
                      {' '}ve{' '}
                      <Link href="/privacy" target="_blank">Gizlilik Politikası</Link>
                      'nı kabul ediyorum
                    </>
                  }
                  checked={acceptTerms}
                  onChange={(_, { checked }) => setAcceptTerms(checked)}
                />

                <Button
                  type="submit"
                  kind="primary"
                  size="lg"
                  renderIcon={UserFollow}
                  disabled={isLoading}
                  className="auth-modal__submit"
                >
                  Kayıt Ol
                </Button>

                <Button
                  type="button"
                  kind="tertiary"
                  size="lg"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="auth-modal__oauth"
                >
                  Google ile devam et
                </Button>
              </form>

              {successMessage && (
                <InlineNotification
                  kind="success"
                  title="Başarılı"
                  subtitle={successMessage}
                  lowContrast
                  hideCloseButton
                  className="auth-modal__notification"
                />
              )}

              <div className="auth-modal__divider">
                <span>veya</span>
              </div>

              <p className="auth-modal__switch">
                Zaten hesabınız var mı?{' '}
                <Link href="#" onClick={(e) => { e.preventDefault(); setActiveTab(0); }}>
                  Giriş yapın
                </Link>
              </p>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Modal>
  );
}

export default AuthModal;
