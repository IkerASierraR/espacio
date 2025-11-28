import React from "react";
import { CheckCircle2, Mail, Pencil, Trash2, UserCircle } from "lucide-react";
import type { UsuarioRecord } from "../types";
import type { UsuarioRole } from "../usuariosService";

interface UsuarioTableProps {
  rows: UsuarioRecord[];
  loading: boolean;
  onEdit: (row: UsuarioRecord) => void;
  onToggleEstado: (row: UsuarioRecord) => void;
  activeRole: UsuarioRole;
}

const roleBadge = (role: UsuarioRole) => {
  switch (role) {
    case "estudiante":
      return "badge-estudiante";
    case "docente":
      return "badge-docente";
    default:
      return "badge-administrativo";
  }
};

const EstadoBadge: React.FC<{ estadoLabel: string; estado: number }> = ({ estadoLabel, estado }) => (
  <span className={`usuario-table-status ${estado === 1 ? "status-activo" : "status-inactivo"}`}>
    {estadoLabel}
  </span>
);

export const UsuarioTable: React.FC<UsuarioTableProps> = ({
  rows,
  loading,
  onEdit,
  onToggleEstado,
  activeRole
}) => {
  if (loading) {
    return (
      <div className="usuario-table-empty">
        <div className="usuario-table-placeholder">
          <UserCircle size={40} />
          <p>Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="usuario-table-empty">
        <div className="usuario-table-placeholder">
          <UserCircle size={40} />
          <p>No se encontraron registros para mostrar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="usuario-table-wrapper">
      <table className="usuario-table">
        <thead>
          <tr>
            <th>{activeRole === "administrativo" ? "Rol" : "Codigo"}</th>
            <th>Nombres</th>
            <th>Apellidos</th>
            <th>Correo</th>
            <th>{activeRole === "administrativo" ? "Escuela / Turno" : "Escuela"}</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.role}-${row.id}`}>
              <td>
                <span className={`usuario-role-badge ${roleBadge(row.role)}`}>
                  {row.codigo ?? row.rolDescripcion}
                </span>
              </td>
              <td>{row.nombres}</td>
              <td>{row.apellidos}</td>
              <td>
                <span className="usuario-table-email">
                  <Mail size={14} />
                  {row.correo}
                </span>
              </td>
              <td>
                {activeRole === "administrativo" ? (
                  <div className="usuario-table-info">
                    <span>{row.escuela ?? "Sin escuela"}</span>
                    <small>{row.turno ?? "Sin turno"}</small>
                  </div>
                ) : (
                  row.escuela ?? "Sin asignar"
                )}
              </td>
              <td>
                <EstadoBadge estadoLabel={row.estadoLabel} estado={row.estado} />
              </td>
              <td>
                <div className="usuario-table-actions">
                  <button type="button" onClick={() => onEdit(row)} aria-label="Editar">
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleEstado(row)}
                    aria-label={row.estado === 1 ? "Deshabilitar" : "Habilitar"}
                    className={row.estado === 1 ? undefined : "usuario-table-activate"}
                  >
                    {row.estado === 1 ? <Trash2 size={16} /> : <CheckCircle2 size={16} />}
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