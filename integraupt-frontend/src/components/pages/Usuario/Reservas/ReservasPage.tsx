import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ListaLaboratorios } from './components/ListaLaboratorios';
import { ReservaModal } from './components/ReservaModal';
import { HorarioModal } from './components/HorarioModal';
import { MisReservasModal } from './components/MisReservasModal';
import { ReservaDetalleModal } from './components/ReservaDetalleModal';
import { EditarReservaModal } from './components/EditarReservaModal';
import type {
  LaboratorioResumen,
  EstadoLaboratorio,
  HorarioSemanal,
  ReservaApi,
  ReservaCreacionResponse
} from './types';
import { getReservasApiUrl } from '../../../../utils/apiConfig';
import { fetchHorarioSemanalPorEspacio } from './services/horariosService';
import { Home, LayoutGrid, LibraryBig, LogOut, NotebookPen, UserRound } from 'lucide-react';
import { Navbar } from '../Navbar';
import '../../../../styles/ReservasScreen.css';

interface ReservasPageProps {
  user: {
    id: string;
    email: string;
    sessionToken?: string;
    user_metadata: {
      name: string;
      avatar_url: string;
      role?: string;
      login_type?: string;
      codigo?: string;
      escuelaId?: number;
      escuelaNombre?: string;
    };
  };
  onNavigateToInicio: () => void;
  onNavigateToServicios: () => void;
  onNavigateToPerfil: () => void;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

interface EspacioApiResponse {
  id?: number | null;
  codigo?: string | null;
  nombre?: string | null;
  tipo?: string | null;
  capacidad?: number | null;
  equipamiento?: string | null;
  escuelaId?: number | null;
  escuelaNombre?: string | null;
  estado?: number | null;
}

type FacultadItem = {
  id: number;
  nombre: string;
  abreviatura?: string;
};

type EscuelaItem = {
  id: number;
  nombre: string;
  facultadId?: number;
  facultadNombre?: string;
};

const resolveEstado = (estado?: number | null): {
  estado: EstadoLaboratorio;
  descripcion: string;
} => {
  switch (estado) {
    case 1:
      return {
        estado: 'disponible',
        descripcion: 'Espacio habilitado para gestionar nuevas reservas.',
      };
    case 2:
      return {
        estado: 'ocupado',
        descripcion: 'El espacio tiene reservas activas en el horario consultado.',
      };
    case 3:
      return {
        estado: 'mantenimiento',
        descripcion: 'El espacio se encuentra en mantenimiento temporal.',
      };
    default:
      return {
        estado: 'no_disponible',
        descripcion: 'El espacio no está disponible para reservas por el momento.',
      };
  }
};

const parseEquipamiento = (equipamiento?: string | null): string[] | undefined => {
  if (!equipamiento) return undefined;

  const items = equipamiento
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return items.length > 0 ? items : undefined;
};

const buildLaboratorioId = (espacio: EspacioApiResponse): string => {
  if (typeof espacio.id === 'number') return espacio.id.toString();

  const codigo = espacio.codigo?.trim();
  if (codigo) return codigo;

  const nombre = espacio.nombre?.trim();
  if (nombre) return nombre.toLowerCase().replace(/\s+/g, '-');

  return 'espacio-desconocido';
};

const mapEspacioToLaboratorio = (
  espacio: EspacioApiResponse,
  metadata?: {
    escuelaNombre?: string | null;
    facultadNombre?: string | null;
  }
): LaboratorioResumen => {
  const { estado, descripcion } = resolveEstado(espacio.estado);
  const equipamiento = parseEquipamiento(espacio.equipamiento);

  const escuelaId =
    typeof espacio.escuelaId === 'number' ? espacio.escuelaId : undefined;
  const escuelaNombre =
    metadata?.escuelaNombre?.trim() ?? espacio.escuelaNombre?.trim() ?? undefined;
  const facultadNombre = metadata?.facultadNombre?.trim();

  return {
    espacioId: typeof espacio.id === 'number' ? espacio.id : undefined,
    id: buildLaboratorioId(espacio),
    nombre: espacio.nombre?.trim() ?? 'Espacio sin nombre',
    codigo: espacio.codigo?.trim() ?? undefined,
    tipo: espacio.tipo?.trim() ?? 'Laboratorio',
    capacidad: typeof espacio.capacidad === 'number' ? espacio.capacidad : undefined,
    estado,
    estadoDescripcion: descripcion,
    equipamiento,
    escuelaId,
    facultad: facultadNombre ?? undefined,
    notas:
      escuelaNombre
        ? `Escuela asignada: ${escuelaNombre}`
        : escuelaId != null
        ? `Escuela asignada (ID): ${escuelaId}`
        : undefined,
    proximaDisponibilidad:
      estado === 'disponible' ? 'Disponible para reservas inmediatas.' : undefined,
  };
};

const getUserDisplayName = (name?: string, codigo?: string): string => {
  const trimmedName = name?.trim();
  if (trimmedName) return trimmedName;

  const trimmedCodigo = codigo?.trim();
  if (trimmedCodigo) return trimmedCodigo;

  return 'Usuario';
};

export const ReservasPage: React.FC<ReservasPageProps> = ({ 
  user, 
  onNavigateToInicio,
  onNavigateToServicios,
  onNavigateToPerfil,
  onLogout,
  isLoggingOut = false 
}) => {
  const [espacios, setEspacios] = useState<EspacioApiResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedLaboratorio, setSelectedLaboratorio] = useState<LaboratorioResumen | null>(null);
  const [facultades, setFacultades] = useState<FacultadItem[]>([]);
  const [escuelas, setEscuelas] = useState<EscuelaItem[]>([]);
  const [catalogosError, setCatalogosError] = useState<string | null>(null);
  const [catalogosLoading, setCatalogosLoading] = useState(false);
  const [selectedFacultadId, setSelectedFacultadId] = useState<number | 'all'>('all');
  const [selectedEscuelaId, setSelectedEscuelaId] = useState<number | 'all'>('all');
  const [horarioLaboratorio, setHorarioLaboratorio] = useState<LaboratorioResumen | null>(null);
  const [horarioSemanal, setHorarioSemanal] = useState<HorarioSemanal[]>([]);
  const [horarioLoading, setHorarioLoading] = useState(false);
  const [horarioError, setHorarioError] = useState<string | null>(null);
  const horarioAbortController = useRef<AbortController | null>(null);
  const [mostrarMisReservas, setMostrarMisReservas] = useState(false);
  const [misReservasReloadKey, setMisReservasReloadKey] = useState(0);
  const [reservaSeleccionada, setReservaSeleccionada] = useState<ReservaApi | null>(null);
  const [reservaEnEdicion, setReservaEnEdicion] = useState<ReservaApi | null>(null);


