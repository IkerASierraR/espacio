import React from "react";
import type {
  EscuelaOption,
  FacultadOption,
  SancionFormValues,
  TipoUsuario,
  UsuarioOption
} from "../types";

interface SancionFormProps {
  values: SancionFormValues;
  errors: string[];
  submitting: boolean;
  usuarioOptions: UsuarioOption[];
    usuarioSearch: string;
    loadingUsuarios: boolean;
    facultades: FacultadOption[];
    escuelas: EscuelaOption[];
    loadingFacultades: boolean;
    loadingEscuelas: boolean;
    allowCatalogFilters: boolean;
    isSupervisor: boolean;
    supervisorEscuelaNombre?: string;
    onChange: (field: keyof SancionFormValues, value: string) => void;
    onFacultadChange: (value: string) => void;
    onEscuelaChange: (value: string) => void;
    onUsuarioSearchChange: (value: string) => void;
    onUsuarioSearch: () => void;
    onUsuarioSelect: (option: UsuarioOption) => void;
     onUsuarioClear: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const USER_TYPES: Array<{ label: string; value: TipoUsuario }> = [
  { label: "Estudiante", value: "ESTUDIANTE" },
  { label: "Docente", value: "DOCENTE" }
];

const renderUsuarioDescripcion = (option: UsuarioOption): string => {
  const nombre = option.nombreCompleto?.trim();
  const codigo = option.codigo?.trim();
  if (nombre && codigo) {
    return `${nombre} (${codigo})`;
  }
  if (nombre) {
    return nombre;
  }
  if (codigo) {
    return codigo;
  }
  return `ID ${option.id}`;
};


export const SancionForm: React.FC<SancionFormProps> = ({
  values,
    errors,
    submitting,
    usuarioOptions,
    usuarioSearch,
    loadingUsuarios,
    facultades,
    escuelas,
    loadingFacultades,
    loadingEscuelas,
    allowCatalogFilters,
    isSupervisor,
    supervisorEscuelaNombre,
    onChange,
    onFacultadChange,
    onEscuelaChange,
    onUsuarioSearchChange,
    onUsuarioSearch,
    onUsuarioSelect,
    onUsuarioClear,
    onSubmit,
    onCancel
}) => {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

const puedeLimpiarSeleccion = Boolean(
    values.usuarioId || values.usuarioCodigo || values.usuarioNombre
  );


  return (
    <form className="sancion-form" onSubmit={handleSubmit}>
      <div className="sancion-form-grid">


        <label className="sancion-form-field">
          <span>Tipo de usuario</span>
          <select
            value={values.tipoUsuario}
            onChange={(event) => onChange("tipoUsuario", event.target.value)}
            disabled={submitting}
          >
            <option value="">Seleccione</option>
            {USER_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {allowCatalogFilters && (
                  <label className="sancion-form-field">
                    <span>Facultad</span>
                    <select
                      value={values.facultadId}
                      onChange={(event) => onFacultadChange(event.target.value)}
                      disabled={submitting || loadingFacultades}
                    >
                      <option value="">Todas las facultades</option>
                      {facultades.map((facultad) => (
                        <option key={facultad.id} value={facultad.id}>
                          {facultad.abreviatura
                            ? `${facultad.abreviatura} — ${facultad.nombre}`
                            : facultad.nombre}
                        </option>
                      ))}
                    </select>
                    {loadingFacultades && (
                      <span className="sancion-field-hint">Cargando facultades...</span>
                    )}
                  </label>
                )}

                {allowCatalogFilters && (
                  <label className="sancion-form-field">
                    <span>Escuela</span>
                    <select
                      value={values.escuelaId}
                      onChange={(event) => onEscuelaChange(event.target.value)}
                      disabled={submitting || loadingEscuelas || !values.facultadId}
                    >
                      <option value="">
                        {values.facultadId ? "Seleccione una escuela" : "Seleccione una facultad"}
                      </option>
                      {escuelas.map((escuela) => (
                        <option key={escuela.id} value={escuela.id}>
                          {escuela.nombre}
                        </option>
                      ))}
                    </select>
                    {loadingEscuelas && (
                      <span className="sancion-field-hint">Cargando escuelas...</span>
                    )}
                  </label>
                )}

                {isSupervisor && (
                  <label className="sancion-form-field">
                    <span>Escuela asignada</span>
                    <input
                      type="text"
                      value={supervisorEscuelaNombre ?? values.usuarioEscuela}
                      readOnly
                    />
                  </label>
                )}
              </div>

              <div className="sancion-user-search-section">
                <label className="sancion-form-field">
                  <span>Buscar usuario por nombre o código</span>
                  <div className="sancion-user-search">
                    <input
                      type="search"
                      value={usuarioSearch}
                      maxLength={25}
                      onChange={(event) => onUsuarioSearchChange(event.target.value)}
                      placeholder="Ej: 2023088 o Juan Perez"
                      disabled={submitting}
                    />
                    <button
                      type="button"
                      className="sancion-btn secondary"
                      onClick={onUsuarioSearch}
                      disabled={submitting || !values.tipoUsuario}
                    >
                      Buscar
                    </button>
                  </div>
                </label>

                <div className="sancion-selected-user">
                  <div>
                    <span className="sancion-selected-title">Usuario seleccionado</span>
                    {values.usuarioNombre || values.usuarioCodigo ? (
                      <p className="sancion-selected-summary">
                        {values.usuarioNombre && <strong>{values.usuarioNombre}</strong>}
                        {values.usuarioCodigo && (
                          <span className="sancion-selected-code">Código: {values.usuarioCodigo}</span>
                        )}
                        {values.usuarioEscuela && (
                          <span className="sancion-selected-escuela">{values.usuarioEscuela}</span>
                        )}
                        {values.usuarioId && (
                          <span className="sancion-selected-id">ID #{values.usuarioId}</span>
                        )}
                      </p>
                    ) : (
                      <p className="sancion-selected-summary sancion-selected-summary--muted">
                        Ningún usuario seleccionado todavía.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="sancion-btn tertiary"
                    onClick={onUsuarioClear}
                    disabled={!puedeLimpiarSeleccion || submitting}
                  >
                    Limpiar
                  </button>
                </div>

                <div className="sancion-user-results">
                  {loadingUsuarios ? (
                    <p className="sancion-user-status">Buscando usuarios...</p>
                  ) : usuarioOptions.length > 0 ? (
                    <ul>
                      {usuarioOptions.map((option) => (
                        <li key={option.id}>
                          <button
                            type="button"
                            className="sancion-user-option"
                            onClick={() => onUsuarioSelect(option)}
                            disabled={submitting}
                          >
                            <span className="sancion-user-option-title">
                              {renderUsuarioDescripcion(option)}
                            </span>
                            <span className="sancion-user-option-meta">
                              {option.escuelaNombre ?? "Escuela no especificada"}
                            </span>
                            {option.facultadNombre && (
                              <span className="sancion-user-option-meta">
                                {option.facultadNombre}
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : usuarioSearch.trim() ? (
                    <p className="sancion-user-status sancion-user-status--muted">
                      No se encontraron coincidencias.
                    </p>
                  ) : null}
                </div>

                <label className="sancion-form-field">
                  <span>Código del usuario (opcional)</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{0,10}"
                    maxLength={10}
                    value={values.usuarioCodigo}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (/^\d{0,10}$/.test(value)) {
                        onChange("usuarioCodigo", value);
                      }
                    }}
                    placeholder="Ingresa el código del usuario"
                    disabled={submitting}
                  />
                </label>

              </div>

              <div className="sancion-form-grid">

        <label className="sancion-form-field">
          <span>Fecha de inicio</span>
          <input
            type="date"
            value={values.fechaInicio}
            onChange={(event) => onChange("fechaInicio", event.target.value)}
            disabled={submitting}
          />
        </label>

        <label className="sancion-form-field">
          <span>Fecha de fin</span>
          <input
            type="date"
            value={values.fechaFin}
            onChange={(event) => onChange("fechaFin", event.target.value)}
            disabled={submitting}
          />
        </label>
      </div>

      <label className="sancion-form-field">
        <span>Motivo</span>
        <textarea
          value={values.motivo}
          maxLength={500}
          onChange={(event) => onChange("motivo", event.target.value)}
          rows={3}
          placeholder="Detalle el motivo de la sanción"
          disabled={submitting}
        />
      </label>

      {errors.length > 0 && (
        <div className="sancion-form-errors" role="alert">
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="sancion-form-actions">
        <button
          type="button"
          className="sancion-btn secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </button>
        <button type="submit" className="sancion-btn primary" disabled={submitting}>
          {submitting ? "Guardando..." : "Registrar sanción"}
        </button>
      </div>
    </form>
  );
};