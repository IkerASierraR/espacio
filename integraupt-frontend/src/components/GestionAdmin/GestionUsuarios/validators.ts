import {
  type AdministrativoPayload,
  type DocentePayload,
  type EstudiantePayload,
  type UsuarioRole
} from "./usuariosService";
import { CONTRATOS_DESCRIPTIVOS, TURNOS_DESCRIPTIVOS, type UsuarioFormValues } from "./types";

interface ValidationResult {
  errors: string[];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NUMERIC_REGEX = /^[0-9]+$/;
const CODIGO_REGEX = /^[A-Za-z0-9-]+$/;
const ALLOWED_ADMIN_ROLES = new Set<number>([3, 4]); // Administrador y Supervisor

const isEmail = (value: string): boolean => EMAIL_REGEX.test(value.trim());

const parseNumero = (value: string): number | null => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export const validateUsuarioForm = (
  role: UsuarioRole,
  values: UsuarioFormValues,
  isEdit: boolean
): ValidationResult => {
  const errors: string[] = [];

  const nombre = values.nombre.trim();
  const apellido = values.apellido.trim();
  const correo = values.correo.trim();
  const password = values.password.trim();
  const numDoc = values.numDoc.trim();
  const celular = values.celular.trim();

  if (!nombre) {
    errors.push("El nombre es obligatorio.");
  } else if (nombre.length < 2 || nombre.length > 30) {
    errors.push("El nombre debe tener entre 2 y 30 caracteres.");
  }

  if (!apellido) {
    errors.push("El apellido es obligatorio.");
  } else if (apellido.length < 2 || apellido.length > 30) {
    errors.push("El apellido debe tener entre 2 y 30 caracteres.");
  }

  if (!values.idTipoDoc) {
    errors.push("Selecciona un tipo de documento.");
  }

  if (!numDoc) {
    errors.push("El numero de documento es obligatorio.");
  } else {
    if (!NUMERIC_REGEX.test(numDoc)) {
      errors.push("El numero de documento solo debe contener digitos.");
    }
    if (numDoc.length < 6 || numDoc.length > 20) {
      errors.push("El numero de documento debe tener entre 6 y 20 digitos.");
    }
  }

  if (celular) {
    if (!NUMERIC_REGEX.test(celular)) {
      errors.push("El celular solo debe contener digitos.");
    }
    if (celular.length !== 9) {
      errors.push("El celular debe tener 9 digitos.");
    }
  }

  if (!correo) {
    errors.push("El correo institucional es obligatorio.");
  } else if (!isEmail(correo)) {
    errors.push("Ingresa un correo valido.");
  } else if (!correo.toLowerCase().endsWith("@upt.pe")) {
    errors.push("Usa el correo institucional (@upt.pe).");
  }

  if (!isEdit && !password) {
    errors.push("La contrase\u00f1a es obligatoria para nuevos usuarios.");
  }

  if (password) {
    if (password.length < 6) {
      errors.push("La contrase\u00f1a debe tener al menos 6 caracteres.");
    }
    if (password.includes(" ")) {
      errors.push("La contrase\u00f1a no debe contener espacios.");
    }
  }

  if (role === "estudiante") {
    if (!values.idEscuela) {
      errors.push("Selecciona una escuela para el estudiante.");
    }
    const codigo = values.codigoGenerico.trim();
    if (!codigo) {
      errors.push("Ingresa el codigo del estudiante.");
    } else {
      if (!NUMERIC_REGEX.test(codigo)) {
        errors.push("El codigo del estudiante solo debe contener digitos.");
      }
      if (codigo.length > 10) {
        errors.push("El codigo del estudiante debe tener maximo 10 digitos.");
      }
    }
  }

  if (role === "docente") {
    const codigo = values.codigoGenerico.trim();
    if (!codigo) {
      errors.push("Ingresa el codigo del docente.");
    } else {
      if (!CODIGO_REGEX.test(codigo)) {
        errors.push("El codigo del docente solo debe tener letras, numeros o guiones.");
      }
      if (codigo.length < 3 || codigo.length > 20) {
        errors.push("El codigo del docente debe tener entre 3 y 20 caracteres.");
      }
    }
    if (!values.tipoContrato.trim()) {
      errors.push("Selecciona el tipo de contrato.");
    } else if (!CONTRATOS_DESCRIPTIVOS.includes(values.tipoContrato.trim())) {
      errors.push("Selecciona un tipo de contrato valido.");
    }
    if (!values.idEscuela) {
      errors.push("Selecciona una escuela para el docente.");
    } else if (!NUMERIC_REGEX.test(values.idEscuela)) {
      errors.push("Selecciona una escuela valida para el docente.");
    }
    if (values.especialidad.trim().length > 0 && values.especialidad.trim().length < 3) {
      errors.push("La especialidad debe tener al menos 3 caracteres.");
    }
  }

  if (role === "administrativo") {
    if (!values.turno.trim()) {
      errors.push("Selecciona el turno de trabajo.");
    } else if (!TURNOS_DESCRIPTIVOS.includes(values.turno.trim())) {
      errors.push("Selecciona un turno valido.");
    }

    if (!values.idRol) {
      errors.push("Selecciona el rol del administrativo.");
    } else {
      const parsedRol = parseNumero(values.idRol);
      if (parsedRol == null) {
        errors.push("Selecciona un rol valido.");
      } else if (!ALLOWED_ADMIN_ROLES.has(parsedRol)) {
        errors.push("Solo se permite asignar Administrador o Supervisor.");
      }
    }

    if (values.extension.trim()) {
      if (!NUMERIC_REGEX.test(values.extension.trim())) {
        errors.push("La extension telefonica solo debe tener digitos.");
      }
      if (values.extension.trim().length < 3 || values.extension.trim().length > 5) {
        errors.push("La extension telefonica debe tener entre 3 y 5 digitos.");
      }
    }

    if (values.idEscuela && !NUMERIC_REGEX.test(values.idEscuela)) {
      errors.push("Selecciona una escuela valida para el administrativo.");
    }
  }

  return { errors };
};

const generoToBoolean = (value: UsuarioFormValues["genero"]): boolean | null => {
  if (value === "M") {
    return true;
  }
  if (value === "F") {
    return false;
  }
  return null;
};

export const buildPayloadFromValues = (
  role: UsuarioRole,
  values: UsuarioFormValues
): EstudiantePayload | DocentePayload | AdministrativoPayload => {
  const idTipoDoc = parseNumero(values.idTipoDoc);
  if (idTipoDoc == null) {
    throw new Error("Tipo de documento invalido");
  }

  const base = {
    nombre: values.nombre.trim(),
    apellido: values.apellido.trim(),
    idTipoDoc,
    numDoc: values.numDoc.trim(),
    celular: values.celular.trim() || undefined,
    genero: generoToBoolean(values.genero),
    correo: values.correo.trim(),
    password: values.password.trim() || undefined
  };

  switch (role) {
    case "estudiante": {
      const idEscuela = parseNumero(values.idEscuela);
      if (idEscuela == null) {
        throw new Error("Selecciona una escuela valida.");
      }
      const payload: EstudiantePayload = {
        ...base,
        idEscuela,
        codigo: values.codigoGenerico.trim()
      };
      return payload;
    }
    case "docente": {
      const idEscuela = parseNumero(values.idEscuela);
      if (idEscuela == null) {
        throw new Error("Selecciona una escuela valida.");
      }
      const payload: DocentePayload = {
        ...base,
        idEscuela,
        codigoDocente: values.codigoGenerico.trim(),
        tipoContrato: values.tipoContrato.trim(),
        especialidad: values.especialidad.trim() || undefined
      };
      return payload;
    }
    case "administrativo": {
      const idRol = parseNumero(values.idRol);
      if (idRol == null) {
        throw new Error("Selecciona un rol valido.");
      }
      let idEscuela: number | null = null;
      if (values.idEscuela) {
        const parsedEscuela = parseNumero(values.idEscuela);
        if (parsedEscuela == null) {
          throw new Error("Selecciona una escuela valida.");
        }
        idEscuela = parsedEscuela;
      }
      const payload: AdministrativoPayload = {
        ...base,
        idEscuela,
        turno: values.turno.trim(),
        extension: values.extension.trim() || undefined,
        idRol
      };
      return payload;
    }
    default:
      throw new Error("Rol no soportado");
  }
};
