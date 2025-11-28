import { useCallback, useEffect, useState } from "react";
import type { Escuela } from "../types";
import { fetchEscuelas } from "../escuelasService";

interface StatusState {
  loading: boolean;
  error: string | null;
}

export const useEscuelas = () => {
  const [escuelas, setEscuelas] = useState<Escuela[]>([]);
  const [{ loading, error }, setStatus] = useState<StatusState>({
    loading: false,
    error: null
  });

  const loadEscuelas = useCallback(async () => {
    setStatus((prev) => ({ ...prev, loading: true }));
    try {
      const data = await fetchEscuelas();
      setEscuelas(data);
      setStatus({ loading: false, error: null });
      return data;
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar las escuelas.";
      setStatus({ loading: false, error: message });
      throw loadError;
    }
  }, []);

  useEffect(() => {
    void loadEscuelas();
  }, [loadEscuelas]);

  return {
    escuelas,
    loading,
    error,
    reloadEscuelas: loadEscuelas
  };
};
