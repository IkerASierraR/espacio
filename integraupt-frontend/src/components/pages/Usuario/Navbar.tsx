import React from 'react';
import { Home, LayoutGrid, NotebookPen, UserRound, LogOut } from 'lucide-react';

interface NavbarProps {
  displayName: string;
  userCode?: string;
  currentPage: 'inicio' | 'servicios' | 'perfil' | 'reservas' | 'incidencias';
  onNavigateToInicio: () => void;
  onNavigateToServicios: () => void;
  onNavigateToPerfil: () => void;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

// Función para obtener las iniciales del nombre
const getInitials = (fullName: string): string => {
  const names = fullName.trim().split(' ');
  if (names.length === 0) return 'U';
  
  const firstName = names[0];
  const lastName = names.length > 1 ? names[names.length - 1] : '';
  
  const firstInitial = firstName.charAt(0).toUpperCase();
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
  
  return firstInitial + lastInitial;
};

export const Navbar: React.FC<NavbarProps> = ({
  displayName,
  userCode,
  currentPage,
  onNavigateToInicio,
  onNavigateToServicios,
  onNavigateToPerfil,
  onLogout,
  isLoggingOut = false
}) => {
  const userInitials = getInitials(displayName);

  return (
    <header className="home-navbar">
      <div className="home-navbar-left">
        <div className="home-navbar-logo" aria-label="IntegraUPT">
          <img src="/upt_transparent_icon.png" alt="user logo" className="login-logo-icon" style={{ width: '25px', height: '25px' }}/>
        </div>
        <div className="home-navbar-brand">
          <span className="home-navbar-brand-title">IntegraUPT</span>
          <span className="home-navbar-brand-subtitle">Pregrado</span>
        </div>
      </div>
      <nav className="home-navbar-links" aria-label="Navegación principal">
        <button 
          type="button" 
          className={`home-navbar-link ${currentPage === 'inicio' ? 'home-navbar-link-active' : ''}`}
          onClick={onNavigateToInicio}
        >
          <Home size={16} />
          <span>Home</span>
        </button>
        <button 
          type="button" 
          className={`home-navbar-link ${currentPage === 'servicios' ? 'home-navbar-link-active' : ''}`}
          onClick={onNavigateToServicios}
        >
          <NotebookPen size={16} />
          <span>Servicios</span>
        </button>
        <button 
          type="button" 
          className={`home-navbar-link ${currentPage === 'perfil' ? 'home-navbar-link-active' : ''}`}
          onClick={onNavigateToPerfil}
        >
          <UserRound size={16} />
          <span>Mi Perfil</span>
        </button>
      </nav>
      <div className="home-navbar-user">
        <div className="home-navbar-user-avatar">
          <div 
            className="home-navbar-user-initials"
            aria-label={`Iniciales de ${displayName}: ${userInitials}`}
            title={displayName}
          >
            {userInitials}
          </div>
        </div>
        <div className="home-navbar-user-info">
          <span className="home-navbar-user-name">{displayName}</span>
          {userCode ? (
            <span className="home-navbar-user-code">{userCode}</span>
          ) : null}
        </div>
        <button
          type="button"
          className="home-navbar-exit"
          aria-label="Cerrar sesión"
          onClick={onLogout}
          disabled={isLoggingOut}
          aria-busy={isLoggingOut}
          title="Cerrar sesión"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};