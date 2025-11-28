import { useCallback, useEffect, useState } from "react";
import type { IncidenciaGestionRow } from "../types";
import { fetchIncidenciasGestion, type FetchIncidenciasParams } from "../incidenciasService";

interface UseIncidenciasGestionOptions {
  rol?: string | null;
  facultadId?: number | null;
  escuelaId?: number | null;
  escuelaContextoId?: number | null;
  espacioId?: number | null;
  search?: string | null;
}

interface UseIncidenciasGestionResult {
  incidencias: IncidenciaGestionRow[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const normalizeParams = (
  options: UseIncidenciasGestionOptions
): FetchIncidenciasParams => {
  const rolValue = options.rol?.trim();
  const searchValue = options.search?.trim();

  return {
    rol: rolValue ? rolValue.toUpperCase() : undefined,
    facultadId: options.facultadId ?? undefined,
    escuelaId: options.escuelaId ?? undefined,
    escuelaContextoId: options.escuelaContextoId ?? undefined,
    espacioId: options.espacioId ?? undefined,
    search: searchValue ? searchValue : undefined
  };
};

export const useIncidenciasGestion = (
  options: UseIncidenciasGestionOptions
): UseIncidenciasGestionResult => {
  const [incidencias, setIncidencias] = useState<IncidenciaGestionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const params = normalizeParams(options);
    setLoading(true);
    try {
      const data = await fetchIncidenciasGestion(params);
      setIncidencias(data);
      setError(null);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar las incidencias.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [options]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return {
    incidencias,
    loading,
    error,
    reload: fetchData
  };
};