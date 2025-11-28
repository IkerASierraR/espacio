import React, { useMemo, useState } from "react";
import { Briefcase, GraduationCap, Loader2, Users, UserPlus, ShieldCheck } from "lucide-react";
import { UsuarioTable } from "./components/UsuarioTable";
import { UsuarioFilters, type UsuarioStatusFilter } from "./components/UsuarioFilters";
import { UsuarioModal } from "./components/UsuarioModal";
import { useUsuarios } from "./hooks/useUsuarios";
import {
  type BackendAdministrativo,
  type BackendDocente,
  type BackendEstudiante,
  type UsuarioFormValues,
  type UsuarioRecord,
  createEmptyFormValues
} from "./types";
import type { UsuarioRole } from "./usuariosService";
import { buildPayloadFromValues, validateUsuarioForm } from "./validators";
import { mapEntityToFormValues, mapEntityToRecord } from "./mappers";
import "../../../styles/GestionUsuarios.css";

interface UsuariosPageProps {
  onAuditLog?: (message: string, detail?: string) => void;
}

type ModalMode = "create" | "edit";

type BackendEntity = BackendEstudiante | BackendDocente | BackendAdministrativo;

const TABS: Array<{
  id: UsuarioRole;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    id: "administrativo",
    label: "Administrativos",
    description: "Personal responsable de la gestion del sistema",
    icon: <Briefcase size={18} />
  },
  {
    id: "docente",
    label: "Docentes",
    description: "Profesores activos y contratados",
    icon: <ShieldCheck size={18} />
  },
  {
    id: "estudiante",
    label: "Estudiantes",
    description: "Usuarios matriculados en las escuelas",
    icon: <GraduationCap size={18} />
  }
];

const DEFAULT_STATUS: UsuarioStatusFilter = "all";

