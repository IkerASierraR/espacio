import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  gestionarReservaAdmin,
  obtenerFiltrosReservasAdmin,
  obtenerReservasAdmin
} from "../reservasService";
import type {
  AdminReserva,
  AdminReservaFilters,
  AdminReservaSummary,
  GestionReservaPayload,
  ReservaEstado,
  ReservaFiltersState
} from "../types";
import type { AdminReservasQueryContext } from "../reservasService";
const DEFAULT_SUMMARY: AdminReservaSummary = {
  pendientes: 0,
  aprobadas: 0,
  rechazadas: 0,
  canceladas: 0
};

const DEFAULT_FILTERS: ReservaFiltersState = {
  estado: "Pendiente",
  tipoEspacio: null,
  facultadId: null,
  escuelaId: null,
  fecha: null,
  search: ""
};

const DEFAULT_ERROR_MESSAGE = "Ocurrió un problema inesperado. Intenta nuevamente.";

const parseError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return DEFAULT_ERROR_MESSAGE;
};

const buildInitialFilters = (
  allowCatalogFilters: boolean,
  supervisorEscuelaId: number | null
): ReservaFiltersState => ({
  ...DEFAULT_FILTERS,
  escuelaId: !allowCatalogFilters && supervisorEscuelaId != null ? supervisorEscuelaId : DEFAULT_FILTERS.escuelaId
});

export interface UseReservasAdminOptions {
  allowCatalogFilters?: boolean;
  supervisorEscuelaId?: number | null;
  usuarioRol?: string | null;
}

export interface UseReservasAdminResult {
  reservas: AdminReserva[];
  resumen: AdminReservaSummary;
  filtros: ReservaFiltersState;
  catalogos: AdminReservaFilters | null;
  catalogosLoading: boolean;
  catalogosError: string | null;
  loading: boolean;
  error: string | null;
  submitting: boolean;
  submitError: string | null;
  successMessage: string | null;
  escuelasFiltradas: AdminReservaFilters["escuelas"];
  onChangeFiltro: <K extends keyof ReservaFiltersState>(field: K, value: ReservaFiltersState[K]) => void;
  onCambiarEstado: (estado: ReservaEstado) => void;
  onResetFiltros: () => void;
  onGestionarReserva: (
    reservaId: number,
    accion: GestionReservaPayload["accion"],
    motivo: string,
    comentarios?: string
  ) => Promise<boolean>;
  onRefetch: () => Promise<void>;
  clearErrors: () => void;
  clearFeedback: () => void;
}

