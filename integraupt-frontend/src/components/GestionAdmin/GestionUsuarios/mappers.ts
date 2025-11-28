import {
  type BackendAdministrativo,
  type BackendDocente,
  type BackendEstudiante,
  type BackendUsuario,
  type UsuarioFormValues,
  type UsuarioRecord,
  createEmptyFormValues,
  estadoLabel,
  generoLabel
} from "./types";
import type { UsuarioRole } from "./usuariosService";

const contratoDescripcion = (value?: string | null): string => {
  if (!value) {
    return "Sin especificar";
  }
  switch (value.toUpperCase()) {
    case "TIEMPO_COMPLETO":
      return "Tiempo Completo";
    case "MEDIO_TIEMPO":
      return "Medio Tiempo";
    case "CONTRATADO":
      return "Contratado";
    case "NO_ESPECIFICADO":
      return "Sin especificar";
    default:
      return value;
  }
};

const turnoDescripcion = (value?: string | null): string => {
  if (!value) {
    return "Sin turno";
  }
  switch (value.toUpperCase()) {
    case "MAÑANA":
    case "MANANA":
      return "Mañana";
    case "TARDE":
      return "Tarde";
    case "NOCHE":
      return "Noche";
    case "COMPLETO":
      return "Completo";
    default:
      return value;
  }
};

