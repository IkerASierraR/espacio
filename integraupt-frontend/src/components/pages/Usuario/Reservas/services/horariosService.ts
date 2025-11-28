import { getHorariosApiUrl } from '../../../../../utils/apiConfig';
import type { HorarioDia, HorarioSemanal } from '../types';

const parseDia = (value: unknown): HorarioDia | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const diaSemana = 'diaSemana' in value && typeof (value as { diaSemana?: unknown }).diaSemana === 'string'
    ? (value as { diaSemana: string }).diaSemana.trim()
    : null;

  const ocupado = 'ocupado' in value && typeof (value as { ocupado?: unknown }).ocupado === 'boolean'
    ? (value as { ocupado: boolean }).ocupado
    : null;

  if (!diaSemana || ocupado === null) {
    return null;
  }

  return { diaSemana, ocupado };
};

const parseHorario = (value: unknown): HorarioSemanal | null => {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const raw = value as Record<string, unknown>;

  const bloqueId = typeof raw.bloqueId === 'number'
    ? raw.bloqueId
    : Number.isFinite(Number(raw.bloqueId))
      ? Number(raw.bloqueId)
      : null;

  const bloqueNombre = typeof raw.bloqueNombre === 'string' ? raw.bloqueNombre.trim() : null;
  const horaInicio = typeof raw.horaInicio === 'string' ? raw.horaInicio.trim() : null;
  const horaFin = typeof raw.horaFin === 'string' ? raw.horaFin.trim() : null;
  const dias = Array.isArray(raw.dias) ? raw.dias.map(parseDia).filter(Boolean) as HorarioDia[] : [];

  if (bloqueId === null || !bloqueNombre || !horaInicio || !horaFin) {
    return null;
  }

  return {
    bloqueId,
    bloqueNombre,
    horaInicio,
    horaFin,
    dias,
  };
};

export const fetchHorarioSemanalPorEspacio = async (
  espacioId: number,
  signal?: AbortSignal
): Promise<HorarioSemanal[]> => {
  const url = getHorariosApiUrl(`/api/horarios/espacio/${espacioId}/semanal`);
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error('No se pudo obtener el horario semanal del espacio.');
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    return [];
  }

  return (data.map(parseHorario).filter(Boolean) as HorarioSemanal[]);
};