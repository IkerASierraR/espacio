export type SancionEstado = "ACTIVA" | "CUMPLIDA";

export type TipoUsuario = "ESTUDIANTE" | "DOCENTE";

export interface Sancion {
   id: number;
    usuarioId: number | null;
    usuarioNombre?: string | null;
    usuarioCodigo?: string | null;
    usuarioEscuela?: string | null;
    usuarioEscuelaId?: number | null;
    usuarioFacultad?: string | null;
    usuarioFacultadId?: number | null;
    tipoUsuario: TipoUsuario;
    motivo: string;
    fechaInicio: string;
    fechaFin: string;
    estado: SancionEstado;
}

export interface SancionPayload {
 usuarioId?: number;
   usuarioCodigo?: string;
   tipoUsuario: string;
   rol?: string;
   facultadId?: number;
   escuelaId?: number;
   escuelaContextoId?: number;
   motivo: string;
   fechaInicio: string;
   fechaFin: string;
}

export interface SancionFormValues {
  usuarioId: string;
  usuarioCodigo: string;
  usuarioNombre: string;
  usuarioEscuela: string;
  facultadId: string;
  escuelaId: string;
  tipoUsuario: TipoUsuario | "";
  motivo: string;
  fechaInicio: string;
  fechaFin: string;
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

export interface UsuarioOption {
  id: number;
  nombreCompleto?: string | null;
  codigo?: string | null;
  escuelaNombre?: string | null;
  facultadNombre?: string | null;
  escuelaId?: number | null;
  facultadId?: number | null;
  }