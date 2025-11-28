import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Espacio } from "../types";

interface EspacioTableProps {
  espacios: Espacio[];
  loading: boolean;
  onEdit: (espacio: Espacio) => void;
  onDelete: (espacio: Espacio) => void;
}

export const EspacioTable: React.FC<EspacioTableProps> = ({
  espacios,
  loading,
  onEdit,
  onDelete
}) => {
  if (loading && espacios.length === 0) {
    return <div className="espacio-table-empty">Cargando espacios...</div>;
  }

  if (!loading && espacios.length === 0) {
    return <div className="espacio-table-empty">No hay espacios registrados.</div>;
  }

  return (
    <div className="espacio-table-wrapper">
      <table className="espacio-table">
        <thead>
          <tr>
            <th>Espacio</th>
            <th>Tipo</th>
            <th>Capacidad</th>
            <th>Escuela</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {espacios.map((espacio) => (
            <tr key={espacio.id}>
              <td>
                <div className="espacio-table-name">
                  <p className="espacio-table-title">{espacio.nombre}</p>
                  <span className="espacio-table-subtitle">{espacio.codigo}</span>
                  {espacio.equipamiento && (
                    <span className="espacio-table-equip" title={espacio.equipamiento}>
                      {espacio.equipamiento}
                    </span>
                  )}
                </div>
              </td>
              <td>{espacio.tipo}</td>
              <td>{espacio.capacidad}</td>
              <td>{espacio.escuelaNombre ?? `Escuela #${espacio.escuelaId}`}</td>
              <td>
                <span
                  className={`espacio-status-badge ${
                    espacio.estado === 1 ? "activo" : "inactivo"
                  }`}
                >
                  {espacio.estado === 1 ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td>
                <div className="espacio-table-actions">
                  <button
                    type="button"
                    className="espacio-action-button edit"
                    onClick={() => onEdit(espacio)}
                  >
                    <Pencil size={16} />
                    Editar
                  </button>
                  <button
                    type="button"
                    className="espacio-action-button delete"
                    onClick={() => onDelete(espacio)}
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
