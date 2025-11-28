import { useCallback, useEffect, useState } from "react";
import type { Facultad } from "../types";
import { fetchFacultades } from "../escuelasService";

interface StatusState {
  loading: boolean;
  error: string | null;
}

export const useFacultades = () => {
  const [facultades, setFacultades] = useState<Facultad[]>([]);
  const [{ loading, error }, setStatus] = useState<StatusState>({
    loading: false,
    error: null
  });

  const loadFacultades = useCallback(async () => {
    setStatus((prev) => ({ ...prev, loading: true }));
    try {
      const data = await fetchFacultades();
      setFacultades(data);
      setStatus({ loading: false, error: null });
      return data;
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar el catalogo de facultades.";
      setStatus({ loading: false, error: message });
      throw loadError;
    }
  }, []);

  useEffect(() => {
    void loadFacultades();
  }, [loadFacultades]);

  return {
    facultades,
    loading,
    error,
    reloadFacultades: loadFacultades
  };
};