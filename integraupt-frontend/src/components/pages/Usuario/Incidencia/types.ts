export interface DisponibilidadIncidenciaResponse {
  reservaId: number;
  habilitado: boolean;
  habilitadoDesde: string;
  habilitadoHasta: string;
}

export interface IncidenciaResponse {
  id: number;
  reservaId: number;
  descripcion: string;
  fechaReporte: string;
}

export interface RegistrarIncidenciaPayload {
  reservaId: number;
  descripcion: string;
}

export interface ReservaIncidenciaResumen {
  reservaId: number;
  espacioId: number;
  espacioNombre: string;
  espacioCodigo?: string | null;
  fechaReserva: string;
  horaInicio: string;
  horaFin: string;
  estado?: string | null;
  habilitado: boolean;
  habilitadoDesde: string;
  habilitadoHasta: string;
  }