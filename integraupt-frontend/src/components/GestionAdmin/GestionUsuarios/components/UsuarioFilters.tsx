import React from "react";
import { RefreshCw, Search } from "lucide-react";
import type { UsuarioRole } from "../usuariosService";

export type UsuarioStatusFilter = "all" | "active" | "inactive";

interface UsuarioFiltersProps {
  search: string;
  status: UsuarioStatusFilter;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: UsuarioStatusFilter) => void;
  onReload: () => void;
  total: number;
  filtered: number;
  loading: boolean;
  role: UsuarioRole;
}

const roleLabel = (role: UsuarioRole): string => {
  switch (role) {
    case "estudiante":
      return "estudiantes";
    case "docente":
      return "docentes";
    default:
      return "administrativos";
  }
};

export const UsuarioFilters: React.FC<UsuarioFiltersProps> = ({
  search,
  status,
  onSearchChange,
  onStatusChange,
  onReload,
  total,
  filtered,
  loading,
  role
}) => {
  return (
    <div className="usuario-filters">
      <div className="usuario-filters-left">
        <div className="usuario-search-box">
          <Search size={16} />
          <input
            type="text"
            value={search}
            maxLength={25}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={`Buscar ${roleLabel(role)} por nombre, codigo o correo`}
          />
        </div>
        <select value={status} onChange={(event) => onStatusChange(event.target.value as UsuarioStatusFilter)}>
          <option value="all">Todos los estados</option>
          <option value="active">Solo activos</option>
          <option value="inactive">Solo inactivos</option>
        </select>
      </div>

      <div className="usuario-filters-right">
        <p className="usuario-filters-count">
          {filtered} de {total} {roleLabel(role)}
        </p>
        <button type="button" onClick={onReload} disabled={loading} className="usuario-refresh-button">
          <RefreshCw size={16} />
          {loading ? "Actualizando..." : "Sincronizar"}
        </button>
      </div>
    </div>
  );
};