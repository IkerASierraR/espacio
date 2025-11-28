import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Home,
  LayoutGrid,
  LibraryBig,
  Loader2,
  LogOut,
  MessageCircleWarning,
  NotebookPen,
  UserRound,
} from 'lucide-react';
import '../../../../styles/IncidenciasScreen.css';
import {
  obtenerIncidenciasPorReserva,
  obtenerReservasIncidenciaPorUsuario,
  registrarIncidencia,
  verificarDisponibilidadIncidencia,
} from './services/incidenciasService';
import type {
  DisponibilidadIncidenciaResponse,
  IncidenciaResponse,
  ReservaIncidenciaResumen,
} from './types';
import { Navbar } from '../Navbar';

interface IncidenciasPageProps {
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
  // onNavigateToReservas: () => void;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

type Feedback = {
  type: 'success' | 'error' | 'info';
  message: string;
};

const FeedbackIcon = ({ type }: { type: Feedback['type'] }) => {
  if (type === 'success') {
    return <CheckCircle2 className="incidencias-feedback-icon" aria-hidden="true" />;
  }

  if (type === 'error') {
    return <AlertTriangle className="incidencias-feedback-icon" aria-hidden="true" />;
  }

  return <Clock className="incidencias-feedback-icon" aria-hidden="true" />;
};

const getUserDisplayName = (name?: string, codigo?: string): string => {
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

const formatDateTime = (value?: string | null): string => {
  if (!value) {
    return 'No disponible';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};
const formatDateValue = (value?: string | null): string => {
  if (!value) {
    return 'Fecha no disponible';
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
  }).format(date);
};

const formatTimeValue = (value?: string | null): string => {
  if (!value) {
    return '—';
  }

  const date = new Date(`1970-01-01T${value}`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getReservaDisplayName = (
  reserva?: ReservaIncidenciaResumen | null,
): string => {
  if (!reserva) {
    return 'reserva seleccionada';
  }

  const nombre = reserva.espacioNombre?.trim();
  const codigo = reserva.espacioCodigo?.trim();

  if (nombre && codigo) {
    return `${nombre} (${codigo})`;
  }

  if (nombre) {
    return nombre;
  }

  if (codigo) {
    return codigo;
  }

  return `Reserva #${reserva.reservaId}`;
};
export const IncidenciasPage: React.FC<IncidenciasPageProps> = ({ 
  user, 
  onNavigateToInicio,
  onNavigateToServicios,
  // onNavigateToReservas,
  onNavigateToPerfil,
  onLogout,
  isLoggingOut = false
 }) => {
 const [reservas, setReservas] = useState<ReservaIncidenciaResumen[]>([]);
  const [reservasLoading, setReservasLoading] = useState(false);
  const [reservasError, setReservasError] = useState<string | null>(null);
  const [selectedReservaId, setSelectedReservaId] = useState<number | null>(null);
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadIncidenciaResponse | null>(null);
  const [incidencias, setIncidencias] = useState<IncidenciaResponse[]>([]);
  const [descripcion, setDescripcion] = useState('');
  const [consultaFeedback, setConsultaFeedback] = useState<Feedback | null>(null);
  const [registroFeedback, setRegistroFeedback] = useState<Feedback | null>(null);
  const [consultaError, setConsultaError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isLoadingIncidencias, setIsLoadingIncidencias] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userId = useMemo(() => {
      const parsed = Number.parseInt(user.id, 10);
      return Number.isNaN(parsed) ? null : parsed;
    }, [user.id]);

  const displayName = useMemo(
    () => getUserDisplayName(user.user_metadata.name, user.user_metadata.codigo),
    [user.user_metadata.codigo, user.user_metadata.name],
  );
useEffect(() => {
    if (userId == null) {
      setReservas([]);
      setReservasError('No fue posible identificar al usuario actual.');
      setSelectedReservaId(null);
      setDisponibilidad(null);
      setIncidencias([]);
      setConsultaFeedback(null);
      setConsultaError(null);
      setRegistroFeedback(null);
      return;
    }

    const abortController = new AbortController();
    setReservasLoading(true);
    setReservasError(null);

    obtenerReservasIncidenciaPorUsuario(userId, abortController.signal)
      .then((data) => {
        if (Array.isArray(data)) {
          setReservas(data);
        } else {
          setReservas([]);
        }
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'No fue posible cargar tus reservas recientes.';
        setReservasError(message);
        setReservas([]);
        setSelectedReservaId(null);
        setDisponibilidad(null);
        setIncidencias([]);
        setConsultaFeedback(null);
        setConsultaError(null);
        setRegistroFeedback(null);
      })
      .finally(() => {
        setReservasLoading(false);
      });

    return () => {
      abortController.abort();
    };
  }, [userId]);

  const reservasOrdenadas = useMemo(() => {
    if (reservas.length === 0) {
      return [] as ReservaIncidenciaResumen[];
    }

    const sorted = [...reservas];
    sorted.sort((a, b) => {
      if (a.habilitado !== b.habilitado) {
        return a.habilitado ? -1 : 1;
      }

      const inicioA = new Date(a.habilitadoDesde).getTime();
      const inicioB = new Date(b.habilitadoDesde).getTime();

      if (Number.isNaN(inicioA) && Number.isNaN(inicioB)) {
        return 0;
      }

      if (Number.isNaN(inicioA)) {
        return 1;
      }

      if (Number.isNaN(inicioB)) {
        return -1;
      }

      return inicioB - inicioA;
    });

    return sorted;
  }, [reservas]);

  const selectedReserva = useMemo(
    () => reservas.find((reserva) => reserva.reservaId === selectedReservaId) ?? null,
    [reservas, selectedReservaId],
  );


  const disponibilidadMensaje = useMemo(() => {
    if (!disponibilidad) {
      return null;
    }

    const rango = `${formatDateTime(disponibilidad.habilitadoDesde)} — ${formatDateTime(
      disponibilidad.habilitadoHasta,
    )}`;

 const reservaLabel = getReservaDisplayName(selectedReserva);
    const horarioReserva = selectedReserva
      ? `${formatDateValue(selectedReserva.fechaReserva)} · ${formatTimeValue(
          selectedReserva.horaInicio,
        )} — ${formatTimeValue(selectedReserva.horaFin)}`
      : 'No disponible';

    if (disponibilidad.habilitado) {
      return {
        titulo: 'Formulario habilitado',
          descripcion: `Puedes registrar incidencias para ${reservaLabel} hasta ${formatDateTime(
          disponibilidad.habilitadoHasta,
        )}.`,
        detalle: `Ventana de registro: ${rango}.`,
        tipo: 'success' as const,
      };
    }

    return {
      titulo: 'Formulario fuera de la ventana permitida',
      descripcion:
        'La reserva seleccionada ya no admite el registro de nuevas incidencias.',
    detalle: `Horario reservado: ${horarioReserva}. Ventana de registro: ${rango}.`,
      tipo: 'warning' as const,
    };
  }, [disponibilidad, selectedReserva]);

   const consultarReserva = useCallback(async (reserva: ReservaIncidenciaResumen) => {
      setSelectedReservaId(reserva.reservaId);
    setDisponibilidad(null);
    setIncidencias([]);
   setConsultaError(null);
      setConsultaFeedback(null);
      setRegistroFeedback(null);
      setIsChecking(true);

      try {
        const disponibilidadResponse = await verificarDisponibilidadIncidencia(reserva.reservaId);
        setDisponibilidad(disponibilidadResponse);

        setConsultaFeedback({
          type: disponibilidadResponse.habilitado ? 'success' : 'info',
          message: disponibilidadResponse.habilitado
            ? `La reserva ${getReservaDisplayName(reserva)} permite registrar incidencias durante la ventana indicada.`
            : `La reserva ${getReservaDisplayName(reserva)} ya no admite incidencias nuevas, pero puedes revisar el historial registrado.`,
        });

        setIsLoadingIncidencias(true);
      try {
          const historial = await obtenerIncidenciasPorReserva(reserva.reservaId);
                setIncidencias(historial);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
             : 'No fue posible cargar el historial de incidencias.';
        setConsultaError(message);
      } finally {
       setIsLoadingIncidencias(false);
      }
   } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'No fue posible verificar la disponibilidad de la reserva seleccionada.';
        setConsultaError(message);
      } finally {
        setIsChecking(false);
      }
    }, []);

    const handleSeleccionarReserva = useCallback(
      (reserva: ReservaIncidenciaResumen) => {
        if (isChecking && reserva.reservaId === selectedReservaId) {
          return;
        }

        consultarReserva(reserva);
    },
   [consultarReserva, isChecking, selectedReservaId],
  );

  const handleRegistrarIncidencia = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!selectedReservaId || !disponibilidad) {
        setRegistroFeedback({
          type: 'error',
          message: 'Verifica primero la reserva para registrar una incidencia.',
        });
        return;
      }

      if (!disponibilidad.habilitado) {
        setRegistroFeedback({
          type: 'error',
          message:
            'La ventana de registro de incidencias está cerrada para la reserva seleccionada.',
        });
        return;
      }

      const descripcionNormalizada = descripcion.trim();
      if (descripcionNormalizada.length < 10) {
        setRegistroFeedback({
          type: 'error',
          message: 'Describe la incidencia con al menos 10 caracteres para continuar.',
        });
        return;
      }

      setIsSubmitting(true);
      setRegistroFeedback(null);

      try {
        const nuevaIncidencia = await registrarIncidencia({
          reservaId: selectedReservaId,
          descripcion: descripcionNormalizada,
        });

        setIncidencias((prev) => [nuevaIncidencia, ...prev]);
        setDescripcion('');
        setRegistroFeedback({
          type: 'success',
           message: `Incidencia registrada correctamente para ${getReservaDisplayName(
                      selectedReserva,
                    )}.`,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'No fue posible registrar la incidencia en este momento.';
        setRegistroFeedback({ type: 'error', message });
      } finally {
        setIsSubmitting(false);
      }
    },
    [descripcion, disponibilidad, selectedReserva, selectedReservaId],
  );

  return (
    <div className="incidencias-container">
      <Navbar
        displayName={displayName}
        userCode={user.user_metadata.codigo}
        currentPage="incidencias"
        onNavigateToInicio={onNavigateToInicio}
        onNavigateToServicios={onNavigateToServicios}
        onNavigateToPerfil={onNavigateToPerfil}
        onLogout={onLogout}
        isLoggingOut={isLoggingOut}
      />
      <main className="incidencias-main">        
        <section className="home-welcome-card">
          <div>
            <p className="home-welcome-date">Gestión de Incidencias</p>
            <h1 className="home-title">Reporte de Incidencias</h1>
            <p className="home-subtitle">
              {displayName}, consulta la disponibilidad de tus reservas e informa incidencias dentro
              del periodo habilitado.
            </p>
          </div>
          <div className="home-welcome-avatar" aria-hidden="true">
            <AlertTriangle size={44} />
          </div>
        </section>
        
        <section className="incidencias-card" aria-labelledby="consulta-reserva-title">
          <div className="incidencias-card-header">
            <MessageCircleWarning className="incidencias-card-icon" aria-hidden="true" />
            <div>
              <h2 id="consulta-reserva-title">Selecciona una reserva</h2>
              <p>
                Elige el espacio reservado para revisar la ventana de incidencias y registrar un
                reporte durante el horario habilitado.
              </p>
            </div>
          </div>

         {reservasLoading ? (
                     <div className="incidencias-empty" role="status">
                       <Loader2 className="incidencias-loading-icon" aria-hidden="true" />
                       <p>Cargando tus reservas recientes…</p>
                     </div>
                   ) : reservasError ? (
                     <div className="incidencias-feedback incidencias-feedback-error" role="alert">
                       <AlertTriangle className="incidencias-feedback-icon" aria-hidden="true" />
                       <p>{reservasError}</p>
            </div>
            ) : reservasOrdenadas.length === 0 ? (
                        <div className="incidencias-empty" role="status">
                          <p>
                            No encontramos reservas recientes habilitadas para el registro de incidencias.
                          </p>
                        </div>
                      ) : (
                        <ul className="incidencias-reservas-list" role="list">
                          {reservasOrdenadas.map((reserva) => {
                            const isSelected = reserva.reservaId === selectedReservaId;
                            const estadoTexto = reserva.estado?.trim();
                            const estadoSlug = estadoTexto
                              ? estadoTexto
                                  .normalize('NFD')
                                  .replace(/[\u0300-\u036f]/g, '')
                                  .replace(/[^a-zA-Z0-9]+/g, '-')
                                  .replace(/-+/g, '-')
                                  .replace(/^-|-$/g, '')
                                  .toLowerCase()
                              : '';
                            const estadoClase = estadoSlug.length > 0
                              ? `incidencias-reserva-status incidencias-reserva-status-${estadoSlug}`
                              : 'incidencias-reserva-status';

                            return (
                              <li key={reserva.reservaId} className="incidencias-reserva-item">
                                <button
                                  type="button"
                                  className={`incidencias-reserva-button${
                                    isSelected ? ' incidencias-reserva-button-selected' : ''
                                  }`}
                                  onClick={() => handleSeleccionarReserva(reserva)}
                                  disabled={isChecking && isSelected}
                                  aria-pressed={isSelected}
                                >
                                  <div className="incidencias-reserva-header">
                                    <div className="incidencias-reserva-info">
                                      <span className="incidencias-reserva-name">
                                        {getReservaDisplayName(reserva)}
                                      </span>
                                      <span className="incidencias-reserva-meta">
                                        Reserva #{reserva.reservaId}
                                      </span>
                                    </div>
                                    {estadoTexto && (
                                      <span className={estadoClase}>{estadoTexto}</span>
                                    )}
                                  </div>
                                  <div className="incidencias-reserva-body">
                                    <span>{formatDateValue(reserva.fechaReserva)}</span>
                                    <span>
                                      {formatTimeValue(reserva.horaInicio)} — {formatTimeValue(reserva.horaFin)}
                                    </span>
                                  </div>
                                  <div className="incidencias-reserva-footer">
                                    <span
                                      className={`incidencias-reserva-chip incidencias-reserva-chip-${
                                        reserva.habilitado ? 'active' : 'inactive'
                                      }`}
                                    >
                                      {reserva.habilitado
                                        ? 'Formulario disponible'
                                        : 'Fuera de ventana'}
                                    </span>
                                    {isSelected && isChecking && (
                                      <span className="incidencias-reserva-loading">
                                        <Loader2
                                          className="incidencias-reserva-loading-icon"
                                          aria-hidden="true"
                                        />
                                        Consultando…
                                      </span>
                                    )}
                                  </div>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
          {consultaError && (
            <div className="incidencias-feedback incidencias-feedback-error" role="alert">
              <AlertTriangle className="incidencias-feedback-icon" aria-hidden="true" />
              <p>{consultaError}</p>
            </div>
          )}

          {consultaFeedback && !consultaError && (
            <div
              className={`incidencias-feedback incidencias-feedback-${consultaFeedback.type}`}
              role="status"
            >
              <FeedbackIcon type={consultaFeedback.type} />
              <p>{consultaFeedback.message}</p>
            </div>
          )}

          {disponibilidadMensaje && (
            <div
              className={`incidencias-availability incidencias-availability-${disponibilidadMensaje.tipo}`}
            >
              <Clock className="incidencias-availability-icon" aria-hidden="true" />
              <div>
                <h3>{disponibilidadMensaje.titulo}</h3>
                <p>{disponibilidadMensaje.descripcion}</p>
                <span>{disponibilidadMensaje.detalle}</span>
              </div>
            </div>
          )}
        </section>

        <div className="incidencias-grid">
          <section className="incidencias-card" aria-labelledby="registro-incidencia-title">
            <div className="incidencias-card-header">
              <AlertTriangle className="incidencias-card-icon" aria-hidden="true" />
              <div>
                <h2 id="registro-incidencia-title">Registrar nueva incidencia</h2>
                <p>
                  Describe el inconveniente detectado durante el uso del laboratorio o espacio
                  reservado.
                </p>
              </div>
            </div>

            <div className="incidencias-selected-reserva">
              {selectedReserva ? (
                <>
                  <h3>{getReservaDisplayName(selectedReserva)}</h3>
                  <p>
                    {formatDateValue(selectedReserva.fechaReserva)} ·{' '}
                    {formatTimeValue(selectedReserva.horaInicio)} —{' '}
                    {formatTimeValue(selectedReserva.horaFin)}
                  </p>
                </>
              ) : (
                <p className="incidencias-selected-reserva-placeholder">
                  Selecciona una reserva para habilitar el formulario de incidencias.
                </p>
              )}
            </div>

            <form className="incidencias-form" onSubmit={handleRegistrarIncidencia}>
              <label className="incidencias-label" htmlFor="descripcion-incidencia">
                Detalle de la incidencia
              </label>
              <textarea
                id="descripcion-incidencia"
                className="incidencias-textarea"
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                placeholder="Describe el problema encontrado durante tu reserva."
                minLength={10}
                rows={5}
                disabled={!disponibilidad?.habilitado}
                required
              />
              <button
                type="submit"
                className="incidencias-primary-button"
                disabled={isSubmitting || !disponibilidad?.habilitado}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="incidencias-button-icon incidencias-button-spinner" />
                    Enviando incidencia
                  </>
                ) : (
                  'Registrar incidencia'
                )}
              </button>
            </form>

            {registroFeedback && (
              <div
                className={`incidencias-feedback incidencias-feedback-${registroFeedback.type}`}
                role={registroFeedback.type === 'error' ? 'alert' : 'status'}
              >
                <FeedbackIcon type={registroFeedback.type} />
                <p>{registroFeedback.message}</p>
              </div>
            )}
          </section>

          <section className="incidencias-card" aria-labelledby="historial-incidencias-title">
            <div className="incidencias-card-header">
              <FileText className="incidencias-card-icon" aria-hidden="true" />
              <div>
                <h2 id="historial-incidencias-title">Historial de incidencias</h2>
                <p>Revisa los reportes registrados para la reserva seleccionada.</p>
              </div>
            </div>

            {isLoadingIncidencias ? (
              <div className="incidencias-empty" role="status">
                <Loader2 className="incidencias-loading-icon" aria-hidden="true" />
                <p>Cargando incidencias registradas…</p>
              </div>
            ) : incidencias.length === 0 ? (
              <div className="incidencias-empty" role="status">
                <p>
                  {selectedReservaId
                    ? 'No se han registrado incidencias para esta reserva.'
                    : 'Selecciona una reserva para visualizar el historial de incidencias.'}
                </p>
              </div>
            ) : (
              <ul className="incidencias-list">
                {incidencias.map((incidencia) => (
                  <li key={incidencia.id} className="incidencias-list-item">
                    <div className="incidencias-list-header">
                      <span className="incidencias-list-title">Incidencia #{incidencia.id}</span>
                      <span className="incidencias-list-date">
                        {formatDateTime(incidencia.fechaReporte)}
                      </span>
                    </div>
                    <p className="incidencias-list-description">{incidencia.descripcion}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};