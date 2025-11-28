import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import { REPORTES_API_BASE_URL } from "../../../utils/apiConfig";
import type {
  EstadisticasGenerales,
  UsoEspacio,
  ReservasMes
} from "./types";

const reportesClient: AxiosInstance = axios.create({
  baseURL: REPORTES_API_BASE_URL,
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

    return new Error(error.message || "No se pudo completar la solicitud en reportes-backend.");
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("No se pudo completar la solicitud en reportes-backend.");
};

const unwrap = async <T>(promise: Promise<AxiosResponse<T>>): Promise<T> => {
  try {
    const { data } = await promise;
    return data;
  } catch (error) {
    throw normalizeError(error);
  }
};

export const fetchEstadisticasGenerales = (): Promise<EstadisticasGenerales> =>
  unwrap(reportesClient.get<EstadisticasGenerales>("/api/reportes/estadisticas-generales"));

export const fetchUsoEspacios = (): Promise<UsoEspacio[]> =>
  unwrap(reportesClient.get<UsoEspacio[]>("/api/reportes/uso-espacios"));

export const fetchReservasPorMes = (): Promise<ReservasMes[]> =>
  unwrap(reportesClient.get<ReservasMes[]>("/api/reportes/reservas-mes"));

export const descargarReportePDF = async (): Promise<Blob> => {
  try {
    const response = await reportesClient.get("/api/reportes/exportacion/pdf", {
      responseType: 'blob'
    });
    
    if (!(response.data instanceof Blob)) {
      throw new Error('Respuesta del servidor no es un archivo válido');
    }
    
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
};

export const descargarReporteExcel = async (): Promise<Blob> => {
  try {
    const response = await reportesClient.get("/api/reportes/exportacion/excel", {
      responseType: 'blob'
    });
    
    if (!(response.data instanceof Blob)) {
      throw new Error('Respuesta del servidor no es un archivo válido');
    }
    
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
};