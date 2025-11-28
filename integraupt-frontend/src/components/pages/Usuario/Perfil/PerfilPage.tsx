import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  Loader2, 
  User, 
  AlertCircle,
  Home,
  LayoutGrid,
  NotebookPen,
  UserRound,
  LogOut,
  LibraryBig,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { PerfilService } from './services/perfilService';
import { InformacionPersonal } from './components/InformacionPersonal';
import { InformacionAcademica } from './components/InformacionAcademica';
import { InformacionDocente } from './components/InformacionDocente';
import type { PerfilEstudiante, PerfilDocente, PerfilAdministrativo, PerfilUsuario } from './types';
import './styles/Perfil.css';
import { Navbar } from '../Navbar';

interface PerfilPageProps {
  user: {
    id: string;
    email: string;
    sessionToken?: string;
    user_metadata: {
      name: string;
      avatar_url: string;
      role?: string;
      login_type?: string;
      codigo?: string;
      escuelaId?: number;
      escuelaNombre?: string;
    };
  };
  onNavigateToInicio: () => void;
  onNavigateToServicios: () => void;
  onNavigateToPerfil: () => void;
  // onNavigateToReservas: () => void;
  // onNavigateToIncidencias: () => void;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

type PerfilCompleto = PerfilEstudiante | PerfilDocente | PerfilAdministrativo;

const getDisplayName = (name?: string, codigo?: string): string => {
  const trimmedName = name?.trim();
  if (trimmedName) {
    return trimmedName;
  }

  const trimmedCodigo = codigo?.trim();
  if (trimmedCodigo) {
    return trimmedCodigo;
  }

  return 'Usuario';
};

export const PerfilPage: React.FC<PerfilPageProps> = ({ 
  user, 
  onNavigateToInicio,
  onNavigateToServicios,
  onNavigateToPerfil,
  // onNavigateToReservas,
  // onNavigateToIncidencias,
  onLogout,
  isLoggingOut = false
}) => {
  const [perfil, setPerfil] = useState<PerfilCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const displayName = getDisplayName(
    user.user_metadata.name,
    user.user_metadata.codigo,
  );

  const handleOpenManualUsuario = () => {
    const pdfUrl = '/manual-usuario-integaupt.pdf';
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  const cargarPerfil = useCallback(async () => {
    if (!user.sessionToken) {
      setError('No hay token de sesión disponible');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Cargando perfil con datos:', {
        userId: user.id,
        loginType: user.user_metadata.login_type,
        tokenLength: user.sessionToken?.length
      });

      const perfilCompleto = await PerfilService.obtenerPerfilCompleto(
        user.user_metadata.login_type || 'academic',
        parseInt(user.id),
        user.sessionToken
      );
      
      console.log('Perfil cargado:', perfilCompleto);
      setPerfil(perfilCompleto);
    } catch (err) {
      console.error('Error cargando perfil:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  }, [user.id, user.sessionToken, user.user_metadata.login_type]);

  useEffect(() => {
    cargarPerfil();
  }, [cargarPerfil]);

  const esEstudiante = (perfil: PerfilCompleto): perfil is PerfilEstudiante => {
    return 'codigo' in perfil;
  };

  const esDocente = (perfil: PerfilCompleto): perfil is PerfilDocente => {
    return 'codigoDocente' in perfil;
  };

  const esAdministrativo = (perfil: PerfilCompleto): perfil is PerfilAdministrativo => {
    return 'turno' in perfil;
  };

  // Función placeholder para botones no implementados
  const handleNotImplemented = () => {
    console.log('Funcionalidad no implementada');
  };  

  if (loading) {
    return (
      <div className="perfil-container">
        <Navbar
          displayName={displayName}
          userCode={user.user_metadata.codigo}
          currentPage="perfil"
          onNavigateToInicio={onNavigateToInicio}
          onNavigateToServicios={onNavigateToServicios}
          onNavigateToPerfil={onNavigateToPerfil}
          onLogout={onLogout}
          isLoggingOut={isLoggingOut}
        />
        <div className="perfil-loading">
          <Loader2 className="perfil-spinner" />
          <p>Cargando información del perfil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="perfil-container">
        <Navbar
          displayName={displayName}
          userCode={user.user_metadata.codigo}
          currentPage="perfil"
          onNavigateToInicio={onNavigateToInicio}
          onNavigateToServicios={onNavigateToServicios}
          onNavigateToPerfil={onNavigateToPerfil}
          onLogout={onLogout}
          isLoggingOut={isLoggingOut}
        />
        <div className="perfil-error">
          <AlertCircle className="perfil-error-icon" />
          <h3>Error al cargar el perfil</h3>
          <p>{error}</p>
          <div className="perfil-debug-info">
            <p>Detalles para debugging:</p>
            <ul>
              <li>User ID: {user.id}</li>
              <li>Login Type: {user.user_metadata.login_type}</li>
              <li>Token: {user.sessionToken ? 'Presente' : 'Ausente'}</li>
            </ul>
          </div>
          <button onClick={cargarPerfil} className="perfil-retry-btn">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="perfil-container">
        <Navbar
          displayName={displayName}
          userCode={user.user_metadata.codigo}
          currentPage="perfil"
          onNavigateToInicio={onNavigateToInicio}
          onNavigateToServicios={onNavigateToServicios}
          onNavigateToPerfil={onNavigateToPerfil}
          onLogout={onLogout}
          isLoggingOut={isLoggingOut}
        />
        <div className="perfil-error">
          <AlertCircle className="perfil-error-icon" />
          <h3>No se pudo cargar la información del perfil</h3>
          <button onClick={cargarPerfil} className="perfil-retry-btn">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="perfil-container">
      <Navbar
        displayName={displayName}
        userCode={user.user_metadata.codigo}
        currentPage="perfil"
        onNavigateToInicio={onNavigateToInicio}
        onNavigateToServicios={onNavigateToServicios}
        onNavigateToPerfil={onNavigateToPerfil}
        onLogout={onLogout}
        isLoggingOut={isLoggingOut}
      />

      <main className="perfil-content">
        <section className="home-welcome-card">
          <div className="perfil-title-section">
            <div className="perfil-avatar">
              <User className="perfil-avatar-icon" />
            </div>
            <div>
              <p className="home-welcome-date">Perfil de Usuario</p>
              <h1 className="home-title">
                {perfil.usuario.nombre} {perfil.usuario.apellido}
              </h1>
              <p className="home-subtitle">
                {esEstudiante(perfil) && 'Estudiante'}
                {esDocente(perfil) && 'Docente'}
                {esAdministrativo(perfil) && 'Personal Administrativo'}
              </p>
            </div>
          </div>
          <div className="home-welcome-avatar" aria-hidden="true">
            <button
              type="button"
              className="manual-usuario-btn"
              onClick={handleOpenManualUsuario}
              title="Abrir manual de usuario"
              aria-label="Abrir manual de usuario en PDF"
            >
              <FileText size={32} />
              <span>Manual</span>
            </button>
          </div>
        </section>

        <div className="perfil-sections-container">
          <InformacionPersonal perfil={perfil.usuario} />
          
          {esEstudiante(perfil) && <InformacionAcademica perfil={perfil} />}
          {esDocente(perfil) && <InformacionDocente perfil={perfil} />}
          
          {esAdministrativo(perfil) && (
            <div className="perfil-section">
              <h3 className="perfil-section-title">Información Administrativa</h3>
              <div className="perfil-grid">
                <div className="perfil-info-item">
                  <label className="perfil-info-label">Turno</label>
                  <p className="perfil-info-value">{perfil.turno || 'No asignado'}</p>
                </div>
                <div className="perfil-info-item">
                  <label className="perfil-info-label">Extensión</label>
                  <p className="perfil-info-value">{perfil.extension || 'No asignada'}</p>
                </div>
                <div className="perfil-info-item">
                  <label className="perfil-info-label">Fecha de incorporación</label>
                  <p className="perfil-info-value">
                    {perfil.fechaIncorporacion 
                      ? new Date(perfil.fechaIncorporacion).toLocaleDateString('es-ES')
                      : 'No disponible'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};