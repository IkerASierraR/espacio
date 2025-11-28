import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Server,
  LogOut,
  Building2,
  CalendarClock,
  ClipboardCheck,
  UsersRound,
  ShieldCheck,
  BarChart3,
  Ban,
  AlertCircle
} from "lucide-react";
import "./../styles/AdminDashboard.css";
import {
  GestionEspacios,
  GestionHorarios,
  GestionSanciones,
  GestionReservas,
  GestionUsuarios,
  GestionReportes,
  GestionIncidencias,
  GestionAuditoria
} from "./GestionAdmin";
import { requestBackendLogout } from "../utils/logout";
import { isBackendLoginType } from "../utils/apiConfig";

type ModuleId =
  | "labs"
  | "schedules"
  | "sanctions"
  | "reservas"
  | "users"
  | "audit"
  | "reports"
  | "incidencias";

interface ModuleDefinition {
  id: ModuleId;
  name: string;
  description: string;
  icon: LucideIcon;
  color: "blue" | "green" | "indigo" | "purple" | "orange" | "red";
}

interface AuditEntry {
  id: string;
  module: ModuleId;
  message: string;
  detail?: string;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  sessionToken?: string;
  user_metadata: {
    name: string;
    avatar_url: string;
    role?: string;
    login_type?: string;
  };
}

interface AdminDashboardProps {
  user: User;
}

const MODULES: ModuleDefinition[] = [
  {
    id: "labs",
    name: "Gestion de Espacios",
    description: "Administra aulas, laboratorios y ambientes especiales",
    icon: Building2,
    color: "blue"
  },
  {
    id: "schedules",
    name: "Gestion de Horarios",
    description: "Configura turnos y tiempos por cada escuela",
    icon: CalendarClock,
    color: "green"
  },
  {
    id: "sanctions",
    name: "Sanciones",
    description: "Administra sanciones activas y su historial",
    icon: Ban,
    color: "red"
  },
  {
    id: "reservas",
    name: "Reservas",
    description: "Aprueba, rechaza y monitorea las solicitudes recibidas",
    icon: ClipboardCheck,
    color: "orange"
  },
  {
    id: "users",
    name: "Usuarios",
    description: "Define responsables y permisos del sistema",
    icon: UsersRound,
    color: "purple"
  },
  {
    id: "audit",
    name: "Auditoria",
    description: "Consulta los eventos relevantes registrados",
    icon: ShieldCheck,
    color: "red"
  },
  {
    id: "reports",
    name: "Reportes",
    description: "Construye reportes y estadisticas ejecutivas",
    icon: BarChart3,
    color: "indigo"
  },
  {
    id: "incidencias",
    name: "Incidencias",
    description: "Revisa y filtra los reportes registrados en los espacios",
    icon: AlertCircle,
    color: "red"
  }
];

const SUPERVISOR_ALLOWED_MODULES: ModuleId[] = [
  "reservas",
  "sanctions",
  "reports",
  "incidencias"
];

const formatTimestamp = (isoDate: string): string => {
  try {
    return new Intl.DateTimeFormat("es-PE", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(isoDate));
  } catch {
    return new Date(isoDate).toLocaleString();
  }
};

