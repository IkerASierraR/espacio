import React from "react";
import { AlertCircle, CalendarClock, Loader2, MapPin } from "lucide-react";
import type { IncidenciaGestionRow } from "../types";

interface IncidenciasTableProps {
  incidencias: IncidenciaGestionRow[];
  loading: boolean;
}

const formatDateTime = (value: string): string => {
  if (!value) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat("es-PE", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
};

export const IncidenciasTable: React.FC<IncidenciasTableProps> = ({ incidencias, loading }) => {
  if (loading) {
    return (
      <div className="gestion-incidencias-table-empty">
        <Loader2 className="gestion-incidencias-spinner" size={20} /> Cargando incidencias...
      </div>
    );
  }

  if (incidencias.length === 0) {
    return <div className="gestion-incidencias-table-empty">No se encontraron incidencias.</div>;
  }

  return (
    <div className="gestion-incidencias-table-wrapper">
      <table className="gestion-incidencias-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha reporte</th>
            <th>Espacio</th>
            <th>Escuela</th>
            <th>Usuario</th>
            <th>Descripcion</th>
          </tr>
        </thead>
        <tbody>
          {incidencias.map((incidencia) => (
            <tr key={incidencia.id}>
              <td>{incidencia.id}</td>
              <td>
                <div className="gestion-incidencias-date">
                  <CalendarClock size={16} />
                  <span>{formatDateTime(incidencia.fechaReporte)}</span>
                </div>
              </td>
              <td>
                <div className="gestion-incidencias-espacio">
                  <strong>{incidencia.espacioNombre || "Sin nombre"}</strong>
                  <span>{incidencia.espacioCodigo ? `Codigo ${incidencia.espacioCodigo}` : ""}</span>
                </div>
              </td>
              <td>
                <div className="gestion-incidencias-escuela">
                  <MapPin size={16} />
                  <div>
                    <span>{incidencia.escuelaNombre || "Sin escuela"}</span>
                    {incidencia.facultadNombre && (
                      <span className="gestion-incidencias-facultad">{incidencia.facultadNombre}</span>
                    )}
                  </div>
                </div>
              </td>
              <td>
                <div className="gestion-incidencias-usuario">
                  <strong>{incidencia.usuarioNombre || "Sin nombre"}</strong>
                  {incidencia.usuarioDocumento && (
                    <span>{incidencia.usuarioDocumento}</span>
                  )}
                </div>
              </td>
              <td className="gestion-incidencias-descripcion">
                {incidencia.descripcion ? (
                  incidencia.descripcion
                ) : (
                  <span className="gestion-incidencias-descripcion-empty">
                    <AlertCircle size={14} /> Sin descripcion
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};