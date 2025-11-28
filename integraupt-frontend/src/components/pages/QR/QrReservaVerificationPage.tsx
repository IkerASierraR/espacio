import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  Hash,
  MapPin,
  QrCode,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getQrReservasApiUrl } from '../../../utils/apiConfig';
import '../../../styles/QrReservaVerification.css';

interface ReservaInfoResponse {
  reservaId?: number | null;
  laboratorio?: string | null;
  fecha?: string | null;
  hora?: string | null;
  estado?: string | null;
    solicitanteNombre?: string | null;
    solicitanteCodigo?: string | null;
}

interface ReservaQrVerificationResponse {
  token?: string | null;
  reserva?: ReservaInfoResponse | null;
  generadoEn?: string | null;
  verificadoEn?: string | null;
}

interface FetchState {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: ReservaQrVerificationResponse | null;
  error: string | null;
}

interface QrReservaVerificationPageProps {
  token: string;
}

type StatusVariant = 'success' | 'warning' | 'danger' | 'info';

interface StatusDescriptor {
  variant: StatusVariant;
  label: string;
  description: string;
  icon: LucideIcon;
}

const DEFAULT_DESCRIPTOR: StatusDescriptor = {
  variant: 'info',
  label: 'Verificación en curso',
  description: 'Estamos confirmando la validez de la reserva con el código proporcionado.',
  icon: Clock,
};

const SUCCESS_STATES = new Set([
  'confirmada',
  'validada',
  'aprobada',
  'activa',
  'registrada',
]);

const WARNING_STATES = new Set([
  'pendiente',
  'en revisión',
  'reprogramada',
  'procesando',
]);

const DANGER_STATES = new Set([
  'cancelada',
  'rechazada',
  'expirada',
  'anulada',
]);

const formatInstant = (value?: string | null): string => {
  if (!value) return '—';
  const trimmed = value.trim();
  if (!trimmed) return '—';
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(parsed);
};

const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  const trimmed = value.trim();
  if (!trimmed) return '—';

  const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? `${trimmed}T00:00:00`
    : trimmed;

  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'full' }).format(parsed);
};

const normalizeToken = (token: string): string => token.trim();

const buildStatusDescriptor = (estado?: string | null): StatusDescriptor => {
  const normalized = estado?.trim().toLowerCase();
  if (!normalized) {
    return DEFAULT_DESCRIPTOR;
  }

  if (SUCCESS_STATES.has(normalized)) {
    return {
      variant: 'success',
      label: 'Reserva verificada',
      description: 'El QR pertenece a una reserva activa y válida dentro del sistema IntegraUPT.',
      icon: CheckCircle2,
    };
  }

  if (DANGER_STATES.has(normalized)) {
    return {
      variant: 'danger',
      label: 'Reserva no disponible',
      description: 'El QR corresponde a una reserva anulada, rechazada o expirada. Solicita una nueva autorización.',
      icon: AlertTriangle,
    };
  }

  if (WARNING_STATES.has(normalized)) {
    return {
      variant: 'warning',
      label: 'Reserva en proceso',
      description: 'La reserva aún se encuentra en validación. Confirma el estado con el personal de soporte.',
      icon: Clock,
    };
  }

  return {
    variant: 'info',
    label: `Estado: ${estado}`,
    description: 'Estado informado por el sistema de reservas. Verifica los detalles para continuar.',
    icon: AlertCircle,
  };
};

