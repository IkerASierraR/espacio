import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  ListChecks,
  Plus,
  RefreshCw,
  Search
} from "lucide-react";
import "../../../styles/GestionHorarios.css";
import { HorarioTable } from "./components/HorarioTable";
import { HorarioForm } from "./components/HorarioForm";
import { useHorarios } from "./hooks/useHorarios";
import { useHorarioCatalogos } from "./hooks/useHorarioCatalogos";
import type { Horario, HorarioFormMode, HorarioFormValues } from "./types";
import {
  buildPayloadFromValues,
  createEmptyFormValues,
  mapHorarioToFormValues,
  validateHorarioValues
} from "./validators";

interface StatusMessage {
  type: "success" | "error";
  text: string;
}

export const GestionHorarios: React.FC = () => {
  const {
    horarios,
    loading,
    error,
    loadHorarios,
    saveHorario,
    removeHorario
  } = useHorarios();
  const {
    catalogos,
    loading: catalogosLoading,
    error: catalogosError,
    reloadCatalogos
  } = useHorarioCatalogos();

  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [formValues, setFormValues] = useState<HorarioFormValues>(createEmptyFormValues());
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<HorarioFormMode>("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);

  const filteredHorarios = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return horarios;
    }
    return horarios.filter((horario) => {
      return (
        horario.cursoNombre.toLowerCase().includes(query) ||
        horario.docenteNombre.toLowerCase().includes(query) ||
        horario.espacioNombre.toLowerCase().includes(query)
      );
    });
  }, [horarios, searchTerm]);

  const totalActivos = useMemo(() => horarios.filter((horario) => horario.estado).length, [horarios]);

  const openCreateModal = () => {
    setMode("create");
    setEditingId(null);
    setFormValues(createEmptyFormValues());
    setFormErrors([]);
    setModalOpen(true);
  };

  const openEditModal = (horario: Horario) => {
    setMode("edit");
    setEditingId(horario.id);
    setFormValues(mapHorarioToFormValues(horario));
    setFormErrors([]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSubmitting(false);
  };

  const handleValueChange = (field: keyof HorarioFormValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const notify = (type: StatusMessage["type"], text: string) => {
    setStatusMessage({ type, text });
  };

  const handleSubmit = async () => {
    const validation = validateHorarioValues(formValues);
    if (validation.length > 0) {
      setFormErrors(validation);
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildPayloadFromValues(formValues);
      const result = await saveHorario(payload, editingId ?? undefined);
      notify(
        "success",
        mode === "create"
          ? "Horario registrado correctamente."
          : `Horario de ${result.cursoNombre} actualizado.`
      );
      closeModal();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "No se pudo guardar el horario.";
      setFormErrors([message]);
      notify("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (horario: Horario) => {
    const confirmed = window.confirm(
      `¿Desea eliminar el horario del curso ${horario.cursoNombre} en ${horario.espacioNombre}?`
    );
    if (!confirmed) {
      return;
    }
    try {
      await removeHorario(horario.id);
      notify("success", "Horario eliminado.");
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : "No se pudo eliminar el horario.";
      notify("error", message);
    }
  };

  const handleReload = async () => {
    try {
      await Promise.all([loadHorarios(), reloadCatalogos()]);
      notify("success", "Catalogos y horarios actualizados.");
    } catch (reloadError) {
      const message =
        reloadError instanceof Error
          ? reloadError.message
          : "No se pudieron sincronizar los datos.";
      notify("error", message);
    }
  };

  return (
    <div className="gestion-horarios">
      <div className="gestion-horarios-header">
        <div>
          <h2 className="gestion-horarios-title">Gestion de Horarios Fijos</h2>
          <p className="gestion-horarios-subtitle">
            Administra los cursos asignados a docentes y espacios con sincronizacion directa al
            horariocurso-backend.
          </p>
        </div>
        <div className="gestion-horarios-actions">
          <button
            type="button"
            className="gestion-horarios-btn secondary"
            onClick={handleReload}
            disabled={loading || catalogosLoading}
          >
            <RefreshCw size={16} />
            Actualizar
          </button>
          <button
            type="button"
            className="gestion-horarios-btn primary"
            onClick={openCreateModal}
          >
            <Plus size={16} />
            Registrar horario
          </button>
        </div>
      </div>

      <div className="gestion-horarios-stats">
        <div className="gestion-horarios-stat">
          <ListChecks size={20} />
          <div>
            <p>Total registrados</p>
            <strong>{horarios.length}</strong>
          </div>
        </div>
        <div className="gestion-horarios-stat">
          <CalendarClock size={20} />
          <div>
            <p>Activos</p>
            <strong>{totalActivos}</strong>
          </div>
        </div>
        <div className="gestion-horarios-stat">
          <span className="gestion-horarios-dot inactive" />
          <div>
            <p>Inactivos</p>
            <strong>{horarios.length - totalActivos}</strong>
          </div>
        </div>
      </div>

      <div className="gestion-horarios-toolbar">
        <div className="gestion-horarios-search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Buscar por curso, docente o espacio"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="gestion-horarios-meta">{filteredHorarios.length} resultados visibles</div>
      </div>

      {statusMessage && (
        <div
          className={`gestion-horarios-alert ${
            statusMessage.type === "success" ? "success" : "error"
          }`}
        >
          {statusMessage.type === "error" && <AlertCircle size={16} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {error && (
        <div className="gestion-horarios-alert error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {catalogosError && (
        <div className="gestion-horarios-alert error">
          <AlertCircle size={16} />
          <span>{catalogosError}</span>
        </div>
      )}

      <HorarioTable
        horarios={filteredHorarios}
        loading={loading}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      {modalOpen && (
        <div className="horario-modal-backdrop">
          <div className="horario-modal">
            <div className="horario-modal-header">
              <div>
                <h3>{mode === "create" ? "Registrar horario" : "Editar horario"}</h3>
                <p>
                  Selecciona curso, docente, espacio y bloque disponibles. Todos los campos son
                  obligatorios.
                </p>
              </div>
              <button type="button" className="horario-modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <HorarioForm
              mode={mode}
              values={formValues}
              errors={formErrors}
              submitting={submitting}
              catalogos={catalogos}
              catalogosLoading={catalogosLoading}
              onChange={handleValueChange}
              onSubmit={handleSubmit}
              onCancel={closeModal}
            />
          </div>
        </div>
      )}
    </div>
  );
};
