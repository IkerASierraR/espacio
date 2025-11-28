import React, { useMemo } from "react";
import { Calendar, Filter, RefreshCw, Search } from "lucide-react";
import type {
  AdminReservaFilters,
  ReservaFiltersState,
  SimpleOption,
  EscuelaOption
} from "../types";

interface ReservaFiltersProps {
  filtros: ReservaFiltersState;
  catalogos: AdminReservaFilters | null;
  catalogosLoading: boolean;
  catalogosError: string | null;
  escuelas: EscuelaOption[];
  onChange: <K extends keyof ReservaFiltersState>(field: K, value: ReservaFiltersState[K]) => void;
  onReset: () => void;
  allowCatalogFilters: boolean;
}

const renderOptions = (options: SimpleOption[], placeholder: string) => (
  <>
    <option value="">{placeholder}</option>
    {options.map((option) => (
      <option key={option.id} value={option.id}>
        {option.nombre}
      </option>
    ))}
  </>
);

export const ReservaFilters: React.FC<ReservaFiltersProps> = ({
  filtros,
  catalogos,
  catalogosLoading,
  catalogosError,
  escuelas,
  onChange,
  onReset,
  allowCatalogFilters
}) => {
  const tipos = useMemo(() => catalogos?.tiposEspacio ?? [], [catalogos]);
  const facultades = useMemo(() => catalogos?.facultades ?? [], [catalogos]);

  return (
    <section className="admin-filters-panel">
      <header className="admin-filters-header">
        <div className="admin-filters-title">
          <Filter className="admin-filters-icon" />
          <div>
            <h3>Filtros y búsqueda</h3>
            <p>Refina la visualización de reservas según tus criterios.</p>
          </div>
        </div>
        <button type="button" className="admin-filters-reset" onClick={onReset}>
          <RefreshCw size={16} />
          Restablecer
        </button>
      </header>

      {catalogosError && (
        <div className="admin-filters-error">{catalogosError}</div>
      )}

      <div className="admin-filters-grid">
        <label className="admin-filter-control">
          <span>Tipo de espacio</span>
          <select
            value={filtros.tipoEspacio ?? ""}
            onChange={(event) => onChange("tipoEspacio", event.target.value || null)}
            disabled={catalogosLoading}
          >
            <option value="">Todos</option>
            {tipos.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </label>

        {allowCatalogFilters ? (
          <>
            <label className="admin-filter-control">
              <span>Facultad</span>
              <select
                value={filtros.facultadId ?? ""}
                onChange={(event) =>
                  onChange(
                    "facultadId",
                    event.target.value ? Number.parseInt(event.target.value, 10) : null
                  )
                }
                disabled={catalogosLoading}
              >
                {renderOptions(facultades, "Todas")}
              </select>
            </label>

            <label className="admin-filter-control">
              <span>Escuela</span>
              <select
                value={filtros.escuelaId ?? ""}
                onChange={(event) =>
                  onChange("escuelaId", event.target.value ? Number(event.target.value) : null)
                }
                disabled={catalogosLoading || escuelas.length === 0}
              >
                {renderOptions(escuelas, filtros.facultadId ? "Todas las escuelas" : "Todas")}
              </select>
            </label>
          </>
        ) : (
          <>
            {/* BLOQUE ELIMINADO */}
          </>
        )}

        <label className="admin-filter-control">
          <span>Fecha de reserva</span>
          <div className="admin-filter-input-wrapper">
            <Calendar size={16} className="admin-filter-input-icon" />
            <input
              type="date"
              value={filtros.fecha ?? ""}
              onChange={(event) => onChange("fecha", event.target.value || null)}
            />
          </div>
        </label>
      </div>

      <div className="admin-filters-search">
        <div className="admin-filter-input-wrapper">
          <Search size={16} className="admin-filter-input-icon" />
          <input
            type="search"
            placeholder="Buscar por espacio o solicitante"
            value={filtros.search}
            onChange={(event) => onChange("search", event.target.value)}
          />
        </div>
      </div>
    </section>
  );
};
