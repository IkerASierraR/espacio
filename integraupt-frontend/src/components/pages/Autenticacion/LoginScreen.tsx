import type { FC } from 'react';
import { useEffect, useMemo } from 'react';
import './styles/LoginScreen.css';
import type { BackendSession, LoginScreenProps } from './types';
import { useLogin } from './hooks/useLogin';
import { LoginHeader } from './components/LoginHeader';
import { TypeSelection } from './components/TypeSelection';
import { LoginForm } from './components/LoginForm';

export const LoginScreen: FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const {
    selectedType,
    identifier,
    password,
    captcha,
    captchaInput,
    error,
    loading,
    infoMessage,
    setIdentifier,
    setPassword,
    setCaptchaInput,
    refreshCaptcha,
    handleSelectType,
    handleBack,
    handleSubmit,
    handleGoogleSignIn
  } = useLogin(onLoginSuccess);

  const subtitleText = useMemo(() => {
    if (!selectedType) {
      return 'Accede a la plataforma integral de la Universidad Privada de Tacna';
    }
    return selectedType === 'academic'
      ? 'Portal Académico IntegraUPT'
      : 'Portal Administrativo IntegraUPT';
  }, [selectedType]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('googleSuccess') === 'true') {
      const userProfile = {
        id: `google_${urlParams.get('email')}`,
        codigo: urlParams.get('email')?.split('@')[0] || '',
        email: urlParams.get('email') || '',
        nombres: urlParams.get('name')?.split(' ')[0] || '',
        apellidos: urlParams.get('name')?.split(' ').slice(1).join(' ') || '',
        avatarUrl: urlParams.get('avatar') || '',
        estado: 'ACTIVO',
        tipoLogin: 'academic',
        rol: 'ESTUDIANTE',
        escuela: urlParams.get('domain') || '',
        facultad: 'Por asignar'
      };

      const session: BackendSession = {
        token: `google_${Date.now()}`,
        perfil: userProfile
      };

      if (onLoginSuccess) {
        onLoginSuccess(session);
      }
      
      // Limpiar URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [onLoginSuccess]);

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <LoginHeader selectedType={selectedType} subtitleText={subtitleText} />

        <div className="login-card space-y-6">
          {!selectedType ? (
            <TypeSelection onSelectType={handleSelectType} />
          ) : (
            <LoginForm
              selectedType={selectedType}
              identifier={identifier}
              password={password}
              captcha={captcha}
              captchaInput={captchaInput}
              error={error}
              loading={loading}
              infoMessage={infoMessage}
              onBack={handleBack}
              onIdentifierChange={setIdentifier}
              onPasswordChange={setPassword}
              onCaptchaInputChange={setCaptchaInput}
              onRefreshCaptcha={refreshCaptcha}
              onSubmit={handleSubmit}
              onGoogleSignIn={selectedType === 'academic' ? handleGoogleSignIn : undefined}
            />
          )}

          <div className="login-footer space-y-1">
            <p>
              IntegraUPT © {new Date().getFullYear()} Universidad Privada de Tacna
            </p>
            <p className="login-footer-sub">Soporte: soporte@upt.edu.pe</p>
          </div>
        </div>
      </div>
    </div>
  );
};