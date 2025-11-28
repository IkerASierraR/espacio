import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import { ESPACIOS_API_BASE_URL } from "../../../utils/apiConfig";
import type { Espacio, EspacioPayload } from "./types";

const espaciosClient: AxiosInstance = axios.create({
  baseURL: ESPACIOS_API_BASE_URL,
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

    return new Error(error.message || "No se pudo completar la solicitud en espacio-backend.");
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("No se pudo completar la solicitud en espacio-backend.");
};

const unwrap = async <T>(promise: Promise<AxiosResponse<T>>): Promise<T> => {
  try {
    const { data } = await promise;
    return data;
  } catch (error) {
    throw normalizeError(error);
  }
};

export const fetchEspacios = (): Promise<Espacio[]> =>
  unwrap(espaciosClient.get<Espacio[]>("/api/espacios"));

export const createEspacio = (payload: EspacioPayload): Promise<Espacio> =>
  unwrap(espaciosClient.post<Espacio>("/api/espacios", payload));

export const updateEspacio = (id: number, payload: EspacioPayload): Promise<Espacio> =>
  unwrap(espaciosClient.put<Espacio>(`/api/espacios/${id}`, payload));

export const deleteEspacio = async (id: number): Promise<void> => {
  try {
    await espaciosClient.delete(`/api/espacios/${id}`);
  } catch (error) {
    throw normalizeError(error);
  }
};
