import { getAdminReservasApiUrl } from "../../../utils/apiConfig";
import type {
  AdminReservaFilters,
  AdminReservaResponse,
  GestionReservaPayload,
  ReservaFiltersState
} from "./types";

export interface AdminReservasQueryContext {
  usuarioId?: number | null;
  rol?: string | null;
}

const appendContextParams = (params: URLSearchParams, context?: AdminReservasQueryContext) => {
  if (!context) {
    return;
  }

  if (context.usuarioId != null) {
    params.set("usuarioId", String(context.usuarioId));
  }

  if (context.rol && context.rol.trim().length > 0) {
    params.set("rol", context.rol.trim());
  }
};

const buildQueryParams = (
  filters: Partial<ReservaFiltersState>,
  context?: AdminReservasQueryContext
): string => {
  const params = new URLSearchParams();

  if (filters.estado) {
    params.set("estado", filters.estado);
  }

  if (filters.tipoEspacio) {
    params.set("tipoEspacio", filters.tipoEspacio);
  }

  if (filters.facultadId) {
    params.set("facultadId", String(filters.facultadId));
  }

  if (filters.escuelaId) {
    params.set("escuelaId", String(filters.escuelaId));
  }

  if (filters.fecha) {
    params.set("fecha", filters.fecha);
  }

  if (filters.search && filters.search.trim().length > 0) {
    params.set("search", filters.search.trim());
  }

  appendContextParams(params, context);

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const obtenerReservasAdmin = async (
  filters: Partial<ReservaFiltersState>,
  context: AdminReservasQueryContext,
  signal?: AbortSignal
): Promise<AdminReservaResponse> => {
  const query = buildQueryParams(filters, context);
  const response = await fetch(getAdminReservasApiUrl(`/api/admin/reservas${query}`), {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    },
    signal
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "No fue posible obtener las reservas administrativas");
  }

  return (await response.json()) as AdminReservaResponse;
};

export const obtenerFiltrosReservasAdmin = async (
    context: AdminReservasQueryContext,
  signal?: AbortSignal
): Promise<AdminReservaFilters> => {
  const query = buildQueryParams({}, context);
    const response = await fetch(getAdminReservasApiUrl(`/api/admin/reservas/filtros${query}`), {
    method: "GET",
    signal
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "No fue posible obtener los filtros de reservas");
  }

  return (await response.json()) as AdminReservaFilters;
};

export const gestionarReservaAdmin = async (
  reservaId: number,
  payload: GestionReservaPayload
): Promise<AdminReservaResponse["reservas"][number]> => {
  const response = await fetch(
    getAdminReservasApiUrl(`/api/admin/reservas/${reservaId}/gestionar`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "No fue posible actualizar la reserva seleccionada");
  }

  return (await response.json()) as AdminReservaResponse["reservas"][number];
};