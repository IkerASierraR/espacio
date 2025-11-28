import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal
} from "lucide-react";
import type { AuditoriaFiltro } from "./types";
import { useAuditorias } from "./hooks/useAuditorias";
import { AuditoriaTable } from "./components/AuditoriaTable";
import { AuditExport, type AuditExportFormat } from "./components/AuditExport";
import "./styles/GestionAuditoria.css";
import { descargarAuditoriaExcel, descargarAuditoriaPdf } from "./auditoriaService";

interface GestionAuditoriaProps {
  onAuditLog?: (message: string, detail?: string) => void;
}

type StatusMessage = {
  type: "success" | "error";
  text: string;
};

type AuditoriaFilterForm = {
  reservaId: string;
  estado: string;
  usuario: string;
  fechaInicio: string;
  fechaFin: string;
};

const ESTADOS_RESERVA = ["Pendiente", "Aprobada", "Rechazada", "Cancelada"];

const dispararDescarga = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const sanitizeFilters = (form: AuditoriaFilterForm): AuditoriaFiltro => {
  const filters: AuditoriaFiltro = {};
  if (form.reservaId.trim()) {
    const parsed = Number(form.reservaId);
    if (!Number.isNaN(parsed)) {
      filters.reservaId = parsed;
    }
  }
  if (form.estado.trim()) {
    filters.estado = form.estado.trim();
  }
  if (form.usuario.trim()) {
    filters.usuario = form.usuario.trim();
  }
  if (form.fechaInicio.trim()) {
    filters.fechaInicio = form.fechaInicio.trim();
  }
  if (form.fechaFin.trim()) {
    filters.fechaFin = form.fechaFin.trim();
  }
  return filters;
};

const buildFormFromFilters = (filters: AuditoriaFiltro): AuditoriaFilterForm => ({
  reservaId: filters.reservaId?.toString() ?? "",
  estado: filters.estado ?? "",
  usuario: filters.usuario ?? "",
  fechaInicio: filters.fechaInicio ?? "",
  fechaFin: filters.fechaFin ?? ""
});