  const isDocente = useMemo(() => {
    const role = user.user_metadata.role?.trim().toLowerCase() ?? '';
    return role === 'profesor';
  }, [user.user_metadata.role]);

  const displayName = useMemo(
    () => getUserDisplayName(user.user_metadata.name, user.user_metadata.codigo),
    [user.user_metadata.codigo, user.user_metadata.name]
  );

  const subtitle = useMemo(() => {
    if (!lastUpdated) {
      return 'Selecciona un espacio para conocer su disponibilidad y equipamiento.';
    }

    const formatter = new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    return `Datos actualizados el ${formatter.format(lastUpdated)}.`;
  }, [lastUpdated]);

  const userId = useMemo(() => {
    const parsed = Number.parseInt(user.id, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, [user.id]);

  const fetchCatalogos = useCallback(async () => {
    if (!isDocente) {
      setFacultades([]);
      setEscuelas([]);
      setCatalogosError(null);
      setCatalogosLoading(false);
      return;
    }

    setCatalogosLoading(true);
    setCatalogosError(null);

    try {
      const [facultadesResponse, escuelasResponse] = await Promise.all([
        fetch(getReservasApiUrl('/api/catalogos/facultades')),
        fetch(getReservasApiUrl('/api/catalogos/escuelas')),
      ]);

      if (!facultadesResponse.ok) {
        throw new Error('No se pudo obtener el listado de facultades disponibles.');
      }

      if (!escuelasResponse.ok) {
        throw new Error('No se pudo obtener el listado de escuelas disponibles.');
      }

      const facultadesData: unknown = await facultadesResponse.json();
      const escuelasData: unknown = await escuelasResponse.json();

      const parsedFacultades: FacultadItem[] = [];
      if (Array.isArray(facultadesData)) {
        (facultadesData as Array<Record<string, unknown>>).forEach((facultad) => {
          const id = typeof facultad.id === 'number' ? facultad.id : null;
          const nombre = typeof facultad.nombre === 'string' ? facultad.nombre.trim() : null;
          const abreviatura =
            typeof facultad.abreviatura === 'string'
              ? facultad.abreviatura.trim()
              : undefined;

          if (id != null && nombre) {
            parsedFacultades.push({ id, nombre, abreviatura });
          }
        });
      }

      const parsedEscuelas: EscuelaItem[] = [];
      if (Array.isArray(escuelasData)) {
        (escuelasData as Array<Record<string, unknown>>).forEach((escuela) => {
          const id = typeof escuela.id === 'number' ? escuela.id : null;
          const nombre = typeof escuela.nombre === 'string' ? escuela.nombre.trim() : null;
          const facultadId =
            typeof escuela.facultadId === 'number' ? escuela.facultadId : undefined;
          const facultadNombre =
            typeof escuela.facultadNombre === 'string'
              ? escuela.facultadNombre.trim()
              : undefined;

          if (id != null && nombre) {
            parsedEscuelas.push({ id, nombre, facultadId, facultadNombre });
          }
        });
      }

      setFacultades(parsedFacultades);
      setEscuelas(parsedEscuelas);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los catálogos de facultades y escuelas.';
      setCatalogosError(message);
      setFacultades([]);
      setEscuelas([]);
    } finally {
      setCatalogosLoading(false);
    }
  }, [isDocente]);

  const fetchLaboratorios = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const escuelaId = user.user_metadata.escuelaId;

    if (!isDocente && escuelaId == null) {
      setEspacios([]);
      setLastUpdated(null);
      setIsLoading(false);
      setError(
        'Tu perfil no tiene una escuela asignada. Comunícate con la oficina académica para regularizarlo.'
      );
      return;
    }

    try {
      const query =
        !isDocente && escuelaId != null ? `?escuelaId=${encodeURIComponent(escuelaId)}` : '';
      const response = await fetch(getReservasApiUrl(`/api/espacios${query}`));

      if (!response.ok) {
        throw new Error('No se pudo obtener la lista de espacios disponibles.');
      }

      const data: unknown = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('El servicio devolvió un formato de respuesta inesperado.');
      }

      setEspacios(data as EspacioApiResponse[]);
      setLastUpdated(new Date());
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Ocurrió un error inesperado al consultar los laboratorios.';
      setError(message);
      setEspacios([]);
      setLastUpdated(null);
    } finally {
      setIsLoading(false);
    }
  }, [isDocente, user.user_metadata.escuelaId]);

  useEffect(() => {
    void fetchLaboratorios();
  }, [fetchLaboratorios]);

  useEffect(() => {
    void fetchCatalogos();
  }, [fetchCatalogos]);

  useEffect(() => {
    if (!isDocente) {
      setSelectedFacultadId('all');
      setSelectedEscuelaId('all');
    }
  }, [isDocente]);

  const escuelaMap = useMemo(() => {
    const map = new Map<number, EscuelaItem>();
    escuelas.forEach((escuela) => map.set(escuela.id, escuela));
    return map;
  }, [escuelas]);

  const facultadMap = useMemo(() => {
    const map = new Map<number, FacultadItem>();
    facultades.forEach((facultad) => map.set(facultad.id, facultad));
    return map;
  }, [facultades]);

  const laboratoriosBase = useMemo(
    () =>
      espacios.map((espacio) => {
        const escuelaInfo =
          typeof espacio.escuelaId === 'number' ? escuelaMap.get(espacio.escuelaId) : undefined;
        const facultadInfo =
          escuelaInfo?.facultadId != null
            ? facultadMap.get(escuelaInfo.facultadId)
            : undefined;


         const escuelaNombre =
           escuelaInfo?.nombre ??
           espacio.escuelaNombre ??
           (typeof espacio.escuelaId === 'number' &&
             user.user_metadata.escuelaId === espacio.escuelaId
               ? user.user_metadata.escuelaNombre ?? null
               : null);
        const facultadNombre = facultadInfo?.nombre ?? escuelaInfo?.facultadNombre ?? null;


        return mapEspacioToLaboratorio(espacio, {
          escuelaNombre,
          facultadNombre,
        });
      }),
    [espacios, escuelaMap, facultadMap]
  );

  const laboratoriosFiltrados = useMemo(() => {
    const filtradosPorRol = laboratoriosBase.filter((laboratorio) => {
      if (!isDocente) {
        const escuelaIdUsuario = user.user_metadata.escuelaId;
        if (typeof escuelaIdUsuario === 'number') {
          return laboratorio.escuelaId === escuelaIdUsuario;
        }
      }
      return true;
    });

    if (!isDocente) return filtradosPorRol;

    return filtradosPorRol.filter((laboratorio) => {
      const escuelaId = laboratorio.escuelaId;

      if (selectedEscuelaId !== 'all') {
        return escuelaId === selectedEscuelaId;
      }

      if (selectedFacultadId !== 'all') {
        if (escuelaId == null) return false;
        const escuelaInfo = escuelaMap.get(escuelaId);
        return escuelaInfo?.facultadId === selectedFacultadId;
      }

      return true;
    });
  }, [
    escuelaMap,
    isDocente,
    laboratoriosBase,
    selectedEscuelaId,
    selectedFacultadId,
    user.user_metadata.escuelaId,
  ]);

  useEffect(() => {
    if (!selectedLaboratorio) return;

    const exists = laboratoriosFiltrados.some(
      (laboratorio) => laboratorio.id === selectedLaboratorio.id
    );

    if (!exists) {
      setSelectedLaboratorio(null);
    }
  }, [laboratoriosFiltrados, selectedLaboratorio]);

  useEffect(() => {
      return () => {
        if (horarioAbortController.current) {
          horarioAbortController.current.abort();
        }
      };
    }, []);

        const fetchHorario = useCallback(async (laboratorio: LaboratorioResumen) => {
            if (!laboratorio.espacioId) {
              setHorarioSemanal([]);
              setHorarioError('No se pudo identificar el espacio seleccionado.');
              setHorarioLoading(false);
              horarioAbortController.current = null;
              return;
            }

            if (horarioAbortController.current) {
              horarioAbortController.current.abort();
            }

            const controller = new AbortController();
            horarioAbortController.current = controller;

            setHorarioLoading(true);
            setHorarioError(null);

            try {
              const data = await fetchHorarioSemanalPorEspacio(laboratorio.espacioId, controller.signal);
              setHorarioSemanal(data);
            } catch (error) {
              if (error instanceof DOMException && error.name === 'AbortError') {
                return;
              }
              setHorarioError(error instanceof Error ? error.message : 'No se pudo cargar el horario del espacio.');
              setHorarioSemanal([]);
            } finally {
              setHorarioLoading(false);
              horarioAbortController.current = null;
            }
          }, []);

          const handleVerHorario = useCallback((laboratorio: LaboratorioResumen) => {
            setHorarioLaboratorio(laboratorio);
            setHorarioSemanal([]);
            setHorarioError(null);
            void fetchHorario(laboratorio);
          }, [fetchHorario]);

          const handleCloseHorarioModal = useCallback(() => {
            if (horarioAbortController.current) {
              horarioAbortController.current.abort();
              horarioAbortController.current = null;
            }
            setHorarioLaboratorio(null);
            setHorarioSemanal([]);
            setHorarioError(null);
  }, []);
