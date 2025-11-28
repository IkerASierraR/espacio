import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ShieldAlert, X, XCircle } from "lucide-react";
import type { AdminReserva } from "../types";
import { validarMotivo } from "../validators";

interface ReservaModalProps {
  open: boolean;
  reserva: AdminReserva | null;
  accion: "Aprobar" | "Rechazar" | null;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (reservaId: number, accion: "Aprobar" | "Rechazar", motivo: string, comentarios?: string) => void;
}

export const ReservaModal: React.FC<ReservaModalProps> = ({
  open,
  reserva,
  accion,
  submitting,
  error,
  onClose,
  onConfirm
}) => {
  const [motivo, setMotivo] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [motivoError, setMotivoError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMotivo("");
      setComentarios("");
      setMotivoError(null);
    }
  }, [open, accion, reserva?.id]);

  const titulo = useMemo(() => {
    if (accion === "Aprobar") {
      return "Aprobar reserva";
    }
    if (accion === "Rechazar") {
      return "Rechazar reserva";
    }
    return "Gestión de reserva";
  }, [accion]);

  if (!open || !reserva || !accion) {
    return null;
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const validation = validarMotivo(motivo);
    if (validation) {
      setMotivoError(validation);
      return;
    }
    setMotivoError(null);
    onConfirm(reserva.id, accion, motivo, comentarios);
  };

  const headerClass = accion === "Rechazar" ? "admin-modal-header admin-modal-header-danger" : "admin-modal-header";
  const Icon = accion === "Rechazar" ? ShieldAlert : CheckCircle2;

  return (
    <div className="admin-modal-overlay" role="dialog" aria-modal="true">
      <div className="admin-modal admin-modal-md">
        <header className={headerClass}>
          <h3 className="admin-modal-title">
            <Icon className="admin-modal-title-icon" />
            {titulo}
          </h3>
          <button type="button" className="admin-modal-close" onClick={onClose}>
            <X className="admin-modal-close-icon" />
          </button>
        </header>

        <form className="admin-modal-form" onSubmit={handleSubmit}>
          <p className="admin-modal-text">
            Confirmarás la {accion.toLowerCase()} de la reserva #{reserva.id} solicitada para el
            espacio <strong>{reserva.espacioNombre}</strong> el día
            {" "}
            <strong>{new Date(reserva.fechaReserva).toLocaleDateString("es-PE")}</strong>.
          </p>

          <label className="admin-form-control">
            <span>Motivo *</span>
            <textarea
              className="admin-textarea"
              placeholder="Describe el motivo de la decisión"
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              rows={4}
              disabled={submitting}
            />
          </label>
          {motivoError && <p className="admin-field-error">{motivoError}</p>}

          <label className="admin-form-control">
            <span>Comentarios opcionales</span>
            <textarea
              className="admin-textarea"
              placeholder="Información adicional para el solicitante"
              value={comentarios}
              onChange={(event) => setComentarios(event.target.value)}
              rows={3}
              disabled={submitting}
            />
          </label>

          {error && <p className="admin-error-message">{error}</p>}

          <div className="admin-modal-actions">
            <button type="button" className="admin-modal-btn admin-modal-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className={accion === "Rechazar" ? "admin-modal-btn admin-modal-danger" : "admin-modal-btn admin-modal-primary"}
              disabled={submitting}
            >
              {accion === "Rechazar" ? (
                <>
                  <XCircle className="admin-modal-btn-icon" /> Rechazar
                </>
              ) : (
                <>
                  <CheckCircle2 className="admin-modal-btn-icon" /> Aprobar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};