export const useReservasAdmin = (
  usuarioGestionId: number | null,
    options: UseReservasAdminOptions = {}
): UseReservasAdminResult => {
   const {
       allowCatalogFilters = true,
       supervisorEscuelaId = null,
       usuarioRol = null
     } = options;
  const [reservas, setReservas] = useState<AdminReserva[]>([]);
  const [resumen, setResumen] = useState<AdminReservaSummary>(DEFAULT_SUMMARY);
 const [filtros, setFiltros] = useState<ReservaFiltersState>(() =>
     buildInitialFilters(allowCatalogFilters, supervisorEscuelaId)
   );
  const [catalogos, setCatalogos] = useState<AdminReservaFilters | null>(null);
  const [catalogosLoading, setCatalogosLoading] = useState(true);
  const [catalogosError, setCatalogosError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const cancelarFetchActivo = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const cargarReservas = useCallback(async () => {
    cancelarFetchActivo();

    if (!allowCatalogFilters && supervisorEscuelaId == null) {
          setLoading(false);
          setReservas([]);
          setResumen(DEFAULT_SUMMARY);
          setError("No se detectó una escuela asignada en tu perfil administrativo.");
          return;
        }

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
     const context: AdminReservasQueryContext = {
             usuarioId: usuarioGestionId,
             rol: usuarioRol
           };
           const data = await obtenerReservasAdmin(filtros, context, controller.signal);
      setReservas(data.reservas);
      setResumen(data.resumen);
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(parseError(cause));
        setReservas([]);
        setResumen(DEFAULT_SUMMARY);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
 }, [allowCatalogFilters, cancelarFetchActivo, filtros, supervisorEscuelaId, usuarioGestionId, usuarioRol]);

  const cargarCatalogos = useCallback(async () => {
    setCatalogosLoading(true);
    setCatalogosError(null);
    try {
      const context: AdminReservasQueryContext = {
              usuarioId: usuarioGestionId,
              rol: usuarioRol
            };
            const data = await obtenerFiltrosReservasAdmin(context);
      setCatalogos(data);
    } catch (cause) {
      setCatalogosError(parseError(cause));
      setCatalogos(null);
    } finally {
      setCatalogosLoading(false);
    }
  }, [usuarioGestionId, usuarioRol]);

  useEffect(() => {
    void cargarCatalogos();
  }, [cargarCatalogos]);

  useEffect(() => {
    void cargarReservas();
    return cancelarFetchActivo;
  }, [cargarReservas, cancelarFetchActivo]);

  const onChangeFiltro = useCallback(
    <K extends keyof ReservaFiltersState>(field: K, value: ReservaFiltersState[K]) => {
       if (!allowCatalogFilters && (field === "facultadId" || field === "escuelaId")) {
              return;
            }
            setFiltros((prev) => {
              const next = {
                ...prev,
                [field]: value
              } as ReservaFiltersState;

              if (field === "facultadId") {
                next.escuelaId = null;
              }

              return next;
            });
    },
   [allowCatalogFilters]
  );

  const onCambiarEstado = useCallback((estado: ReservaEstado) => {
    setFiltros((prev) => ({
      ...prev,
      estado
    }));
  }, []);

  const onResetFiltros = useCallback(() => {
    setFiltros(buildInitialFilters(allowCatalogFilters, supervisorEscuelaId));
     }, [allowCatalogFilters, supervisorEscuelaId]);

  const onGestionarReserva = useCallback(
    async (
      reservaId: number,
      accion: GestionReservaPayload["accion"],
      motivo: string,
      comentarios?: string
    ) => {
      if (!usuarioGestionId) {
        setSubmitError("No se pudo identificar al usuario administrador actual.");
        return false;
      }
      setSubmitting(true);
      setSubmitError(null);
      setSuccessMessage(null);
      try {
        await gestionarReservaAdmin(reservaId, {
          usuarioGestionId,
          accion,
          motivo,
          comentarios: comentarios && comentarios.trim().length > 0 ? comentarios.trim() : undefined
        });
        setSuccessMessage(
          accion === "Aprobar"
            ? "Reserva aprobada correctamente."
            : "Reserva rechazada correctamente."
        );
        await cargarReservas();
        return true;
      } catch (cause) {
        setSubmitError(parseError(cause));
        return false;
      } finally {
        setSubmitting(false);
      }
      return false;
    },
    [cargarReservas, usuarioGestionId]
  );

  const onRefetch = useCallback(async () => {
    await cargarReservas();
  }, [cargarReservas]);

  const clearErrors = useCallback(() => {
    setError(null);
    setSubmitError(null);
  }, []);

  const clearFeedback = useCallback(() => {
    clearErrors();
    setSuccessMessage(null);
  }, [clearErrors]);

  const escuelasFiltradas = useMemo(() => {
    if (!catalogos?.escuelas) {
      return [] as AdminReservaFilters["escuelas"]; // empty list
    }
if (!allowCatalogFilters) {
      if (supervisorEscuelaId == null) {
        return [] as AdminReservaFilters["escuelas"];
      }
      return catalogos.escuelas.filter((escuela) => escuela.id === supervisorEscuelaId);
    }
    if (!filtros.facultadId) {
      return catalogos.escuelas;
    }
    return catalogos.escuelas.filter((escuela) => escuela.facultadId === filtros.facultadId);
  }, [allowCatalogFilters, catalogos, filtros.facultadId, supervisorEscuelaId]);

  return {
    reservas,
    resumen,
    filtros,
    catalogos,
    catalogosLoading,
    catalogosError,
    loading,
    error,
    submitting,
    submitError,
    successMessage,
    escuelasFiltradas,
    onChangeFiltro,
    onCambiarEstado,
    onResetFiltros,
    onGestionarReserva,
    onRefetch,
    clearErrors,
    clearFeedback
  };
};