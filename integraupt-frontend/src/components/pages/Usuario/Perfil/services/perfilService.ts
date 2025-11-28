import { getUsuariosApiUrl } from "../../../../../utils/apiConfig";
import type { PerfilEstudiante, PerfilDocente, PerfilAdministrativo } from "../types";
import '../styles/Perfil.css';

export class PerfilService {
  private static cache: Map<string, any> = new Map();

  private static async fetchWithAuth(endpoint: string, token: string) {
    // Usar cache para evitar llamadas duplicadas
    const cacheKey = `${endpoint}-${token}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const response = await fetch(getUsuariosApiUrl(endpoint), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, data);
    return data;
  }

  static async obtenerPerfilEstudiante(userId: number, token: string): Promise<PerfilEstudiante> {
    try {
      const estudiantes = await this.fetchWithAuth('/api/estudiantes', token);
      const estudianteEncontrado = estudiantes.find((est: any) => 
        est.usuario && est.usuario.idUsuario === userId
      );
      
      if (!estudianteEncontrado) {
        throw new Error('No se encontró estudiante con el ID de usuario proporcionado');
      }

      return estudianteEncontrado;
    } catch (error) {
      console.error('Error obteniendo perfil de estudiante:', error);
      throw error;
    }
  }

  static async obtenerPerfilDocente(userId: number, token: string): Promise<PerfilDocente> {
    try {
      const docentes = await this.fetchWithAuth('/api/docentes', token);
      const docenteEncontrado = docentes.find((doc: any) => 
        doc.usuario && doc.usuario.idUsuario === userId
      );
      
      if (!docenteEncontrado) {
        throw new Error('No se encontró docente con el ID de usuario proporcionado');
      }

      return docenteEncontrado;
    } catch (error) {
      console.error('Error obteniendo perfil de docente:', error);
      throw error;
    }
  }

  static async obtenerPerfilAdministrativo(userId: number, token: string): Promise<PerfilAdministrativo> {
    try {
      const administrativos = await this.fetchWithAuth('/api/administrativos', token);
      const administrativoEncontrado = administrativos.find((admin: any) => 
        admin.usuario && admin.usuario.idUsuario === userId
      );
      
      if (!administrativoEncontrado) {
        throw new Error('No se encontró administrativo con el ID de usuario proporcionado');
      }

      return administrativoEncontrado;
    } catch (error) {
      console.error('Error obteniendo perfil de administrativo:', error);
      throw error;
    }
  }

  static async obtenerPerfilCompleto(loginType: string, userId: number, token: string) {
    console.log('Obteniendo perfil para:', { loginType, userId });
    
    // Limpiar cache anterior
    this.cache.clear();

    try {
      if (loginType === 'academic') {
        // Para usuarios académicos, determinar automáticamente si es estudiante o docente
        try {
          return await this.obtenerPerfilEstudiante(userId, token);
        } catch (estudianteError) {
          console.log('No es estudiante, intentando como docente...');
          return await this.obtenerPerfilDocente(userId, token);
        }
      } else if (loginType === 'administrative') {
        return await this.obtenerPerfilAdministrativo(userId, token);
      } else {
        throw new Error('Tipo de usuario no válido');
      }
    } catch (error) {
      console.error('Error en obtenerPerfilCompleto:', error);
      throw error;
    }
  }

  // Método para limpiar cache manualmente
  static clearCache() {
    this.cache.clear();
  }
}