import React from "react";
import type { Escuela, EspacioFormMode, EspacioFormValues } from "../types";

interface EspacioFormProps {
  values: EspacioFormValues;
  errors: string[];
  mode: EspacioFormMode;
  submitting: boolean;
  escuelas: Escuela[];
  escuelasLoading: boolean;
  onChange: (field: keyof EspacioFormValues, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

// const tipoSugerencias = ["Aula", "Laboratorio", "Auditorio", "Sala de reuniones", "Coworking"];
const tipoSugerencias = ["Salon", "Laboratorio"];

export const EspacioForm: React.FC<EspacioFormProps> = ({
  values,
  errors,
  mode,
  submitting,
  escuelas,
  escuelasLoading,
  onChange,
  onSubmit,
  onCancel
}) => {
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    onSubmit();
  };

  const hasSelectedEscuela = escuelas.some(
    (escuela) => `${escuela.id}` === values.escuelaId
  );

  return (
    <form className="espacio-form" onSubmit={handleSubmit}>
      <div className="espacio-form-grid">
        <div className="espacio-form-group">
          <label className="espacio-form-label" htmlFor="codigo">
            Codigo
          </label>
          <input
            id="codigo"
            className="espacio-form-input"
            placeholder="Ej. LAB-A201"
            maxLength={10}
            value={values.codigo}
            onChange={(event) => onChange("codigo", event.target.value)}
            required
          />
        </div>

        <div className="espacio-form-group">
          <label className="espacio-form-label" htmlFor="nombre">
            Nombre
          </label>
          <input
            id="nombre"
            className="espacio-form-input"
            maxLength={20}
            placeholder="Laboratorio de Sistemas"
            value={values.nombre}
            onChange={(event) => onChange("nombre", event.target.value)}
            required
          />
        </div>

        <div className="espacio-form-group">
        <label className="espacio-form-label" htmlFor="tipo">
          Tipo
        </label>
        <select
          id="tipo"
          className="espacio-form-input"
          value={values.tipo}
          onChange={(event) => onChange("tipo", event.target.value)}
          required
        >
          {tipoSugerencias.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>
      </div>


        <div className="espacio-form-group">
          <label className="espacio-form-label" htmlFor="capacidad">
            Capacidad
          </label>
          <input
            id="capacidad"
            type="number"
            min={1}
            max={100}
            className="espacio-form-input"
            placeholder="30"
            value={values.capacidad}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "") {
                onChange("capacidad", "");
                return;
              }

              if (/^\d{1,3}$/.test(value)) {
                const numericValue = Number(value);
                if (numericValue >= 1 && numericValue <= 100) {
                  onChange("capacidad", value);
                }
              }
            }}
            required
          />
        </div>

        <div className="espacio-form-group">
          <label className="espacio-form-label" htmlFor="escuela">
            Escuela
          </label>
          <select
            id="escuela"
            className="espacio-form-input"
            value={values.escuelaId}
            onChange={(event) => onChange("escuelaId", event.target.value)}
            disabled={escuelasLoading || escuelas.length === 0}
            required
          >
            <option value="" disabled>
              {escuelasLoading ? "Cargando escuelas..." : "Selecciona una escuela"}
            </option>
            {!hasSelectedEscuela && values.escuelaId && (
              <option value={values.escuelaId}>{`Escuela #${values.escuelaId}`}</option>
            )}
            {escuelas.map((escuela) => (
              <option key={escuela.id} value={`${escuela.id}`}>
                {escuela.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="espacio-form-group">
          <label className="espacio-form-label" htmlFor="estado">
            Estado
          </label>
          <select
            id="estado"
            className="espacio-form-input"
            value={values.estado}
            onChange={(event) => onChange("estado", event.target.value as EspacioFormValues["estado"])}
          >
            <option value="1">Activo</option>
            <option value="0">Inactivo</option>
          </select>
        </div>
      </div>

      <div className="espacio-form-group espacio-form-group-full">
        <label className="espacio-form-label" htmlFor="equipamiento">
          Equipamiento
        </label>
        <textarea
          id="equipamiento"
          className="espacio-form-textarea"
          maxLength={500}
          rows={3}
          placeholder="Computadoras, proyector, aire acondicionado..."
          value={values.equipamiento}
          onChange={(event) => onChange("equipamiento", event.target.value)}
        />
      </div>

      {errors.length > 0 && (
        <div className="espacio-form-errors">
          <p>Revisa los siguientes puntos:</p>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="espacio-form-actions">
        <button
          type="button"
          className="gestion-espacios-btn ghost"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="gestion-espacios-btn primary"
          disabled={submitting}
        >
          {submitting ? "Guardando..." : mode === "create" ? "Registrar" : "Actualizar"}
        </button>
      </div>
    </form>
  );
};
