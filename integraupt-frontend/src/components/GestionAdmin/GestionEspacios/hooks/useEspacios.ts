import { useCallback, useEffect, useState } from "react";
import type { Espacio, EspacioPayload } from "../types";
import { createEspacio, deleteEspacio, fetchEspacios, updateEspacio } from "../espaciosService";

interface StatusState {
  loading: boolean;
  error: string | null;
}

export const useEspacios = () => {
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [{ loading, error }, setStatus] = useState<StatusState>({
    loading: false,
    error: null
  });

  const loadEspacios = useCallback(async () => {
    setStatus((prev) => ({ ...prev, loading: true }));
    try {
      const data = await fetchEspacios();
      setEspacios(data);
      setStatus({ loading: false, error: null });
      return data;
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar los espacios.";
      setStatus({ loading: false, error: message });
      throw loadError;
    }
  }, []);

  useEffect(() => {
    void loadEspacios();
  }, [loadEspacios]);

  const saveEspacio = useCallback(
    async (payload: EspacioPayload, id?: number) => {
      try {
        const result = id
          ? await updateEspacio(id, payload)
          : await createEspacio(payload);

        setEspacios((prev) => {
          if (id) {
            return prev.map((espacio) => (espacio.id === id ? result : espacio));
          }
          return [result, ...prev];
        });

        return result;
      } catch (saveError) {
        throw saveError;
      }
    },
    []
  );

  const removeEspacio = useCallback(async (id: number) => {
    try {
      await deleteEspacio(id);
      setEspacios((prev) => prev.filter((espacio) => espacio.id !== id));
    } catch (deleteError) {
      throw deleteError;
    }
  }, []);

  return {
    espacios,
    loading,
    error,
    loadEspacios,
    saveEspacio,
    removeEspacio
  };
};
