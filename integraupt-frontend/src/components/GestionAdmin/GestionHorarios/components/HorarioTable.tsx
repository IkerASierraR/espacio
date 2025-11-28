import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Horario } from "../types";

interface HorarioTableProps {
  horarios: Horario[];
  loading: boolean;
  onEdit: (horario: Horario) => void;
  onDelete: (horario: Horario) => void;
}

export const HorarioTable: React.FC<HorarioTableProps> = ({
  horarios,
  loading,
  onEdit,
  onDelete
}) => {
  if (loading && horarios.length === 0) {
    return <div className="horario-table-empty">Cargando horarios...</div>;
  }

  if (!loading && horarios.length === 0) {
    return <div className="horario-table-empty">No hay horarios registrados.</div>;
  }

  return (
    <div className="horario-table-wrapper">
      <table className="horario-table">
        <thead>
          <tr>
            <th>Curso</th>
            <th>Docente</th>
            <th>Espacio</th>
            <th>Bloque</th>
            <th>Dia</th>
            <th>Vigencia</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {horarios.map((horario) => (
            <tr key={horario.id}>
              <td>
                <div className="horario-table-cell">
                  <p className="horario-table-title">{horario.cursoNombre}</p>
                  <span className="horario-table-subtitle">Cod. {horario.cursoId}</span>
                </div>
              </td>
              <td>
                <div className="horario-table-cell">
                  <p className="horario-table-title">{horario.docenteNombre}</p>
                  <span className="horario-table-subtitle">ID {horario.docenteId}</span>
                </div>
              </td>
              <td>
                <div className="horario-table-cell">
                  <p className="horario-table-title">{horario.espacioNombre}</p>
                  {horario.espacioCodigo && (
                    <span className="horario-table-subtitle">{horario.espacioCodigo}</span>
                  )}
                </div>
              </td>
              <td>
                <div className="horario-table-cell">
                  <p className="horario-table-title">{horario.bloqueNombre}</p>
                  {horario.bloqueHorario && (
                    <span className="horario-table-subtitle">{horario.bloqueHorario}</span>
                  )}
                </div>
              </td>
              <td>{horario.diaSemana}</td>
              <td>
                <div className="horario-table-cell">
                  <span className="horario-table-subtitle">
                    {horario.fechaInicio} — {horario.fechaFin}
                  </span>
                </div>
              </td>
              <td>
                <span
                  className={`horario-status-badge ${horario.estado ? "activo" : "inactivo"}`}
                >
                  {horario.estado ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td>
                <div className="horario-table-actions">
                  <button
                    type="button"
                    className="horario-action-button edit"
                    onClick={() => onEdit(horario)}
                  >
                    <Pencil size={16} />
                    Editar
                  </button>
                  <button
                    type="button"
                    className="horario-action-button delete"
                    onClick={() => onDelete(horario)}
                  >
                    <Trash2 size={16} />
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
