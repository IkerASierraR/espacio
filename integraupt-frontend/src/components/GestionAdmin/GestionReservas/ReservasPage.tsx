import React, { useCallback, useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  ClipboardCheck,
  Inbox,
  Loader2,
  ShieldAlert
} from "lucide-react";
import { ReservaFilters } from "./components/ReservaFilters";
import { ReservaCard } from "./components/ReservaCard";
import { ReservaModal } from "./components/ReservaModal";
import { useReservasAdmin } from "./hooks/useReservas";
import type { AdminReserva, AdminReservaSummary, ReservaEstado } from "./types";
import { esEstadoGestionable } from "./validators";

interface UserMetadata {
  [key: string]: unknown;
}

interface CurrentUser {
  id?: string | number;
  user_metadata?: UserMetadata;
}

interface GestionReservasProps {
  onAuditLog?: (message: string, detail?: string) => void;
  currentUser?: CurrentUser;
}

const parseNumeric = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};
const parseStringValue = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
};

const resolveRole = (metadata: UserMetadata | undefined): string | null => {
  if (!metadata) {
    return null;
  }
  const candidates = [
    metadata["role"],
    metadata["rol"],
    metadata["userRole"],
    metadata["user_role"],
    metadata["perfil"],
    metadata["profileRole"],
    metadata["profile_role"],
    metadata["tipoRol"],
    metadata["tipo_rol"]
  ];
  for (const candidate of candidates) {
    const parsed = parseStringValue(candidate);
    if (parsed) {
      return parsed;
    }
  }
  return null;
};

const resolveLoginType = (metadata: UserMetadata | undefined): string | null => {
  if (!metadata) {
    return null;
  }
  const candidates = [
    metadata["login_type"],
    metadata["loginType"],
    metadata["tipoLogin"],
    metadata["tipo_login"],
    metadata["loginTipo"],
    metadata["login_tipo"]
  ];
  for (const candidate of candidates) {
    const parsed = parseStringValue(candidate);
    if (parsed) {
      return parsed;
    }
  }
  return null;
};

const resolveEscuelaId = (metadata: UserMetadata | undefined): number | null => {
  if (!metadata) {
    return null;
  }
  const candidates = [
    metadata["escuelaId"],
    metadata["escuela_id"],
    metadata["idEscuela"],
    metadata["id_escuela"],
    metadata["escuelaAsignadaId"],
    metadata["escuela_asignada_id"],
    metadata["schoolId"],
    metadata["school_id"]
  ];
  for (const candidate of candidates) {
    const parsed = parseNumeric(candidate);
    if (parsed != null) {
      return parsed;
    }
  }
  return null;
};

const resolveEscuelaNombre = (metadata: UserMetadata | undefined): string | null => {
  if (!metadata) {
    return null;
  }
  const candidates = [
    metadata["escuelaNombre"],
    metadata["escuela_nombre"],
    metadata["escuela"],
    metadata["schoolName"],
    metadata["school_name"],
    metadata["escuelaAsignada"],
    metadata["escuela_asignada"]
  ];
  for (const candidate of candidates) {
    const parsed = parseStringValue(candidate);
    if (parsed) {
      return parsed;
    }
  }
  return null;
};

const resolveFacultadNombre = (metadata: UserMetadata | undefined): string | null => {
  if (!metadata) {
    return null;
  }
  const candidates = [
    metadata["facultadNombre"],
    metadata["facultad_nombre"],
    metadata["facultad"],
    metadata["facultyName"],
    metadata["faculty_name"],
    metadata["facultadAsignada"],
    metadata["facultad_asignada"]
  ];
  for (const candidate of candidates) {
    const parsed = parseStringValue(candidate);
    if (parsed) {
      return parsed;
    }
  }
  return null;
};
const resolveUsuarioGestionId = (user?: CurrentUser): number | null => {
  if (!user) {
    return null;
  }
  const metadata = user.user_metadata ?? {};
  const candidates = [
    metadata.backendUserId,
    metadata.backend_user_id,
    metadata.usuarioId,
    metadata.usuario_id,
    metadata.idUsuario,
    metadata.id_usuario,
    metadata.administrativoId,
    metadata.administrativo_id,
    metadata.userId,
    metadata.user_id,
    user.id
  ];
  for (const candidate of candidates) {
    const parsed = parseNumeric(candidate);
    if (parsed != null) {
      return parsed;
    }
  }
  return null;
};

