import React from "react";
import { Loader2, Shield } from "lucide-react";
import type { AuditoriaReserva } from "../types";

interface AuditoriaTableProps {
  auditorias: AuditoriaReserva[];
  loading?: boolean;
  onSelect?: (auditoria: AuditoriaReserva) => void;
}

const formatDate = (isoDate?: string | null): string => {
  if (!isoDate) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat("es-PE", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
};

const renderEstadoChip = (estado?: string | null) => {
  if (!estado) return <span className="auditoria-chip">Sin estado</span>;
  const normalized = estado.toLowerCase();
  const className = `auditoria-chip auditoria-chip-${normalized}`;
  return <span className={className}>{estado}</span>;
};

export const AuditoriaTable: React.FC<AuditoriaTableProps> = ({
  auditorias,
  loading,
  onSelect
}) => {
  if (loading) {
    return (
      <div className="auditoria-table-loading">
        <Loader2 className="spin" size={20} />
        <p>Cargando auditorias de reserva...</p>
      </div>
    );
  }

  if (!auditorias.length) {
    return (
      <div className="auditoria-table-empty">
        <Shield size={20} />
        <p>No se encontraron registros de auditoria con los criterios seleccionados.</p>
      </div>
    );
  }

  return (
    <div className="auditoria-table-wrapper">
      <table className="auditoria-table">
        <thead>
          <tr>
            <th># Audit</th>
            <th>Reserva</th>
            <th>Cambio</th>
            <th>Usuario</th>
            <th>Espacio</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {auditorias.map((auditoria) => (
            <tr
              key={auditoria.idAudit}
              onClick={() => onSelect?.(auditoria)}
              className={onSelect ? "auditoria-table-row-clickable" : undefined}
            >
              <td>
                <strong>{auditoria.idAudit}</strong>
              </td>
              <td>
                <div className="auditoria-table-cell">
                  <span>#{auditoria.idReserva}</span>
                  {auditoria.estadoReservaActual && (
                    <small>Actual: {auditoria.estadoReservaActual}</small>
                  )}
                </div>
              </td>
              <td>
                <div className="auditoria-table-cell">
                  {renderEstadoChip(auditoria.estadoAnterior)}
                  <span className="auditoria-table-arrow">-&gt;</span>
                  {renderEstadoChip(auditoria.estadoNuevo)}
                </div>
              </td>
              <td>
                <div className="auditoria-table-cell">
                  <span>{auditoria.usuarioCambioNombre ?? "Sin usuario"}</span>
                  {auditoria.usuarioCambioDocumento && (
                    <small>Doc: {auditoria.usuarioCambioDocumento}</small>
                  )}
                </div>
              </td>
              <td>
                <div className="auditoria-table-cell">
                  <span>{auditoria.nombreEspacio ?? "Sin espacio"}</span>
                  {auditoria.codigoEspacio && <small>{auditoria.codigoEspacio}</small>}
                </div>
              </td>
              <td>{formatDate(auditoria.fechaCambio)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};