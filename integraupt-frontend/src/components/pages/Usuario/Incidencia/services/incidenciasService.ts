import { getIncidenciasApiUrl } from '../../../../../utils/apiConfig';
import type {
  DisponibilidadIncidenciaResponse,
  IncidenciaResponse,
  RegistrarIncidenciaPayload,
  ReservaIncidenciaResumen,
} from '../types';

const buildIncidenciasUrl = (path: string): string =>
  getIncidenciasApiUrl(`/api/incidencias${path}`);

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data = await response.json();
    if (typeof data?.message === 'string') {
      return data.message;
    }
    if (typeof data === 'string') {
      return data;
    }
  } catch (error) {
    // Ignored, fallback to text body
  }

  try {
    const text = await response.text();
    if (text) {
      return text;
    }
  } catch (error) {
    // Ignored, fallback to default message
  }

  return 'Ocurrió un error inesperado al comunicarse con el servicio de incidencias.';
};

export const verificarDisponibilidadIncidencia = async (
  reservaId: number,
  signal?: AbortSignal,
): Promise<DisponibilidadIncidenciaResponse> => {
  const response = await fetch(
    buildIncidenciasUrl(`/reserva/${encodeURIComponent(reservaId)}/disponibilidad`),
    { signal },
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json();
};

export const obtenerIncidenciasPorReserva = async (
  reservaId: number,
  signal?: AbortSignal,
): Promise<IncidenciaResponse[]> => {
  const response = await fetch(
    buildIncidenciasUrl(`/reserva/${encodeURIComponent(reservaId)}`),
    { signal },
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json();
};

export const registrarIncidencia = async (
  payload: RegistrarIncidenciaPayload,
): Promise<IncidenciaResponse> => {
  const response = await fetch(buildIncidenciasUrl(''), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
return response.json();
};

export const obtenerReservasIncidenciaPorUsuario = async (
  usuarioId: number,
  signal?: AbortSignal,
): Promise<ReservaIncidenciaResumen[]> => {
  const response = await fetch(
    buildIncidenciasUrl(`/usuario/${encodeURIComponent(usuarioId)}/reservas`),
    { signal },
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }


  return response.json();
};