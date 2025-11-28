import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Ban, CheckCircle2, Plus, RefreshCw, Search } from "lucide-react";
import "../../../styles/GestionSanciones.css";
import { SancionForm } from "./components/SancionForm";
import { SancionesTable } from "./components/SancionTable";
import { useSanciones } from "./hooks/useSanciones";
import type {
  EscuelaOption,
  FacultadOption,
  Sancion,
  SancionFormValues,
  UsuarioOption
} from "./types";
import {
  buildPayloadFromValues,
  createEmptyFormValues,
  validateSancionValues
} from "./validators";

import {
  fetchEscuelas,
  fetchFacultades,
  searchUsuarios
} from "./sancionesService";

interface UserMetadata {
  role?: string;
  login_type?: string;
  escuelaId?: number;
  escuelaNombre?: string;
}

interface GestionSancionesProps {
  onAuditLog?: (message: string, detail?: string) => void;
  currentUser?: { user_metadata?: UserMetadata };
}

type StatusMessage = {
  type: "success" | "error";
  text: string;
};

const containsQuery = (text: string, query: string): boolean =>
  text.toLowerCase().includes(query);

const formatSummary = (sancion: Sancion): string => {
  const descriptor = sancion.usuarioNombre
    || sancion.usuarioCodigo
    || (sancion.usuarioId != null ? `ID ${sancion.usuarioId}` : "usuario sin identificar");
  return `${sancion.tipoUsuario} — ${descriptor}`;
};

