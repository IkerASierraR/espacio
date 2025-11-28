import React from "react";
import { X } from "lucide-react";
import type { Escuela, EspacioFormMode, EspacioFormValues } from "../types";
import { EspacioForm } from "./EspacioForm";

interface EspacioModalProps {
  open: boolean;
  mode: EspacioFormMode;
  values: EspacioFormValues;
  errors: string[];
  submitting: boolean;
  escuelas: Escuela[];
  escuelasLoading: boolean;
  escuelasError: string | null;
  onClose: () => void;
  onChange: (field: keyof EspacioFormValues, value: string) => void;
  onSubmit: () => void;
}

export const EspacioModal: React.FC<EspacioModalProps> = ({
  open,
  mode,
  values,
  errors,
  submitting,
  escuelas,
  escuelasLoading,
  escuelasError,
  onClose,
  onChange,
  onSubmit
}) => {
  if (!open) {
    return null;
  }

  return (
    <div className="espacio-modal-backdrop" role="dialog" aria-modal="true">
      <div className="espacio-modal">
        <div className="espacio-modal-header">
          <div>
            <h3>{mode === "create" ? "Registrar nuevo espacio" : "Actualizar espacio"}</h3>
          </div>
          <button
            type="button"
            className="espacio-modal-close"
            aria-label="Cerrar formulario"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {escuelasError && (
          <div className="espacio-form-errors">
            <p>{escuelasError}</p>
          </div>
        )}

        <EspacioForm
          values={values}
          errors={errors}
          mode={mode}
          submitting={submitting}
          escuelas={escuelas}
          escuelasLoading={escuelasLoading}
          onChange={onChange}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};
