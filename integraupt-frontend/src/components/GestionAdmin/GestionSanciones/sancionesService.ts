import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import { getReservasApiUrl, SANCIONES_API_BASE_URL } from "../../../utils/apiConfig";
import type {
  EscuelaOption,
  FacultadOption,
  Sancion,
  SancionPayload,
  UsuarioOption
} from "./types";

interface SancionApiResponse {
  id: number;
   usuarioId: number | null;
   tipoUsuario: "ESTUDIANTE" | "DOCENTE";
   motivo: string;
   fechaInicio: string;
   fechaFin: string;
   estado: "ACTIVA" | "CUMPLIDA";
   usuarioNombre?: string | null;
   usuarioCodigo?: string | null;
   usuarioEscuela?: string | null;
   usuarioEscuelaId?: number | null;
   usuarioFacultad?: string | null;
   usuarioFacultadId?: number | null;
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

interface UsuarioBusquedaApiResponse {
  id: number;
  nombreCompleto?: string | null;
  codigo?: string | null;
  escuelaId?: number | null;
  escuelaNombre?: string | null;
  facultadId?: number | null;
  facultadNombre?: string | null;
}

const sancionesClient: AxiosInstance = axios.create({
  baseURL: SANCIONES_API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 15000
});

const normalizeError = (error: unknown, serviceName = "sanciones-backend"): Error => {
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
const fetchCatalogWithFallback = async <T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> => {
  try {
    return await unwrap(
      sancionesClient.get<T>(path, {
        params
      })
    );
  } catch (primaryError) {
    const primaryNormalized = normalizeError(primaryError);

    try {
      const fallbackResponse = await axios.get<T>(getReservasApiUrl(path), {
        params,
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 15000
      });

      return fallbackResponse.data;
    } catch (fallbackError) {
      const fallbackNormalized = normalizeError(fallbackError, "reservas-backend");
      const combinedMessage =
        fallbackNormalized.message === primaryNormalized.message
          ? fallbackNormalized.message
          : `${fallbackNormalized.message} (${primaryNormalized.message})`;

      throw new Error(combinedMessage);
    }
  }
};
const mapSancion = (item: SancionApiResponse): Sancion => ({
  id: item.id,
    usuarioId: item.usuarioId ?? null,
    usuarioNombre: item.usuarioNombre ?? null,
    usuarioCodigo: item.usuarioCodigo ?? null,
    usuarioEscuela: item.usuarioEscuela ?? null,
    usuarioEscuelaId: item.usuarioEscuelaId ?? null,
    usuarioFacultad: item.usuarioFacultad ?? null,
    usuarioFacultadId: item.usuarioFacultadId ?? null,
    tipoUsuario: item.tipoUsuario,
    motivo: item.motivo,
    fechaInicio: item.fechaInicio,
    fechaFin: item.fechaFin,
    estado: item.estado
});

export interface FetchSancionesParams {
  rol?: string;
  facultadId?: number;
  escuelaId?: number;
  escuelaContextoId?: number;
}

export const fetchSanciones = async (params?: FetchSancionesParams): Promise<Sancion[]> => {
  const data = await unwrap(
        sancionesClient.get<SancionApiResponse[]>("/api/sanciones", { params })
  );
  return data.map(mapSancion);
};

export const createSancion = async (payload: SancionPayload): Promise<Sancion> => {
  const data = await unwrap(
    sancionesClient.post<SancionApiResponse>("/api/sanciones", payload)
  );
  return mapSancion(data);
};

export const levantarSancion = async (id: number): Promise<Sancion> => {
  const data = await unwrap(
    sancionesClient.patch<SancionApiResponse>(`/api/sanciones/${id}/levantar`)
  );
  return mapSancion(data);
};

export const fetchFacultades = async (): Promise<FacultadOption[]> => {
 const data = await fetchCatalogWithFallback<FacultadApiResponse[]>("/api/catalogos/facultades");

  return data.map((item) => ({
    id: item.id,
    nombre: item.nombre,
    abreviatura: item.abreviatura ?? null
  }));
};

export const fetchEscuelas = async (facultadId?: number): Promise<EscuelaOption[]> => {
  const params = facultadId != null ? { facultadId } : undefined;
  const data = await fetchCatalogWithFallback<EscuelaApiResponse[]>("/api/catalogos/escuelas", params);

  return data.map((item) => ({
    id: item.id,
    nombre: item.nombre,
    facultadId: item.facultadId ?? null,
    facultadNombre: item.facultadNombre ?? null
  }));
};

interface UsuarioSearchParams {
  tipoUsuario: string;
  query?: string;
  facultadId?: number;
  escuelaId?: number;
  rol?: string;
  escuelaContextoId?: number;
  limit?: number;
}

export const searchUsuarios = async ({
  tipoUsuario,
  query,
  facultadId,
  escuelaId,
  rol,
  escuelaContextoId,
  limit
}: UsuarioSearchParams): Promise<UsuarioOption[]> => {
  const params: Record<string, string | number> = { tipoUsuario };

  if (query) {
    params.query = query;
  }

  if (facultadId != null) {
    params.facultadId = facultadId;
  }

  if (escuelaId != null) {
    params.escuelaId = escuelaId;
  }

  if (limit != null) {
    params.limit = limit;
  }

  if (rol) {
    params.rol = rol;
  }

  if (escuelaContextoId != null) {
    params.escuelaContextoId = escuelaContextoId;
  }

  const data = await unwrap(
    sancionesClient.get<UsuarioBusquedaApiResponse[]>("/api/usuarios/busqueda", { params })
  );

  return data.map((item) => ({
    id: item.id,
    nombreCompleto: item.nombreCompleto ?? null,
    codigo: item.codigo ?? null,
    escuelaId: item.escuelaId ?? null,
    escuelaNombre: item.escuelaNombre ?? null,
    facultadId: item.facultadId ?? null,
    facultadNombre: item.facultadNombre ?? null
  }));
};