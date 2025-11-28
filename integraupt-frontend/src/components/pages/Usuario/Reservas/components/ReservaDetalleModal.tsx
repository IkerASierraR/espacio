import { useCallback, useEffect, useMemo, useState } from 'react';
import {
     AlertCircle,
  CalendarDays,
  Download,
  Loader2,
  MapPin,
  QrCode,
  Users,
  X,
} from 'lucide-react';
import type { ReservaApi, ReservaCreacionResponse, ReservaEstado, ReservaQrResponse } from '../types';
import { fetchReservaQrDetalle, updateReserva } from '../services/reservasService';
import '../../../../../styles/ReservaModal.css';

interface ReservaDetalleModalProps {
  reserva: ReservaApi | null;
  open: boolean;
  onClose: () => void;
  onEditReserva?: (reserva: ReservaApi) => void;
  onReservaCancelada?: (reserva: ReservaApi) => void;
}

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

const buildQrDataUrl = (qr?: ReservaQrResponse | null): string | null => {
  const base64 = qr?.qrBase64?.trim();
  if (!base64) {
    return null;
  }
  return base64.startsWith('data:image') ? base64 : `data:image/png;base64,${base64}`;
};

export const ReservaDetalleModal: React.FC<ReservaDetalleModalProps> = ({
  reserva,
  open,
  onClose,
  onEditReserva,
  onReservaCancelada,
}) => {
  const [detalle, setDetalle] = useState<ReservaCreacionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
   const [showCancelPrompt, setShowCancelPrompt] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelError, setCancelError] = useState<string | null>(null);
    const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

  const cargarDetalle = useCallback(async () => {
    if (!reserva) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReservaQrDetalle(reserva.id);
      setDetalle(data);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : 'No se pudo obtener el detalle de la reserva seleccionada.';
      setError(message);
      setDetalle(null);
    } finally {
      setLoading(false);
    }
  }, [reserva]);

  useEffect(() => {
    if (open && reserva) {
      void cargarDetalle();
    } else {
      setDetalle(null);
      setError(null);
      setLoading(false);
    }

    setShowCancelPrompt(false);
    setIsCancelling(false);
    setCancelError(null);
    setCancelSuccess(null);

  }, [open, reserva?.id, cargarDetalle]);

  const qrDataUrl = useMemo(() => buildQrDataUrl(detalle?.qr), [detalle?.qr]);
  const verificationUrl = useMemo(() => detalle?.qr?.verificationUrl?.trim() ?? '', [detalle?.qr?.verificationUrl]);

  const reservaData = useMemo(() => detalle?.reserva ?? reserva, [detalle?.reserva, reserva]);
  const canEditReserva = useMemo(() => {
    if (!reservaData || !onEditReserva) {
      return false;
    }
    const estadoNormalizado = reservaData.estado?.toLowerCase() ?? '';
    return estadoNormalizado === 'pendiente';
  }, [onEditReserva, reservaData]);

  const canCancelReserva = useMemo(() => {
    if (!reservaData) {
      return false;
    }
    const estadoNormalizado = reservaData.estado?.toLowerCase() ?? '';
    return estadoNormalizado === 'aprobada';
  }, [reservaData]);

  const estadoReserva = getEstadoLabel(reservaData?.estado);
  const fechaReserva = formatDateValue(reservaData?.fechaReserva);
  const espacioNombre = reservaData?.espacioNombre?.trim();
   const espacioReserva =
     espacioNombre && espacioNombre.length > 0
       ? espacioNombre
       : reservaData?.espacioId
         ? `Espacio ${reservaData.espacioId}`
         : 'Espacio por asignar';
  const cantidadReserva = reservaData?.cantidadEstudiantes ?? 0;
  const descripcionUso = reservaData?.descripcionUso ?? '';

  const handleRetry = useCallback(() => {
    if (!open || !reserva) {
      return;
    }
    void cargarDetalle();
  }, [cargarDetalle, open, reserva]);

  const handleEditReserva = useCallback(() => {
    if (!canEditReserva || !reservaData || !onEditReserva) {
      return;
    }
    onEditReserva(reservaData);
  }, [canEditReserva, onEditReserva, reservaData]);

