export interface GoogleUserProfile {
  email: string;
  fullName: string;
  picture: string;
  hostedDomain: string;
  emailVerified: boolean;
}

export interface GoogleCallbackResponse {
  success: boolean;
  message: string;
  profile: GoogleUserProfile | null;
}

export const googleAuthService = {
  async handleGoogleCallback(code: string): Promise<GoogleCallbackResponse> {
    const response = await fetch(`http://localhost:8080/auth/google/callback?code=${code}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error en la autenticación con Google');
    }

    return await response.json();
  },

  // Convertir perfil de Google al formato de la aplicación
  convertToBackendProfile(googleProfile: GoogleUserProfile): any {
    return {
      email: googleProfile.email,
      nombres: googleProfile.fullName.split(' ')[0] || '',
      apellidos: googleProfile.fullName.split(' ').slice(1).join(' ') || '',
      avatarUrl: googleProfile.picture,
      estado: 'ACTIVO',
      tipoLogin: 'academic',
      rol: 'ESTUDIANTE',
      escuela: 'Por asignar',
      facultad: 'Por asignar'
    };
  }
};