const buildAuditId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const normalizedRole = useMemo(
    () => user.user_metadata.role?.trim().toLowerCase() ?? "",
    [user.user_metadata.role]
  );

  const isSupervisor = normalizedRole === "supervisor";

  const availableModules = useMemo(() => {
    if (isSupervisor) {
      return MODULES.filter((module) =>
        SUPERVISOR_ALLOWED_MODULES.includes(module.id)
      );
    }
    return MODULES;
  }, [isSupervisor]);

  const [activeModule, setActiveModule] = useState<ModuleId>("labs");

  useEffect(() => {
    if (!availableModules.some((module) => module.id === activeModule)) {
      const fallbackModule = availableModules[0]?.id ?? MODULES[0].id;
      setActiveModule(fallbackModule);
    }
  }, [activeModule, availableModules]);

  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // CORRECCIÓN AQUÍ
  const moduleDictionary = useMemo(() => {
    return availableModules.reduce((acc, module) => {
      acc[module.id] = module;
      return acc;
    }, {} as Record<ModuleId, ModuleDefinition>);
  }, [availableModules]);

  const userInitial = useMemo(() => {
    const fallback = user.email || "A";
    const source = user.user_metadata.name || fallback;
    return source.charAt(0).toUpperCase();
  }, [user.email, user.user_metadata.name]);

  const shouldNotifyBackend = useMemo(
    () => isBackendLoginType(user.user_metadata.login_type),
    [user.user_metadata.login_type]
  );

  const addAuditLog = useCallback(
    (message: string, detail?: string) => {
      setAuditTrail((prev) => {
        const entry: AuditEntry = {
          id: buildAuditId(),
          module: activeModule,
          message,
          detail,
          createdAt: new Date().toISOString()
        };
        return [entry, ...prev].slice(0, 20);
      });
    },
    [activeModule]
  );

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      if (shouldNotifyBackend) {
        await requestBackendLogout(user.id, user.sessionToken);
      }
    } catch (error) {
      console.error("No se pudo cerrar la sesion en el backend:", error);
    } finally {
      try {
        localStorage.removeItem("admin_session");
      } catch {}
      window.location.reload();
    }
  }, [isLoggingOut, shouldNotifyBackend, user.id]);

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-container">
          <div className="admin-header-left">
            <div className="admin-logo">
              <Server className="admin-logo-icon" />
            </div>
            <div>
              <h1 className="admin-title">Panel de Control Administrativo</h1>
              <p className="admin-subtitle">IntegraUPT - Sistema de Gestion</p>
            </div>
          </div>

          <div className="admin-header-right">
            <div className="admin-user-info">
              <p className="admin-user-name">{user.user_metadata.name}</p>
              <p className="admin-user-role">
                {user.user_metadata.role ?? "Administrador del Sistema"}
              </p>
            </div>
            <div className="admin-user-avatar">
              <span className="admin-avatar-text">{userInitial}</span>
            </div>
            <button
              onClick={handleLogout}
              className="admin-logout-btn"
              disabled={isLoggingOut}
            >
              <LogOut className="admin-logout-icon" />
              {isLoggingOut ? "Cerrando..." : "Cerrar Sesion"}
            </button>
          </div>
        </div>
      </header>

      <div className="admin-main-container">
        <div className="admin-modules-grid">
          {availableModules.map((module) => {
            const Icon = module.icon;
            const isActive = activeModule === module.id;
            return (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`admin-module-card ${
                  isActive ? "admin-module-active" : ""
                }`}
              >
                <div className={`admin-module-icon admin-module-${module.color}`}>
                  <Icon className="admin-module-icon-svg" />
                </div>
                <h3 className="admin-module-title">{module.name}</h3>
                <p className="admin-module-description">
                  {module.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="admin-content">
          {activeModule === "labs" && (
            <GestionEspacios onAuditLog={addAuditLog} />
          )}

          {activeModule === "schedules" && <GestionHorarios />}

          {activeModule === "sanctions" && (
            <GestionSanciones onAuditLog={addAuditLog} currentUser={user} />
          )}

          {activeModule === "reservas" && (
            <GestionReservas onAuditLog={addAuditLog} currentUser={user} />
          )}

          {activeModule === "users" && (
            <GestionUsuarios onAuditLog={addAuditLog} />
          )}

          {activeModule === "incidencias" && (
            <GestionIncidencias onAuditLog={addAuditLog} currentUser={user} />
          )}

          {activeModule === "reports" && (
            <GestionReportes onAuditLog={addAuditLog} />
          )}

          {activeModule === "audit" && (
                  <GestionAuditoria onAuditLog={addAuditLog} />
                )}
        </div>

        <div className="admin-activity-panel">
          <div className="admin-activity-header">
            <div>
              <h2 className="admin-title">Actividad reciente</h2>
              <p className="admin-subtitle">
                Eventos generados por los modulos del panel
              </p>
            </div>
          </div>

          {auditTrail.length === 0 ? (
            <p className="admin-activity-empty">
              Aun no se registran movimientos en esta sesion.
            </p>
          ) : (
            <ul className="admin-activity-list">
              {auditTrail.map((entry) => {
                const moduleMeta = moduleDictionary[entry.module];
                return (
                  <li key={entry.id} className="admin-activity-item">
                    <div>
                      <p className="admin-activity-message">
                        {entry.message}
                      </p>
                      {entry.detail && (
                        <p className="admin-activity-detail">
                          {entry.detail}
                        </p>
                      )}
                      <span className="admin-activity-time">
                        {formatTimestamp(entry.createdAt)}
                      </span>
                    </div>
                    <span
                      className={`admin-activity-badge admin-activity-badge-${
                        moduleMeta?.color ?? "blue"
                      }`}
                    >
                      {moduleMeta?.name ?? entry.module}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