const handleRetryHorario = useCallback(() => {
    if (!horarioLaboratorio) return;
    void fetchHorario(horarioLaboratorio);
  }, [fetchHorario, horarioLaboratorio]);


  const handleCloseModal = useCallback(() => {
    setSelectedLaboratorio(null);
  }, []);

  const handleReservar = useCallback((laboratorio: LaboratorioResumen) => {
    setSelectedLaboratorio(laboratorio);
  }, []);

  const handleReservaCreada = useCallback(
   (_respuesta: ReservaCreacionResponse) => {
      void fetchLaboratorios();
       setMisReservasReloadKey((previous) => previous + 1);
    },
    [fetchLaboratorios]
  );

const handleVerMisReservas = useCallback(() => {
    setMostrarMisReservas(true);
  }, []);

  const handleCerrarMisReservas = useCallback(() => {
    setMostrarMisReservas(false);
  }, []);

  const handleSeleccionarReserva = useCallback((reserva: ReservaApi) => {
    setReservaSeleccionada(reserva);
  }, []);

  const handleEditarReserva = useCallback((reserva: ReservaApi) => {
         setReservaSeleccionada((prev) => (prev?.id === reserva.id ? null : prev));
         setReservaEnEdicion(reserva);
  }, []);


  const handleCerrarDetalleReserva = useCallback(() => {
    setReservaSeleccionada(null);
  }, []);

  const handleCerrarEdicionReserva = useCallback(() => {
    setReservaEnEdicion(null);
  }, []);

  const aplicarActualizacionReserva = useCallback(
    (reservaActualizada: ReservaApi) => {
      setReservaSeleccionada((prev) => (prev?.id === reservaActualizada.id ? reservaActualizada : prev));
      setMisReservasReloadKey((previous) => previous + 1);
      void fetchLaboratorios();
    },
    [fetchLaboratorios]
  );

  const handleReservaActualizada = useCallback(
    (reservaActualizada: ReservaApi) => {
      setReservaEnEdicion(null);
      aplicarActualizacionReserva(reservaActualizada);
    },
    [aplicarActualizacionReserva]
  );

  const handleReservaCancelada = useCallback(
    (reservaCancelada: ReservaApi) => {
      aplicarActualizacionReserva(reservaCancelada);
    },
    [aplicarActualizacionReserva]
  );

  useEffect(() => {
    if (!mostrarMisReservas) {
      setReservaSeleccionada(null);
      setReservaEnEdicion(null);
    }
  }, [mostrarMisReservas]);

  const handleFacultadChange = useCallback((value: number | 'all') => {
    setSelectedFacultadId(value);
    setSelectedEscuelaId('all');
  }, []);

  const handleEscuelaChange = useCallback((value: number | 'all') => {
    setSelectedEscuelaId(value);
  }, []);

  return (
    <div className="reservas-container">
      <Navbar
        displayName={displayName}
        userCode={user.user_metadata.codigo}
        currentPage="reservas"
        onNavigateToInicio={onNavigateToInicio}
        onNavigateToServicios={onNavigateToServicios}
        onNavigateToPerfil={onNavigateToPerfil}
        onLogout={onLogout}
        isLoggingOut={isLoggingOut}
      />

      <main className="reservas-main">
        {/* AÑADIR WELCOME CARD */}
        <section className="home-welcome-card">
          <div>
            <p className="home-welcome-date">Gestión de Reservas</p>
            <h1 className="home-title">Reserva de Espacios</h1>
            <p className="home-subtitle">
              {subtitle || 'Selecciona un espacio para conocer su disponibilidad y equipamiento.'}
            </p>
          </div>
          <div className="home-welcome-avatar" aria-hidden="true">
            <LibraryBig size={44} />
          </div>
        </section>

        <ListaLaboratorios
          laboratorios={laboratoriosFiltrados}
          isLoading={isLoading}
          error={error}
          onRetry={fetchLaboratorios}
          onVerHorario={handleVerHorario}
          onReservar={handleReservar}
          onVerMisReservas={userId != null ? handleVerMisReservas : undefined}
          // REMOVER ESTA LÍNEA: onVolverServicios={onBack}
          searchPlaceholder="Buscar laboratorio por nombre, código o facultad"
          title={`Espacios disponibles para ${displayName}`}
          subtitle={subtitle}
          advancedFiltersEnabled={isDocente}
          facultades={facultades}
          escuelas={escuelas}
          selectedFacultadId={selectedFacultadId}
          selectedEscuelaId={selectedEscuelaId}
          onFacultadChange={handleFacultadChange}
          onEscuelaChange={handleEscuelaChange}
          filtersError={catalogosError}
          filtersLoading={catalogosLoading}
        />

        {horarioLaboratorio && (
          <HorarioModal
            laboratorio={horarioLaboratorio}
            horarios={horarioSemanal}
            isLoading={horarioLoading}
            error={horarioError}
            onClose={handleCloseHorarioModal}
            onRetry={handleRetryHorario}
          />
        )}

        {selectedLaboratorio && (
          <ReservaModal
            laboratorio={selectedLaboratorio}
            userId={userId}
            onClose={handleCloseModal}
            onReservaCreada={handleReservaCreada}
          />
        )}

        {userId != null && (
          <MisReservasModal
            open={mostrarMisReservas}
            userId={userId}
            onClose={handleCerrarMisReservas}
            onSelectReserva={handleSeleccionarReserva}
            onEditReserva={handleEditarReserva}
            reloadKey={misReservasReloadKey}
          />
        )}

        <ReservaDetalleModal
          reserva={reservaSeleccionada}
          open={reservaSeleccionada != null}
          onClose={handleCerrarDetalleReserva}
          onEditReserva={handleEditarReserva}
          onReservaCancelada={handleReservaCancelada}
        />
        <EditarReservaModal
          reserva={reservaEnEdicion}
          open={reservaEnEdicion != null}
          onClose={handleCerrarEdicionReserva}
          onReservaActualizada={handleReservaActualizada}
        />
      </main>
    </div>
  );
};