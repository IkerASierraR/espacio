import { useCallback, useEffect, useState } from "react";
import type { EstadisticasGenerales, UsoEspacio, ReservasMes } from "../types";
import {
  fetchEstadisticasGenerales,
  fetchUsoEspacios,
  fetchReservasPorMes,
  descargarReportePDF,
  descargarReporteExcel
} from "../reportesService";

interface StatusState {
  loading: boolean;
  error: string | null;
}

interface ReportesData {
  estadisticas: EstadisticasGenerales | null;
  usoEspacios: UsoEspacio[];
  reservasPorMes: ReservasMes[];
}

const descargarArchivo = async (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const useReportes = () => {
  const [data, setData] = useState<ReportesData>({
    estadisticas: null,
    usoEspacios: [],
    reservasPorMes: []
  });
  
  const [{ loading, error }, setStatus] = useState<StatusState>({
    loading: false,
    error: null
  });

  const cargarDatos = useCallback(async () => {
    setStatus((prev) => ({ ...prev, loading: true }));
    try {
      const [estadisticasData, usoEspaciosData, reservasMesData] = await Promise.all([
        fetchEstadisticasGenerales(),
        fetchUsoEspacios(),
        fetchReservasPorMes()
      ]);

      setData({
        estadisticas: estadisticasData,
        usoEspacios: usoEspaciosData,
        reservasPorMes: reservasMesData
      });
      
      setStatus({ loading: false, error: null });
      return { estadisticasData, usoEspaciosData, reservasMesData };
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar los datos de reportes.";
      setStatus({ loading: false, error: message });
      throw loadError;
    }
  }, []);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const descargarPDF = useCallback(async () => {
    try {
      const blob = await descargarReportePDF();
      
      // Obtener el nombre del archivo del blob o usar uno por defecto
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
      const filename = `reporte_estadisticas_${timestamp}.pdf`;
      
      await descargarArchivo(blob, filename);
      return true;
    } catch (error) {
      throw normalizeError(error);
    }
  }, []);

  const descargarExcel = useCallback(async () => {
    try {
      const blob = await descargarReporteExcel();
      
      // Obtener el nombre del archivo del blob o usar uno por defecto
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
      const filename = `reporte_estadisticas_${timestamp}.xlsx`;
      
      await descargarArchivo(blob, filename);
      return true;
    } catch (error) {
      throw normalizeError(error);
    }
  }, []);

  return {
    data,
    loading,
    error,
    cargarDatos,
    descargarPDF,
    descargarExcel
  };
};

// Helper function para normalizar errores en los callbacks
const normalizeError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }
  return new Error("No se pudo completar la operación.");
};