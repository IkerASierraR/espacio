import { getReservasApiUrl } from '../../../../../utils/apiConfig';
import type { ReservaApi, ReservaCreacionResponse, ReservaEstado, ReservaUpdatePayload } from '../types';

const parseNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
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

const VALID_ESTADOS: ReservaEstado[] = ['Pendiente', 'Aprobada', 'Rechazada', 'Cancelada'];

const normalizeEstado = (estado?: string | null): ReservaEstado | null => {
  if (!estado) {
    return null;
  }
  const trimmed = estado.trim();
  if (!trimmed) {
    return null;
  }
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  return VALID_ESTADOS.find((item) => item === capitalized) ?? null;
};

const parseReserva = (input: unknown): ReservaApi | null => {
  if (!input || typeof input !== 'object') {
    return null;
  }
  const raw = input as Record<string, unknown>;

   const id = parseNumber(raw.id);
    const usuarioId = parseNumber(raw.usuarioId ?? raw.usuario_id ?? raw.usuario);
    const espacioId = parseNumber(raw.espacioId ?? raw.espacio_id ?? raw.espacio);
    const espacioNombre = parseString(raw.espacioNombre ?? raw.espacio_nombre);
    const bloqueId = parseNumber(raw.bloqueId ?? raw.bloque_id ?? raw.bloque);
    const bloqueHoraInicio = parseString(raw.bloqueHoraInicio ?? raw.hora_inicio);
    const bloqueHoraFin = parseString(raw.bloqueHoraFin ?? raw.hora_fin);
    const cursoId = parseNumber(raw.cursoId ?? raw.curso_id ?? raw.curso);
    const cantidadEstudiantes = parseNumber(
      raw.cantidadEstudiantes ?? raw.cantidad_estudiantes ?? raw.estudiantes
  );

  if (
    id == null ||
    usuarioId == null ||
    espacioId == null ||
    bloqueId == null ||
    cursoId == null ||
    cantidadEstudiantes == null
  ) {
    return null;
  }

  return {
    id,
       usuarioId,
       espacioId,
       espacioNombre,
       bloqueId,
       bloqueHoraInicio,
       bloqueHoraFin,
       cursoId,
       cantidadEstudiantes,
    fechaReserva: parseString(raw.fechaReserva ?? raw.fecha_reserva),
    fechaSolicitud: parseString(raw.fechaSolicitud ?? raw.fecha_solicitud),
    descripcionUso: parseString(raw.descripcionUso ?? raw.descripcion_uso),
    estado: normalizeEstado(parseString(raw.estado)),
  };
};

export const fetchReservasPorUsuario = async (
  usuarioId: number,
  estado?: string
): Promise<ReservaApi[]> => {
  const baseUrl = getReservasApiUrl(`/api/reservas/usuario/${usuarioId}`);
  const url = estado ? `${baseUrl}?estado=${encodeURIComponent(estado)}` : baseUrl;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('No se pudieron obtener las reservas registradas.');
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('La respuesta del servicio de reservas no es válida.');
  }

  const reservas = data
    .map((item) => parseReserva(item))
    .filter((item): item is ReservaApi => Boolean(item));

  return reservas;
};

export const fetchReservaQrDetalle = async (
  reservaId: number
): Promise<ReservaCreacionResponse> => {
  const response = await fetch(getReservasApiUrl(`/api/reservas/${reservaId}/qr`));
  if (!response.ok) {
    throw new Error('No se pudo obtener el detalle de la reserva seleccionada.');
  }

  const data = (await response.json()) as ReservaCreacionResponse;
  const reserva = parseReserva(data?.reserva);
  return {
    reserva: reserva ?? data.reserva,
    qr: data.qr,
  };
};

export const updateReserva = async (
  reservaId: number,
  payload: ReservaUpdatePayload
): Promise<ReservaApi> => {
  const response = await fetch(getReservasApiUrl(`/api/reservas/${reservaId}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('No se pudo actualizar la reserva seleccionada.');
  }

  const data: unknown = await response.json();
  const reservaActualizada = parseReserva(data);

  if (!reservaActualizada) {
    throw new Error('La respuesta del servicio de actualización no es válida.');
  }

  return reservaActualizada;
};