export const GestionUsuarios: React.FC<UsuariosPageProps> = ({ onAuditLog }) => {
  const [activeRole, setActiveRole] = useState<UsuarioRole>("administrativo");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<UsuarioStatusFilter>(DEFAULT_STATUS);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [modalOpen, setModalOpen] = useState(false);
  const [formValues, setFormValues] = useState<UsuarioFormValues>(createEmptyFormValues());
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { items, loading, error, catalogs, reload, createItem, updateItem, changeEstado } =
    useUsuarios(activeRole);

  const records = useMemo<UsuarioRecord[]>(
    () => items.map((entity) => mapEntityToRecord(activeRole, entity as BackendEntity)),
    [items, activeRole]
  );

  const filteredRecords = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return records.filter((record) => {
      const matchesSearch =
        !search ||
        record.nombres.toLowerCase().includes(search) ||
        record.apellidos.toLowerCase().includes(search) ||
        (record.codigo?.toLowerCase().includes(search) ?? false) ||
        record.correo.toLowerCase().includes(search) ||
        (record.escuela?.toLowerCase().includes(search) ?? false) ||
        (record.turno?.toLowerCase().includes(search) ?? false);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && record.estado === 1) ||
        (statusFilter === "inactive" && record.estado !== 1);

      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, statusFilter]);

  const totalActivos = useMemo(() => records.filter((record) => record.estado === 1).length, [records]);
  const totalInactivos = useMemo(() => records.filter((record) => record.estado !== 1).length, [records]);
  const ultimaActualizacion = useMemo(() => {
    const fechas = records
      .map((record) => (record.fechaRegistro ? new Date(record.fechaRegistro) : null))
      .filter((date): date is Date => !!date && !Number.isNaN(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime());
    if (fechas.length === 0) {
      return "Sin registros recientes";
    }
    return fechas[0].toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" });
  }, [records]);

  const handleTabChange = (role: UsuarioRole) => {
    setActiveRole(role);
    setSearchTerm("");
    setStatusFilter(DEFAULT_STATUS);
    setFormErrors([]);
    setModalOpen(false);
  };

  const openCreateModal = () => {
    setModalMode("create");
    setFormValues(createEmptyFormValues());
    setFormErrors([]);
    setSelectedId(null);
    setModalOpen(true);
  };

  const findEntityById = (id: number): BackendEntity | undefined => {
    switch (activeRole) {
      case "estudiante":
        return (items as BackendEstudiante[]).find((item) => item.idEstudiante === id);
      case "docente":
        return (items as BackendDocente[]).find((item) => item.idDocente === id);
      case "administrativo":
        return (items as BackendAdministrativo[]).find((item) => item.idAdministrativo === id);
      default:
        return undefined;
    }
  };

  const openEditModal = (record: UsuarioRecord) => {
    const entity = findEntityById(record.id);
    if (!entity) {
      setFormErrors(["No se encontro la informacion completa del usuario seleccionado."]);
      return;
    }
    setModalMode("edit");
    setSelectedId(record.id);
    setFormValues(mapEntityToFormValues(activeRole, entity));
    setFormErrors([]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSubmitting(false);
  };

  const handleValueChange = (field: keyof UsuarioFormValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const validation = validateUsuarioForm(activeRole, formValues, modalMode === "edit");
    if (validation.errors.length > 0) {
      setFormErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      if (activeRole === "estudiante") {
        const payload = buildPayloadFromValues("estudiante", formValues);
        if (modalMode === "create") {
          const created = await createItem(payload);
          setModalOpen(false);
          onAuditLog?.(
            "Registro de estudiante",
            `${created.usuario.nombre} ${created.usuario.apellido}`
          );
        } else if (selectedId != null) {
          const updated = await updateItem(selectedId, payload);
          setModalOpen(false);
          onAuditLog?.(
            "Actualizacion de estudiante",
            `${updated.usuario.nombre} ${updated.usuario.apellido}`
          );
        }
        return;
      }

      if (activeRole === "docente") {
        const payload = buildPayloadFromValues("docente", formValues);
        if (modalMode === "create") {
          const created = await createItem(payload);
          setModalOpen(false);
          onAuditLog?.(
            "Registro de docente",
            `${created.usuario.nombre} ${created.usuario.apellido}`
          );
        } else if (selectedId != null) {
          const updated = await updateItem(selectedId, payload);
          setModalOpen(false);
          onAuditLog?.(
            "Actualizacion de docente",
            `${updated.usuario.nombre} ${updated.usuario.apellido}`
          );
        }
        return;
      }

      const payload = buildPayloadFromValues("administrativo", formValues);
      if (modalMode === "create") {
        const created = await createItem(payload);
        setModalOpen(false);
        onAuditLog?.(
          "Registro de administrativo",
          `${created.usuario.nombre} ${created.usuario.apellido}`
        );
      } else if (selectedId != null) {
        const updated = await updateItem(selectedId, payload);
        setModalOpen(false);
        onAuditLog?.(
          "Actualizacion de administrativo",
          `${updated.usuario.nombre} ${updated.usuario.apellido}`
        );
      }
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "No se pudo guardar el usuario.";
      setFormErrors([message]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleEstado = async (record: UsuarioRecord) => {
    const activar = record.estado !== 1;
    const actionLabel = activar ? "habilitar" : "deshabilitar";
    const confirmed = window.confirm(
      `¿Deseas ${actionLabel} a ${record.nombres} ${record.apellidos}?`
    );
    if (!confirmed) {
      return;
    }
    try {
      const updated = await changeEstado(record.id, activar);
      const auditLabel = activar ? "Activacion" : "Inactivacion";
      onAuditLog?.(
        `${auditLabel} de ${record.role}`,
        `${updated.usuario.nombre} ${updated.usuario.apellido}`
      );
    } catch (updateError) {
      const message =
        updateError instanceof Error ? updateError.message : "No se pudo actualizar el estado.";
      setFormErrors([message]);
      setModalOpen(false);
    }
  };

  return (
    <div className="usuarios-page">
      <header className="usuarios-header">
        <div>
          <h2>Gestion de Usuarios</h2>
          <p>Administra estudiantes, docentes y personal administrativo desde un unico lugar.</p>
        </div>
        <button type="button" className="usuarios-new-button" onClick={openCreateModal}>
          <UserPlus size={16} />
          Nuevo usuario
        </button>
      </header>

      <section className="usuarios-stats">
        <article className="usuarios-stat-card">
          <div className="usuarios-stat-icon usuarios-stat-icon-primary">
            <Users size={20} />
          </div>
          <div>
            <span className="usuarios-stat-label">Total registrados</span>
            <span className="usuarios-stat-value">{records.length}</span>
          </div>
        </article>
        <article className="usuarios-stat-card">
          <div className="usuarios-stat-icon usuarios-stat-icon-success">
            <ShieldCheck size={20} />
          </div>
          <div>
            <span className="usuarios-stat-label">Activos</span>
            <span className="usuarios-stat-value">{totalActivos}</span>
          </div>
        </article>
        <article className="usuarios-stat-card">
          <div className="usuarios-stat-icon usuarios-stat-icon-warning">
            <GraduationCap size={20} />
          </div>
          <div>
            <span className="usuarios-stat-label">Inactivos</span>
            <span className="usuarios-stat-value">{totalInactivos}</span>
          </div>
        </article>
        <article className="usuarios-stat-card">
          <div className="usuarios-stat-icon usuarios-stat-icon-info">
            <Loader2 size={20} />
          </div>
          <div>
            <span className="usuarios-stat-label">Ultima actualizacion</span>
            <span className="usuarios-stat-value usuarios-stat-small">{ultimaActualizacion}</span>
          </div>
        </article>
      </section>

      <nav className="usuarios-tabs" aria-label="Tipos de usuarios">
        {TABS.map((tab) => {
          const isActive = tab.id === activeRole;
          return (
            <button
              key={tab.id}
              type="button"
              className={`usuarios-tab ${isActive ? "usuarios-tab-active" : ""}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <span className="usuarios-tab-icon">{tab.icon}</span>
              <span>
                <strong>{tab.label}</strong>
                <small>{tab.description}</small>
              </span>
            </button>
          );
        })}
      </nav>

      <section className="usuarios-card">
        <UsuarioFilters
          search={searchTerm}
          status={statusFilter}
          onSearchChange={setSearchTerm}
          onStatusChange={setStatusFilter}
          onReload={() => {
            setFormErrors([]);
            void reload();
          }}
          total={records.length}
          filtered={filteredRecords.length}
          loading={loading}
          role={activeRole}
        />

        {error && <div className="usuarios-error">{error}</div>}

        <UsuarioTable
          rows={filteredRecords}
          loading={loading}
          onEdit={openEditModal}
          onToggleEstado={handleToggleEstado}
          activeRole={activeRole}
        />
      </section>

      <UsuarioModal
        open={modalOpen}
        mode={modalMode}
        role={activeRole}
        values={formValues}
        catalogs={catalogs}
        errors={formErrors}
        onChange={handleValueChange}
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </div>
  );
};