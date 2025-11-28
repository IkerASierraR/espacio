import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Filter, RefreshCw, Search, ShieldAlert } from "lucide-react";
import "../../../styles/GestionIncidencias.css";
import { IncidenciasTable } from "./components/IncidenciasTable";
import {
  fetchEscuelas,
  fetchEspaciosCatalogo,
  fetchFacultades
} from "./incidenciasService";
import type {
  EscuelaOption,
  EspacioOption,
  FacultadOption
} from "./types";
import { useIncidenciasGestion } from "./hooks/useIncidenciasGestion";

interface UserMetadata {
  role?: string;
  login_type?: string;
  escuelaId?: number;
  escuelaNombre?: string;
}

interface GestionIncidenciasProps {
  onAuditLog?: (message: string, detail?: string) => void;
  currentUser?: { user_metadata?: UserMetadata };
}

const toNumber = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
};

export const GestionIncidencias: React.FC<GestionIncidenciasProps> = ({
  onAuditLog,
  currentUser
}) => {
  const metadata = currentUser?.user_metadata;
  const normalizedRole = metadata?.role?.trim().toUpperCase() ?? "ADMINISTRATIVO";
  const loginType = metadata?.login_type?.trim().toLowerCase() ?? "";
  const isSupervisor = normalizedRole === "SUPERVISOR";
  const allowCatalogFilters = loginType === "administrative" && !isSupervisor;

  const [facultades, setFacultades] = useState<FacultadOption[]>([]);
  const [escuelas, setEscuelas] = useState<EscuelaOption[]>([]);
  const [espacios, setEspacios] = useState<EspacioOption[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [espaciosLoading, setEspaciosLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [escuelasError, setEscuelasError] = useState<string | null>(null);
  const [espaciosError, setEspaciosError] = useState<string | null>(null);

  const [facultadId, setFacultadId] = useState<string>("");
  const [escuelaId, setEscuelaId] = useState<string>(() =>
    metadata?.escuelaId != null ? String(metadata.escuelaId) : ""
  );
  const [espacioId, setEspacioId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch((current) => (current === searchTerm.trim() ? current : searchTerm.trim()));
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchTerm]);

  useEffect(() => {
    if (!allowCatalogFilters) {
      setFacultades([]);
      return;
    }

    let cancelled = false;
    const loadFacultades = async () => {
      setCatalogLoading(true);
      setCatalogError(null);
      try {
        const data = await fetchFacultades();
        if (!cancelled) {
          setFacultades(data);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "No se pudieron cargar las facultades.";
          setCatalogError(message);
        }
      } finally {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      }
    };

    void loadFacultades();

    return () => {
      cancelled = true;
    };
  }, [allowCatalogFilters]);

  useEffect(() => {
    if (isSupervisor) {
      setEscuelas(
        metadata?.escuelaId != null
          ? [
              {
                id: metadata.escuelaId,
                nombre: metadata.escuelaNombre ?? "Escuela asignada",
                facultadId: null,
                facultadNombre: null
              }
            ]
          : []
      );
      return;
    }

    let cancelled = false;
    const loadEscuelas = async () => {
      setEscuelasError(null);
      try {
        const data = await fetchEscuelas(toNumber(facultadId) ?? undefined);
        if (!cancelled) {
          setEscuelas(data);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "No se pudieron cargar las escuelas.";
          setEscuelasError(message);
        }
      }
    };

    void loadEscuelas();

    return () => {
      cancelled = true;
    };
  }, [facultadId, isSupervisor, metadata?.escuelaId, metadata?.escuelaNombre]);

  useEffect(() => {
    let cancelled = false;
    const loadEspacios = async () => {
      setEspaciosLoading(true);
      setEspaciosError(null);
      try {
        const data = await fetchEspaciosCatalogo();
        if (!cancelled) {
          setEspacios(data);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "No se pudieron cargar los espacios.";
          setEspaciosError(message);
        }
      } finally {
        if (!cancelled) {
          setEspaciosLoading(false);
        }
      }
    };

    void loadEspacios();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!allowCatalogFilters) {
      setFacultadId("");
    }
  }, [allowCatalogFilters]);

  useEffect(() => {
    if (isSupervisor && metadata?.escuelaId != null) {
      setEscuelaId(String(metadata.escuelaId));
    }
  }, [isSupervisor, metadata?.escuelaId]);

  useEffect(() => {
    setEspacioId("");
  }, [escuelaId]);

  const filteredEspacios = useMemo(() => {
    if (!escuelaId) {
      return espacios;
    }
    const escuelaNumeric = toNumber(escuelaId);
    return espacios.filter((espacio) => espacio.escuelaId === escuelaNumeric);
  }, [espacios, escuelaId]);

  const gestionOptions = useMemo(
    () => ({
      rol: normalizedRole,
      facultadId: toNumber(facultadId),
      escuelaId: toNumber(escuelaId),
      escuelaContextoId: isSupervisor ? metadata?.escuelaId ?? null : null,
      espacioId: toNumber(espacioId),
      search: debouncedSearch
    }),
    [
      normalizedRole,
      facultadId,
      escuelaId,
      isSupervisor,
      metadata?.escuelaId,
      espacioId,
      debouncedSearch
    ]
  );

  const { incidencias, loading, error, reload } = useIncidenciasGestion(gestionOptions);

  useEffect(() => {
    if (!loading && !error) {
      const filtersApplied = [
        facultadId ? `facultad ${facultadId}` : null,
        escuelaId ? `escuela ${escuelaId}` : null,
        espacioId ? `espacio ${espacioId}` : null,
        debouncedSearch ? `busqueda "${debouncedSearch}"` : null
      ]
        .filter(Boolean)
        .join(", ");

      if (onAuditLog && filtersApplied) {
        onAuditLog("Consulta de incidencias", filtersApplied);
      }
    }
  }, [loading, error, facultadId, escuelaId, espacioId, debouncedSearch, onAuditLog]);

  return (
    <div className="gestion-incidencias">
      <div className="gestion-incidencias-header">
        <div>
          <h2 className="gestion-incidencias-title">Gestion de incidencias</h2>
          <p className="gestion-incidencias-subtitle">
            Visualiza y filtra los reportes registrados por los usuarios segun tu rol.
          </p>
        </div>
        <button
          type="button"
          className="gestion-incidencias-btn"
          onClick={() => {
            void reload();
          }}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      <div className="gestion-incidencias-stats">
        <div className="gestion-incidencias-stat">
          <ShieldAlert size={18} />
          <div>
            <p>Total de incidencias</p>
            <strong>{incidencias.length}</strong>
          </div>
        </div>
        <div className="gestion-incidencias-stat">
          <Filter size={18} />
          <div>
            <p>Filtros aplicados</p>
            <strong>
              {
                [facultadId, escuelaId, espacioId, debouncedSearch].filter((value) =>
                  Boolean(value && value.length > 0)
                ).length
              }
            </strong>
          </div>
        </div>
      </div>

      <div className="gestion-incidencias-toolbar">
        <div className="gestion-incidencias-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por usuario, documento o descripcion"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="gestion-incidencias-filters">
          {allowCatalogFilters && (
            <label className="gestion-incidencias-filter">
              <span>Facultad</span>
              <select
                value={facultadId}
                onChange={(event) => {
                  setFacultadId(event.target.value);
                  setEscuelaId("");
                }}
                disabled={catalogLoading}
              >
                <option value="">Todas</option>
                {facultades.map((facultad) => (
                  <option key={facultad.id} value={facultad.id}>
                    {facultad.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="gestion-incidencias-filter">
            <span>Escuela</span>
            {isSupervisor ? (
              <input
                type="text"
                value={metadata?.escuelaNombre ?? "Escuela asignada"}
                disabled
                readOnly
              />
            ) : (
              <select
                value={escuelaId}
                onChange={(event) => setEscuelaId(event.target.value)}
                disabled={escuelas.length === 0 && !escuelasError}
              >
                <option value="">Todas</option>
                {escuelas.map((escuela) => (
                  <option key={escuela.id} value={escuela.id}>
                    {escuela.nombre}
                  </option>
                ))}
              </select>
            )}
          </label>

          <label className="gestion-incidencias-filter">
            <span>Espacio</span>
            <select
              value={espacioId}
              onChange={(event) => setEspacioId(event.target.value)}
              disabled={espaciosLoading || filteredEspacios.length === 0}
            >
              <option value="">Todos</option>
              {filteredEspacios.map((espacio) => (
                <option key={espacio.id} value={espacio.id}>
                  {espacio.nombre} {espacio.codigo ? `(${espacio.codigo})` : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {catalogError && (
        <div className="gestion-incidencias-alert">
          <AlertCircle size={16} /> {catalogError}
        </div>
      )}
      {escuelasError && (
        <div className="gestion-incidencias-alert">
          <AlertCircle size={16} /> {escuelasError}
        </div>
      )}
      {espaciosError && (
        <div className="gestion-incidencias-alert">
          <AlertCircle size={16} /> {espaciosError}
        </div>
      )}
      {error && (
        <div className="gestion-incidencias-alert error">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <IncidenciasTable incidencias={incidencias} loading={loading} />
    </div>
  );
};