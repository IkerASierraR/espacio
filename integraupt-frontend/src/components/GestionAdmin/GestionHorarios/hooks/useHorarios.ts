import { useCallback, useEffect, useState } from "react";
import type { Horario, HorarioPayload } from "../types";
import {
  createHorario,
  deleteHorario,
  fetchHorarios,
  updateHorario
} from "../horariosService";

interface StatusState {
  loading: boolean;
  error: string | null;
}

export const useHorarios = () => {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [{ loading, error }, setStatus] = useState<StatusState>({
    loading: false,
    error: null
  });

  const loadHorarios = useCallback(async () => {
    setStatus((prev) => ({ ...prev, loading: true }));
    try {
      const data = await fetchHorarios();
      setHorarios(data);
      setStatus({ loading: false, error: null });
      return data;
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "No se pudieron cargar los horarios.";
      setStatus({ loading: false, error: message });
      throw loadError;
    }
  }, []);

  useEffect(() => {
    void loadHorarios();
  }, [loadHorarios]);

  const saveHorario = useCallback(
    async (payload: HorarioPayload, id?: number) => {
      const result = id ? await updateHorario(id, payload) : await createHorario(payload);
      setHorarios((prev) => {
        if (id) {
          return prev.map((horario) => (horario.id === id ? result : horario));
        }
        return [result, ...prev];
      });
      return result;
    },
    []
  );

  const removeHorario = useCallback(async (id: number) => {
    await deleteHorario(id);
    setHorarios((prev) => prev.filter((horario) => horario.id !== id));
  }, []);

  return {
    horarios,
    loading,
    error,
    loadHorarios,
    saveHorario,
    removeHorario
  };
};
