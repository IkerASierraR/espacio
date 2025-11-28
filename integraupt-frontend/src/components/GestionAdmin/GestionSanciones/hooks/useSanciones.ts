import { useCallback, useEffect, useState } from "react";
import { createSancion, fetchSanciones, levantarSancion } from "../sancionesService";
import type { FetchSancionesParams } from "../sancionesService";
import type { Sancion, SancionPayload } from "../types";

interface UseSancionesResult {
  sanciones: Sancion[];
  loading: boolean;
  error: string | null;
  loadSanciones: () => Promise<void>;
  registerSancion: (payload: SancionPayload) => Promise<Sancion>;
  levantarSancion: (id: number) => Promise<Sancion>;
}

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return "No se pudo completar la operacion.";
};

export const useSanciones = (params?: FetchSancionesParams): UseSancionesResult => {
  const [sanciones, setSanciones] = useState<Sancion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSanciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSanciones(params);
      setSanciones(data);
    } catch (loadError) {
      const message = extractErrorMessage(loadError);
      setError(message);
      throw loadError instanceof Error ? loadError : new Error(message);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    void loadSanciones();
  }, [loadSanciones]);


  const registerSancion = useCallback(async (payload: SancionPayload) => {
    try {
      const result = await createSancion(payload);
      setSanciones((prev) => [result, ...prev]);
      return result;
    } catch (createError) {
      throw createError instanceof Error
        ? createError
        : new Error(extractErrorMessage(createError));
    }
  }, []);

  const levantar = useCallback(async (id: number) => {
    try {
      const result = await levantarSancion(id);
      setSanciones((prev) =>
        prev.map((item) => (item.id === result.id ? result : item))
      );
      return result;
    } catch (patchError) {
      throw patchError instanceof Error
        ? patchError
        : new Error(extractErrorMessage(patchError));
    }
  }, []);

  return {
    sanciones,
    loading,
    error,
    loadSanciones,
    registerSancion,
    levantarSancion: levantar
  };
};