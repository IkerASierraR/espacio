export type ReservaEstado = "Pendiente" | "Aprobada" | "Rechazada" | "Cancelada";

export interface AdminReserva {
  id: number;
  estado: ReservaEstado;
  fechaReserva: string;
  fechaSolicitud: string;
  descripcionUso?: string | null;
  cantidadEstudiantes: number;
  espacioCodigo?: string | null;
  espacioNombre: string;
  espacioTipo: string;
  escuelaId?: number | null;
  escuelaNombre?: string | null;
  facultadId?: number | null;
  facultadNombre?: string | null;
  bloqueNombre?: string | null;
  horaInicio: string;
  horaFin: string;
  cursoNombre: string;
  solicitanteId: number;
  solicitanteNombre: string;
  solicitanteApellido: string;
  solicitanteCorreo?: string | null;
  ultimaAccion?: string | null;
  motivo?: string | null;
  comentarios?: string | null;
  fechaGestion?: string | null;
  gestorId?: number | null;
  gestorNombre?: string | null;
  gestorApellido?: string | null;
}

export interface AdminReservaSummary {
  pendientes: number;
  aprobadas: number;
  rechazadas: number;
  canceladas: number;
}

export interface SimpleOption {
  id: number;
  nombre: string;
}

export interface EscuelaOption extends SimpleOption {
  facultadId: number;
}

export interface AdminReservaFilters {
  tiposEspacio: string[];
  facultades: SimpleOption[];
  escuelas: EscuelaOption[];
}

export interface ReservaFiltersState {
  estado: ReservaEstado;
  tipoEspacio: string | null;
  facultadId: number | null;
  escuelaId: number | null;
  fecha: string | null;
  search: string;
}

export interface GestionReservaPayload {
  usuarioGestionId: number;
  accion: "Aprobar" | "Rechazar";
  motivo: string;
  comentarios?: string;
}

export interface AdminReservaResponse {
  reservas: AdminReserva[];
  resumen: AdminReservaSummary;
}