import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Clock,
  Inbox,
  Loader2,
  MapPin,
  QrCode,
  Users,
  X,
} from 'lucide-react';
import type { ReservaApi, ReservaEstado } from '../types';
import { fetchReservasPorUsuario } from '../services/reservasService';
import '../../../../../styles/ReservaModal.css';

const TABS: Array<{
  estado: ReservaEstado;
  titulo: string;
  descripcion: string;
}> = [
  {
    estado: 'Pendiente',
    titulo: 'Pendientes',
    descripcion: 'Solicitudes en espera de revisión',
  },
  {
    estado: 'Aprobada',
    titulo: 'Aprobadas',
    descripcion: 'Reservas confirmadas',
  },
  {
    estado: 'Rechazada',
    titulo: 'Rechazadas',
    descripcion: 'Solicitudes denegadas',
  },
  {
    estado: 'Cancelada',
    titulo: 'Canceladas',
    descripcion: 'Reservas anuladas',
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
    return 'Fecha por confirmar';
  }
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'long' }).format(date);
};

const getEstadoLabel = (estado?: ReservaEstado | null): string => estado ?? 'Sin estado';

const getEstadoModifier = (estado?: ReservaEstado | null): string =>
  (estado ?? 'Pendiente').toLowerCase();

const isEstadoPendiente = (estado?: ReservaEstado | null): boolean =>
  (estado ?? '').toLowerCase() === 'pendiente';

const buildReservaResumen = (reserva: ReservaApi): string => {
  const fecha = formatDateValue(reserva.fechaReserva);
  const espacio = reserva.espacioNombre
    ? reserva.espacioNombre
    : reserva.espacioId
      ? `Espacio ${reserva.espacioId}`
      : 'Espacio por asignar';
  return `${fecha} · ${espacio}`;
};

interface MisReservasModalProps {
  open: boolean;
  userId: number | null;
  onClose: () => void;
  onSelectReserva: (reserva: ReservaApi) => void;
  onEditReserva?: (reserva: ReservaApi) => void;
  reloadKey?: number;
}

