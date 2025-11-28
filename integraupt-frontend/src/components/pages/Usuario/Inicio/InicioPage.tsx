import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Clock3,
  DoorOpen,
  GraduationCap,
  Home,
  LayoutGrid,
  LibraryBig,
  LogOut,
  MonitorSmartphone,
  NotebookPen,
  UserRound,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import '../../../../styles/HomeScreen.css';
import { fetchReservasInicioResumen, type ReservaInicioResumen } from './services/reservasResumenService';
import { Navbar } from '../Navbar';
import { ChatBot } from './ChatBot';
import { EnlacesUtiles } from './components/EnlacesUtiles';

interface IntegraUPTAppProps {
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
  onNavigateToServicios: () => void;
  onNavigateToReservas: () => void;
  onNavigateToIncidencias: () => void;
  onNavigateToPerfil: () => void;
  onLogout: () => void;
  isLoggingOut: boolean;
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

type ReservaStatusKey = 'sesion' | 'aprobado' | 'rechazado' | 'pendiente';

interface StatusConfig {
  key: ReservaStatusKey;
  title: string;
  description: string;
  emptyMessage: string;
  icon: React.ReactNode;
  limit?: number;
}

const STATUS_CONFIG: StatusConfig[] = [
  {
    key: 'sesion',
    title: 'Sesión',
    description: 'Reservas que están en curso en este momento.',
    emptyMessage: 'No hay reservas en sesión actualmente.',
    icon: <Activity size={18} aria-hidden="true" />,
  },
  {
    key: 'aprobado',
    title: 'Aprobadas',
    description: 'Reservas confirmadas y próximas a iniciar.',
    emptyMessage: 'No tienes reservas aprobadas recientes.',
    icon: <CheckCircle2 size={18} aria-hidden="true" />,
    limit: 3,
  },
  {
    key: 'rechazado',
    title: 'Rechazadas',
    description: 'Solicitudes rechazadas o canceladas.',
    emptyMessage: 'No registras reservas rechazadas.',
    icon: <XCircle size={18} aria-hidden="true" />,
  },
];

const parseIsoDate = (value?: string | null): Date | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (match) {
    const [, year, month, day] = match;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const formatDateValue = (value?: string | null): string => {
  const date = parseIsoDate(value);
  if (!date) {
    return 'Fecha por definir';
  }
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(date);
};

const normalizeTime = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed.slice(0, 5);
  }
  return trimmed;
};

const formatTimeRange = (reserva: ReservaInicioResumen): string => {
  const inicio = normalizeTime(reserva.horaInicio);
  const fin = normalizeTime(reserva.horaFin);
  if (inicio && fin) {
    return `${inicio} - ${fin}`;
  }
  if (inicio) {
    return inicio;
  }
  return 'Horario por definir';
};

const getReservaNombre = (reserva: ReservaInicioResumen): string => {
  if (reserva.espacioNombre) {
    return reserva.espacioNombre;
  }
  if (reserva.espacioCodigo) {
    return `Espacio ${reserva.espacioCodigo}`;
  }
  if (reserva.espacioId != null) {
    return `Espacio ${reserva.espacioId}`;
  }
  return `Reserva #${reserva.reservaId}`;
};

const parseDateTime = (fecha?: string | null, hora?: string | null): Date | null => {
  const date = parseIsoDate(fecha);
  const time = normalizeTime(hora);
  if (!date || !time) {
    return null;
  }

  const [hours, minutes] = time.split(':');
  const result = new Date(date.getTime());
  result.setHours(Number.parseInt(hours, 10), Number.parseInt(minutes, 10), 0, 0);
  return Number.isNaN(result.getTime()) ? null : result;
};

const normalizeEstado = (estado?: string | null): string => {
  if (!estado) {
    return '';
  }
  return estado
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
};

const getReservaStatusKey = (reserva: ReservaInicioResumen): ReservaStatusKey => {
  const estadoNormalizado = normalizeEstado(reserva.estado);

  if (estadoNormalizado.includes('sesion') || estadoNormalizado.includes('sension')) {
    return 'sesion';
  }

  if (estadoNormalizado.startsWith('rechaz') || estadoNormalizado.startsWith('cancel')) {
    return 'rechazado';
  }

  if (estadoNormalizado.startsWith('pend')) {
    return 'pendiente';
  }

  if (estadoNormalizado.startsWith('apro')) {
    const inicio = parseDateTime(reserva.fechaReserva, reserva.horaInicio);
    const fin = parseDateTime(reserva.fechaReserva, reserva.horaFin);
    const ahora = new Date();
    if (inicio && fin && ahora >= inicio && ahora <= fin) {
      return 'sesion';
    }
    return 'aprobado';
  }

  const inicio = parseDateTime(reserva.fechaReserva, reserva.horaInicio);
  const fin = parseDateTime(reserva.fechaReserva, reserva.horaFin);
  const ahora = new Date();
  if (inicio && fin && ahora >= inicio && ahora <= fin) {
    return 'sesion';
  }

  if (estadoNormalizado.length === 0) {
    return 'pendiente';
  }

  return 'aprobado';
};

