export type EstadoLaboratorio = 'disponible' | 'mantenimiento' | 'ocupado' | 'no_disponible';

export interface LaboratorioResumen {
    espacioId?: number;
  id: string;
  nombre: string;
  codigo?: string;
  tipo?: string;
  facultad?: string;
  campus?: string;
  ubicacion?: string;
  piso?: string;
  capacidad?: number;
  escuelaId?: number;
  estado?: EstadoLaboratorio;
  estadoDescripcion?: string;
  especialidades?: string[];
  equipamiento?: string[];
  proximaDisponibilidad?: string;
  ultimaActualizacion?: string;
  notas?: string;
}

export interface HorarioDia {
  diaSemana: string;
  ocupado: boolean;
}

export interface HorarioSemanal {
  bloqueId: number;
  bloqueNombre: string;
  horaInicio: string;
  horaFin: string;
  dias: HorarioDia[];
  }
export type ReservaEstado = 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Cancelada';

  export interface ReservaApi {
    id: number;
        usuarioId: number;
        espacioId: number;
        espacioNombre?: string | null;
        bloqueId: number;
        bloqueHoraInicio?: string | null;
        bloqueHoraFin?: string | null;
        cursoId: number;
        fechaReserva?: string | null;
        fechaSolicitud?: string | null;
        descripcionUso?: string | null;
        cantidadEstudiantes: number;
        estado?: ReservaEstado | null;
  }

  export interface ReservaUpdatePayload {
    usuarioId: number;
    espacioId: number;
    bloqueId: number;
    cursoId: number;
    fechaReserva: string;
    descripcionUso?: string | null;
    cantidadEstudiantes: number;
    estado?: ReservaEstado | null;
  }

  export interface ReservaQrInfo {
    reservaId?: number | null;
    laboratorio?: string | null;
    fecha?: string | null;
    hora?: string | null;
    estado?: string | null;
  }

  export interface ReservaQrResponse {
    token?: string | null;
    verificationUrl?: string | null;
    qrBase64?: string | null;
    reserva?: ReservaQrInfo | null;
    generadoEn?: string | null;
  }

  export interface ReservaCreacionResponse {
    reserva: ReservaApi;
    qr?: ReservaQrResponse | null;
}