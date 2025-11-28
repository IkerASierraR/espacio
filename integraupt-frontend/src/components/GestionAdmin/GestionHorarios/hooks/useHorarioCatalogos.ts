import { useCallback, useEffect, useState } from "react";
import type { HorarioCatalogos } from "../types";
import { fetchHorarioCatalogos } from "../horariosService";

interface StatusState {
  loading: boolean;
  error: string | null;
}

const EMPTY_CATALOGOS: HorarioCatalogos = {
  cursos: [],
  docentes: [],
  espacios: [],
  bloques: []
};

export const useHorarioCatalogos = () => {
  const [catalogos, setCatalogos] = useState<HorarioCatalogos>(EMPTY_CATALOGOS);
  const [{ loading, error }, setStatus] = useState<StatusState>({
    loading: false,
    error: null
  });

  const loadCatalogos = useCallback(async () => {
    setStatus((prev) => ({ ...prev, loading: true }));
    try {
      const data = await fetchHorarioCatalogos();
      setCatalogos(data);
      setStatus({ loading: false, error: null });
      return data;
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "No se pudieron cargar los catalogos.";
      setStatus({ loading: false, error: message });
      throw loadError;
    }
  }, []);

  useEffect(() => {
    void loadCatalogos();
  }, [loadCatalogos]);

  return {
    catalogos,
    loading,
    error,
    reloadCatalogos: loadCatalogos
  };
};
