import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuditoriaFiltro, AuditoriaReserva } from "../types";
import { fetchAuditorias } from "../auditoriaService";

export interface UseAuditoriasResult {
  auditorias: AuditoriaReserva[];
  loading: boolean;
  error: string | null;
  filters: AuditoriaFiltro;
  lastUpdated: string | null;
  loadAuditorias: (nextFilters?: AuditoriaFiltro) => Promise<void>;
  applyFilters: (nextFilters: AuditoriaFiltro) => Promise<void>;
  resetFilters: () => Promise<void>;
  resumenEstados: Record<string, number>;
}

const INITIAL_FILTERS: AuditoriaFiltro = {};

export const useAuditorias = (): UseAuditoriasResult => {
  const [auditorias, setAuditorias] = useState<AuditoriaReserva[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditoriaFiltro>(INITIAL_FILTERS);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadAuditorias = useCallback(
    async (nextFilters?: AuditoriaFiltro) => {
      setLoading(true);
      setError(null);

      const filtersToUse = nextFilters ?? filters;
      try {
        const data = await fetchAuditorias(filtersToUse);
        setAuditorias(data);
        setLastUpdated(new Date().toISOString());
        if (nextFilters) {
          setFilters(nextFilters);
        }
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "No se pudo obtener el historial de auditoria.";
        setError(message);
        throw loadError instanceof Error ? loadError : new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const applyFilters = useCallback(
    async (nextFilters: AuditoriaFiltro) => {
      setFilters(nextFilters);
      await loadAuditorias(nextFilters);
    },
    [loadAuditorias]
  );

  const resetFilters = useCallback(async () => {
    setFilters(INITIAL_FILTERS);
    await loadAuditorias(INITIAL_FILTERS);
  }, [loadAuditorias]);

  const resumenEstados = useMemo(() => {
    return auditorias.reduce<Record<string, number>>((acc, item) => {
      const key = item.estadoNuevo?.toUpperCase() || "SIN_ESTADO";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }, [auditorias]);

  useEffect(() => {
    loadAuditorias().catch(() => undefined);
  }, [loadAuditorias]);

  return {
    auditorias,
    loading,
    error,
    filters,
    lastUpdated,
    loadAuditorias,
    applyFilters,
    resetFilters,
    resumenEstados
  };
};