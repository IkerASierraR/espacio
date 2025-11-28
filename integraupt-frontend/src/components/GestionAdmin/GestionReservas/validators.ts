import type { GestionReservaPayload, ReservaEstado } from "./types";

export const MAX_MOTIVO_LENGTH = 1000;

export const esEstadoGestionable = (estado: ReservaEstado): boolean =>
  estado === "Pendiente";

export const validarMotivo = (motivo: string): string | null => {
  if (!motivo || motivo.trim().length === 0) {
    return "Debes indicar el motivo de la gestión.";
  }

  if (motivo.trim().length > MAX_MOTIVO_LENGTH) {
    return `El motivo no debe superar los ${MAX_MOTIVO_LENGTH} caracteres.`;
  }

  return null;
};

export const construirPayloadGestion = (
  usuarioGestionId: number,
  accion: GestionReservaPayload["accion"],
  motivo: string,
  comentarios?: string
): GestionReservaPayload => ({
  usuarioGestionId,
  accion,
  motivo: motivo.trim(),
  comentarios: comentarios && comentarios.trim().length > 0 ? comentarios.trim() : undefined
});

export const formatearEstado = (estado: ReservaEstado): string => {
  switch (estado) {
    case "Pendiente":
      return "Pendiente";
    case "Aprobada":
      return "Aprobada";
    case "Rechazada":
      return "Rechazada";
    case "Cancelada":
      return "Cancelada";
    default:
      return estado;
  }
};