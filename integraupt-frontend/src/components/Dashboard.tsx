import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminDashboard } from './AdminDashboard';
import { IntegraUPTApp } from './pages/Usuario/Inicio/InicioPage';
import { ReservasPage } from './pages/Usuario/Reservas/ReservasPage';
import { IncidenciasPage } from "./pages/Usuario/Incidencia/IncidenciasPage";
import { ServiciosPage } from './pages/Usuario/Servicios/ServiciosPage';
import { requestBackendLogout } from '../utils/logout';
import { isBackendLoginType } from '../utils/apiConfig';
import { PerfilPage } from './pages/Usuario/Perfil/PerfilPage';


interface User {
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
}

interface DashboardProps {
  user: User;
}

const ACTIVE_VIEW_STORAGE_KEY = 'dashboard_active_view';

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const isAdministrative = user.user_metadata.login_type === 'administrative';

  const [activeView, setActiveView] = useState<
     'inicio' | 'servicios' | 'reservas' | 'incidencias' | 'perfil'
   >(() => {
     if (typeof window === 'undefined') {
       return 'inicio';
     }

     try {
       const storedView = localStorage.getItem(ACTIVE_VIEW_STORAGE_KEY);

       if (
         storedView === 'inicio' ||
         storedView === 'servicios' ||
         storedView === 'reservas' ||
         storedView === 'incidencias' ||
         storedView === 'perfil'
       ) {
         return storedView;
       }
     } catch {}

     return 'inicio';
   });

   const [isLoggingOut, setIsLoggingOut] = useState(false);

   const shouldNotifyBackend = useMemo(
     () => isBackendLoginType(user.user_metadata.login_type),
     [user.user_metadata.login_type]
   );

    const handleLogout = useCallback(async () => {
       if (isLoggingOut) {
         return;
       }

       setIsLoggingOut(true);

       try {
         if (shouldNotifyBackend) {
           await requestBackendLogout(user.id, user.sessionToken);
         }
       } finally {
         try {
           localStorage.removeItem('admin_session');
           localStorage.removeItem(ACTIVE_VIEW_STORAGE_KEY);
         } catch {
           // Ignorar si no existe almacenamiento
         }

         window.location.reload();
       }
     }, [isLoggingOut, shouldNotifyBackend, user.id, user.sessionToken]);

     const handleNavigateToServicios = useCallback(() => {
       setActiveView('servicios');
     }, []);

  const handleNavigateToReservas = useCallback(() => {
    setActiveView('reservas');
  }, []);

  const handleNavigateToIncidencias = useCallback(() => {
    setActiveView('incidencias');
  }, []);

  const handleNavigateToPerfil = useCallback(() => {
    setActiveView('perfil');
  }, []);

  const handleNavigateToInicio = useCallback(() => {
    setActiveView('inicio');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(ACTIVE_VIEW_STORAGE_KEY, activeView);
    } catch {}
  }, [activeView]);

  // Si el usuario es administrativo → mostrar panel de administrador
  if (isAdministrative) {
    return <AdminDashboard user={user} />;
  }

  if (activeView === 'servicios') {
    return (
      <ServiciosPage
        user={user}
        onNavigateToInicio={handleNavigateToInicio}
        onNavigateToServicios={handleNavigateToServicios}
        onNavigateToPerfil={handleNavigateToPerfil}
        onNavigateToReservas={handleNavigateToReservas}
        onNavigateToIncidencias={handleNavigateToIncidencias}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />
    );
  }

  if (activeView === 'reservas') {
    return (
      <ReservasPage 
        user={user} 
        onNavigateToInicio={handleNavigateToInicio}
        onNavigateToServicios={handleNavigateToServicios}
        onNavigateToPerfil={handleNavigateToPerfil}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />
    );
  }

  if (activeView === 'incidencias') {
    return (
      <IncidenciasPage 
        user={user} 
        onNavigateToInicio={handleNavigateToInicio}
        onNavigateToServicios={handleNavigateToServicios}
        onNavigateToPerfil={handleNavigateToPerfil}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />
    );
  }

  if (activeView === 'perfil') {
    return (
      <PerfilPage 
        user={user} 
        onNavigateToInicio={handleNavigateToInicio}
        onNavigateToServicios={handleNavigateToServicios}
        onNavigateToPerfil={handleNavigateToPerfil}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />
    );
  }

  return (
    <IntegraUPTApp
      user={user}
      onNavigateToServicios={handleNavigateToServicios}
      onNavigateToReservas={handleNavigateToReservas}
      onNavigateToIncidencias={handleNavigateToIncidencias}
      onNavigateToPerfil={handleNavigateToPerfil}
      onLogout={handleLogout}
      isLoggingOut={isLoggingOut}
    />
  );
};