export const GestionAuditoria: React.FC<GestionAuditoriaProps> = ({ onAuditLog }) => {
  const {
    auditorias,
    loading,
    error,
    filters,
    lastUpdated,
    loadAuditorias,
    applyFilters,
    resetFilters,
    resumenEstados
  } = useAuditorias();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [filterForm, setFilterForm] = useState<AuditoriaFilterForm>(buildFormFromFilters(filters));

  useEffect(() => {
    setFilterForm(buildFormFromFilters(filters));
  }, [filters]);

  const notifyStatus = useCallback((type: StatusMessage["type"], text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4500);
  }, []);

  const handleReload = useCallback(async () => {
    try {
      await loadAuditorias();
      notifyStatus("success", "Lista sincronizada con auditoria-backend.");
      onAuditLog?.("Sincronizacion de auditoria", "Historial actualizado manualmente.");
    } catch (reloadError) {
      const message =
        reloadError instanceof Error ? reloadError.message : "No se pudo sincronizar la lista.";
      notifyStatus("error", message);
      onAuditLog?.("Error sincronizando auditoria", message);
    }
  }, [loadAuditorias, notifyStatus, onAuditLog]);

  const handleApplyFilters = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const filtersToApply = sanitizeFilters(filterForm);
    try {
      await applyFilters(filtersToApply);
      notifyStatus("success", "Filtros aplicados correctamente.");
      onAuditLog?.("Filtros en historial", JSON.stringify(filtersToApply));
    } catch (applyError) {
      const message =
        applyError instanceof Error ? applyError.message : "No se pudo aplicar los filtros.";
      notifyStatus("error", message);
    }
  };

  const handleResetFilters = async () => {
    setFilterForm(buildFormFromFilters({}));
    try {
      await resetFilters();
      notifyStatus("success", "Se restablecieron los filtros.");
      onAuditLog?.("Filtros en historial", "Se limpiaron los filtros aplicados.");
    } catch (resetError) {
      const message =
        resetError instanceof Error ? resetError.message : "No se pudieron limpiar los filtros.";
      notifyStatus("error", message);
    }
  };

  const handleExport = useCallback(
    async (format: AuditExportFormat) => {
      try {
        const blob =
          format === "pdf"
            ? await descargarAuditoriaPdf(filters)
            : await descargarAuditoriaExcel(filters);
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, "-");
        const filename = `auditoria_reservas_${timestamp}.${format === "pdf" ? "pdf" : "xlsx"}`;
        dispararDescarga(blob, filename);
        notifyStatus("success", `Archivo ${format.toUpperCase()} generado correctamente.`);
        onAuditLog?.(`Exportacion ${format.toUpperCase()}`, `Archivo ${filename}`);
      } catch (exportError) {
        const message =
          exportError instanceof Error
            ? exportError.message
            : "No se pudo exportar la auditoria.";
        notifyStatus("error", message);
        onAuditLog?.("Error exportando auditoria", message);
        throw exportError;
      }
    },
    [filters, notifyStatus, onAuditLog]
  );

  const filteredAuditorias = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return auditorias;
    }
    return auditorias.filter((auditoria) => {
      return (
        auditoria.idAudit.toString().includes(query) ||
        auditoria.idReserva.toString().includes(query) ||
        auditoria.estadoNuevo.toLowerCase().includes(query) ||
        auditoria.estadoAnterior.toLowerCase().includes(query) ||
        (auditoria.usuarioCambioNombre ?? "").toLowerCase().includes(query) ||
        (auditoria.nombreEspacio ?? "").toLowerCase().includes(query)
      );
    });
  }, [auditorias, searchTerm]);

  const totalRegistros = auditorias.length;
  const totalFiltrados = filteredAuditorias.length;

  const estadoStats = useMemo(() => {
    return ESTADOS_RESERVA.map((estado) => ({
      estado,
      total: resumenEstados[estado.toUpperCase()] ?? 0
    }));
  }, [resumenEstados]);

  return (
    <div className="gestion-auditoria">
      <div className="gestion-auditoria-header">
        <div>
          <h2 className="gestion-auditoria-title">Gestion de Auditoria de Reservas</h2>
          <p className="gestion-auditoria-subtitle">
            Consulta los cambios de estado realizados sobre las reservas y detecta anomalias
            rapidamente.
          </p>
        </div>
        <div className="gestion-auditoria-actions">
          <button
            type="button"
            className="auditoria-btn secondary"
            onClick={handleReload}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="gestion-auditoria-stats">
        <div className="auditoria-stat-card">
          <ShieldCheck size={20} />
          <div>
            <p>Total de eventos</p>
            <strong>{totalRegistros}</strong>
            {lastUpdated && (
              <small>Ultima sincronizacion: {new Date(lastUpdated).toLocaleString()}</small>
            )}
          </div>
        </div>
        {estadoStats.map((stat) => (
          <div className="auditoria-stat-card" key={stat.estado}>
            <span className={`auditoria-dot estado-${stat.estado.toLowerCase()}`} />
            <div>
              <p>{stat.estado}</p>
              <strong>{stat.total}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className="gestion-auditoria-toolbar">
        <div className="gestion-auditoria-search">
          <Search size={16} />
          <input
            type="search"
            maxLength={50}
            placeholder="Buscar por auditoria, reserva, usuario o espacio"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="gestion-auditoria-meta">
          {totalFiltrados} resultados visibles (de {totalRegistros})
        </div>
      </div>

      <form className="gestion-auditoria-filters" onSubmit={handleApplyFilters}>
        <div className="gestion-auditoria-filters-title">
          <SlidersHorizontal size={16} />
          <span>Filtros avanzados</span>
        </div>
        <div className="gestion-auditoria-filters-grid">
          <label>
            <span>ID Reserva</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{1,4}"
              maxLength={4}
              value={filterForm.reservaId}
              onChange={(event) => {
                const value = event.target.value;
                if (/^\d{0,4}$/.test(value)) {
                  setFilterForm((prev) => ({ ...prev, reservaId: value }));
                }
              }}
              placeholder="Ej: 120"
            />
          </label>
          <label>
            <span>Estado</span>
            <select
              value={filterForm.estado}
              onChange={(event) =>
                setFilterForm((prev) => ({ ...prev, estado: event.target.value }))
              }
            >
              <option value="">Todos</option>
              {ESTADOS_RESERVA.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Usuario</span>
            <input
              type="text"
              maxLength={25}
              value={filterForm.usuario}
              onChange={(event) =>
                setFilterForm((prev) => ({
                  ...prev,
                  usuario: event.target.value
                }))
              }
              placeholder="Nombre o documento"
            />
          </label>
          <label>
            <span>Fecha inicio</span>
            <input
              type="datetime-local"
              value={filterForm.fechaInicio}
              onChange={(event) =>
                setFilterForm((prev) => ({ ...prev, fechaInicio: event.target.value }))
              }
            />
          </label>

          <label>
            <span>Fecha fin</span>
            <input
              type="datetime-local"
              value={filterForm.fechaFin}
              onChange={(event) =>
                setFilterForm((prev) => ({ ...prev, fechaFin: event.target.value }))
              }
            />
          </label>
        </div>
        <div className="gestion-auditoria-filters-actions">
          <button type="submit" className="auditoria-btn primary" disabled={loading}>
            <Filter size={16} />
            Aplicar filtros
          </button>
          <button
            type="button"
            className="auditoria-btn ghost"
            onClick={handleResetFilters}
            disabled={loading}
          >
            Restablecer
          </button>
        </div>
      </form>

      {statusMessage && (
        <div
          className={`gestion-auditoria-alert ${
            statusMessage.type === "success" ? "success" : "error"
          }`}
        >
          {statusMessage.type === "error" && <AlertCircle size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {error && (
        <div className="gestion-auditoria-alert error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <AuditExport onExport={handleExport} />

      <AuditoriaTable auditorias={filteredAuditorias} loading={loading} />
    </div>
  );
};