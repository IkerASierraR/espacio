import type { Horario, HorarioFormValues, HorarioPayload } from "./types";

const DIA_SEMANA_VALIDOS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

export const createEmptyFormValues = (): HorarioFormValues => ({
  cursoId: "",
  docenteId: "",
  espacioId: "",
  bloqueId: "",
  diaSemana: "Lunes",
  fechaInicio: "",
  fechaFin: "",
  estado: "activo"
});

export const mapHorarioToFormValues = (horario: Horario): HorarioFormValues => ({
  cursoId: `${horario.cursoId}`,
  docenteId: `${horario.docenteId}`,
  espacioId: `${horario.espacioId}`,
  bloqueId: `${horario.bloqueId}`,
  diaSemana: horario.diaSemana,
  fechaInicio: horario.fechaInicio,
  fechaFin: horario.fechaFin,
  estado: horario.estado ? "activo" : "inactivo"
});

export const validateHorarioValues = (values: HorarioFormValues): string[] => {
  const errors: string[] = [];

  if (!values.cursoId.trim()) {
    errors.push("Seleccione un curso valido.");
  }

  if (!values.docenteId.trim()) {
    errors.push("Seleccione un docente valido.");
  }

  if (!values.espacioId.trim()) {
    errors.push("Seleccione un espacio valido.");
  }

  if (!values.bloqueId.trim()) {
    errors.push("Seleccione un bloque valido.");
  }

  if (!DIA_SEMANA_VALIDOS.includes(values.diaSemana)) {
    errors.push("Seleccione un dia de la semana valido.");
  }

  if (!values.fechaInicio) {
    errors.push("La fecha de inicio es obligatoria.");
  }

  if (!values.fechaFin) {
    errors.push("La fecha de fin es obligatoria.");
  }

  if (values.fechaInicio && values.fechaFin) {
    const inicio = new Date(values.fechaInicio);
    const fin = new Date(values.fechaFin);
    if (fin < inicio) {
      errors.push("La fecha de fin debe ser mayor o igual a la fecha de inicio.");
    }
  }

  return errors;
};

export const buildPayloadFromValues = (values: HorarioFormValues): HorarioPayload => ({
  curso: Number(values.cursoId),
  docente: Number(values.docenteId),
  espacio: Number(values.espacioId),
  bloque: Number(values.bloqueId),
  diaSemana: values.diaSemana,
  fechaInicio: values.fechaInicio,
  fechaFin: values.fechaFin,
  estado: values.estado === "activo"
});