const handleRequestCancelReserva = useCallback(() => {
    if (!canCancelReserva) {
      return;
    }
    setCancelError(null);
    setCancelSuccess(null);
    setShowCancelPrompt(true);
  }, [canCancelReserva]);

  const handleDismissCancelPrompt = useCallback(() => {
    if (isCancelling) {
      return;
    }
    setShowCancelPrompt(false);
  }, [isCancelling]);

  const handleConfirmCancelReserva = useCallback(async () => {
    if (!reservaData) {
      return;
    }

    if (!reservaData.fechaReserva) {
      setCancelError('No se puede cancelar una reserva sin fecha confirmada.');
      return;
    }

    setIsCancelling(true);
    setCancelError(null);

    try {
      const payload = {
        usuarioId: reservaData.usuarioId,
        espacioId: reservaData.espacioId,
        bloqueId: reservaData.bloqueId,
        cursoId: reservaData.cursoId,
        fechaReserva: reservaData.fechaReserva,
        descripcionUso: reservaData.descripcionUso ?? null,
        cantidadEstudiantes: reservaData.cantidadEstudiantes,
        estado: 'Cancelada' as ReservaEstado,
      };

      const cancelada = await updateReserva(reservaData.id, payload);
      setCancelSuccess('La reserva fue cancelada correctamente.');
      setShowCancelPrompt(false);
      if (onReservaCancelada) {
        onReservaCancelada(cancelada);
      }
    } catch (cancelErrorResponse) {
      setCancelError(
        cancelErrorResponse instanceof Error
          ? cancelErrorResponse.message
          : 'No se pudo cancelar la reserva seleccionada.'
      );
    } finally {
      setIsCancelling(false);
    }
  }, [onReservaCancelada, reservaData]);


  if (!open || !reserva) {
    return null;
  }

  return (
    <div
      className="reserva-modal reserva-modal--stacked"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reserva-detalle-title"
    >
      <div className="reserva-modal__overlay" onClick={onClose} />
      <div className="reserva-modal__content reserva-detalle">
        <header className="reserva-modal__header">
          <div>
            <p className="reserva-modal__eyebrow">Detalle de la reserva</p>
            <h2 id="reserva-detalle-title" className="reserva-modal__title">
              Reserva #{reserva.id}
            </h2>
            <p className="reserva-modal__subtitle">
              <QrCode size={16} aria-hidden="true" />
              Presenta este código QR el día de tu reserva.
            </p>
          </div>
          <button type="button" className="reserva-modal__close" onClick={onClose} aria-label="Cerrar detalle">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        {loading ? (
          <div className="reserva-detalle__feedback" role="status">
            <Loader2 className="spinning" size={24} aria-hidden="true" /> Consultando información...
          </div>
        ) : error ? (
          <div className="reserva-detalle__feedback reserva-detalle__feedback--error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={handleRetry} className="reserva-form__button reserva-form__button--primary">
              Reintentar
            </button>
          </div>
        ) : (
          <div className="reserva-detalle__content">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Código QR de la reserva" className="reserva-detalle__qr" />
            ) : (
              <div className="reserva-detalle__feedback reserva-detalle__feedback--warning" role="status">
                No se pudo generar el código QR automáticamente. Utiliza el enlace de verificación para validar tu reserva.
              </div>
            )}

            <dl className="reserva-detalle__details">
              <div className="reserva-detalle__detail-item">
                <dt>
                  <CalendarDays size={16} aria-hidden="true" /> Fecha reservada
                </dt>
                <dd>{fechaReserva}</dd>
              </div>
              <div className="reserva-detalle__detail-item">
                <dt>
                  <MapPin size={16} aria-hidden="true" /> Espacio asignado
                </dt>
                <dd>{espacioReserva}</dd>
              </div>
              <div className="reserva-detalle__detail-item">
                <dt>
                  <Users size={16} aria-hidden="true" /> Estudiantes estimados
                </dt>
                <dd>{cantidadReserva}</dd>
              </div>
              <div className="reserva-detalle__detail-item">
                <dt>Estado</dt>
                <dd>{estadoReserva}</dd>
              </div>
              {descripcionUso && (
                <div className="reserva-detalle__detail-item reserva-detalle__detail-item--wide">
                  <dt>Descripción del uso</dt>
                  <dd>{descripcionUso}</dd>
                </div>
              )}
            </dl>

            {verificationUrl && (
              <div className="reserva-detalle__verification">
                <span>Enlace de verificación:</span>
                <a href={verificationUrl} target="_blank" rel="noopener noreferrer">
                  {verificationUrl}
                </a>
              </div>
            )}

            <div className="reserva-detalle__actions">
               {canCancelReserva && (
                           <button
                             type="button"
                             className="reserva-form__button reserva-form__button--danger"
                             onClick={handleRequestCancelReserva}
                           >
                             Cancelar reserva
                           </button>
                         )}
                         {canEditReserva && (
                           <button
                             type="button"
                              className="reserva-form__button reserva-form__button--secondary"
                              onClick={handleEditReserva}
                            >
                              Modificar reserva
                            </button>
                          )}
              {qrDataUrl && (
                <a
                  className="reserva-form__button reserva-form__button--primary"
                  href={qrDataUrl}
                  download={`reserva-${reserva.id}-qr.png`}
                >
                  <Download size={16} aria-hidden="true" /> Descargar QR
                </a>
              )}
              <button type="button" className="reserva-form__button" onClick={onClose}>
                Cerrar
              </button>
            </div>
            {showCancelPrompt && (
                          <div className="reserva-detalle__feedback reserva-detalle__feedback--warning reserva-detalle__cancel-confirm" role="alert">
                            <div className="reserva-detalle__cancel-confirm-message">
                              <AlertCircle size={18} aria-hidden="true" /> Seguro deseas Cancelar la Reserva?
                            </div>
                            <div className="reserva-detalle__cancel-confirm-actions">
                              <button
                                type="button"
                                className="reserva-form__button reserva-form__button--danger"
                                onClick={handleConfirmCancelReserva}
                                disabled={isCancelling}
                              >
                                {isCancelling && <Loader2 className="spinning" size={16} aria-hidden="true" />} Sí, cancelar
                              </button>
                              <button
                                type="button"
                                className="reserva-form__button reserva-form__button--secondary"
                                onClick={handleDismissCancelPrompt}
                                disabled={isCancelling}
                              >
                                No, mantener
                              </button>
                            </div>
                          </div>
                        )}

                        {cancelError && (
                          <div className="reserva-detalle__feedback reserva-detalle__feedback--error" role="alert">
                            {cancelError}
                          </div>
                        )}

                        {cancelSuccess && !showCancelPrompt && (
                          <div className="reserva-detalle__feedback" role="status">
                            {cancelSuccess}
                          </div>
                        )}
          </div>
        )}
      </div>
    </div>
  );
};