export const MisReservasModal: React.FC<MisReservasModalProps> = ({
  open,
  userId,
  onClose,
  onSelectReserva,
  onEditReserva,
  reloadKey = 0,
}) => {
  const [estadoActivo, setEstadoActivo] = useState<ReservaEstado>('Pendiente');
  const [reservas, setReservas] = useState<ReservaApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarReservas = useCallback(async () => {
    if (userId == null) {
      setReservas([]);
      setError('No se pudo identificar al usuario actual.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchReservasPorUsuario(userId, estadoActivo);
      setReservas(data);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : 'Ocurrió un error al consultar tus reservas registradas.';
      setError(message);
      setReservas([]);
    } finally {
      setLoading(false);
    }
  }, [estadoActivo, userId]);

  useEffect(() => {
    if (!open) {
      setReservas([]);
      setError(null);
      setLoading(false);
      return;
    }
    void cargarReservas();
  }, [open, cargarReservas, reloadKey]);

  useEffect(() => {
    if (!open) {
      setEstadoActivo('Pendiente');
    }
  }, [open]);

  const handleRetry = useCallback(() => {
    if (!open) {
      return;
    }
    void cargarReservas();
  }, [cargarReservas, open]);

  const handleSelect = useCallback(
    (reserva: ReservaApi) => {
         const isPendiente = isEstadoPendiente(reserva.estado);
             if (isPendiente && onEditReserva) {
               onEditReserva(reserva);
               return;
             }
      onSelectReserva(reserva);
    },
   [onEditReserva, onSelectReserva]
  );

  const estadoDescripcion = useMemo(() => {
    const tab = TABS.find((item) => item.estado === estadoActivo);
    return tab?.descripcion ?? '';
  }, [estadoActivo]);

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const reservasFuturas = useMemo(
    () =>
      reservas.filter((reserva) => {
        const parsedDate = parseIsoDate(reserva.fechaReserva);
        if (!parsedDate) {
          return true;
        }
        const normalizedDate = new Date(parsedDate);
        normalizedDate.setHours(0, 0, 0, 0);
        return normalizedDate >= today;
      }),
    [reservas, today],
  );


  if (!open) {
    return null;
  }

  return (
    <div className="reserva-modal" role="dialog" aria-modal="true" aria-labelledby="mis-reservas-title">
      <div className="reserva-modal__overlay" onClick={onClose} />
      <div className="reserva-modal__content mis-reservas">
        <header className="reserva-modal__header">
          <div>
            <p className="reserva-modal__eyebrow">Mis reservas</p>
            <h2 id="mis-reservas-title" className="reserva-modal__title">
              Historial de solicitudes
            </h2>
            <p className="reserva-modal__subtitle">
              <QrCode size={16} aria-hidden="true" />
              Selecciona una reserva para consultar su código QR.
            </p>
          </div>
          <button type="button" className="reserva-modal__close" onClick={onClose} aria-label="Cerrar mis reservas">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="mis-reservas__tabs" role="tablist">
          {TABS.map(({ estado, titulo }) => {
            const isActive = estado === estadoActivo;
            return (
              <button
                key={estado}
                type="button"
                className={`mis-reservas__tab ${isActive ? 'mis-reservas__tab--active' : ''}`}
                onClick={() => setEstadoActivo(estado)}
                role="tab"
                aria-selected={isActive}
              >
                <span className="mis-reservas__tab-title">{titulo}</span>
                <span className="mis-reservas__tab-description">
                  {estado === estadoActivo ? estadoDescripcion : ''}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="mis-reservas__feedback" role="status">
            <Loader2 className="spinning" size={24} aria-hidden="true" /> Cargando reservas...
          </div>
        ) : error ? (
          <div className="mis-reservas__feedback mis-reservas__feedback--error" role="alert">
            <AlertCircle size={20} aria-hidden="true" />
            <div>
              <p>{error}</p>
              <button type="button" onClick={handleRetry} className="mis-reservas__feedback-action">
                Reintentar
              </button>
            </div>
          </div>
        ) : reservasFuturas.length === 0 ? (
          <div className="mis-reservas__feedback mis-reservas__feedback--empty">
            <Inbox size={24} aria-hidden="true" />
            <div>
              <p>No encontramos reservas {estadoActivo.toLowerCase()}.</p>
              <span>Vuelve más tarde para revisar nuevas actualizaciones.</span>
            </div>
          </div>
        ) : (
          <ul className="mis-reservas__list">
            {reservasFuturas.map((reserva) => {
              const estado = reserva.estado;
              const esEditable = isEstadoPendiente(estado) && Boolean(onEditReserva);
              return (
                <li key={reserva.id}>
                  <button
                    type="button"
                    className="mis-reservas__card"
                    onClick={() => handleSelect(reserva)}
                      aria-label={
                                         esEditable
                                           ? `Editar la reserva ${reserva.id}`
                                           : `Ver detalles de la reserva ${reserva.id}`
                                       }
                  >
                    <div className="mis-reservas__card-header">
                      <div>
                        <span className="mis-reservas__card-title">Reserva #{reserva.id}</span>
                        <p className="mis-reservas__card-summary">{buildReservaResumen(reserva)}</p>
                         {esEditable && (
                                                  <span className="mis-reservas__card-hint">Haz clic para modificar tu solicitud</span>
                                                )}
                      </div>
                      <span
                        className={`mis-reservas__badge mis-reservas__badge--${getEstadoModifier(estado)}`}
                      >
                        {getEstadoLabel(estado)}
                      </span>
                    </div>
                    <div className="mis-reservas__card-details">
                      <span>
                        <CalendarDays size={16} aria-hidden="true" /> {formatDateValue(reserva.fechaReserva)}
                      </span>
                      <span>
                        <MapPin size={16} aria-hidden="true" />
                                               {reserva.espacioNombre
                                                 ? reserva.espacioNombre
                                                 : reserva.espacioId
                                                   ? `Espacio ${reserva.espacioId}`
                                                   : 'Sin espacio asignado'}
                      </span>
                      <span>
                           <Clock size={16} aria-hidden="true" />
                                                {reserva.bloqueHoraInicio && reserva.bloqueHoraFin
                                                  ? `${reserva.bloqueHoraInicio} - ${reserva.bloqueHoraFin}`
                                                  : `Bloque ${reserva.bloqueId}`}
                      </span>
                      <span>
                        <Users size={16} aria-hidden="true" /> {reserva.cantidadEstudiantes} estudiante
                        {reserva.cantidadEstudiantes === 1 ? '' : 's'}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};