const pickUsuarioCorreo = (usuario?: BackendUsuario | null): string | null => {
  if (!usuario) {
    return null;
  }
  
  const candidates = [
    usuario.auth?.correoU,
    usuario.correoInstitucional,
    usuario.correo,
    usuario.email,
    usuario.correoPersonal
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  
  return null;
};

const decodePassword = (usuario?: BackendUsuario | null): string => {
  const encoded = usuario?.auth?.password;
  if (!encoded) {
    return "";
  }
  try {
    if (typeof globalThis.atob === "function") {
      return globalThis.atob(encoded);
    }
  } catch (error) {
    console.warn("No se pudo decodificar la contraseña almacenada", error);
  }
  return "";
};

export const mapEstudianteToRecord = (estudiante: BackendEstudiante): UsuarioRecord => ({
  id: estudiante.idEstudiante,
  usuarioId: estudiante.usuario.idUsuario,
  role: "estudiante",
  codigo: estudiante.codigo,
  nombres: estudiante.usuario.nombre,
  apellidos: estudiante.usuario.apellido,
  correo: pickUsuarioCorreo(estudiante.usuario) ?? "Sin correo",
  rolDescripcion: estudiante.usuario.rol?.nombre ?? "Estudiante",
  escuela: estudiante.escuela?.nombre ?? null,
  facultad: estudiante.escuela?.facultad?.nombre ?? null,
  estado: estudiante.usuario.estado,
  estadoLabel: estadoLabel(estudiante.usuario.estado),
  generoLabel: generoLabel(estudiante.usuario.genero),
  documento: estudiante.usuario.numDoc,
  tipoDocumento: estudiante.usuario.tipoDoc?.abreviatura,
  telefono: estudiante.usuario.celular,
  fechaRegistro: estudiante.usuario.fechaRegistro ?? undefined
});

export const mapDocenteToRecord = (docente: BackendDocente): UsuarioRecord => ({
  id: docente.idDocente,
  usuarioId: docente.usuario.idUsuario,
  role: "docente",
  codigo: docente.codigoDocente,
  nombres: docente.usuario.nombre,
  apellidos: docente.usuario.apellido,
  correo: pickUsuarioCorreo(docente.usuario) ?? "Sin correo",
  rolDescripcion: docente.usuario.rol?.nombre ?? "Docente",
  escuela: docente.escuela?.nombre ?? null,
  facultad: docente.escuela?.facultad?.nombre ?? null,
  estado: docente.usuario.estado,
  estadoLabel: estadoLabel(docente.usuario.estado),
  generoLabel: generoLabel(docente.usuario.genero),
  documento: docente.usuario.numDoc,
  tipoDocumento: docente.usuario.tipoDoc?.abreviatura,
  telefono: docente.usuario.celular,
  fechaRegistro: docente.usuario.fechaRegistro ?? undefined
});

export const mapAdministrativoToRecord = (
  administrativo: BackendAdministrativo
): UsuarioRecord => ({
  id: administrativo.idAdministrativo,
  usuarioId: administrativo.usuario.idUsuario,
  role: "administrativo",
  nombres: administrativo.usuario.nombre,
  apellidos: administrativo.usuario.apellido,
  correo: pickUsuarioCorreo(administrativo.usuario) ?? "Sin correo",
  rolDescripcion: administrativo.usuario.rol?.nombre ?? "Administrativo",
  estado: administrativo.usuario.estado,
  estadoLabel: estadoLabel(administrativo.usuario.estado),
  generoLabel: generoLabel(administrativo.usuario.genero),
  documento: administrativo.usuario.numDoc,
  tipoDocumento: administrativo.usuario.tipoDoc?.abreviatura,
  telefono: administrativo.usuario.celular,
  fechaRegistro: administrativo.usuario.fechaRegistro ?? undefined,
  codigo: administrativo.usuario.rol?.nombre ?? "Sin rol",
  escuela: administrativo.escuela?.nombre ?? null,
  facultad: administrativo.escuela?.facultad?.nombre ?? null,
  turno: turnoDescripcion(administrativo.turno)
});

export const mapEntityToRecord = (
  role: UsuarioRole,
  entity: BackendEstudiante | BackendDocente | BackendAdministrativo
): UsuarioRecord => {
  switch (role) {
    case "estudiante":
      return mapEstudianteToRecord(entity as BackendEstudiante);
    case "docente":
      return mapDocenteToRecord(entity as BackendDocente);
    case "administrativo":
      return mapAdministrativoToRecord(entity as BackendAdministrativo);
    default:
      throw new Error(`Rol no soportado: ${role}`);
  }
};

export const mapEntityToFormValues = (
  role: UsuarioRole,
  entity: BackendEstudiante | BackendDocente | BackendAdministrativo
): UsuarioFormValues => {
  const base = createEmptyFormValues();

  if (role === "estudiante") {
    const estudiante = entity as BackendEstudiante;
    return {
      ...base,
      nombre: estudiante.usuario.nombre ?? "",
      apellido: estudiante.usuario.apellido ?? "",
      idTipoDoc: estudiante.usuario.tipoDoc?.idTipoDoc?.toString() ?? "",
      numDoc: estudiante.usuario.numDoc ?? "",
      celular: estudiante.usuario.celular ?? "",
      genero: estudiante.usuario.genero === null
        ? ""
        : estudiante.usuario.genero
        ? "M"
        : "F",
      correo: pickUsuarioCorreo(estudiante.usuario) ?? "",
      password: decodePassword(estudiante.usuario),
      idEscuela: estudiante.escuela?.idEscuela?.toString() ?? "",
      codigoGenerico: estudiante.codigo ?? "",
      tipoContrato: "",
      especialidad: "",
      turno: "",
      extension: "",
      idRol: ""
    };
  }

  if (role === "docente") {
    const docente = entity as BackendDocente;
    return {
      ...base,
      nombre: docente.usuario.nombre ?? "",
      apellido: docente.usuario.apellido ?? "",
      idTipoDoc: docente.usuario.tipoDoc?.idTipoDoc?.toString() ?? "",
      numDoc: docente.usuario.numDoc ?? "",
      celular: docente.usuario.celular ?? "",
      genero: docente.usuario.genero === null ? "" : docente.usuario.genero ? "M" : "F",
      correo: pickUsuarioCorreo(docente.usuario) ?? "",
      password: decodePassword(docente.usuario),
      idEscuela: docente.escuela?.idEscuela?.toString() ?? "",
      codigoGenerico: docente.codigoDocente ?? "",
      tipoContrato: contratoDescripcion(docente.tipoContrato),
      especialidad: docente.especialidad ?? "",
      turno: "",
      extension: "",
      idRol: ""
    };
  }

  const administrativo = entity as BackendAdministrativo;
  return {
    ...base,
    nombre: administrativo.usuario.nombre ?? "",
    apellido: administrativo.usuario.apellido ?? "",
    idTipoDoc: administrativo.usuario.tipoDoc?.idTipoDoc?.toString() ?? "",
    numDoc: administrativo.usuario.numDoc ?? "",
    celular: administrativo.usuario.celular ?? "",
    genero:
      administrativo.usuario.genero === null
        ? ""
        : administrativo.usuario.genero
        ? "M"
        : "F",
    correo: pickUsuarioCorreo(administrativo.usuario) ?? "",
    password: decodePassword(administrativo.usuario),
    idEscuela: administrativo.escuela?.idEscuela?.toString() ?? "",
    codigoGenerico: "",
    tipoContrato: "",
    especialidad: "",
    turno: turnoDescripcion(administrativo.turno),
    extension: administrativo.extension ?? "",
    idRol: administrativo.usuario.rol?.idRol?.toString() ?? ""
  };
};

export const sortCatalogByNombre = <T extends { nombre?: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => {
    const left = (a.nombre ?? "").toLowerCase();
    const right = (b.nombre ?? "").toLowerCase();
    return left.localeCompare(right, "es");
  });