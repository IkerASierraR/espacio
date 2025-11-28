import { type KeyboardEvent, useCallback, useMemo } from 'react';
import { 
  AlertTriangle, 
  ArrowLeft, 
  MonitorSmartphone,
  Home,
  LayoutGrid,
  NotebookPen,
  UserRound,
  LogOut,
  LibraryBig
} from 'lucide-react';
import '../../../../styles/ServiciosScreen.css';
import { Navbar } from '../Navbar';

interface ServiciosPageProps {
  user: {
    id: string;
    email: string;
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
  onNavigateToReservas: () => void;
  onNavigateToIncidencias: () => void;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

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

export const ServiciosPage: React.FC<ServiciosPageProps> = ({
  user,
  onNavigateToInicio,
  onNavigateToServicios,
  onNavigateToPerfil,
  onNavigateToReservas,
  onNavigateToIncidencias,
  onLogout,
  isLoggingOut = false
}) => {
  const displayName = useMemo(
    () => getDisplayName(user.user_metadata.name, user.user_metadata.codigo),
    [user.user_metadata.codigo, user.user_metadata.name],
  );

  const buildCardHandlers = useCallback(
    (action: () => void) => ({
      onClick: action,
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          action();
        }
      },
    }),
    [],
  );

  // const reservasHandlers = buildCardHandlers(onNavigateToReservas);
  // const incidenciasHandlers = buildCardHandlers(onNavigateToIncidencias);

  // Función placeholder para botones no implementados
  const handleNotImplemented = () => {
    console.log('Funcionalidad no implementada');
  };
  
  return (
    <div className="servicios-container">
      <Navbar
        displayName={displayName}
        userCode={user.user_metadata.codigo}
        currentPage="servicios"
        onNavigateToInicio={onNavigateToInicio}
        onNavigateToServicios={onNavigateToServicios}
        onNavigateToPerfil={onNavigateToPerfil}
        onLogout={onLogout}
        isLoggingOut={isLoggingOut}
      />
      <main className="servicios-main" aria-labelledby="servicios-title">
        <section className="home-welcome-card">
          <div>
            <p className="home-welcome-date">Servicios Disponibles</p>
            <h1 className="home-title">Gestión de Servicios</h1>
            <p className="home-subtitle">
              Hola {displayName}, selecciona el servicio que deseas gestionar.
            </p>
          </div>
          <div className="home-welcome-avatar" aria-hidden="true">
            <NotebookPen size={44} />
          </div>
        </section>

        <section className="servicios-menu-grid" aria-label="Servicios disponibles">
          <article
            className="servicios-menu-card servicios-menu-card-espacios"
            role="article"
            tabIndex={0}
          >
            <div className="servicios-menu-icon-container">
              <div className="servicios-menu-icon servicios-menu-icon-espacios">
                <MonitorSmartphone className="servicios-menu-icon-svg" aria-hidden="true" />
              </div>
            </div>
            <h2 className="servicios-menu-card-title">Reserva de espacios</h2>
            <p className="servicios-menu-card-description">
              Reserva laboratorios y aulas para tus actividades académicas.
            </p>
            <div className="servicios-menu-card-badge">Laboratorios / Aulas</div>
            <div className="servicios-menu-card-actions">
              <button
                type="button"
                className="servicios-menu-card-button servicios-menu-card-button-espacios"
                onClick={(event) => {
                  onNavigateToReservas();
                }}
              >
                Gestionar reservas
              </button>
            </div>
          </article>

          <article
            className="servicios-menu-card servicios-menu-card-incidencias"
            role="article"
            tabIndex={0}
          >
            <div className="servicios-menu-icon-container">
              <div className="servicios-menu-icon servicios-menu-icon-incidencias">
                <AlertTriangle className="servicios-menu-icon-svg" aria-hidden="true" />
              </div>
            </div>
            <h2 className="servicios-menu-card-title">Incidencias y reportes</h2>
            <p className="servicios-menu-card-description">
              Registra incidencias, da seguimiento a sus estados y revisa tus reportes.
            </p>
            <div className="servicios-menu-card-badge servicios-menu-card-badge-incidencias">
              Atención a incidencias
            </div>
            <div className="servicios-menu-card-actions">
              <button
                type="button"
                className="servicios-menu-card-button servicios-menu-card-button-incidencias"
                onClick={(event) => {
                  onNavigateToIncidencias();
                }}
              >
                Gestionar incidencias
              </button>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
};