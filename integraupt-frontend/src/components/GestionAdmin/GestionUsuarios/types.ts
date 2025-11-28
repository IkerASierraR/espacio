import type { UsuarioRole } from "./usuariosService";

export interface BackendTipoDocumento {
  idTipoDoc: number;
  nombre: string;
  abreviatura: string;
}

export interface BackendRol {
  idRol: number;
  nombre: string;
}

export interface BackendFacultad {
  idFacultad: number;
  nombre: string;
  abreviatura?: string;
}

export interface BackendEscuela {
  idEscuela: number;
  nombre: string;
  facultad?: BackendFacultad | null;
}

export interface BackendUsuarioAuth {
  idAuth?: number;
  correoU: string;
  password?: string;
}

export interface BackendUsuario {
  idUsuario: number;
  nombre: string;
  apellido: string;
  tipoDoc?: BackendTipoDocumento | null;
  numDoc: string;
  celular?: string | null;
  genero?: boolean | null;
  rol?: BackendRol | null;
  estado: number;
  fechaRegistro?: string | null;
  correo?: string | null;
  correoInstitucional?: string | null;
  correoPersonal?: string | null;
  email?: string | null;
  auth?: BackendUsuarioAuth | null;
}

export interface BackendEstudiante {
  idEstudiante: number;
  usuario: BackendUsuario;
  escuela?: BackendEscuela | null;
  codigo: string;
}

export interface BackendDocente {
  idDocente: number;
  usuario: BackendUsuario;
  escuela?: BackendEscuela | null;
  codigoDocente: string;
  tipoContrato?: string | null;
  especialidad?: string | null;
  fechaIncorporacion?: string | null;
}

export interface BackendAdministrativo {
  idAdministrativo: number;
  usuario: BackendUsuario;
  escuela?: BackendEscuela | null;
  turno?: string | null;
  extension?: string | null;
  fechaIncorporacion?: string | null;
}

export interface UsuarioRecord {
  id: number;
  usuarioId: number;
  role: UsuarioRole;
  codigo?: string;
  nombres: string;
  apellidos: string;
  correo: string;
  rolDescripcion: string;
  escuela?: string | null;
  facultad?: string | null;
  turno?: string | null;
  estado: number;
  estadoLabel: string;
  generoLabel: string;
  documento?: string;
  tipoDocumento?: string;
  telefono?: string | null;
  fechaRegistro?: string | null;
}

export interface UsuarioFormValues {
  nombre: string;
  apellido: string;
  idTipoDoc: string;
  numDoc: string;
  celular: string;
  genero: "" | "M" | "F";
  correo: string;
  password: string;
  idEscuela: string;
  codigoGenerico: string;
  tipoContrato: string;
  especialidad: string;
  turno: string;
  extension: string;
  idRol: string;
}

export const createEmptyFormValues = (): UsuarioFormValues => ({
  nombre: "",
  apellido: "",
  idTipoDoc: "",
  numDoc: "",
  celular: "",
  genero: "",
  correo: "",
  password: "",
  idEscuela: "",
  codigoGenerico: "",
  tipoContrato: "",
  especialidad: "",
  turno: "",
  extension: "",
  idRol: ""
});

export type CatalogoEstado = "idle" | "loading" | "error" | "ready";

export interface CatalogosData {
  tiposDocumento: BackendTipoDocumento[];
  roles: BackendRol[];
  escuelas: BackendEscuela[];
}

export const CONTRATOS_DESCRIPTIVOS: string[] = [
  "Tiempo Completo",
  "Medio Tiempo",
  "Contratado"
];

export const TURNOS_DESCRIPTIVOS: string[] = [
  "Mañana",
  "Tarde",
  "Noche",
  "Completo"
];

export const generoLabel = (value?: boolean | null): string => {
  if (value === true) {
    return "Masculino";
  }
  if (value === false) {
    return "Femenino";
  }
  return "No especificado";
};

export const estadoLabel = (estado?: number | null): string => {
  if (estado === 1) {
    return "Activo";
  }
  if (estado === 0) {
    return "Inactivo";
  }
  return "Sin estado";
};