import React from "react";
import { X, Loader2 } from "lucide-react";
import type { UsuarioRole } from "../usuariosService";
import type { CatalogosData, UsuarioFormValues } from "../types";
import { UsuarioForm } from "./UsuarioForm";

interface UsuarioModalProps {
  open: boolean;
  mode: "create" | "edit";
  role: UsuarioRole;
  values: UsuarioFormValues;
  catalogs: CatalogosData;
  errors: string[];
  onChange: (field: keyof UsuarioFormValues, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
}

export const UsuarioModal: React.FC<UsuarioModalProps> = ({
  open,
  mode,
  role,
  values,
  catalogs,
  errors,
  onChange,
  onClose,
  onSubmit,
  submitting
}) => {
  if (!open) {
    return null;
  }

  const title =
    mode === "create"
      ? role === "estudiante"
        ? "Registrar estudiante"
        : role === "docente"
        ? "Registrar docente"
        : "Registrar administrativo"
      : role === "estudiante"
      ? "Actualizar estudiante"
      : role === "docente"
      ? "Actualizar docente"
      : "Actualizar administrativo";

  return (
    <div className="usuario-modal-backdrop" role="dialog" aria-modal="true">
      <div className="usuario-modal">
        <header className="usuario-modal-header">
          <h2>{title}</h2>
          <button type="button" className="usuario-modal-close" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>

        {errors.length > 0 && (
          <div className="usuario-modal-errors">
            <strong>No se pudo completar la operacion:</strong>
            <ul>
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="usuario-modal-body">
          <UsuarioForm role={role} values={values} onChange={onChange} catalogs={catalogs} mode={mode} />
        </div>

        <footer className="usuario-modal-footer">
          <button type="button" className="usuario-modal-secondary" onClick={onClose} disabled={submitting}>
            Cancelar
          </button>
          <button type="button" className="usuario-modal-primary" onClick={onSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="usuario-modal-spinner" size={16} /> Guardando...
              </>
            ) : mode === "create" ? (
              "Guardar"
            ) : (
              "Actualizar"
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};