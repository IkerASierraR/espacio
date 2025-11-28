import axios, { type AxiosInstance, type AxiosResponse, type AxiosRequestConfig } from "axios";
import { AUDITORIA_API_BASE_URL } from "../../../utils/apiConfig";
import type { AuditoriaFiltro, AuditoriaReserva } from "./types";

const auditoriaClient: AxiosInstance = axios.create({
  baseURL: AUDITORIA_API_BASE_URL,
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

    return new Error(error.message || "No se pudo completar la solicitud en auditoria-backend.");
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("No se pudo completar la solicitud en auditoria-backend.");
};

const unwrap = async <T>(promise: Promise<AxiosResponse<T>>): Promise<T> => {
  try {
    const { data } = await promise;
    return data;
  } catch (error) {
    throw normalizeError(error);
  }
};

const buildQueryParams = (filters?: AuditoriaFiltro): AxiosRequestConfig["params"] => {
  if (!filters) {
    return undefined;
  }

  const params: Record<string, string | number> = {};

  if (filters.reservaId != null) {
    params.reservaId = filters.reservaId;
  }

  if (filters.estado) {
    const estado = filters.estado.trim();
    if (estado) {
      params.estado = estado;
    }
  }

  if (filters.usuario) {
    const usuario = filters.usuario.trim();
    if (usuario) {
      params.usuario = usuario;
    }
  }

  if (filters.fechaInicio) {
    const fechaInicio = filters.fechaInicio.trim();
    if (fechaInicio) {
      params.fechaInicio = fechaInicio;
    }
  }

  if (filters.fechaFin) {
    const fechaFin = filters.fechaFin.trim();
    if (fechaFin) {
      params.fechaFin = fechaFin;
    }
  }

  return Object.keys(params).length > 0 ? params : undefined;
};

export const fetchAuditorias = (filters?: AuditoriaFiltro): Promise<AuditoriaReserva[]> =>
  unwrap(
    auditoriaClient.get<AuditoriaReserva[]>("/api/auditorias", {
      params: buildQueryParams(filters)
    })
  );

export const fetchAuditoriaPorId = (id: number): Promise<AuditoriaReserva> =>
  unwrap(auditoriaClient.get<AuditoriaReserva>(`/api/auditorias/${id}`));

export const fetchAuditoriasPorReserva = (reservaId: number): Promise<AuditoriaReserva[]> =>
  unwrap(auditoriaClient.get<AuditoriaReserva[]>(`/api/auditorias/reserva/${reservaId}`));

const downloadAuditoriaArchivo = async (
  path: string,
  filters?: AuditoriaFiltro
): Promise<Blob> => {
  try {
    const response = await auditoriaClient.get<Blob>(path, {
      params: buildQueryParams(filters),
      responseType: "blob"
    });

    if (!(response.data instanceof Blob)) {
      throw new Error("Respuesta del servidor no es un archivo valido.");
    }

    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
};

export const descargarAuditoriaPdf = (filters?: AuditoriaFiltro): Promise<Blob> =>
  downloadAuditoriaArchivo("/api/auditorias/exportacion/pdf", filters);

export const descargarAuditoriaExcel = (filters?: AuditoriaFiltro): Promise<Blob> =>
  downloadAuditoriaArchivo("/api/auditorias/exportacion/excel", filters);