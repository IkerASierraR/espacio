import React from "react";
import { AlertCircle, CheckCircle2, Loader2, Undo2 } from "lucide-react";
import type { Sancion } from "../types";

interface SancionTableProps {
  sanciones: Sancion[];
  loading: boolean;
  onLevantar: (sancion: Sancion) => void;
}

const formatDate = (value: string): string => {
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

const renderEstado = (estado: Sancion["estado"]) => {
  if (estado === "ACTIVA") {
    return (
      <span className="sancion-badge sancion-badge-active">
        <AlertCircle size={14} /> Activa
      </span>
    );
  }
  return (
    <span className="sancion-badge sancion-badge-completed">
      <CheckCircle2 size={14} /> Cumplida
    </span>
  );
};

export const SancionesTable: React.FC<SancionTableProps> = ({
  sanciones,
  loading,
  onLevantar
}) => {
  if (loading) {
    return (
      <div className="sancion-table-empty">
        <Loader2 className="sancion-spinner" size={20} /> Cargando sanciones...
      </div>
    );
  }

  if (sanciones.length === 0) {
    return <div className="sancion-table-empty">No hay sanciones registradas.</div>;
  }

  return (
    <div className="sancion-table-wrapper">
      <table className="sancion-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Persona</th>
            <th>Tipo</th>
            <th>Motivo</th>
            <th>Inicio</th>
            <th>Fin</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sanciones.map((sancion) => (
            <tr key={sancion.id}>
              <td>{sancion.id}</td>
               <td>
                              <div className="sancion-user-cell">
                                <span className="sancion-user-name">
                                  {sancion.usuarioNombre || "Sin nombre"}
                                </span>
                                <div className="sancion-user-meta">
                                  {sancion.usuarioCodigo && (
                                    <span className="sancion-user-code">Codigo: {sancion.usuarioCodigo}</span>
                                  )}
                                  {sancion.usuarioEscuela && (
                                    <span className="sancion-user-escuela">{sancion.usuarioEscuela}</span>
                                  )}
                                  {sancion.usuarioFacultad && (
                                    <span className="sancion-user-facultad">{sancion.usuarioFacultad}</span>
                                  )}
                                </div>
                              </div>
                            </td>
              <td>{sancion.tipoUsuario}</td>
              <td className="sancion-motivo">{sancion.motivo}</td>
              <td>{formatDate(sancion.fechaInicio)}</td>
              <td>{formatDate(sancion.fechaFin)}</td>
              <td>{renderEstado(sancion.estado)}</td>
              <td className="sancion-actions">
                {sancion.estado === "ACTIVA" && (
                  <button
                    type="button"
                    className="sancion-btn tertiary"
                    onClick={() => onLevantar(sancion)}
                  >
                    <Undo2 size={14} /> Levantar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};