import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import { USUARIOS_API_BASE_URL } from "../../../utils/apiConfig";
import type {
  BackendAdministrativo,
  BackendDocente,
  BackendEstudiante,
  BackendEscuela,
  BackendRol,
  BackendTipoDocumento
} from "./types";

export type UsuarioRole = "administrativo" | "docente" | "estudiante";

export interface EstudiantePayload {
  nombre: string;
  apellido: string;
  idTipoDoc: number;
  numDoc: string;
  celular?: string;
  genero?: boolean | null;
  correo: string;
  password?: string;
  idEscuela: number;
  codigo: string;
}

export interface DocentePayload {
  nombre: string;
  apellido: string;
  idTipoDoc: number;
  numDoc: string;
  celular?: string;
  genero?: boolean | null;
  correo: string;
  password?: string;
  idEscuela?: number | null;
  codigoDocente: string;
  tipoContrato: string;
  especialidad?: string;
}

export interface AdministrativoPayload {
  nombre: string;
  apellido: string;
  idTipoDoc: number;
  numDoc: string;
  celular?: string;
  genero?: boolean | null;
  correo: string;
  password?: string;
  idEscuela?: number | null;
  turno: string;
  extension?: string;
  idRol: number;
}

export type PayloadMap = {
  administrativo: AdministrativoPayload;
  docente: DocentePayload;
  estudiante: EstudiantePayload;
};

export type EntityMap = {
  administrativo: BackendAdministrativo;
  docente: BackendDocente;
  estudiante: BackendEstudiante;
};

const usuariosClient: AxiosInstance = axios.create({
  baseURL: USUARIOS_API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 20000
});

const endpoints: Record<UsuarioRole, string> = {
  administrativo: "/api/administrativos",
  docente: "/api/docentes",
  estudiante: "/api/estudiantes"
};

const catalogEndpoints = {
  tiposDocumento: "/api/catalogos/tipos-documento",
  roles: "/api/catalogos/roles",
  escuelas: "/api/catalogos/escuelas"
} as const;

type CatalogKey = keyof typeof catalogEndpoints;

const normalizeError = (error: unknown): Error => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;
    if (typeof responseData === "string") {
      return new Error(responseData);
    }
    if (responseData && typeof responseData === "object" && "message" in responseData) {
      const maybeMessage = (responseData as { message?: string }).message;
      if (maybeMessage) {
        return new Error(maybeMessage);
      }
    }
    return new Error(error.message || "No se pudo completar la solicitud.");
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error("No se pudo completar la solicitud.");
};

const unwrap = async <T>(promise: Promise<AxiosResponse<T>>): Promise<T> => {
  try {
    const { data } = await promise;
    return data;
  } catch (error) {
    throw normalizeError(error);
  }
};

export const fetchUsuarios = async <R extends UsuarioRole>(role: R): Promise<EntityMap[R][]> =>
  unwrap(usuariosClient.get<EntityMap[R][]>(endpoints[role]));

export const createUsuario = async <R extends UsuarioRole>(
  role: R,
  payload: PayloadMap[R]
): Promise<EntityMap[R]> => unwrap(usuariosClient.post<EntityMap[R]>(endpoints[role], payload));

export const updateUsuario = async <R extends UsuarioRole>(
  role: R,
  id: number,
  payload: PayloadMap[R]
): Promise<EntityMap[R]> => unwrap(usuariosClient.put<EntityMap[R]>(`${endpoints[role]}/${id}`, payload));

export const updateUsuarioEstado = async <R extends UsuarioRole>(
  role: R,
  id: number,
  activo: boolean
): Promise<EntityMap[R]> =>
  unwrap(usuariosClient.patch<EntityMap[R]>(`${endpoints[role]}/${id}/estado`, { activo }));

export const deleteUsuario = async <R extends UsuarioRole>(role: R, id: number): Promise<void> => {
  try {
    await usuariosClient.delete(`${endpoints[role]}/${id}`);
  } catch (error) {
    throw normalizeError(error);
  }
};

export const fetchCatalogo = async (key: CatalogKey) => {
  switch (key) {
    case "tiposDocumento":
      return unwrap(usuariosClient.get<BackendTipoDocumento[]>(catalogEndpoints[key]));
    case "roles":
      return unwrap(usuariosClient.get<BackendRol[]>(catalogEndpoints[key]));
    case "escuelas":
      return unwrap(usuariosClient.get<BackendEscuela[]>(catalogEndpoints[key]));
    default:
      throw new Error("Catalogo no soportado");
  }
};