export const QrReservaVerificationPage: React.FC<QrReservaVerificationPageProps> = ({ token }) => {
  const [tokenInput, setTokenInput] = useState(() => normalizeToken(token));
  const [activeToken, setActiveToken] = useState(() => normalizeToken(token));
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState<'idle' | 'success' | 'error'>('idle');
  const [state, setState] = useState<FetchState>({ status: 'idle', data: null, error: null });

  useEffect(() => {
    const cleaned = normalizeToken(token);
    setTokenInput(cleaned);
    setActiveToken(cleaned);
  }, [token]);

  useEffect(() => {
    if (!activeToken) {
      setState({ status: 'idle', data: null, error: 'Ingresa un token de reserva para continuar.' });
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const fetchData = async () => {
      setState((prev) => ({ status: 'loading', data: prev.data, error: null }));

      try {
        const response = await fetch(
          getQrReservasApiUrl(`/api/v1/qr/reservas/${encodeURIComponent(activeToken)}`),
          { signal: controller.signal }
        );

        if (!response.ok) {
          let message = 'No se pudo verificar la reserva. Inténtalo nuevamente.';
          try {
            const error = await response.json();
            const normalizedMessage = error?.message ?? error?.error ?? error?.detail;
            if (typeof normalizedMessage === 'string' && normalizedMessage.trim().length > 0) {
              message = normalizedMessage.trim();
            }
          } catch {
            // Ignorar errores de parseo del cuerpo
          }
          throw new Error(message);
        }

        const data = (await response.json()) as ReservaQrVerificationResponse;
        if (!isMounted) return;

        setState({ status: 'success', data, error: null });
      } catch (error) {
        if (!isMounted) return;
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        const message = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
        setState({ status: 'error', data: null, error: message });
      }
    };

    void fetchData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [activeToken, refreshCounter]);

  useEffect(() => {
    const previousTitle = document.title;
    const baseTitle = 'Verificación de reserva | IntegraUPT';

    if (state.status === 'success' && state.data?.reserva?.laboratorio) {
      document.title = `${state.data.reserva.laboratorio} | ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }

    return () => {
      document.title = previousTitle;
    };
  }, [state.status, state.data?.reserva?.laboratorio]);

  const descriptor = useMemo(() => {
    if (state.status !== 'success') {
      return DEFAULT_DESCRIPTOR;
    }

    return buildStatusDescriptor(state.data?.reserva?.estado);
  }, [state.status, state.data?.reserva?.estado]);

  const reserva = state.data?.reserva;

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const cleaned = normalizeToken(tokenInput);
      if (!cleaned) {
        setState({ status: 'idle', data: null, error: 'Ingresa un token de reserva para continuar.' });
        return;
      }

      if (cleaned !== activeToken) {
        setActiveToken(cleaned);
      } else {
        setRefreshCounter((value) => value + 1);
      }
    },
    [activeToken, tokenInput]
  );

  const handleRefresh = useCallback(() => {
    if (!activeToken) {
      return;
    }
    setRefreshCounter((value) => value + 1);
  }, [activeToken]);

  const handleCopyToken = useCallback(async () => {
    if (!activeToken) return;

    try {
      await navigator.clipboard.writeText(activeToken);
      setCopyFeedback('success');
      setTimeout(() => setCopyFeedback('idle'), 2000);
    } catch {
      setCopyFeedback('error');
      setTimeout(() => setCopyFeedback('idle'), 2000);
    }
  }, [activeToken]);

  const formattedFecha = useMemo(() => formatDate(reserva?.fecha), [reserva?.fecha]);
  const formattedHora = reserva?.hora?.trim() || '—';
  const formattedGenerado = useMemo(() => formatInstant(state.data?.generadoEn), [state.data?.generadoEn]);
  const formattedVerificado = useMemo(
    () => formatInstant(state.data?.verificadoEn),
    [state.data?.verificadoEn]
  );
  const applicantName = reserva?.solicitanteNombre?.trim() || 'Nombre no disponible';
  const applicantInitial =
    applicantName === 'Nombre no disponible' ? 'U' : applicantName.charAt(0).toUpperCase();
  const applicantCode = reserva?.solicitanteCodigo?.trim()
    ? `Código: ${reserva.solicitanteCodigo.trim()}`
    : 'Código no registrado';

  return (
    <div className="qr-reserva-page">
      <div className="qr-reserva-page__backdrop" aria-hidden="true" />
      <div className="qr-reserva-page__content">
        <header className="qr-reserva-header">
          <div className="qr-reserva-header__brand">
                      <div className="qr-reserva-header__crest" aria-hidden="true" />
                      <div className="qr-reserva-header__identity">
                        <span className="qr-reserva-header__badge">
                          <ShieldCheck size={16} aria-hidden="true" /> IntegraUPT Verificación
                        </span>
                        <h1 className="qr-reserva-header__title">Validación de reservas universitarias</h1>
                      </div>
                    </div>
          <p className="qr-reserva-header__subtitle">
            Comprueba en segundos el estado del código QR asociado a una reserva del sistema IntegraUPT.
          </p>
        </header>

        <section className="qr-reserva-card" aria-live="polite">
          <div className={`qr-reserva-status qr-reserva-status--${descriptor.variant}`}>
            <descriptor.icon size={24} aria-hidden="true" />
            <div className="qr-reserva-status__text">
              <h2>{descriptor.label}</h2>
              <p>{descriptor.description}</p>
            </div>
            <button
              type="button"
              className="qr-reserva-status__refresh"
              onClick={handleRefresh}
              aria-label="Actualizar verificación"
            >
              <RefreshCw size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="qr-reserva-card__body">
            {state.status === 'loading' && (
              <div className="qr-reserva-loader">
                <div className="qr-reserva-loader__spinner" aria-hidden="true" />
                <p>Validando código de reserva…</p>
              </div>
            )}

            {state.status === 'error' && (
              <div className="qr-reserva-error">
                <AlertTriangle size={22} aria-hidden="true" />
                <div>
                  <h3>No fue posible confirmar la reserva</h3>
                  <p>{state.error}</p>
                  <button type="button" onClick={handleRefresh} className="qr-reserva-error__retry">
                    <RefreshCw size={16} aria-hidden="true" /> Intentar nuevamente
                  </button>
                </div>
              </div>
            )}

            {state.status === 'idle' && (
              <div className="qr-reserva-empty">
                <QrCode size={42} aria-hidden="true" />
                <div>
                  <h3>Escanea o ingresa un código QR</h3>
                  <p>Proporciona el token de verificación asociado a la reserva para consultar sus detalles.</p>
                </div>
              </div>
            )}

            {state.status === 'success' && (
              <div className="qr-reserva-details">
                <div className="qr-reserva-applicant" role="presentation">
                                <div className="qr-reserva-applicant__avatar" aria-hidden="true">
                                  <span>{applicantInitial}</span>
                                </div>
                                <div>
                                  <span className="qr-reserva-details__label">Solicitante</span>
                                  <p className="qr-reserva-applicant__name">{applicantName}</p>
                                  <p className="qr-reserva-applicant__code">{applicantCode}</p>
                                </div>
                              </div>
                <div className="qr-reserva-details__grid">
                  <div>
                    <span className="qr-reserva-details__label">
                      <MapPin size={16} aria-hidden="true" /> Laboratorio
                    </span>
                    <p className="qr-reserva-details__value">{reserva?.laboratorio?.trim() || 'No registrado'}</p>
                  </div>
                  <div>
                    <span className="qr-reserva-details__label">
                      <CalendarDays size={16} aria-hidden="true" /> Fecha reservada
                    </span>
                    <p className="qr-reserva-details__value">{formattedFecha}</p>
                  </div>
                  <div>
                    <span className="qr-reserva-details__label">
                      <Clock size={16} aria-hidden="true" /> Horario programado
                    </span>
                    <p className="qr-reserva-details__value">{formattedHora}</p>
                  </div>
                  <div>
                    <span className="qr-reserva-details__label">
                      <Hash size={16} aria-hidden="true" /> ID de reserva
                    </span>
                    <p className="qr-reserva-details__value">
                      {typeof reserva?.reservaId === 'number' ? `#${reserva.reservaId}` : 'No disponible'}
                    </p>
                  </div>
                </div>

                <div className="qr-reserva-timeline" role="list">
                  <div className="qr-reserva-timeline__item" role="listitem">
                    <span className="qr-reserva-details__label">
                      <Clock size={16} aria-hidden="true" /> Generado
                    </span>
                    <p className="qr-reserva-details__value">{formattedGenerado}</p>
                  </div>
                  <div className="qr-reserva-timeline__item" role="listitem">
                    <span className="qr-reserva-details__label">
                      <ShieldCheck size={16} aria-hidden="true" /> Última verificación
                    </span>
                    <p className="qr-reserva-details__value">{formattedVerificado}</p>
                  </div>
                </div>

                <div className="qr-reserva-token">
                  <div>
                    <span className="qr-reserva-details__label">Token de verificación</span>
                    <p className="qr-reserva-token__value" aria-live="polite">{activeToken}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="qr-reserva-token__copy"
                    aria-label="Copiar token de verificación"
                  >
                    <Copy size={16} aria-hidden="true" /> Copiar
                  </button>
                  {copyFeedback === 'success' && (
                    <span className="qr-reserva-token__feedback" role="status">
                      Copiado correctamente
                    </span>
                  )}
                  {copyFeedback === 'error' && (
                    <span className="qr-reserva-token__feedback qr-reserva-token__feedback--error" role="status">
                      No se pudo copiar
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <form className="qr-reserva-form" onSubmit={handleSubmit} noValidate>
            <label className="qr-reserva-form__label" htmlFor="qr-token-input">
              Verificar otro token
            </label>
            <div className="qr-reserva-form__controls">
              <input
                id="qr-token-input"
                name="qr-token"
                type="text"
                value={tokenInput}
                onChange={(event) => setTokenInput(event.target.value)}
                placeholder="Ej. 9f2a-4c1b-82d0"
                autoComplete="off"
                spellCheck={false}
              />
              <button type="submit" className="qr-reserva-form__submit">
                <ShieldCheck size={18} aria-hidden="true" /> Verificar
              </button>
            </div>
          </form>
        </section>

        <section className="qr-reserva-guidelines" aria-label="Recomendaciones para el control de reservas">
          <h2>¿Cómo validar el acceso con éxito?</h2>
          <ul>
            <li>
              <CheckCircle2 size={18} aria-hidden="true" />
              <span>Confirma que el código coincida con el documento de identidad del usuario.</span>
            </li>
            <li>
              <AlertCircle size={18} aria-hidden="true" />
              <span>Si el estado es observado o inválido, dirige al usuario a mesa de ayuda antes de permitir el ingreso.</span>
            </li>
            <li>
              <QrCode size={18} aria-hidden="true" />
              <span>Mantén el QR visible y sin daños para acelerar el proceso de control en laboratorio.</span>
            </li>
          </ul>
        </section>

        <footer className="qr-reserva-footer">
          <p>
            ¿Necesitas asistencia? Comunícate con soporte académico a través de{' '}
            <a href="mailto:soporte@integraupt.edu.pe">soporte@integraupt.edu.pe</a> o el canal interno de IntegraUPT.
          </p>
          <button
            type="button"
            onClick={() => (window.location.href = '/')}
            className="qr-reserva-footer__home"
          >
            Volver al inicio de IntegraUPT
          </button>
        </footer>
      </div>
    </div>
  );
};

export default QrReservaVerificationPage;