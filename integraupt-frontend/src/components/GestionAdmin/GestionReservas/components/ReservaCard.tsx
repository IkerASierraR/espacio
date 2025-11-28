import React, { useMemo } from "react";
import {
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  Mail,
  Users,
  UserCircle2,
  XCircle
} from "lucide-react";
import type { AdminReserva } from "../types";
import { esEstadoGestionable, formatearEstado } from "../validators";

const formatDate = (value: string | null | undefined): string => {
  if (!value) {
    return "-";
  }
  try {
    return new Intl.DateTimeFormat("es-PE", {
      year: "numeric",
      month: "short",
      day: "2-digit"
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const formatTime = (value: string | null | undefined): string => {
  if (!value) {
    return "-";
  }
  try {
    return new Intl.DateTimeFormat("es-PE", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(`1970-01-01T${value}`));
  } catch {
    return value;
  }
};

const buildSolicitanteNombre = (reserva: AdminReserva): string => {
  const nombres = [reserva.solicitanteNombre, reserva.solicitanteApellido].filter(Boolean);
  return nombres.join(" ") || "Solicitante sin nombre";
};

const estadoBadgeClass = (estado: AdminReserva["estado"]): string => {
  switch (estado) {
    case "Pendiente":
      return "admin-reserva-badge admin-reserva-pendiente";
    case "Aprobada":
      return "admin-reserva-badge admin-reserva-aprobada";
    case "Rechazada":
      return "admin-reserva-badge admin-reserva-rechazada";
    default:
      return "admin-reserva-badge";
  }
};

interface ReservaCardProps {
  reserva: AdminReserva;
  disabled?: boolean;
  onGestion?: (reserva: AdminReserva, accion: "Aprobar" | "Rechazar") => void;
  onSelect?: (reserva: AdminReserva) => void;
}

export const ReservaCard: React.FC<ReservaCardProps> = ({
  reserva,
  disabled,
  onGestion,
  onSelect
}) => {
  const solicitanteNombre = useMemo(() => buildSolicitanteNombre(reserva), [reserva]);
  const gestionable = esEstadoGestionable(reserva.estado);

  return (
    <article className="admin-reserva-card" onClick={() => onSelect?.(reserva)}>
      <div className="admin-reserva-header">
        <div>
          <span className={estadoBadgeClass(reserva.estado)}>{formatearEstado(reserva.estado)}</span>
          <h4 className="admin-reserva-title">Reserva #{reserva.id}</h4>
          <p className="admin-reserva-description">
            Solicitante: <strong>{solicitanteNombre}</strong>
          </p>
          {reserva.solicitanteCorreo && (
            <p className="admin-reserva-description">
              <Mail size={14} /> {reserva.solicitanteCorreo}
            </p>
          )}
        </div>
      </div>

      <div className="admin-reserva-fecha">
        <CalendarCheck className="admin-reserva-fecha-icon" />
        <div>
          <span className="admin-reserva-fecha-label">Fecha reservada</span>
          <span className="admin-reserva-fecha-valor">{formatDate(reserva.fechaReserva)}</span>
        </div>
        <div>
          <span className="admin-reserva-fecha-label">Bloque</span>
          <span className="admin-reserva-fecha-valor">
            {reserva.bloqueNombre} · {formatTime(reserva.horaInicio)} – {formatTime(reserva.horaFin)}
          </span>
        </div>
      </div>

      <div className="admin-reserva-meta">
        <div className="admin-reserva-meta-item">
          <CalendarClock className="admin-reserva-meta-icon" />
          <div>
            <span className="admin-reserva-meta-label">Solicitada el</span>
            <span className="admin-reserva-meta-value">{formatDate(reserva.fechaSolicitud)}</span>
          </div>
        </div>
        <div className="admin-reserva-meta-item">
          <UserCircle2 className="admin-reserva-meta-icon" />
          <div>
            <span className="admin-reserva-meta-label">Espacio</span>
            <span className="admin-reserva-meta-value">
              {reserva.espacioNombre}
              {reserva.espacioCodigo ? ` · ${reserva.espacioCodigo}` : ""}
            </span>
            {reserva.espacioTipo && (
              <span className="admin-reserva-meta-detail">{reserva.espacioTipo}</span>
            )}
          </div>
        </div>
        <div className="admin-reserva-meta-item">
          <Users className="admin-reserva-meta-icon" />
          <div>
            <span className="admin-reserva-meta-label">Estudiantes</span>
            <span className="admin-reserva-meta-value">{reserva.cantidadEstudiantes}</span>
            {reserva.descripcionUso && (
              <span className="admin-reserva-meta-detail">{reserva.descripcionUso}</span>
            )}
          </div>
        </div>
        <div className="admin-reserva-meta-item">
          <GraduationCap className="admin-reserva-meta-icon" />
          <div>
            <span className="admin-reserva-meta-label">Curso</span>
            <span className="admin-reserva-meta-value">{reserva.cursoNombre}</span>
            {reserva.facultadNombre && (
              <span className="admin-reserva-meta-detail">
                {reserva.facultadNombre}
                {reserva.escuelaNombre ? ` · ${reserva.escuelaNombre}` : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {reserva.motivo && (
        <div className="admin-reserva-motivo">
          <strong>Motivo registrado</strong>
          <span>{reserva.motivo}</span>
          {reserva.comentarios && <span>{reserva.comentarios}</span>}
        </div>
      )}

      {reserva.fechaGestion && reserva.ultimaAccion && (
        <div className="admin-reserva-meta-item">
          <CheckCircle2 className="admin-reserva-meta-icon" />
          <div>
            <span className="admin-reserva-meta-label">Última gestión</span>
            <span className="admin-reserva-meta-value">
              {reserva.ultimaAccion} · {formatDate(reserva.fechaGestion)}
            </span>
            {reserva.gestorNombre && (
              <span className="admin-reserva-meta-detail">
                {reserva.gestorNombre} {reserva.gestorApellido}
              </span>
            )}
          </div>
        </div>
      )}

      {gestionable && (
        <div className="admin-reserva-actions">
          <button
            type="button"
            className="admin-reserva-btn admin-reserva-approve"
            onClick={(event) => {
              event.stopPropagation();
              onGestion?.(reserva, "Aprobar");
            }}
            disabled={disabled}
          >
            <CheckCircle2 className="admin-reserva-btn-icon" /> Aprobar
          </button>
          <button
            type="button"
            className="admin-reserva-btn admin-reserva-reject"
            onClick={(event) => {
              event.stopPropagation();
              onGestion?.(reserva, "Rechazar");
            }}
            disabled={disabled}
          >
            <XCircle className="admin-reserva-btn-icon" /> Rechazar
          </button>
        </div>
      )}
    </article>
  );
};