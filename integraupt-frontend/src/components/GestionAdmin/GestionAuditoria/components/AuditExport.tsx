import React, { useState } from "react";
import { Download, Loader2 } from "lucide-react";

export type AuditExportFormat = "pdf" | "excel";

interface AuditExportProps {
  onExport?: (format: AuditExportFormat) => Promise<void>;
}

export const AuditExport: React.FC<AuditExportProps> = ({ onExport }) => {
  const [exporting, setExporting] = useState<AuditExportFormat | null>(null);
  const exportAvailable = typeof onExport === "function";

  const handleExport = async (format: AuditExportFormat) => {
    if (!onExport || exporting) {
      return;
    }
    try {
      setExporting(format);
      await onExport(format);
    } finally {
      setExporting(null);
    }
  };

  const renderButtonLabel = (format: AuditExportFormat) => {
    if (exporting === format) {
      return (
        <>
          <Loader2 className="spin" size={16} /> Generando {format.toUpperCase()}...
        </>
      );
    }
    return (
      <>
        <Download size={16} /> Exportar {format.toUpperCase()}
      </>
    );
  };

  return (
    <div className="auditoria-export-panel">
      <div>
        <h4>Exportaciones</h4>
        <p>
          Descarga el historial de cambios en formato PDF o Excel.
        </p>
      </div>
      <div className="auditoria-export-actions">
        <button
          type="button"
          className="auditoria-btn primary"
          onClick={() => handleExport("pdf")}
          disabled={!exportAvailable || !!exporting}
        >
          {renderButtonLabel("pdf")}
        </button>
        <button
          type="button"
          className="auditoria-btn secondary"
          onClick={() => handleExport("excel")}
          disabled={!exportAvailable || !!exporting}
        >
          {renderButtonLabel("excel")}
        </button>
        {!exportAvailable && (
          <small className="auditoria-export-hint">
            Exportar requerira endpoints PDF/Excel como en reportes-backend.
          </small>
        )}
      </div>
    </div>
  );
};