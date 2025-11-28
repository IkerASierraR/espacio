import React, { useMemo, useState } from "react";
import { AlertCircle, Layers3, Plus, RefreshCw, Search } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
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

    return espacios.filter((espacio) => {
      return (
        espacio.nombre.toLowerCase().includes(query) ||
        espacio.codigo.toLowerCase().includes(query) ||
        espacio.tipo.toLowerCase().includes(query)
      );
    });
  }, [espacios, searchTerm]);

  const totalActivos = useMemo(
    () => espacios.filter((espacio) => espacio.estado === 1).length,
    [espacios]
  );

  const totalInactivos = useMemo(
    () => espacios.filter((espacio) => espacio.estado === 0).length,
    [espacios]
  );

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
      await loadEspacios();
      console.log("success", "Lista actualizada.");
    } catch (reloadError) {
      const message =
        reloadError instanceof Error
          ? reloadError.message
          : "No se pudo sincronizar la lista.";
      notifyStatus("error", message);
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
        <div className="gestion-espacios-search">
          <Search size={16} />
          <input
            type="search"
            maxLength={50}
            placeholder="Buscar por codigo, nombre o tipo"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
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
