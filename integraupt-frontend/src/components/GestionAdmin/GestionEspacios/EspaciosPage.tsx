import React, { useMemo, useState } from "react";
import { AlertCircle, Filter, Layers3, Plus, RefreshCw, Search } from "lucide-react";
import "../../../styles/GestionEspacios.css";
import { EspacioModal } from "./components/EspacioModal";
import { EspacioTable } from "./components/EspacioTable";
import type { Espacio, EspacioFormMode, EspacioFormValues } from "./types";
import {
  buildPayloadFromValues,
  createEmptyFormValues,
  mapEspacioToFormValues,
  validateEspacioValues
} from "./validators";
import { useEspacios } from "./hooks/useEspacios";
import { useEscuelas } from "./hooks/useEscuelas";
import { useFacultades } from "./hooks/useFacultades";
import type { EspacioFilters } from "./espaciosService";

interface GestionEspaciosProps {
  onAuditLog?: (message: string, detail?: string) => void;
}

type StatusMessage = {
  type: "success" | "error";
  text: string;
};

export const GestionEspacios: React.FC<GestionEspaciosProps> = ({ onAuditLog }) => {
  const { espacios, loading, error, loadEspacios, saveEspacio, removeEspacio } = useEspacios();
  const {
    escuelas,
    loading: escuelasLoading,
    error: escuelasError
  } = useEscuelas();
  const {
    facultades,
    loading: facultadesLoading,
    error: facultadesError
  } = useFacultades();
  const [searchTerm, setSearchTerm] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    estado: "all",
    escuelaId: "",
    facultadId: "",
    tipo: ""
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<EspacioFormMode>("create");
  const [formValues, setFormValues] = useState<EspacioFormValues>(createEmptyFormValues());
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);

  const filteredEspacios = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return espacios;
    }

    return espacios.filter((espacio) => espacio.nombre.toLowerCase().includes(query));
  }, [espacios, searchTerm]);

  const totalActivos = useMemo(
    () => espacios.filter((espacio) => espacio.estado === 1).length,
    [espacios]
  );

  const totalInactivos = useMemo(
    () => espacios.filter((espacio) => espacio.estado === 0).length,
    [espacios]
  );

  const facultadOptions = useMemo(() => {
    if (facultades.length > 0) {
      return facultades;
    }

    const uniqueIds = Array.from(new Set(escuelas.map((escuela) => escuela.facultadId)));
    return uniqueIds.map((id) => ({ id, nombre: `Facultad ${id}`, abreviatura: null }));
  }, [escuelas, facultades]);

  const buildFiltersPayload = (): EspacioFilters => {
    const payload: EspacioFilters = {};
    if (filters.estado === "activos") {
      payload.estado = 1;
    } else if (filters.estado === "inactivos") {
      payload.estado = 0;
    }

    const tipo = filters.tipo.trim();
    if (tipo) {
      payload.tipo = tipo;
    }

    const escuelaId = filters.escuelaId.trim();
    const facultadId = filters.facultadId.trim();

    if (escuelaId) {
      payload.escuelaId = Number(escuelaId);
    } else if (facultadId) {
      payload.facultadId = Number(facultadId);
    }

    return payload;
  };

  const openCreateModal = () => {
    setMode("create");
    setEditingId(null);
    setFormValues(createEmptyFormValues());
    setFormErrors([]);
    setModalOpen(true);
  };

  const openEditModal = (espacio: Espacio) => {
    setMode("edit");
    setEditingId(espacio.id);
    setFormValues(mapEspacioToFormValues(espacio));
    setFormErrors([]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSubmitting(false);
  };

  const handleValueChange = (field: keyof EspacioFormValues, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const notifyStatus = (type: StatusMessage["type"], text: string) => {
    setStatusMessage({ type, text });
  };

  const handleSubmit = async () => {
    const validation = validateEspacioValues(formValues);
    if (validation.length > 0) {
      setFormErrors(validation);
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildPayloadFromValues(formValues);
      const result = await saveEspacio(payload, editingId ?? undefined);
      notifyStatus(
        "success",
        mode === "create" ? "Espacio registrado correctamente." : "Espacio actualizado correctamente."
      );
      onAuditLog?.(
        mode === "create"
          ? `Registro de espacio ${result.nombre}`
          : `Actualizacion de espacio ${result.nombre}`,
        `Codigo ${result.codigo}`
      );
      setModalOpen(false);
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "No se pudo guardar el espacio.";
      setFormErrors([message]);
      notifyStatus("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (espacio: Espacio) => {
    const confirmed = window.confirm(
      `¿Deseas eliminar el espacio ${espacio.nombre} (${espacio.codigo})?`
    );
    if (!confirmed) {
      return;
    }

    try {
      await removeEspacio(espacio.id);
      notifyStatus("success", "Espacio eliminado correctamente.");
      onAuditLog?.(`Eliminacion de espacio ${espacio.nombre}`, `Codigo ${espacio.codigo}`);
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : "No se pudo eliminar el espacio.";
      notifyStatus("error", message);
    }
  };

  const handleReload = async () => {
    try {
      await loadEspacios(buildFiltersPayload());
      console.log("success", "Lista actualizada.");
    } catch (reloadError) {
      const message =
        reloadError instanceof Error
          ? reloadError.message
          : "No se pudo sincronizar la lista.";
      notifyStatus("error", message);
    }
  };

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters((prev) => {
      if (field === "escuelaId") {
        return {
          ...prev,
          escuelaId: value,
          facultadId: value ? "" : prev.facultadId
        };
      }

      if (field === "facultadId") {
        return {
          ...prev,
          facultadId: value,
          escuelaId: value ? "" : prev.escuelaId
        };
      }

      return {
        ...prev,
        [field]: value
      };
    });
  };

  const applyFilters = async () => {
    try {
      await loadEspacios(buildFiltersPayload());
      setFiltersOpen(false);
    } catch (filterError) {
      const message =
        filterError instanceof Error
          ? filterError.message
          : "No se pudieron aplicar los filtros.";
      notifyStatus("error", message);
    }
  };

  const clearFilters = async () => {
    setFilters({ estado: "all", escuelaId: "", facultadId: "", tipo: "" });
    try {
      await loadEspacios();
    } catch (error) {
      console.error("Error reloading espacios", error);
    }
  };

  return (
    <div className="gestion-espacios">
      <div className="gestion-espacios-header">
        <div>
          <h2 className="gestion-espacios-title">Gestion de Espacios</h2>
          <p className="gestion-espacios-subtitle">
            Administra los ambientes academicos y sincroniza los cambios en tiempo real.
          </p>
        </div>
        <div className="gestion-espacios-actions">
          <button
            type="button"
            className="gestion-espacios-btn secondary"
            onClick={handleReload}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Actualizar
          </button>
          <button
            type="button"
            className="gestion-espacios-btn primary"
            onClick={openCreateModal}
          >
            <Plus size={16} />
            Registrar espacio
          </button>
        </div>
      </div>

      <div className="gestion-espacios-stats">
        <div className="gestion-espacios-stat">
          <Layers3 size={20} />
          <div>
            <p>Total registrados</p>
            <strong>{espacios.length}</strong>
          </div>
        </div>
        <div className="gestion-espacios-stat">
          <span className="gestion-espacios-dot active" />
          <div>
            <p>Activos</p>
            <strong>{totalActivos}</strong>
          </div>
        </div>
        <div className="gestion-espacios-stat">
          <span className="gestion-espacios-dot inactive" />
          <div>
            <p>Inactivos</p>
            <strong>{totalInactivos}</strong>
          </div>
        </div>
      </div>

      <div className="gestion-espacios-toolbar">
        <div className="gestion-espacios-filter-group">
          <div className="gestion-espacios-search">
            <Search size={16} />
            <input
              type="search"
              maxLength={50}
              placeholder="Buscar por nombre"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="gestion-espacios-filter-toggle">
            <button
              type="button"
              className="gestion-espacios-btn ghost"
              onClick={() => setFiltersOpen((prev) => !prev)}
            >
              <Filter size={16} />
              Filtros
            </button>
            {filtersOpen && (
              <div className="gestion-espacios-filters-panel">
                <div className="gestion-espacios-filter-row">
                  <div className="gestion-espacios-filter">
                    <label htmlFor="estado">Estado</label>
                    <select
                      id="estado"
                      value={filters.estado}
                      onChange={(event) => handleFilterChange("estado", event.target.value)}
                    >
                      <option value="all">Todos</option>
                      <option value="activos">Activos</option>
                      <option value="inactivos">Inactivos</option>
                    </select>
                  </div>
                  <div className="gestion-espacios-filter">
                    <label htmlFor="escuela">Escuela</label>
                    <select
                      id="escuela"
                      value={filters.escuelaId}
                      disabled={Boolean(filters.facultadId)}
                      onChange={(event) => handleFilterChange("escuelaId", event.target.value)}
                    >
                      <option value="">Todas</option>
                      {escuelas.map((escuela) => (
                        <option key={escuela.id} value={escuela.id}>
                          {escuela.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="gestion-espacios-filter">
                    <label htmlFor="facultad">Facultad</label>
                    <select
                      id="facultad"
                      value={filters.facultadId}
                      disabled={Boolean(filters.escuelaId) || facultadesLoading}
                      onChange={(event) => handleFilterChange("facultadId", event.target.value)}
                    >
                      <option value="">Todas</option>
                      {facultadOptions.map((facultad) => (
                        <option key={facultad.id} value={facultad.id}>
                          {facultad.abreviatura && facultad.abreviatura.length > 0
                            ? `${facultad.abreviatura} — ${facultad.nombre}`
                            : facultad.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="gestion-espacios-filter">
                    <label htmlFor="tipo">Tipo</label>
                    <select
                      id="tipo"
                      value={filters.tipo}
                      onChange={(event) => handleFilterChange("tipo", event.target.value)}
                    >
                      <option value="">Todos</option>
                      <option value="laboratorio">Laboratorio</option>
                      <option value="salon">Salon</option>
                    </select>
                  </div>
                </div>
                <div className="gestion-espacios-filter-actions">
                  <p className="gestion-espacios-filter-hint">
                    Filtra por escuela o facultad, no ambos al mismo tiempo.
                  </p>
                  <div className="gestion-espacios-filter-buttons">
                    <button
                      type="button"
                      className="gestion-espacios-btn secondary"
                      onClick={clearFilters}
                      disabled={loading || escuelasLoading}
                    >
                      Limpiar filtros
                    </button>
                    <button
                      type="button"
                      className="gestion-espacios-btn primary"
                      onClick={applyFilters}
                      disabled={loading || escuelasLoading}
                    >
                      Aplicar filtros
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="gestion-espacios-meta">
          {filteredEspacios.length} resultados visibles
        </div>
      </div>

      {statusMessage && (
        <div
          className={`gestion-espacios-alert ${
            statusMessage.type === "success" ? "success" : "error"
          }`}
        >
          {statusMessage.type === "error" && <AlertCircle size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {error && (
        <div className="gestion-espacios-alert error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      {escuelasError && (
        <div className="gestion-espacios-alert error">
          <AlertCircle size={16} />
          <span>{escuelasError}</span>
        </div>
      )}

      {facultadesError && (
        <div className="gestion-espacios-alert error">
          <AlertCircle size={16} />
          <span>{facultadesError}</span>
        </div>
      )}
      
      <EspacioTable
        espacios={filteredEspacios}
        loading={loading}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      <EspacioModal
        open={modalOpen}
        mode={mode}
        values={formValues}
        errors={formErrors}
        submitting={submitting}
        escuelas={escuelas}
        escuelasLoading={escuelasLoading}
        escuelasError={escuelasError}
        onClose={closeModal}
        onChange={handleValueChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
