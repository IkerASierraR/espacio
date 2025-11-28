import React, { useMemo, useState } from "react";
import { Download, BarChart3, Users, Calendar, Server, TrendingUp, RefreshCw, AlertCircle } from "lucide-react";
import "./styles/GestionReportes.css";
import { useReportes } from "./hooks/useReportes";
import { ModalSeleccionFormato } from "./components/ModalSeleccionFormato";

interface ReportesEstadisticasProps {
  onAuditLog?: (message: string, detail?: string) => void;
}

export const GestionReportes: React.FC<ReportesEstadisticasProps> = ({ onAuditLog }) => {
  const { data, loading, error, cargarDatos, descargarPDF, descargarExcel } = useReportes();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const notifyStatus = (type: "success" | "error", text: string) => {
    setStatusMessage({ type, text });
  };

  const handleAbrirModal = () => {
    setModalAbierto(true);
  };

  const handleCerrarModal = () => {
    setModalAbierto(false);
  };

  const handleSeleccionarFormato = async (formato: 'pdf' | 'excel') => {
    setModalAbierto(false);
    
    try {
      if (formato === "pdf") {
        await descargarPDF();
        notifyStatus("success", "Reporte PDF generado y descargado correctamente.");
        onAuditLog?.("Descarga de Reporte PDF", "Reporte estadístico en formato PDF");
      } else if (formato === "excel") {
        await descargarExcel();
        notifyStatus("success", "Reporte Excel generado y descargado correctamente.");
        onAuditLog?.("Descarga de Reporte Excel", "Reporte estadístico en formato Excel");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al generar el reporte.";
      notifyStatus("error", message);
      onAuditLog?.("Error en generación de reporte", `Error: ${message}`);
    }
  };

  const handleRecargar = async () => {
    try {
      await cargarDatos();
      notifyStatus("success", "Datos actualizados correctamente.");
      onAuditLog?.("Recarga de datos", "Datos de reportes actualizados");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al recargar los datos.";
      notifyStatus("error", message);
    }
  };

  const obtenerColorVariacion = (variacion: string) => {
    if (variacion.includes('↑')) return "#10b981";
    if (variacion.includes('↓')) return "#ef4444";
    return "#6b7280";
  };

  // Estadísticas calculadas para el resumen
  const estadisticasResumen = useMemo(() => {
    if (!data.usoEspacios.length) return null;

    const laboratorios = data.usoEspacios.filter(e => e.tipoEspacio === 'Laboratorio');
    const aulas = data.usoEspacios.filter(e => e.tipoEspacio === 'Salon');
    const espacioMasSolicitado = data.usoEspacios[0];

    return {
      totalLaboratorios: laboratorios.length,
      totalReservasLaboratorios: laboratorios.reduce((sum, e) => sum + e.totalReservas, 0),
      totalAulas: aulas.length,
      totalReservasAulas: aulas.reduce((sum, e) => sum + e.totalReservas, 0),
      espacioMasSolicitado: espacioMasSolicitado.codigoEspacio,
      reservasEspacioMasSolicitado: espacioMasSolicitado.totalReservas
    };
  }, [data.usoEspacios]);

  if (loading && !data.estadisticas) {
    return (
      <div className="gestion-reportes-loading">
        <div className="gestion-reportes-loading-spinner"></div>
        <p>Cargando reportes y estadísticas...</p>
      </div>
    );
  }

  return (
    <div className="gestion-reportes">
      {/* Header */}
      <div className="gestion-reportes-header">
        <div>
          <h2 className="gestion-reportes-title">Reportes y Estadísticas</h2>
          <p className="gestion-reportes-subtitle">
            Análisis y métricas del sistema con sincronización en tiempo real.
          </p>
        </div>
        <div className="gestion-reportes-actions">
          <button
            type="button"
            className="gestion-reportes-btn secondary"
            onClick={handleRecargar}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Actualizar
          </button>
          <button
            type="button"
            className="gestion-reportes-btn primary"
            onClick={handleAbrirModal}
            disabled={loading}
          >
            <Download size={16} />
            Generar Reporte
          </button>
        </div>
      </div>

      {/* Modal de selección de formato */}
      <ModalSeleccionFormato
        open={modalAbierto}
        onClose={handleCerrarModal}
        onSeleccionarFormato={handleSeleccionarFormato}
      />

      {statusMessage && (
        <div
          className={`gestion-reportes-alert ${
            statusMessage.type === "success" ? "success" : "error"
          }`}
        >
          {statusMessage.type === "error" && <AlertCircle size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {error && (
        <div className="gestion-reportes-alert error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Estadísticas Principales */}
      {data.estadisticas && (
        <div className="gestion-reportes-stats">
          <div className="gestion-reportes-stat">
            <Users size={20} />
            <div>
              <p>Total Estudiantes</p>
              <strong>{data.estadisticas.totalEstudiantes.toLocaleString()}</strong>
            </div>
          </div>

          <div className="gestion-reportes-stat">
            <Users size={20} />
            <div>
              <p>Total Docentes</p>
              <strong>{data.estadisticas.totalDocentes.toLocaleString()}</strong>
            </div>
          </div>

          <div className="gestion-reportes-stat">
            <Calendar size={20} />
            <div>
              <p>Reservas Activas</p>
              <strong>{data.estadisticas.reservasActivas.toLocaleString()}</strong>
            </div>
          </div>

          <div className="gestion-reportes-stat">
            <TrendingUp size={20} />
            <div>
              <p>Tasa de Uso</p>
              <strong>{data.estadisticas.tasaUso.toFixed(1)}%</strong>
              <p style={{ color: obtenerColorVariacion(data.estadisticas.variacionReservas), fontSize: '0.75rem', margin: 0 }}>
                {data.estadisticas.variacionReservas} vs período anterior
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Resumen por Tipo de Espacio */}
      {estadisticasResumen && (
        <div className="gestion-reportes-summary">
          <h3 className="gestion-reportes-summary-title">
            <BarChart3 size={20} />
            Resumen por Tipo de Espacio
          </h3>
          <div className="gestion-reportes-summary-grid">
            <div className="gestion-reportes-summary-card gestion-reportes-summary-blue">
              <div className="gestion-reportes-summary-icon">
                <Server size={20} />
              </div>
              <div className="gestion-reportes-summary-content">
                <h4 className="gestion-reportes-summary-card-title">Laboratorios</h4>
                <p className="gestion-reportes-summary-value">
                  {estadisticasResumen.totalLaboratorios} espacios
                </p>
                <p className="gestion-reportes-summary-description">
                  {estadisticasResumen.totalReservasLaboratorios} reservas totales
                </p>
              </div>
            </div>

            <div className="gestion-reportes-summary-card gestion-reportes-summary-purple">
              <div className="gestion-reportes-summary-icon">
                <Calendar size={20} />
              </div>
              <div className="gestion-reportes-summary-content">
                <h4 className="gestion-reportes-summary-card-title">Aulas</h4>
                <p className="gestion-reportes-summary-value">
                  {estadisticasResumen.totalAulas} espacios
                </p>
                <p className="gestion-reportes-summary-description">
                  {estadisticasResumen.totalReservasAulas} reservas totales
                </p>
              </div>
            </div>

            <div className="gestion-reportes-summary-card gestion-reportes-summary-green">
              <div className="gestion-reportes-summary-icon">
                <TrendingUp size={20} />
              </div>
              <div className="gestion-reportes-summary-content">
                <h4 className="gestion-reportes-summary-card-title">Espacio Más Solicitado</h4>
                <p className="gestion-reportes-summary-value">
                  {estadisticasResumen.espacioMasSolicitado}
                </p>
                <p className="gestion-reportes-summary-description">
                  {estadisticasResumen.reservasEspacioMasSolicitado} reservas
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gráficos y Métricas Detalladas */}
      <div className="gestion-reportes-charts">
        {/* Uso de Espacios */}
        <div className="gestion-reportes-chart">
          <div className="gestion-reportes-chart-header">
            <h3 className="gestion-reportes-chart-title">
              <Server size={18} />
              Uso de Espacios
            </h3>
            <span className="gestion-reportes-chart-subtitle">
              Distribución de reservas por espacio (top 6)
            </span>
          </div>
          
          <div className="gestion-reportes-usage-bars">
            {data.usoEspacios.slice(0, 6).map((espacio, idx) => (
              <div key={idx} className="gestion-reportes-usage-bar">
                <div className="gestion-reportes-usage-info">
                  <span className="gestion-reportes-usage-name">
                    {espacio.codigoEspacio} - {espacio.nombreEspacio}
                  </span>
                  <span className="gestion-reportes-usage-percent">
                    {espacio.porcentajeUso.toFixed(1)}%
                  </span>
                </div>
                <div className="gestion-reportes-usage-track">
                  <div
                    className={`gestion-reportes-usage-progress ${
                      espacio.porcentajeUso > 75 ? 'gestion-reportes-usage-green' :
                      espacio.porcentajeUso > 50 ? 'gestion-reportes-usage-blue' :
                      espacio.porcentajeUso > 25 ? 'gestion-reportes-usage-yellow' : 'gestion-reportes-usage-gray'
                    }`}
                    style={{ width: `${Math.min(espacio.porcentajeUso, 100)}%` }}
                  ></div>
                </div>
                <div className="gestion-reportes-usage-details">
                  <span>{espacio.tipoEspacio}</span>
                  <span>{espacio.totalReservas} reservas</span>
                </div>
              </div>
            ))}
          </div>

          {data.usoEspacios.length === 0 && !loading && (
            <div className="gestion-reportes-empty gestion-reportes-empty-sm">
              <BarChart3 size={32} />
              <h3>No hay datos de uso</h3>
              <p>No se encontraron reservas para generar estadísticas</p>
            </div>
          )}
        </div>

        {/* Reservas por Mes */}
        <div className="gestion-reportes-chart">
          <div className="gestion-reportes-chart-header">
            <h3 className="gestion-reportes-chart-title">
              <Calendar size={18} />
              Reservas por Mes
            </h3>
            <span className="gestion-reportes-chart-subtitle">
              Tendencia de reservas en los últimos meses
            </span>
          </div>
          
          <div className="gestion-reportes-monthly">
            {data.reservasPorMes.map((mes, idx) => (
              <div key={idx} className="gestion-reportes-monthly-item">
                <div className="gestion-reportes-monthly-header">
                  <span className="gestion-reportes-monthly-name">{mes.mes} {mes.anio}</span>
                  <span className="gestion-reportes-monthly-count">{mes.totalReservas} reservas</span>
                </div>
              </div>
            ))}
          </div>

          {data.reservasPorMes.length === 0 && !loading && (
            <div className="gestion-reportes-empty gestion-reportes-empty-sm">
              <Calendar size={32} />
              <h3>No hay reservas mensuales</h3>
              <p>No se encontraron reservas para el análisis temporal</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};