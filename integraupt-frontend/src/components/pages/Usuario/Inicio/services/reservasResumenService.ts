import { getReservasApiUrl } from '../../../../../utils/apiConfig';

export interface ReservaInicioResumen {
  reservaId: number;
  espacioId: number | null;
  espacioNombre: string | null;
  espacioCodigo: string | null;
  fechaReserva: string | null;
  horaInicio: string | null;
  horaFin: string | null;
  estado: string | null;
}

const parseNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const parseString = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
};

const parseReservaInicioResumen = (input: unknown): ReservaInicioResumen | null => {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const raw = input as Record<string, unknown>;

  const reservaId = parseNumber(raw.reservaId ?? raw.id);
  if (reservaId == null) {
    return null;
  }

  return {
    reservaId,
    espacioId: parseNumber(raw.espacioId),
    espacioNombre: parseString(raw.espacioNombre),
    espacioCodigo: parseString(raw.espacioCodigo),
    fechaReserva: parseString(raw.fechaReserva),
    horaInicio: parseString(raw.horaInicio),
    horaFin: parseString(raw.horaFin),
    estado: parseString(raw.estado),
  };
};

export const fetchReservasInicioResumen = async (
  usuarioId: number,
  signal?: AbortSignal,
): Promise<ReservaInicioResumen[]> => {
  const response = await fetch(
    getReservasApiUrl(`/api/reservas/usuario/${encodeURIComponent(usuarioId)}/resumen`),
    { signal },
  );

  if (!response.ok) {
    throw new Error('No se pudieron sincronizar las reservas recientes.');
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('La respuesta del servicio de reservas no es válida.');
  }

  return data
    .map((item) => parseReservaInicioResumen(item))
    .filter((item): item is ReservaInicioResumen => Boolean(item));
};