export const GestionSanciones: React.FC<GestionSancionesProps> = ({ onAuditLog, currentUser }) => {
  const {
    sanciones,
    loading,
    error,
    loadSanciones,
    registerSancion,
    levantarSancion
  } = useSanciones();

const metadata = currentUser?.user_metadata;
  const normalizedRole = metadata?.role?.trim().toLowerCase() ?? "";
  const loginType = metadata?.login_type?.trim().toLowerCase() ?? "";
  const supervisorEscuelaId = metadata?.escuelaId ?? null;
  const supervisorEscuelaNombre = metadata?.escuelaNombre ?? null;
  const isSupervisor = normalizedRole === "supervisor";
  const allowCatalogFilters = loginType === "administrative" && !isSupervisor;

  const buildInitialFormValues = () => {
    const initial = createEmptyFormValues();
    if (isSupervisor && supervisorEscuelaId != null) {
      initial.escuelaId = supervisorEscuelaId.toString();
      initial.usuarioEscuela = supervisorEscuelaNombre?.trim() ?? "";
    }
    return initial;
  };


  const [searchTerm, setSearchTerm] = useState("");
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [formValues, setFormValues] = useState<SancionFormValues>(() => buildInitialFormValues());
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
   const [facultades, setFacultades] = useState<FacultadOption[]>([]);
    const [escuelas, setEscuelas] = useState<EscuelaOption[]>([]);
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [escuelasLoading, setEscuelasLoading] = useState(false);
    const [usuarioOptions, setUsuarioOptions] = useState<UsuarioOption[]>([]);
    const [usuarioSearch, setUsuarioSearch] = useState("");
    const [usuariosLoading, setUsuariosLoading] = useState(false);

  const filteredSanciones = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return sanciones;
    }

    return sanciones.filter((sancion) =>
      [
        sancion.id.toString(),
        sancion.usuarioId != null ? sancion.usuarioId.toString() : "",
                sancion.usuarioNombre ?? "",
                sancion.usuarioCodigo ?? "",
                sancion.usuarioEscuela ?? "",
                sancion.usuarioFacultad ?? "",
        sancion.tipoUsuario,
        sancion.motivo,
        sancion.estado
      ].some((value) => containsQuery(String(value), query))
    );
  }, [sanciones, searchTerm]);

  const totalActivas = useMemo(
    () => sanciones.filter((sancion) => sancion.estado === "ACTIVA").length,
    [sanciones]
  );

  const totalCumplidas = useMemo(
    () => sanciones.filter((sancion) => sancion.estado === "CUMPLIDA").length,
    [sanciones]
  );

  const notify = useCallback((message: StatusMessage) => {
    setStatusMessage(message);
    window.setTimeout(() => {
      setStatusMessage((current) =>
        current === message ? null : current
      );
    }, 4500);
  }, []);

  const handleReload = async () => {
    try {
      await loadSanciones();
      notify({ type: "success", text: "Lista de sanciones actualizada." });
    } catch (reloadError) {
      const message = reloadError instanceof Error ? reloadError.message : "No se pudo refrescar la lista.";
      notify({ type: "error", text: message });
    }
  };

  const resetFormState = () => {
    setFormErrors([]);
    setUsuarioOptions([]);
        setUsuarioSearch("");
        setEscuelas([]);
        setFormValues(buildInitialFormValues());
      };

      const handleToggleForm = () => {
        if (formOpen) {
          setFormOpen(false);
          resetFormState();
        } else {
          resetFormState();
          setFormOpen(true);
    }
  };

  const handleValueChange = (field: keyof SancionFormValues, value: string) => {
     if (field === "tipoUsuario") {
          setUsuarioOptions([]);
          setUsuarioSearch("");
        }

        setFormValues((prev) => {
          const next = { ...prev, [field]: value };
          if (field === "tipoUsuario") {
            next.usuarioId = "";
            next.usuarioNombre = "";
            next.usuarioCodigo = "";
            if (isSupervisor && supervisorEscuelaNombre) {
              next.usuarioEscuela = supervisorEscuelaNombre;
            } else {
              next.usuarioEscuela = "";
            }
          }
          if (field === "usuarioCodigo") {
            next.usuarioId = "";
            next.usuarioNombre = "";
          }
          return next;
        });
      };

      const handleFacultadChange = (value: string) => {
        setFormValues((prev) => ({
          ...prev,
          facultadId: value,
          escuelaId: "",
          usuarioId: "",
          usuarioCodigo: "",
          usuarioNombre: "",
          usuarioEscuela: ""
        }));
        setUsuarioOptions([]);
        setUsuarioSearch("");
        setEscuelas([]);
      };

      const handleEscuelaChange = (value: string) => {
        const escuelaSeleccionada = escuelas.find((escuela) => escuela.id === Number(value));
        setFormValues((prev) => ({
          ...prev,
          escuelaId: value,
          usuarioId: "",
          usuarioCodigo: "",
          usuarioNombre: "",
          usuarioEscuela: escuelaSeleccionada?.nombre ?? ""
        }));
        setUsuarioOptions([]);
        setUsuarioSearch("");
      };

      const handleUsuarioSearchChange = (value: string) => {
        setUsuarioSearch(value);
      };

      const handleUsuarioSelect = (option: UsuarioOption) => {
        setFormValues((prev) => ({
          ...prev,
          usuarioId: option.id.toString(),
          usuarioCodigo: option.codigo ?? "",
          usuarioNombre: option.nombreCompleto ?? "",
          usuarioEscuela: option.escuelaNombre ?? prev.usuarioEscuela,
          facultadId: option.facultadId != null ? option.facultadId.toString() : prev.facultadId,
          escuelaId: option.escuelaId != null ? option.escuelaId.toString() : prev.escuelaId
        }));
      };

      const handleUsuarioClear = () => {
        setFormValues((prev) => ({
          ...prev,
          usuarioId: "",
          usuarioCodigo: "",
          usuarioNombre: "",
          usuarioEscuela: isSupervisor && supervisorEscuelaNombre ? supervisorEscuelaNombre : ""
        }));
      };

      const handleUsuarioSearch = async () => {
        if (!formValues.tipoUsuario) {
          notify({ type: "error", text: "Selecciona el tipo de usuario antes de buscar." });
          return;
        }

        const query = usuarioSearch.trim();
        const facultadIdFilter = (() => {
          if (!(allowCatalogFilters && formValues.facultadId.trim())) {
            return undefined;
          }
          const parsed = Number(formValues.facultadId.trim());
          return Number.isNaN(parsed) ? undefined : parsed;
        })();

        const escuelaIdFilter = (() => {
          if (isSupervisor && supervisorEscuelaId != null) {
            return supervisorEscuelaId;
          }
          const value = formValues.escuelaId.trim();
          if (!value) {
            return undefined;
          }
          const parsed = Number(value);
          return Number.isNaN(parsed) ? undefined : parsed;
        })();

        setUsuariosLoading(true);
        try {
          const results = await searchUsuarios({
            tipoUsuario: formValues.tipoUsuario,
            query: query || undefined,
            facultadId: facultadIdFilter,
            escuelaId: escuelaIdFilter,
            limit: 20
          });
          setUsuarioOptions(results);
          if (results.length === 0) {
            notify({ type: "error", text: "No se encontraron usuarios con los criterios indicados." });
          }
        } catch (searchError) {
          const message = searchError instanceof Error
            ? searchError.message
            : "No se pudo completar la busqueda.";
          notify({ type: "error", text: message });
        } finally {
          setUsuariosLoading(false);
        }
  };

