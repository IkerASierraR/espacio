import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import { HORARIOCURSO_API_BASE_URL } from "../../../utils/apiConfig";
import type {
  Horario,
  HorarioPayload,
  HorarioCatalogos
} from "./types";

interface HorarioCursoApiResponse {
  idHorarioCurso: number;
  curso: number;
  docente: number;
  espacio: number;
  bloque: number;
  diaSemana: string;
  fechaInicio: string;
  fechaFin: string;
  estado?: boolean;
  nombreCurso?: string;
  nombreDocente?: string;
  nombreEspacio?: string;
  codigoEspacio?: string | null;
  nombreBloque?: string;
  horaInicioBloque?: string;
  horaFinBloque?: string;
}

const horariosClient: AxiosInstance = axios.create({
  baseURL: HORARIOCURSO_API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 15000
});

const normalizeError = (error: unknown): Error => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;
    if (typeof responseData === "string") {
      return new Error(responseData);
    }

    if (responseData && typeof responseData === "object" && "message" in responseData) {
      const maybeMessage = (responseData as { message?: string }).message;
      if (maybeMessage) {
        return new Error(maybeMessage);
      }
    }

    return new Error(error.message || "No se pudo completar la solicitud en horariocurso-backend.");
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("No se pudo completar la solicitud en horariocurso-backend.");
};

const unwrap = async <T>(promise: Promise<AxiosResponse<T>>): Promise<T> => {
  try {
    const { data } = await promise;
    return data;
  } catch (error) {
    throw normalizeError(error);
  }
};

const mapHorario = (item: HorarioCursoApiResponse): Horario => {
  const bloqueHorario =
    item.horaInicioBloque && item.horaFinBloque
      ? `${item.horaInicioBloque} - ${item.horaFinBloque}`
      : undefined;

  return {
    id: item.idHorarioCurso,
    cursoId: item.curso,
    cursoNombre: item.nombreCurso ?? `Curso ${item.curso}`,
    docenteId: item.docente,
    docenteNombre: item.nombreDocente ?? `Docente ${item.docente}`,
    espacioId: item.espacio,
    espacioNombre: item.nombreEspacio ?? `Espacio ${item.espacio}`,
    espacioCodigo: item.codigoEspacio,
    bloqueId: item.bloque,
    bloqueNombre: item.nombreBloque ?? `Bloque ${item.bloque}`,
    bloqueHorario,
    diaSemana: item.diaSemana,
    fechaInicio: item.fechaInicio,
    fechaFin: item.fechaFin,
    estado: item.estado ?? true
  };
};

export const fetchHorarios = async (): Promise<Horario[]> => {
  const data = await unwrap(
    horariosClient.get<HorarioCursoApiResponse[]>("/api/horarios")
  );
  return data.map(mapHorario);
};

export const createHorario = async (payload: HorarioPayload): Promise<Horario> => {
  const data = await unwrap(
    horariosClient.post<HorarioCursoApiResponse>("/api/horarios", payload)
  );
  return mapHorario(data);
};

export const updateHorario = async (
  id: number,
  payload: HorarioPayload
): Promise<Horario> => {
  const data = await unwrap(
    horariosClient.put<HorarioCursoApiResponse>(`/api/horarios/${id}`, payload)
  );
  return mapHorario(data);
};

export const deleteHorario = async (id: number): Promise<void> => {
  await unwrap(horariosClient.delete(`/api/horarios/${id}`));
};

export const fetchHorarioCatalogos = (): Promise<HorarioCatalogos> =>
  unwrap(horariosClient.get<HorarioCatalogos>("/api/horarios/meta"));
