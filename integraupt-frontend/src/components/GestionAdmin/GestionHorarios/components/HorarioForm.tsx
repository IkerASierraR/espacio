import React from "react";
import type {
  HorarioCatalogos,
  HorarioFormMode,
  HorarioFormValues
} from "../types";

const DIAS_SEMANA = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

interface HorarioFormProps {
  mode: HorarioFormMode;
  values: HorarioFormValues;
  errors: string[];
  submitting: boolean;
  catalogos: HorarioCatalogos;
  catalogosLoading: boolean;
  onChange: (field: keyof HorarioFormValues, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export const HorarioForm: React.FC<HorarioFormProps> = ({
  mode,
  values,
  errors,
  submitting,
  catalogos,
  catalogosLoading,
  onChange,
  onSubmit,
  onCancel
}) => {
  return (
    <div className="horario-form">
      <div className="horario-form-grid">
        <label className="horario-form-field">
          <span>Curso</span>
          <select
            className="horario-form-input"
            value={values.cursoId}
            onChange={(event) => onChange("cursoId", event.target.value)}
            disabled={catalogosLoading}
          >
            <option value="">Seleccione un curso</option>
            {catalogos.cursos.map((curso) => (
              <option key={curso.id} value={curso.id}>
                {curso.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="horario-form-field">
          <span>Docente</span>
          <select
            className="horario-form-input"
            value={values.docenteId}
            onChange={(event) => onChange("docenteId", event.target.value)}
            disabled={catalogosLoading}
          >
            <option value="">Seleccione un docente</option>
            {catalogos.docentes.map((docente) => (
              <option key={docente.id} value={docente.id}>
                {docente.nombreCompleto ??
                  `${docente.nombres} ${docente.apellidos}`}
              </option>
            ))}
          </select>
        </label>

        <label className="horario-form-field">
          <span>Espacio</span>
          <select
            className="horario-form-input"
            value={values.espacioId}
            onChange={(event) => onChange("espacioId", event.target.value)}
            disabled={catalogosLoading}
          >
            <option value="">Seleccione un espacio</option>
            {catalogos.espacios.map((espacio) => (
              <option key={espacio.id} value={espacio.id}>
                {espacio.nombre} ({espacio.codigo})
              </option>
            ))}
          </select>
        </label>

        <label className="horario-form-field">
          <span>Bloque horario</span>
          <select
            className="horario-form-input"
            value={values.bloqueId}
            onChange={(event) => onChange("bloqueId", event.target.value)}
            disabled={catalogosLoading}
          >
            <option value="">Seleccione un bloque</option>
            {catalogos.bloques.map((bloque) => (
              <option key={bloque.id} value={bloque.id}>
                {bloque.nombre} ({bloque.horaInicio} - {bloque.horaFinal})
              </option>
            ))}
          </select>
        </label>

        <label className="horario-form-field">
          <span>Día de la semana</span>
          <select
            className="horario-form-input"
            value={values.diaSemana}
            onChange={(event) => onChange("diaSemana", event.target.value)}
          >
            {DIAS_SEMANA.map((dia) => (
              <option key={dia} value={dia}>
                {dia}
              </option>
            ))}
          </select>
        </label>

        <label className="horario-form-field">
          <span>Fecha de inicio</span>
          <input
            className="horario-form-input"
            type="date"
            value={values.fechaInicio}
            onChange={(event) =>
              onChange("fechaInicio", event.target.value)
            }
          />
        </label>

        <label className="horario-form-field">
          <span>Fecha de fin</span>
          <input
            className="horario-form-input"
            type="date"
            value={values.fechaFin}
            onChange={(event) =>
              onChange("fechaFin", event.target.value)
            }
          />
        </label>

        <label className="horario-form-field">
          <span>Estado</span>
          <select
            className="horario-form-input"
            value={values.estado}
            onChange={(event) =>
              onChange("estado", event.target.value as HorarioFormValues["estado"])
            }
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </label>
      </div>

      {errors.length > 0 && (
        <div className="horario-form-errors">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      <div className="horario-form-actions">
        <button
          className="horario-form-btn"
          disabled={submitting}
          onClick={onSubmit}
        >
          {submitting
            ? "Guardando..."
            : mode === "create"
            ? "Registrar horario"
            : "Actualizar horario"}
        </button>

        <button
          className="horario-form-btn-cancel"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};