const getBadgeLabel = (statusKey: ReservaStatusKey, estado?: string | null): string => {
  if (statusKey === 'sesion') {
    return 'Activa';
  }

  const trimmed = estado?.trim();
  if (!trimmed) {
    switch (statusKey) {
      case 'aprobado':
        return 'Aprobada';
      case 'rechazado':
        return 'Rechazada';
      default:
        return 'Pendiente';
    }
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};


export const IntegraUPTApp: React.FC<IntegraUPTAppProps> = ({
  user,
      onNavigateToServicios,
      onNavigateToReservas,
       onNavigateToIncidencias,
        onNavigateToPerfil,
           onLogout,
           isLoggingOut
}) => {
  const displayName = getDisplayName(
    user.user_metadata.name,
      user.user_metadata.codigo,
      );

  const userId = useMemo(() => {
      const parsed = Number.parseInt(user.id, 10);
      return Number.isNaN(parsed) ? null : parsed;
    }, [user.id]);

    const [reservasResumen, setReservasResumen] = useState<ReservaInicioResumen[]>([]);
    const [reservasLoading, setReservasLoading] = useState(false);
    const [reservasError, setReservasError] = useState<string | null>(null);
    const [currentPublicationIndex, setCurrentPublicationIndex] = useState(0);
    const [selectedPublication, setSelectedPublication] = useState<null | typeof publications[0]>(null);
    
    const publications = [
  {
    id: 1,
    src: "https://net.upt.edu.pe/imagenes/2025-II/PROGRAMA_BECAS_MOVILIDAD.jpg",
    alt: "Programa de Becas de Movilidad"
  },
  {
    id: 2,
    src: "https://net.upt.edu.pe/imagenes/2025-I/DEFENSORIA_UNIVERSITARIA_UPT_FLYER.png", 
    alt: "Defensoría Universitaria UPT"
  },
  {
    id: 3,
    src: "https://net.upt.edu.pe/imagenes/2025-I/Calendario_Academico_2025-II_Nuevo.jpg",
    alt: "Calendario Académico 2025-II"
  },
  {
    id: 4,
    src: "https://net.upt.edu.pe/imagenes/2025-II/BUEN_PAGADOR.jpg",
    alt: "Sorteo Buen Pagador"
  },
  {
    id: 5, 
    src: "	https://net.upt.edu.pe/imagenes/2025-II/COMUNICADO_COMUNIDAD_UNIVERSITARIA.png",
    alt: "Comunicado a la Comunidad Universitaria"
  }
  // Puedes agregar más imágenes según las que tenga tu universidad
];

    useEffect(() => {
      if (userId == null) {
        setReservasResumen([]);
        setReservasError('No se pudo identificar al usuario actual.');
        setReservasLoading(false);
        return;
      }

      const controller = new AbortController();
      let isMounted = true;

      setReservasLoading(true);
      setReservasError(null);

      fetchReservasInicioResumen(userId, controller.signal)
        .then((data) => {
          if (!isMounted) {
            return;
          }
          setReservasResumen(data);
        })
        .catch((error) => {
          if (!isMounted || controller.signal.aborted) {
            return;
          }
          const message =
            error instanceof Error
              ? error.message
              : 'No fue posible sincronizar tus reservas recientes.';
          setReservasError(message);
          setReservasResumen([]);
        })
        .finally(() => {
          if (!isMounted || controller.signal.aborted) {
            return;
          }
          setReservasLoading(false);
        });

      return () => {
        isMounted = false;
        controller.abort();
      };
    }, [userId]);

    const reservasPorEstado = useMemo(() => {
      const agrupadas: Record<ReservaStatusKey, ReservaInicioResumen[]> = {
        sesion: [],
        aprobado: [],
        rechazado: [],
        pendiente: [],
      };

      reservasResumen.forEach((reserva) => {
        const clave = getReservaStatusKey(reserva);
        agrupadas[clave].push(reserva);
      });

      (Object.keys(agrupadas) as ReservaStatusKey[]).forEach((clave) => {
        agrupadas[clave] = agrupadas[clave]
          .slice()
          .sort((a, b) => {
            const inicioA = parseDateTime(a.fechaReserva, a.horaInicio)?.getTime() ?? Number.POSITIVE_INFINITY;
            const inicioB = parseDateTime(b.fechaReserva, b.horaInicio)?.getTime() ?? Number.POSITIVE_INFINITY;
            return inicioA - inicioB;
          });
      });

      return agrupadas;
    }, [reservasResumen]);     

  return (
    <div className="home-container">
      <Navbar
        displayName={displayName}
        userCode={user.user_metadata.codigo}
        currentPage="inicio"
        onNavigateToInicio={() => {}} // En la página de inicio, esta función puede ser vacía
        onNavigateToServicios={onNavigateToServicios}
        onNavigateToPerfil={onNavigateToPerfil}
        onLogout={onLogout}
        isLoggingOut={isLoggingOut}
      />
      <main className="home-main">
        <section className="home-welcome-card">
          <div>
            <p className="home-welcome-date">Miércoles, 12 de noviembre de 2025</p>
            <h1 className="home-title">Bienvenido {displayName}</h1>
            <p className="home-subtitle">
              Gestiona tus reservas de espacios, reporta incidencias y mantén tu agenda académica al día.
            </p>
          </div>
          <div className="home-welcome-avatar" aria-hidden="true">
            <GraduationCap size={44} />
          </div>
        </section>
        <div className="home-content-grid">
          <section className="home-column" aria-labelledby="publicaciones-title">
            <header className="home-section-header">
              <div className="home-section-header-icon">
                <CalendarDays size={18} />
              </div>
              <div>
                <h2 id="publicaciones-title">Publicaciones UPT</h2>
                <p>Información importante y convocatorias</p>
              </div>
            </header>

            <div className="home-publications-carousel">
              <figure className="home-publication-figure">
                <img 
                  className="home-publication-img"
                  src={publications[currentPublicationIndex].src}
                  alt={publications[currentPublicationIndex].alt}
                  onClick={() => setSelectedPublication(publications[currentPublicationIndex])}
                  style={{ maxHeight: '400px', objectFit: 'contain', cursor: 'pointer' }}
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='16' fill='%2394a3b8'%3EImagen no disponible%3C/text%3E%3C/svg%3E";
                  }}
                />
                <figcaption className="home-publication-caption">
                  <div className="home-publication-bottom-bar">
                    <div className="home-publication-title">
                      {publications[currentPublicationIndex].alt}
                    </div>
                    <div className="home-publication-counter">
                      {currentPublicationIndex + 1} of {publications.length}
                    </div>
                  </div>
                </figcaption>
              </figure>

              {/* Indicadores del carrusel */}
              {publications.length > 1 && (
                <div className="home-carousel-indicators">
                  {publications.map((_, index) => (
                    <button
                      key={index}
                      className={`home-carousel-indicator ${index === currentPublicationIndex ? 'active' : ''}`}
                      onClick={() => setCurrentPublicationIndex(index)}
                      aria-label={`Ir a publicación ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          <EnlacesUtiles />

          <aside className="home-sidebar" aria-labelledby="reservas-title">
            <div className="home-sidebar-content">
              <header className="home-section-header">
                <div className="home-section-header-icon home-section-header-icon-green">
                  <LibraryBig size={18} />
                </div>
                <div>
                  <h2 id="reservas-title">Reservas recientes</h2>
                  <p>Visualiza tus espacios y su estado en tiempo real</p>
                </div>
              </header>

              {reservasError && !reservasLoading ? (
                <div className="home-reservas-alert" role="alert">
                  <AlertTriangle size={16} aria-hidden="true" />
                  <span>{reservasError}</span>
                </div>
              ) : null}

              <div className="home-reservas-status-grid">
                {STATUS_CONFIG.map((status) => {
                  const items = reservasPorEstado[status.key];
                  return (
                    <section
                      key={status.key}
                      className={`home-reservas-status-card home-reservas-status-card--${status.key}`}
                      aria-labelledby={`home-reservas-${status.key}-title`}
                      data-status={status.key}
                    >
                      <header className="home-reservas-status-card-header">
                        <span className="home-reservas-status-icon">{status.icon}</span>
                        <div>
                          <h3 id={`home-reservas-${status.key}-title`}>{status.title}</h3>
                          <p>{status.description}</p>
                        </div>
                      </header>

                      {reservasLoading ? (
                        <div className="home-reservas-status-empty" role="status">
                          <Clock3 size={16} aria-hidden="true" />
                          <span>Sincronizando reservas…</span>
                        </div>
                      ) : reservasError ? (
                        <div
                          className="home-reservas-status-empty home-reservas-status-empty-error"
                          role="status"
                        >
                          <span>Sin datos disponibles.</span>
                        </div>
                      ) : items.length === 0 ? (
                        <div className="home-reservas-status-empty" role="status">
                          <span>{status.emptyMessage}</span>
                        </div>
                      ) : (
                        <ul className="home-reservas-status-list" role="list">
                          {items
                            .slice(0, status.limit ?? items.length)
                            .map((reserva) => (
                              <li key={reserva.reservaId} className="home-reservas-status-item">
                                <span className="home-reservas-status-marker" aria-hidden="true" />
                                <div className="home-reservas-status-item-info">
                                  <span className="home-reservas-status-name">{getReservaNombre(reserva)}</span>
                                  <span className="home-reservas-status-meta">
                                  {formatDateValue(reserva.fechaReserva)} · {formatTimeRange(reserva)}
                                </span>
                              </div>
                              <span
                                className={`home-reservas-status-badge home-reservas-status-badge--${status.key}`}
                              >
                                {getBadgeLabel(status.key, reserva.estado)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              className="home-action-btn"
              onClick={onNavigateToReservas}
            >
              Gestionar reservas
            </button>
          </aside>
        </div>

        <section className="home-services" aria-labelledby="servicios-title">
          <div className="home-services-header">
            <h2 id="servicios-title">Servicios</h2>
            <p>Selecciona el servicio que necesitas gestionar</p>
          </div>

          <div className="home-services-grid">
            <article className="home-service-card">
              <div className="home-service-icon home-service-icon-blue">
                <MonitorSmartphone size={32} />
              </div>
              <h3>Reservas de espacios</h3>
              <p>Reserva laboratorios y aulas para tus actividades académicas.</p>
              <button type="button" onClick={onNavigateToReservas}>
                Abrir gestor de reservas
              </button>
            </article>

            <article className="home-service-card">
              <div className="home-service-icon home-service-icon-purple">
                <AlertTriangle size={32} />
              </div>
              <h3>Incidencias y reportes</h3>
              <p>Registra incidencias y da seguimiento a tus reportes activos.</p>
              <button type="button" onClick={onNavigateToIncidencias}>
                Abrir gestor de incidencias
              </button>
            </article>

            <article className="home-service-card">
              <div className="home-service-icon home-service-icon-green">
                <DoorOpen size={32} />
              </div>
              <h3>Orientación y asesorías</h3>
              <p>Solicita orientación académica o asesorías personalizadas.</p>
              <button type="button" disabled>
                Próximamente
              </button>
            </article>
          </div>
        </section>
    </main>
    {selectedPublication && (
      <div className="home-publication-modal-overlay">
        <div className="home-publication-modal">
          <button 
            className="home-publication-modal-close"
            onClick={() => setSelectedPublication(null)}
            aria-label="Cerrar"
          >
            ×
          </button>
          
          <div className="home-publication-modal-image-container">
            <img 
              src={selectedPublication.src}
              alt={selectedPublication.alt}
              className="home-publication-modal-img"
            />
          </div>

          <div className="home-publication-modal-info">
            <div className="home-publication-modal-title">
              {selectedPublication.alt}
            </div>
            <div className="home-publication-modal-counter">
              {publications.findIndex(pub => pub.id === selectedPublication.id) + 1} de {publications.length}
            </div>
          </div>

          {/* Navegación en el modal */}
          {publications.length > 1 && (
            <>
              <button 
                className="home-publication-modal-nav home-publication-modal-prev"
                onClick={() => {
                  const currentIndex = publications.findIndex(pub => pub.id === selectedPublication.id);
                  const prevIndex = currentIndex === 0 ? publications.length - 1 : currentIndex - 1;
                  setSelectedPublication(publications[prevIndex]);
                }}
                aria-label="Publicación anterior"
              >
                ‹
              </button>
              
              <button 
                className="home-publication-modal-nav home-publication-modal-next"
                onClick={() => {
                  const currentIndex = publications.findIndex(pub => pub.id === selectedPublication.id);
                  const nextIndex = currentIndex === publications.length - 1 ? 0 : currentIndex + 1;
                  setSelectedPublication(publications[nextIndex]);
                }}
                aria-label="Siguiente publicación"
              >
                ›
              </button>
            </>
          )}
        </div>
      </div>
    )}
    <ChatBot />
  </div>
);
};