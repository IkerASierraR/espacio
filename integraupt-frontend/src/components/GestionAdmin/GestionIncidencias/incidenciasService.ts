import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import { getEspaciosApiUrl, INCIDENCIAS_API_BASE_URL, getReservasApiUrl } from "../../../utils/apiConfig";
import type {
  EscuelaOption,
  EspacioOption,
  FacultadOption,
  IncidenciaGestionRow
} from "./types";

interface IncidenciaGestionApiResponse {
  id: number;
  reservaId: number | null;
  usuarioId: number | null;
  usuarioNombre?: string | null;
  usuarioDocumento?: string | null;
  espacioId?: number | null;
  espacioCodigo?: string | null;
  espacioNombre?: string | null;
  escuelaId?: number | null;
  escuelaNombre?: string | null;
  facultadId?: number | null;
  facultadNombre?: string | null;
  descripcion?: string | null;
  fechaReporte: string;
}

interface FacultadApiResponse {
  id: number;
  nombre: string;
  abreviatura?: string | null;
}

interface EscuelaApiResponse {
  id: number;
  nombre: string;
  facultadId?: number | null;
  facultadNombre?: string | null;
}

interface EspacioApiResponse {
  id: number;
  codigo: string;
  nombre: string;
  escuelaId?: number | null;
}

export interface FetchIncidenciasParams {
  rol?: string;
  facultadId?: number;
  escuelaId?: number;
  escuelaContextoId?: number;
  espacioId?: number;
  search?: string;
}

const incidenciasClient: AxiosInstance = axios.create({
  baseURL: INCIDENCIAS_API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 15000
});

const normalizeError = (error: unknown, serviceName = "incidencias-backend"): Error => {
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

    return new Error(error.message || `No se pudo completar la solicitud en ${serviceName}.`);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(`No se pudo completar la solicitud en ${serviceName}.`);
};

const unwrap = async <T>(promise: Promise<AxiosResponse<T>>): Promise<T> => {
  try {
    const { data } = await promise;
    return data;
  } catch (error) {
    throw normalizeError(error);
  }
};

const mapIncidenciaGestion = (item: IncidenciaGestionApiResponse): IncidenciaGestionRow => ({
  id: item.id,
  reservaId: item.reservaId ?? null,
  usuarioId: item.usuarioId ?? null,
  usuarioNombre: item.usuarioNombre ?? null,
  usuarioDocumento: item.usuarioDocumento ?? null,
  espacioId: item.espacioId ?? null,
  espacioCodigo: item.espacioCodigo ?? null,
  espacioNombre: item.espacioNombre ?? null,
  escuelaId: item.escuelaId ?? null,
  escuelaNombre: item.escuelaNombre ?? null,
  facultadId: item.facultadId ?? null,
  facultadNombre: item.facultadNombre ?? null,
  descripcion: item.descripcion ?? null,
  fechaReporte: item.fechaReporte
});

export const fetchIncidenciasGestion = async (
  params?: FetchIncidenciasParams
): Promise<IncidenciaGestionRow[]> => {
  const data = await unwrap(
    incidenciasClient.get<IncidenciaGestionApiResponse[]>("/api/incidencias", { params })
  );
  return data.map(mapIncidenciaGestion);
};

export const fetchFacultades = async (): Promise<FacultadOption[]> => {
  const response = await axios.get<FacultadApiResponse[]>(
    getReservasApiUrl("/api/catalogos/facultades"),
    {
      headers: { "Content-Type": "application/json" },
      timeout: 15000
    }
  );

  return response.data.map((item) => ({
    id: item.id,
    nombre: item.nombre,
    abreviatura: item.abreviatura ?? null
  }));
};

export const fetchEscuelas = async (facultadId?: number): Promise<EscuelaOption[]> => {
  const response = await axios.get<EscuelaApiResponse[]>(
    getReservasApiUrl("/api/catalogos/escuelas"),
    {
      params: facultadId != null ? { facultadId } : undefined,
      headers: { "Content-Type": "application/json" },
      timeout: 15000
    }
  );

  return response.data.map((item) => ({
    id: item.id,
    nombre: item.nombre,
    facultadId: item.facultadId ?? null,
    facultadNombre: item.facultadNombre ?? null
  }));
};

export const fetchEspaciosCatalogo = async (): Promise<EspacioOption[]> => {
  const response = await axios.get<EspacioApiResponse[]>(getEspaciosApiUrl("/api/espacios"), {
    headers: { "Content-Type": "application/json" },
    timeout: 15000
  });

  return response.data.map((item) => ({
    id: item.id,
    nombre: item.nombre,
    codigo: item.codigo,
    escuelaId: item.escuelaId ?? null
  }));
};