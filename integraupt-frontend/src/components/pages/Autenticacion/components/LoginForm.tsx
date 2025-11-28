import type { FC } from 'react';
import { ArrowLeft, Loader2, Lock, Mail, RefreshCw } from 'lucide-react';
import type { LoginType } from '../types';

interface LoginFormProps {
  selectedType: LoginType;
  identifier: string;
  password: string;
  captcha: string;
  captchaInput: string;
  error: string | null;
  loading: boolean;
  infoMessage: string | null;
  onBack: () => void;
  onIdentifierChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onCaptchaInputChange: (value: string) => void;
  onRefreshCaptcha: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
}

export const LoginForm: FC<LoginFormProps> = ({
  selectedType,
  identifier,
  password,
  captcha,
  captchaInput,
  error,
  loading,
  infoMessage,
  onBack,
  onIdentifierChange,
  onPasswordChange,
  onCaptchaInputChange,
  onRefreshCaptcha,
  onSubmit,
  onGoogleSignIn
}) => {

  const handleCaptchaChange = (value: string) => {
    const filteredValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 5);
    onCaptchaInputChange(filteredValue);
  };

  const handleGoogleSignIn = () => {
    if (onGoogleSignIn) {
      onGoogleSignIn();
    } else {
      window.location.href = '/api/auth/google'; // URL según el backend
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
  const button = e.currentTarget;
  const rect = button.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  
  button.style.setProperty('--mouse-x', `${x}%`);
  button.style.setProperty('--mouse-y', `${y}%`);
};
  return (
    <div className="space-y-6">
      <button type="button" className="login-back-btn" onClick={onBack}>
        <ArrowLeft className="login-back-icon" />
        Volver a seleccionar tipo de acceso
      </button>

      <form className="login-form space-y-4" onSubmit={onSubmit}>
        <div className="login-form-group space-y-2">
          <label className="login-label" htmlFor="identifier">
            Código universitario o correo electrónico
          </label>
          <div className="login-input-wrapper">
            <Mail className="login-input-icon" />
            <input
              id="identifier"
              className="login-input"
              placeholder="Ej. UPT2024001 o usuario@upt.edu.pe"
              autoComplete="username"
              value={identifier}
              onChange={(event) => onIdentifierChange(event.target.value)}
              required
            />
          </div>
        </div>

        <div className="login-form-group space-y-2">
          <label className="login-label" htmlFor="password">
            Contraseña
          </label>
          <div className="login-input-wrapper">
            <Lock className="login-input-icon" />
            <input
              id="password"
              type="password"
              className="login-input"
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              required
            />
          </div>
        </div>

        <div className="login-form-group space-y-2">
          <label className="login-label" htmlFor="captcha">
            Código de seguridad
          </label>
          <div className="login-captcha-container">
            <div 
              className={`login-captcha-display ${
                selectedType === 'academic' ? 'academic' : 'administrative'
              }`}
            >
              {captcha}
            </div>
            <button
              type="button"
              className="login-captcha-refresh"
              onClick={onRefreshCaptcha}
              aria-label="Actualizar código de seguridad"
            >
              <RefreshCw className="login-captcha-icon" />
            </button>
          </div>
          
          <input
            id="captcha"
            className="login-input"
            placeholder="Ingresa los 5 caracteres mostrados"
            value={captchaInput}
            onChange={(event) => handleCaptchaChange(event.target.value)}
            maxLength={5}
            pattern="[A-Za-z0-9]{5}"
            title="Ingresa exactamente 5 caracteres (letras o números)"
            required
          />
          
          <div className="login-captcha-counter">
            {captchaInput.length}/5 caracteres
          </div>
        </div>

        {error && <div className="login-error">{error}</div>}
        {infoMessage && !error && (
          <div className="login-test-credentials login-test-admin">
            {infoMessage}
          </div>
        )}

        <button
          type="submit"
          className={`login-submit-btn ${
            selectedType === 'academic'
              ? 'login-submit-academic'
              : 'login-submit-admin'
          }`}
          disabled={loading || captchaInput.length !== 5}
        >
          {loading ? (
            <span className="login-loading space-x-2">
              <Loader2 className="login-spinner" />
              Procesando...
            </span>
          ) : (
            <span>Iniciar sesión</span>
          )}
        </button>
        {selectedType === 'academic' && (
          <div className="login-google-section">
            <div className="login-divider">
              <span className="login-divider-text">o</span>
            </div>
            <button
              type="button"
              className="login-google-btn"
              onClick={handleGoogleSignIn}
              onMouseMove={handleMouseMove}
              disabled={loading}
            >
              {loading ? (
                <span className="login-loading space-x-2">
                  <Loader2 className="login-spinner" />
                  Conectando con Google...
                </span>
              ) : (
                <>
                  <svg className="login-google-icon" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Iniciar sesión con google</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};