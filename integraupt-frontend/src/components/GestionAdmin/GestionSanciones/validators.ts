import type { SancionFormValues, SancionPayload } from "./types";

const sanitizeMotivo = (value: string): string => value.trim();

export const createEmptyFormValues = (): SancionFormValues => ({
  usuarioId: "",
   usuarioCodigo: "",
   usuarioNombre: "",
   usuarioEscuela: "",
   facultadId: "",
   escuelaId: "",
  tipoUsuario: "",
  motivo: "",
  fechaInicio: "",
  fechaFin: ""
});

export const validateSancionValues = (values: SancionFormValues): string[] => {
  const errors: string[] = [];

   const usuarioId = values.usuarioId.trim();
    const usuarioCodigo = values.usuarioCodigo.trim();

    if (!usuarioId && !usuarioCodigo) {
      errors.push("Selecciona un usuario o ingresa su codigo.");
    } else if (usuarioId && Number.isNaN(Number(usuarioId))) {
      errors.push("El identificador del usuario seleccionado no es valido.");
  }

  if (!values.tipoUsuario) {
    errors.push("Seleccione el tipo de usuario.");
  }

  const motivo = sanitizeMotivo(values.motivo);
  if (!motivo) {
    errors.push("El motivo de la sancion es obligatorio.");
  } else if (motivo.length > 255) {
    errors.push("El motivo no puede superar los 255 caracteres.");
  }

  if (!values.fechaInicio) {
    errors.push("Seleccione la fecha de inicio.");
  }

  if (!values.fechaFin) {
    errors.push("Seleccione la fecha de fin.");
  }

  if (values.fechaInicio && values.fechaFin) {
    const inicio = new Date(values.fechaInicio);
    const fin = new Date(values.fechaFin);
    if (fin < inicio) {
      errors.push("La fecha de fin no puede ser anterior a la fecha de inicio.");
    }
  }

  return errors;
};

export const buildPayloadFromValues = (values: SancionFormValues): SancionPayload => ({
  ...(values.usuarioId.trim() ? { usuarioId: Number(values.usuarioId.trim()) } : {}),
  ...(values.usuarioCodigo.trim() ? { usuarioCodigo: values.usuarioCodigo.trim() } : {}),
  tipoUsuario: values.tipoUsuario ? values.tipoUsuario.toUpperCase() : "",
  motivo: sanitizeMotivo(values.motivo),
  fechaInicio: values.fechaInicio,
  fechaFin: values.fechaFin
});