export interface IncidenciaGestionRow {
  id: number;
  reservaId: number | null;
  usuarioId: number | null;
  usuarioNombre: string | null;
  usuarioDocumento: string | null;
  espacioId: number | null;
  espacioCodigo: string | null;
  espacioNombre: string | null;
  escuelaId: number | null;
  escuelaNombre: string | null;
  facultadId: number | null;
  facultadNombre: string | null;
  descripcion: string | null;
  fechaReporte: string;
}

export interface FacultadOption {
  id: number;
  nombre: string;
  abreviatura?: string | null;
}

export interface EscuelaOption {
  id: number;
  nombre: string;
  facultadId?: number | null;
  facultadNombre?: string | null;
}

export interface EspacioOption {
  id: number;
  nombre: string;
  codigo: string;
  escuelaId?: number | null;
}

export interface IncidenciaFilters {
  facultadId: string;
  escuelaId: string;
  espacioId: string;
  search: string;
}