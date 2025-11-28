export interface AuditoriaReserva {
  idAudit: number;
  idReserva: number;
  estadoAnterior: string;
  estadoNuevo: string;
  fechaCambio: string;
  usuarioCambioId?: number | null;
  usuarioCambioNombre?: string | null;
  usuarioCambioDocumento?: string | null;
  estadoReservaActual?: string | null;
  descripcionUso?: string | null;
  fechaReserva?: string | null;
  codigoEspacio?: string | null;
  nombreEspacio?: string | null;
}

export interface AuditoriaFiltro {
  reservaId?: number;
  estado?: string;
  usuario?: string;
  fechaInicio?: string;
  fechaFin?: string;
}