import React from "react";
import { X, FileText, Table } from "lucide-react";

interface ModalSeleccionFormatoProps {
  open: boolean;
  onClose: () => void;
  onSeleccionarFormato: (formato: 'pdf' | 'excel') => void;
}

export const ModalSeleccionFormato: React.FC<ModalSeleccionFormatoProps> = ({
  open,
  onClose,
  onSeleccionarFormato
}) => {
  if (!open) {
    return null;
  }

  return (
    <div className="gestion-reportes-modal-backdrop" role="dialog" aria-modal="true">
      <div className="gestion-reportes-modal">
        <div className="gestion-reportes-modal-header">
          <div>
            <h3>Generar Reporte</h3>
            <p>Selecciona el formato para descargar el reporte</p>
          </div>
          <button
            type="button"
            className="gestion-reportes-modal-close"
            aria-label="Cerrar modal"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="gestion-reportes-modal-content">
          <div className="gestion-reportes-formatos-grid">
            <button
              className="gestion-reportes-formato-option"
              onClick={() => onSeleccionarFormato('pdf')}
            >
              <div className="gestion-reportes-formato-icon pdf">
                <FileText size={32} />
              </div>
              <div className="gestion-reportes-formato-info">
                <h4>PDF</h4>
                <p>Documento optimizado para impresión y lectura</p>
              </div>
            </button>

            <button
              className="gestion-reportes-formato-option"
              onClick={() => onSeleccionarFormato('excel')}
            >
              <div className="gestion-reportes-formato-icon excel">
                <Table size={32} />
              </div>
              <div className="gestion-reportes-formato-info">
                <h4>Excel</h4>
                <p>Hoja de cálculo con datos tabulares para análisis</p>
              </div>
            </button>
          </div>
        </div>

        <div className="gestion-reportes-modal-actions">
          <button
            type="button"
            className="gestion-reportes-btn ghost"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};