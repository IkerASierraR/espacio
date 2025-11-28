import { useState, useCallback, useEffect } from 'react';
import type { LoginType, BackendSession } from '../types';
import { generateCaptcha } from '../captchaUtils';
import { autenticacionService } from '../services/autenticacionService';

export const useLogin = (onLoginSuccess?: (session: BackendSession) => void) => {
  const [selectedType, setSelectedType] = useState<LoginType | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState<string>(() => generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
  }, []);

  const handleSelectType = (type: LoginType) => {
    setSelectedType(type);
    setIdentifier('');
    setPassword('');
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
    setError(null);
    setInfoMessage(null);
  };

  const handleBack = () => {
    setSelectedType(null);
    setIdentifier('');
    setPassword('');
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
    setError(null);
    setInfoMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedType) return;

    if (captchaInput.trim().toUpperCase() !== captcha) {
      setError('El código de seguridad es incorrecto. Intenta nuevamente.');
      refreshCaptcha();
      return;
    }

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const data = await autenticacionService.login(identifier, password, selectedType);

      if (!data?.success) {
        throw new Error(data?.message ?? 'Credenciales inválidas.');
      }

      const perfil = data.perfil;
      const token = data.token?.trim();

      if (!perfil) {
        throw new Error('No se recibió el perfil del usuario.');
      }

      if (!token) {
        throw new Error('No se recibió el token de sesión. Intenta nuevamente.');
      }

      const session: BackendSession = { token, perfil };
      setInfoMessage(data.message ?? 'Inicio de sesión exitoso. Redirigiendo...');

      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(session);
      }, 1000);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Ocurrió un error inesperado durante el inicio de sesión.';
      setError(message);
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = useCallback(async () => {
  console.log('Obteniendo URL de Google...');
  setLoading(true);
  setError(null);

  try {
    // Primero obtener la URL del backend
    const response = await fetch('http://localhost:8080/auth/google/login');
    
    if (!response.ok) {
      throw new Error('Error al obtener URL de Google');
    }

    const data = await response.json();
    
    if (data.success && data.url) {
      // Ahora redirigir a la URL de Google
      window.location.href = data.url;
    } else {
      throw new Error(data.message || 'Error en la respuesta del servidor');
    }
  } catch (err) {
    const message = err instanceof Error 
      ? err.message 
      : 'Error al iniciar autenticación con Google';
    setError(message);
    setLoading(false);
  }
}, []);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const googleCode = urlParams.get('code');
      
      if (googleCode) {
        setLoading(true);
        setError(null);

        try {
          // Llamar al endpoint de callback
          const response = await fetch(`http://localhost:8080/auth/google/callback?code=${googleCode}`);
          
          if (!response.ok) {
            throw new Error('Error en la autenticación con Google');
          }

          const googleResponse = await response.json();
          
          if (!googleResponse.success || !googleResponse.profile) {
            throw new Error(googleResponse.message || 'Error en autenticación con Google');
          }

          // Convertir perfil de Google al formato de tu app
          const googleProfile = googleResponse.profile;
          const userProfile = {
            id: `google_${googleProfile.email}`,
            codigo: googleProfile.email.split('@')[0], // "dj2022075749"
            email: googleProfile.email,
            nombres: googleProfile.fullName?.split(' ')[0] || 'DAYAN', // "DAYAN"
            apellidos: googleProfile.fullName?.split(' ').slice(1).join(' ') || 'ELVIS JAHUIRA PILCO',
            avatarUrl: googleProfile.picture,
            estado: 'ACTIVO',
            tipoLogin: 'academic',
            rol: 'ESTUDIANTE',
            escuela: googleProfile.hostedDomain || 'virtual.upt.pe',
            facultad: 'Por asignar'
          };

          const session: BackendSession = {
            token: `google_${Date.now()}`,
            perfil: userProfile
          };

          setInfoMessage('Autenticación con Google exitosa. Redirigiendo...');
          
          setTimeout(() => {
            if (onLoginSuccess) onLoginSuccess(session);
          }, 1000);

        } catch (err) {
          const message = err instanceof Error 
            ? err.message 
            : 'Error durante la autenticación con Google';
          setError(message);
        } finally {
          setLoading(false);
          // Limpiar URL
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    };

    handleGoogleCallback();
  }, [onLoginSuccess]);

  return {
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
    handleGoogleSignIn,
  };
};