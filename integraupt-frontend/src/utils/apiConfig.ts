// =====================
// Normalizadores comunes
// =====================
const normalizeBaseUrl = (url: string): string =>
  url.replace(/\/+$/, "");

const resolveBaseUrl = (
  candidate: string | undefined,
  fallback: string
): string => {
  const value = candidate?.trim();
  return normalizeBaseUrl(value || fallback);
};

const normalizePath = (path: string): string =>
  path.startsWith("/") ? path : `/${path}`;

const env = import.meta.env;

// ==========================
// URLs por defecto (fallback)
// ==========================
const DEFAULT_LOGIN_BACKEND_URL = "http://localhost:8081";
const DEFAULT_ESPACIOS_BACKEND_URL = "http://localhost:8082";
const DEFAULT_HORARIOCURSO_BACKEND_URL = "http://localhost:8083";
const DEFAULT_RESERVAS_BACKEND_URL = "http://localhost:8084";
const DEFAULT_HORARIOS_BACKEND_URL = "http://localhost:8085";
const DEFAULT_INCIDENCIAS_BACKEND_URL = "http://localhost:8086";
const DEFAULT_SANCIONES_BACKEND_URL = "http://localhost:8087";
const DEFAULT_ADMIN_RESERVAS_BACKEND_URL = "http://localhost:8088";
const DEFAULT_USUARIOS_BACKEND_URL = "http://localhost:8092";
const DEFAULT_REPORTES_BACKEND_URL = "http://localhost:8089";
const DEFAULT_QR_RESERVAS_BACKEND_URL = "http://localhost:8090";
const DEFAULT_AUDITORIA_BACKEND_URL = "http://localhost:8091";

// ==========================
// Resolución final de URLs
// ==========================
export const LOGIN_API_BASE_URL = resolveBaseUrl(
  env.VITE_LOGIN_BACKEND_URL ?? env.VITE_BACKEND_URL,
  DEFAULT_LOGIN_BACKEND_URL
);

export const RESERVAS_API_BASE_URL = resolveBaseUrl(
  env.VITE_RESERVAS_BACKEND_URL ?? env.VITE_BACKEND_URL,
  DEFAULT_RESERVAS_BACKEND_URL
);

export const ADMIN_RESERVAS_API_BASE_URL = resolveBaseUrl(
  env.VITE_ADMIN_RESERVAS_BACKEND_URL ?? env.VITE_RESERVAS_BACKEND_URL ?? env.VITE_BACKEND_URL,
  DEFAULT_ADMIN_RESERVAS_BACKEND_URL
);

export const HORARIOS_API_BASE_URL = resolveBaseUrl(
  env.VITE_HORARIOS_BACKEND_URL ?? env.VITE_BACKEND_URL,
  DEFAULT_HORARIOS_BACKEND_URL
);

export const ESPACIOS_API_BASE_URL = resolveBaseUrl(
  env.VITE_ESPACIOS_BACKEND_URL ?? env.VITE_BACKEND_URL,
  DEFAULT_ESPACIOS_BACKEND_URL
);

export const HORARIOCURSO_API_BASE_URL = resolveBaseUrl(
  env.VITE_HORARIOCURSO_BACKEND_URL ?? env.VITE_BACKEND_URL,
  DEFAULT_HORARIOCURSO_BACKEND_URL
);

export const INCIDENCIAS_API_BASE_URL = resolveBaseUrl(
  env.VITE_INCIDENCIAS_BACKEND_URL ?? env.VITE_BACKEND_URL,
  DEFAULT_INCIDENCIAS_BACKEND_URL
);

export const SANCIONES_API_BASE_URL = resolveBaseUrl(
  env.VITE_SANCIONES_BACKEND_URL ?? env.VITE_BACKEND_URL,
  DEFAULT_SANCIONES_BACKEND_URL
);

export const REPORTES_API_BASE_URL = resolveBaseUrl(
  env.VITE_REPORTES_BACKEND_URL ?? env.VITE_BACKEND_URL,
  DEFAULT_REPORTES_BACKEND_URL
);

export const QR_RESERVAS_API_BASE_URL = resolveBaseUrl(
  env.VITE_QR_RESERVAS_BACKEND_URL ?? env.VITE_BACKEND_URL,
  DEFAULT_QR_RESERVAS_BACKEND_URL
);



export const USUARIOS_API_BASE_URL = resolveBaseUrl(
  env.VITE_USUARIOS_BACKEND_URL ?? env.VITE_BACKEND_URL,
  DEFAULT_USUARIOS_BACKEND_URL
);

export const AUDITORIA_API_BASE_URL = resolveBaseUrl(
  env.VITE_AUDITORIA_BACKEND_URL ?? env.VITE_BACKEND_URL,
  DEFAULT_AUDITORIA_BACKEND_URL
);


// ==========================
// Helpers para construir URLs
// ==========================
export const buildServiceUrl = (baseUrl: string, path: string): string =>
  `${normalizeBaseUrl(baseUrl)}${normalizePath(path)}`;

export const getLoginApiUrl = (path: string) =>
  buildServiceUrl(LOGIN_API_BASE_URL, path);

export const getReservasApiUrl = (path: string) =>
  buildServiceUrl(RESERVAS_API_BASE_URL, path);

export const getAdminReservasApiUrl = (path: string) =>
  buildServiceUrl(ADMIN_RESERVAS_API_BASE_URL, path);


export const getEspaciosApiUrl = (path: string) =>
  buildServiceUrl(ESPACIOS_API_BASE_URL, path);

export const getHorariosApiUrl = (path: string) =>
  buildServiceUrl(HORARIOS_API_BASE_URL, path);

export const getHorarioCursoApiUrl = (path: string) =>
  buildServiceUrl(HORARIOCURSO_API_BASE_URL, path);

export const getIncidenciasApiUrl = (path: string) =>
  buildServiceUrl(INCIDENCIAS_API_BASE_URL, path);

export const getSancionesApiUrl = (path: string) =>
  buildServiceUrl(SANCIONES_API_BASE_URL, path);

export const getUsuariosApiUrl = (path: string) =>
  buildServiceUrl(USUARIOS_API_BASE_URL, path);

export const getQrReservasApiUrl = (path: string) =>
  buildServiceUrl(QR_RESERVAS_API_BASE_URL, path);

  export const getAuditoriaApiUrl = (path: string) =>
    buildServiceUrl(AUDITORIA_API_BASE_URL, path);

// ==========================
// Login Type Helper
// ==========================
const backendLoginTypes = new Set(["academic", "administrative"]);

export const isBackendLoginType = (loginType?: string | null): boolean =>
  !!loginType && backendLoginTypes.has(loginType.toLowerCase());