useEffect(() => {
    if (!formOpen || !allowCatalogFilters) {
      return;
    }
    if (facultades.length > 0 || catalogLoading) {
      return;
    }

    let cancelled = false;
    const loadFacultades = async () => {
      setCatalogLoading(true);
      try {
        const result = await fetchFacultades();
        if (!cancelled) {
          setFacultades(result);
        }
      } catch (catalogError) {
        if (!cancelled) {
          const message = catalogError instanceof Error
            ? catalogError.message
            : "No se pudo obtener el listado de facultades.";
          notify({ type: "error", text: message });
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
  }, [formOpen, allowCatalogFilters, facultades.length, catalogLoading, notify]);

  useEffect(() => {
    if (!formOpen || !allowCatalogFilters) {
      setEscuelasLoading(false);
      return;
    }

    const value = formValues.facultadId.trim();
    if (!value) {
      setEscuelas([]);
      setEscuelasLoading(false);
      return;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      setEscuelas([]);
      setEscuelasLoading(false);
      return;
    }

    let cancelled = false;
    const loadEscuelas = async () => {
      setEscuelasLoading(true);
      try {
        const result = await fetchEscuelas(parsed);
        if (!cancelled) {
          setEscuelas(result);
        }
      } catch (escuelaError) {
        if (!cancelled) {
          const message = escuelaError instanceof Error
            ? escuelaError.message
            : "No se pudo obtener el listado de escuelas.";
          notify({ type: "error", text: message });
        }
      } finally {
        if (!cancelled) {
          setEscuelasLoading(false);
        }
      }
    };

    void loadEscuelas();

    return () => {
      cancelled = true;
    };
  }, [formOpen, allowCatalogFilters, formValues.facultadId, notify]);

  const handleSubmit = async () => {
    const validation = validateSancionValues(formValues);
    if (validation.length > 0) {
      setFormErrors(validation);
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildPayloadFromValues(formValues);
      const result = await registerSancion(payload);
      notify({ type: "success", text: "Sancion registrada correctamente." });
      onAuditLog?.(`Registro de sancion #${result.id}`, formatSummary(result));
      resetFormState();
      setFormOpen(false);
    } catch (submitError) {
      const message = submitError instanceof Error
        ? submitError.message
        : "No se pudo registrar la sancion.";
      notify({ type: "error", text: message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormOpen(false);
    resetFormState();
  };

  const handleLevantar = async (sancion: Sancion) => {
    const confirmed = window.confirm(
      `¿Desea levantar la sancion #${sancion.id} para el ${formatSummary(sancion)}?`
    );
    if (!confirmed) {
      return;
    }

    try {
      const result = await levantarSancion(sancion.id);
      notify({ type: "success", text: "La sancion fue levantada." });
      onAuditLog?.(`Sancion levantada #${result.id}`, formatSummary(result));
    } catch (patchError) {
      const message = patchError instanceof Error
        ? patchError.message
        : "No se pudo levantar la sancion.";
      notify({ type: "error", text: message });
    }
  };

  return (
    <section className="gestion-sanciones">
      <header className="gestion-sanciones-header">
        <div>
          <h2 className="gestion-sanciones-title">Gestion de Sanciones</h2>
          <p className="gestion-sanciones-subtitle">
            Controla las sanciones activas y su historial sincronizado con sanciones-backend.
          </p>
        </div>
        <div className="gestion-sanciones-actions">
          <button
            type="button"
            className="sancion-btn secondary"
            onClick={handleReload}
            disabled={loading}
          >
            <RefreshCw size={16} /> Actualizar
          </button>
          <button
            type="button"
            className="sancion-btn primary"
            onClick={handleToggleForm}
          >
            <Plus size={16} /> {formOpen ? "Cerrar formulario" : "Registrar sancion"}
          </button>
        </div>
      </header>

      <div className="gestion-sanciones-stats">
        <div className="gestion-sanciones-stat">
          <Ban size={18} />
          <div>
            <p>Activas</p>
            <strong>{totalActivas}</strong>
          </div>
        </div>
        <div className="gestion-sanciones-stat">
          <CheckCircle2 size={18} />
          <div>
            <p>Cumplidas</p>
            <strong>{totalCumplidas}</strong>
          </div>
        </div>
      </div>

      <div className="gestion-sanciones-toolbar">
        <div className="gestion-sanciones-search">
          <Search size={16} />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por usuario, motivo o estado"
          />
        </div>
        {statusMessage && (
          <div
            className={`sancion-status ${statusMessage.type === "error" ? "error" : "success"}`}
          >
            {statusMessage.type === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {error && !statusMessage && (
        <div className="sancion-status error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {formOpen && (
        <div className="gestion-sanciones-form">
          <SancionForm
            values={formValues}
            errors={formErrors}
            submitting={submitting}
            onChange={handleValueChange}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            usuarioOptions={usuarioOptions}
            usuarioSearch={usuarioSearch}
            onUsuarioSearchChange={handleUsuarioSearchChange}
            onUsuarioSearch={handleUsuarioSearch}
            onUsuarioSelect={handleUsuarioSelect}
            onUsuarioClear={handleUsuarioClear}
            loadingUsuarios={usuariosLoading}
            facultades={facultades}
            escuelas={escuelas}
            loadingFacultades={catalogLoading}
            loadingEscuelas={escuelasLoading}
            onFacultadChange={handleFacultadChange}
            onEscuelaChange={handleEscuelaChange}
            allowCatalogFilters={allowCatalogFilters}
            isSupervisor={isSupervisor}
            supervisorEscuelaNombre={supervisorEscuelaNombre ?? undefined}
          />
        </div>
      )}

      <SancionesTable
        sanciones={filteredSanciones}
        loading={loading}
        onLevantar={handleLevantar}
      />
    </section>
  );
};