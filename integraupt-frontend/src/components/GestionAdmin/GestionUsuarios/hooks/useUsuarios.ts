import { useCallback, useEffect, useState } from "react";
import type { CatalogosData, CatalogoEstado } from "../types";
import {
  type EntityMap,
  type PayloadMap,
  type UsuarioRole,
  createUsuario,
  fetchCatalogo,
  fetchUsuarios,
  updateUsuario,
  updateUsuarioEstado
} from "../usuariosService";

export interface UseUsuariosState<R extends UsuarioRole> {
  items: EntityMap[R][];
  loading: boolean;
  error: string | null;
  catalogs: CatalogosData;
  catalogsState: CatalogoEstado;
  reload: () => Promise<EntityMap[R][]>;
  reloadCatalogos: () => Promise<void>;
  createItem: (payload: PayloadMap[R]) => Promise<EntityMap[R]>;
  updateItem: (id: number, payload: PayloadMap[R]) => Promise<EntityMap[R]>;
  changeEstado: (id: number, activo: boolean) => Promise<EntityMap[R]>;
}

const initialCatalogs: CatalogosData = {
  tiposDocumento: [],
  roles: [],
  escuelas: []
};

const applyCorreoFromPayload = <R extends UsuarioRole>(
  entity: EntityMap[R],
  payload: PayloadMap[R]
): EntityMap[R] => {
  const correo = payload.correo?.trim();
  if (!correo) {
    return entity;
  }

  const typedEntity = entity as EntityMap["administrativo"];
  const usuario = typedEntity.usuario;

  const updatedUsuario = {
    ...usuario,
    auth: { ...(usuario.auth ?? {}), correoU: correo },
    correo,
    correoInstitucional: correo,
    email: correo,
    correoPersonal: usuario.correoPersonal ?? correo
  };

  return {
    ...(entity as unknown as Record<string, unknown>),
    usuario: updatedUsuario
  } as EntityMap[R];
};

export const useUsuarios = <R extends UsuarioRole>(role: R): UseUsuariosState<R> => {
  const [items, setItems] = useState<EntityMap[R][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catalogs, setCatalogs] = useState<CatalogosData>(initialCatalogs);
  const [catalogsState, setCatalogsState] = useState<CatalogoEstado>("idle");

  const loadUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUsuarios(role);
      setItems(data);
      setError(null);
      return data;
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "No se pudieron cargar los usuarios.";
      setError(message);
      throw loadError;
    } finally {
      setLoading(false);
    }
  }, [role]);

  const loadCatalogs = useCallback(async () => {
    setCatalogsState("loading");
    try {
      const [tiposDocumento, roles, escuelas] = await Promise.all([
        fetchCatalogo("tiposDocumento") as Promise<typeof catalogs.tiposDocumento>,
        fetchCatalogo("roles") as Promise<typeof catalogs.roles>,
        fetchCatalogo("escuelas") as Promise<typeof catalogs.escuelas>
      ]);
      setCatalogs({ tiposDocumento, roles, escuelas });
      setCatalogsState("ready");
    } catch (catalogError) {
      setCatalogsState("error");
      console.error("No se pudieron cargar los catalogos de usuarios", catalogError);
    }
  }, []);

  useEffect(() => {
    void loadUsuarios();
  }, [loadUsuarios]);

  useEffect(() => {
    if (catalogsState === "idle") {
      void loadCatalogs();
    }
  }, [catalogsState, loadCatalogs]);

  const createItem = useCallback(
    async (payload: PayloadMap[R]) => {
      const result = await createUsuario(role, payload);
      const resultWithCorreo = applyCorreoFromPayload(result, payload);
      setItems((prev) => [resultWithCorreo, ...prev]);
      return resultWithCorreo;
    },
    [role]
  );

  const updateItem = useCallback(
    async (id: number, payload: PayloadMap[R]) => {
      const result = await updateUsuario(role, id, payload);
      const resultWithCorreo = applyCorreoFromPayload(result, payload);
      setItems((prev) =>
        prev.map((item) => (getEntityId(role, item) === id ? resultWithCorreo : item))
      );
      return resultWithCorreo;
    },
    [role]
  );

  const changeEstado = useCallback(
    async (id: number, activo: boolean) => {
      const updated = await updateUsuarioEstado(role, id, activo);
      setItems((prev) =>
        prev.map((item) => (getEntityId(role, item) === id ? updated : item))
      );
      return updated;
    },
    [role]
  );

  return {
    items,
    loading,
    error,
    catalogs,
    catalogsState,
    reload: loadUsuarios,
    reloadCatalogos: loadCatalogs,
    createItem,
    updateItem,
    changeEstado
  };
};

const getEntityId = <R extends UsuarioRole>(role: R, entity: EntityMap[R]): number => {
  switch (role) {
    case "administrativo":
      return (entity as EntityMap["administrativo"]).idAdministrativo;
    case "docente":
      return (entity as EntityMap["docente"]).idDocente;
    case "estudiante":
      return (entity as EntityMap["estudiante"]).idEstudiante;
    default:
      throw new Error(`Rol no soportado: ${role as string}`);
  }
};