const TAB_DEFINITIONS: Array<{
  estado: ReservaEstado;
  titulo: string;
  descripcion: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    estado: "Pendiente",
    titulo: "Pendientes",
    descripcion: "Solicitudes que requieren revisión",
    Icon: ClipboardCheck
  },
  {
    estado: "Aprobada",
    titulo: "Aprobadas",
    descripcion: "Reservas aceptadas",
    Icon: CheckCircle2
  },
  {
    estado: "Rechazada",
    titulo: "Rechazadas",
    descripcion: "Solicitudes denegadas",
    Icon: Ban
  }
];

const buildResumenPorEstado = (resumen: AdminReservaSummary): Record<ReservaEstado, number> => ({
  Pendiente: resumen.pendientes,
  Aprobada: resumen.aprobadas,
  Rechazada: resumen.rechazadas,
  Cancelada: resumen.canceladas
});

export const ReservasPage: React.FC<GestionReservasProps> = ({ onAuditLog, currentUser }) => {
  const usuarioGestionId = useMemo(() => resolveUsuarioGestionId(currentUser), [currentUser]);

   const metadata: UserMetadata = currentUser?.user_metadata ?? {};
    const resolvedRole = resolveRole(metadata);
    const normalizedRole = resolvedRole?.trim().toLowerCase() ?? "";
    const loginType = resolveLoginType(metadata)?.trim().toLowerCase() ?? "";
    const isSupervisor = normalizedRole === "supervisor";
    const allowCatalogFilters = loginType === "administrative" && !isSupervisor;
    const supervisorEscuelaId = resolveEscuelaId(metadata);
    const supervisorEscuelaNombre = resolveEscuelaNombre(metadata);
    const supervisorFacultadNombre = resolveFacultadNombre(metadata);
    const usuarioRolForBackend = normalizedRole.length > 0 ? normalizedRole : null;

  const {
    reservas,
    resumen,
    filtros,
    catalogos,
    catalogosLoading,
    catalogosError,
    loading,
    error,
    submitting,
    submitError,
    successMessage,
    escuelasFiltradas,
    onChangeFiltro,
    onCambiarEstado,
    onResetFiltros,
    onGestionarReserva,
    clearErrors,
    clearFeedback
  } = useReservasAdmin(usuarioGestionId, {
      allowCatalogFilters,
      supervisorEscuelaId,
      usuarioRol: usuarioRolForBackend
    });

    const lockedEscuelaNombre = useMemo(() => {
      if (allowCatalogFilters) {
        return null;
      }
      if (supervisorEscuelaId != null) {
        const match =
          escuelasFiltradas.find((escuela) => escuela.id === supervisorEscuelaId) ||
          catalogos?.escuelas?.find((escuela) => escuela.id === supervisorEscuelaId);
        if (match) {
          return match.nombre;
        }
      }
      if (!allowCatalogFilters && catalogos?.escuelas?.length === 1) {
        return catalogos.escuelas[0].nombre;
      }
      return supervisorEscuelaNombre ?? null;
    }, [allowCatalogFilters, catalogos, escuelasFiltradas, supervisorEscuelaId, supervisorEscuelaNombre]);

    const lockedFacultadNombre = useMemo(() => {
      if (allowCatalogFilters) {
        return null;
      }
      if (supervisorEscuelaId != null) {
        const escuelaAsignada =
          escuelasFiltradas.find((escuela) => escuela.id === supervisorEscuelaId) ||
          catalogos?.escuelas?.find((escuela) => escuela.id === supervisorEscuelaId);
        if (escuelaAsignada && catalogos?.facultades) {
          const facultad = catalogos.facultades.find((item) => item.id === escuelaAsignada.facultadId);
          if (facultad) {
            return facultad.nombre;
          }
        }
      }
      if (!allowCatalogFilters && catalogos?.facultades?.length === 1) {
        return catalogos.facultades[0].nombre;
      }
      return supervisorFacultadNombre ?? null;
    }, [allowCatalogFilters, catalogos, escuelasFiltradas, supervisorEscuelaId, supervisorFacultadNombre]);

    const isSupervisorWithoutEscuela = !allowCatalogFilters && isSupervisor && supervisorEscuelaId == null;


  const [modalAbierta, setModalAbierta] = useState(false);
  const [modalAccion, setModalAccion] = useState<"Aprobar" | "Rechazar" | null>(null);
  const [reservaSeleccionada, setReservaSeleccionada] = useState<AdminReserva | null>(null);

  const handleSolicitarGestion = useCallback((reserva: AdminReserva, accion: "Aprobar" | "Rechazar") => {
    setReservaSeleccionada(reserva);
    setModalAccion(accion);
    setModalAbierta(true);
  }, []);

  const cerrarModal = useCallback(
    (preserveSuccess: boolean) => {
      setModalAbierta(false);
      setModalAccion(null);
      setReservaSeleccionada(null);
      if (preserveSuccess) {
        clearErrors();
      } else {
        clearFeedback();
      }
    },
    [clearErrors, clearFeedback]
  );

  const handleConfirmarGestion = useCallback(
    async (reservaId: number, accion: "Aprobar" | "Rechazar", motivo: string, comentarios?: string) => {
      const exitoso = await onGestionarReserva(reservaId, accion, motivo, comentarios);
      if (exitoso) {
        if (reservaSeleccionada) {
          const mensaje = accion === "Aprobar" ? "Reserva aprobada" : "Reserva rechazada";
          const detalle = `Reserva #${reservaSeleccionada.id} — ${reservaSeleccionada.espacioNombre}`;
          onAuditLog?.(mensaje, detalle);
        }
        cerrarModal(true);
      }
    },
    [cerrarModal, onAuditLog, onGestionarReserva, reservaSeleccionada]
  );

  const resumenPorEstado = useMemo(() => buildResumenPorEstado(resumen), [resumen]);

  const reservasFiltradas = useMemo(() => reservas, [reservas]);

  const showGestionWarning = usuarioGestionId == null;

  return (
    <section className="admin-reservas-module">
      <header className="admin-module-header">
        <div>
          <h2 className="admin-title">Gestión de reservas</h2>
          <p className="admin-subtitle">
            Administra las solicitudes recibidas y gestiona su aprobación o rechazo.
          </p>
        </div>
      </header>

      {showGestionWarning && (
        <div className="admin-alert admin-alert-error">
          <ShieldAlert className="admin-alert-icon" />
          <div>
            <strong>No se pudo identificar al administrador.</strong>
            <p className="admin-alert-details">
              Algunas acciones pueden estar deshabilitadas hasta sincronizar la sesión con el backend.
            </p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="admin-alert admin-alert-success">
          <CheckCircle2 className="admin-alert-icon" />
          <div>
            <strong>{successMessage}</strong>
          </div>
        </div>
      )}

      {(error || submitError) && (
        <div className="admin-alert admin-alert-error">
          <ShieldAlert className="admin-alert-icon" />
          <div>
            <strong>{submitError ?? error}</strong>
          </div>
        </div>
      )}

      <div className="admin-tabs">
        {TAB_DEFINITIONS.map(({ estado, titulo, descripcion, Icon }) => {
          const isActive = filtros.estado === estado;
          const count = resumenPorEstado[estado];
          return (
            <button
              key={estado}
              type="button"
              className={`admin-tab ${isActive ? "admin-tab-active" : ""}`}
              onClick={() => onCambiarEstado(estado)}
            >
              <div className="admin-tab-header">
                <Icon className="admin-tab-icon" />
                <div>
                  <span className="admin-tab-label">{titulo}</span>
                  <span className="admin-tab-count">{count}</span>
                </div>
              </div>
              <span className="admin-tab-description">{descripcion}</span>
            </button>
          );
        })}
      </div>

      <ReservaFilters
        filtros={filtros}
        catalogos={catalogos}
        catalogosLoading={catalogosLoading}
        catalogosError={catalogosError}
        escuelas={escuelasFiltradas}
        onChange={onChangeFiltro}
        onReset={onResetFiltros}
          allowCatalogFilters={allowCatalogFilters}
                lockedFacultadNombre={lockedFacultadNombre}
                lockedEscuelaNombre={lockedEscuelaNombre}
                isSupervisorWithoutEscuela={isSupervisorWithoutEscuela}
      />

      {loading ? (
        <div className="admin-loading-state">
          <Loader2 className="spinning" size={32} /> Cargando reservas...
        </div>
      ) : reservasFiltradas.length === 0 ? (
        <div className="admin-empty-state">
          <Inbox className="admin-empty-icon" />
          <h3 className="admin-empty-title">No encontramos reservas con los filtros seleccionados</h3>
          <p className="admin-empty-description">
            Ajusta los criterios o restablece los filtros para ver todas las solicitudes disponibles.
          </p>
        </div>
      ) : (
        <div className="admin-reservas-grid">
          {reservasFiltradas.map((reserva) => (
            <ReservaCard
              key={reserva.id}
              reserva={reserva}
              disabled={submitting || !esEstadoGestionable(reserva.estado) || showGestionWarning}
              onGestion={handleSolicitarGestion}
            />
          ))}
        </div>
      )}

      <ReservaModal
        open={modalAbierta}
        reserva={reservaSeleccionada}
        accion={modalAccion}
        submitting={submitting}
        error={submitError}
        onClose={() => cerrarModal(false)}
        onConfirm={handleConfirmarGestion}
      />
    </section>
  );
};