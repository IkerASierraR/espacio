import type { ChangeEvent, ChangeEventHandler } from 'react';
import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Beaker,
  Building2,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Search,
  Users
} from 'lucide-react';
import type { LaboratorioResumen, EstadoLaboratorio } from '../types';
import "../../../../../styles/ListaLaboratorios.css";

type ComboValue = number | 'all';

interface FacultadOption {
  id: number;
  nombre: string;
  abreviatura?: string;
}

interface EscuelaOption {
  id: number;
  nombre: string;
  facultadId?: number;
  facultadNombre?: string;
}


type EstadoVariant = {
  label: string;
  cardClass: string;
  badgeClass: string;
  description: string;
};

const ESTADO_VARIANTS: Record<EstadoLaboratorio, EstadoVariant> = {
  disponible: {
    label: 'Disponible',
    cardClass: 'lab-card--disponible',
    badgeClass: 'lab-card__status--disponible',
    description: 'El espacio está disponible para reservas inmediatas.'
  },
  mantenimiento: {
    label: 'En mantenimiento',
    cardClass: 'lab-card--mantenimiento',
    badgeClass: 'lab-card__status--mantenimiento',
    description: 'El espacio se encuentra en mantenimiento temporal.'
  },
  ocupado: {
    label: 'Sin disponibilidad',
    cardClass: 'lab-card--ocupado',
    badgeClass: 'lab-card__status--ocupado',
    description: 'Todas las reservas para este espacio están ocupadas.'
  },
  no_disponible: {
    label: 'No disponible',
    cardClass: 'lab-card--no-disponible',
    badgeClass: 'lab-card__status--no-disponible',
    description: 'El espacio no acepta reservas por el momento.'
  }
};

export interface ListaLaboratoriosProps {
  laboratorios: LaboratorioResumen[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onVerHorario?: (laboratorio: LaboratorioResumen) => void;
  onReservar?: (laboratorio: LaboratorioResumen) => void;
  onVerMisReservas?: () => void;
  onVolverServicios?: () => void;
  searchPlaceholder?: string;
  title?: string;
  subtitle?: string;
  advancedFiltersEnabled?: boolean;
    facultades?: FacultadOption[];
    escuelas?: EscuelaOption[];
    selectedFacultadId?: ComboValue;
    selectedEscuelaId?: ComboValue;
    onFacultadChange?: (value: ComboValue) => void;
    onEscuelaChange?: (value: ComboValue) => void;
    filtersError?: string | null;
    filtersLoading?: boolean;
}

const DEFAULT_TITLE = 'Espacios Disponibles';
const DEFAULT_SUBTITLE = 'Selecciona un espacio para ver su horario semanal.';
const DEFAULT_SEARCH_PLACEHOLDER = 'Buscar laboratorio por nombre, código o facultad';

export function ListaLaboratorios({
  laboratorios,
  isLoading = false,
  error = null,
  onRetry,
  onVerHorario,
  onReservar,
  onVerMisReservas,
  onVolverServicios,
  searchPlaceholder = DEFAULT_SEARCH_PLACEHOLDER,
  title = DEFAULT_TITLE,
   subtitle = DEFAULT_SUBTITLE,
    advancedFiltersEnabled = false,
    facultades = [],
    escuelas = [],
    selectedFacultadId = 'all',
    selectedEscuelaId = 'all',
    onFacultadChange,
    onEscuelaChange,
    filtersError = null,
    filtersLoading = false
}: ListaLaboratoriosProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const normalizedTerm = searchTerm.trim().toLowerCase();
  const normalizedSelectedFacultadId = selectedFacultadId ?? 'all';
    const normalizedSelectedEscuelaId = selectedEscuelaId ?? 'all';

    const filteredEscuelaOptions = useMemo(() => {
      if (typeof normalizedSelectedFacultadId !== 'number') {
        return escuelas;
      }

      return escuelas.filter(
        (escuela) => escuela.facultadId === normalizedSelectedFacultadId
      );
    }, [escuelas, normalizedSelectedFacultadId]);


  const filteredLaboratorios = useMemo(() => {
    if (!normalizedTerm) {
      return laboratorios;
    }

    return laboratorios.filter((laboratorio) => {
      const candidates: Array<string | undefined> = [
        laboratorio.nombre,
        laboratorio.codigo,
        laboratorio.facultad,
        laboratorio.campus,
        laboratorio.ubicacion,
        laboratorio.piso,
        laboratorio.estadoDescripcion,
        laboratorio.notas,
        ...(laboratorio.especialidades ?? []),
        ...(laboratorio.equipamiento ?? [])
      ];

      return candidates.some((candidate) =>
        candidate?.toLowerCase().includes(normalizedTerm)
      );
    });
  }, [laboratorios, normalizedTerm]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
const handleFacultadSelectChange: ChangeEventHandler<HTMLSelectElement> = (
    event
  ) => {
    if (!onFacultadChange) {
      return;
    }

    const { value } = event.target;
    if (value === 'all') {
      onFacultadChange('all');
      return;
    }

    const parsed = Number.parseInt(value, 10);
    onFacultadChange(Number.isNaN(parsed) ? 'all' : parsed);
  };

  const handleEscuelaSelectChange: ChangeEventHandler<HTMLSelectElement> = (
    event
  ) => {
    if (!onEscuelaChange) {
      return;
    }

    const { value } = event.target;
    if (value === 'all') {
      onEscuelaChange('all');
      return;
    }

    const parsed = Number.parseInt(value, 10);
    onEscuelaChange(Number.isNaN(parsed) ? 'all' : parsed);
  };

  const renderSkeleton = () => (
    <div className="lab-list__grid">
      {Array.from({ length: Math.max(3, Math.min(6, laboratorios.length || 3)) }).map((_, index) => (
        <div key={`skeleton-${index}`} className="lab-card lab-card--skeleton">
          <div className="lab-card__skeleton-badge" />
          <div className="lab-card__skeleton-line lab-card__skeleton-line--medium" />
          <div className="lab-card__skeleton-line lab-card__skeleton-line--short" />
          <div className="lab-card__skeleton-line lab-card__skeleton-line--long" />
          <div className="lab-card__skeleton-line lab-card__skeleton-line--medium" />
          <div className="lab-card__skeleton-line lab-card__skeleton-line--short" />
          <div className="lab-card__skeleton-footer">
            <div className="lab-card__skeleton-pill" />
            <div className="lab-card__skeleton-pill" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderError = () => (
    <div className="lab-list__feedback lab-list__feedback--error" role="alert">
      <AlertCircle className="lab-list__feedback-icon" aria-hidden="true" />
      <div className="lab-list__feedback-content">
        <h3>Ocurrió un error</h3>
        <p>{error}</p>
      </div>
      {onRetry && (
        <button type="button" className="lab-list__feedback-button" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );

  const renderEmpty = () => (
    <div className="lab-list__feedback lab-list__feedback--empty">
      <Beaker className="lab-list__feedback-icon" aria-hidden="true" />
      <div className="lab-list__feedback-content">
        <h3>No se encontraron laboratorios</h3>
        <p>Intenta modificar tu búsqueda o revisar otros criterios.</p>
      </div>
    </div>
  );

  return (
    <section className="lab-list">
      <div className="lab-list__container">
        <header className="lab-list__header">
          <div className="lab-list__header-text">
            {onVolverServicios && (
              <button type="button" className="lab-list__back" onClick={onVolverServicios}>
                <ArrowLeft size={16} aria-hidden="true" />
                Volver a Servicios
              </button>
            )}
            <h1 className="lab-list__title">{title}</h1>
            <p className="lab-list__subtitle">{subtitle}</p>
          </div>
          {onVerMisReservas && (
            <button type="button" className="lab-list__my-reservations" onClick={onVerMisReservas}>
              Mis reservas
            </button>
          )}
        </header>

        <div className="lab-list__toolbar">
          <div className="lab-list__search" role="search">
            <Search className="lab-list__search-icon" aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={handleChange}
              className="lab-list__search-input"
              placeholder={searchPlaceholder}
              aria-label="Buscar laboratorio"
            />
          </div>
          {advancedFiltersEnabled && (
                      <div
                        className="lab-list__filters"
                        role="group"
                        aria-label="Filtros de facultad y escuela"
                      >
                        <div className="lab-list__filter">
                          <label className="lab-list__filter-label" htmlFor="lab-filter-facultad">
                            Facultad
                          </label>
                          <select
                            id="lab-filter-facultad"
                            className="lab-list__filter-select"
                            value={
                              normalizedSelectedFacultadId === 'all'
                                ? 'all'
                                : normalizedSelectedFacultadId.toString()
                            }
                            onChange={handleFacultadSelectChange}
                            disabled={filtersLoading || facultades.length === 0 || !onFacultadChange}
                          >
                            <option value="all">Todas las facultades</option>
                            {facultades.map((facultad) => (
                              <option key={facultad.id} value={facultad.id}>
                                {facultad.abreviatura && facultad.abreviatura.length > 0
                                  ? `${facultad.abreviatura} — ${facultad.nombre}`
                                  : facultad.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="lab-list__filter">
                          <label className="lab-list__filter-label" htmlFor="lab-filter-escuela">
                            Escuela
                          </label>
                          <select
                            id="lab-filter-escuela"
                            className="lab-list__filter-select"
                            value={
                              normalizedSelectedEscuelaId === 'all'
                                ? 'all'
                                : normalizedSelectedEscuelaId.toString()
                            }
                            onChange={handleEscuelaSelectChange}
                            disabled={
                              filtersLoading || filteredEscuelaOptions.length === 0 || !onEscuelaChange
                            }
                          >
                            <option value="all">Todas las escuelas</option>
                            {filteredEscuelaOptions.map((escuela) => (
                              <option key={escuela.id} value={escuela.id}>
                                {escuela.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
          <div className="lab-list__summary">
            <span className="lab-list__summary-count">
              {filteredLaboratorios.length} espacio{filteredLaboratorios.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
         {advancedFiltersEnabled && filtersError && (
                  <p className="lab-list__filters-error" role="status">{filtersError}</p>
                )}

        {isLoading && renderSkeleton()}
        {!isLoading && error && renderError()}
        {!isLoading && !error && filteredLaboratorios.length === 0 && renderEmpty()}

        {!isLoading && !error && filteredLaboratorios.length > 0 && (
          <div className="lab-list__grid">
            {filteredLaboratorios.map((laboratorio) => {
              const estado = ESTADO_VARIANTS[laboratorio.estado ?? 'disponible'];
              const cardClassName = ['lab-card', estado.cardClass].join(' ');
              const statusLabel = laboratorio.estadoDescripcion ?? estado.label;

              return (
                <article key={laboratorio.id} className={cardClassName} aria-label={`Información del ${laboratorio.tipo ?? 'laboratorio'} ${laboratorio.nombre}`}>
                  <header className="lab-card__header">
                    <span className="lab-card__tag">
                      <Beaker size={16} aria-hidden="true" />
                      {laboratorio.tipo ?? 'Laboratorio'}
                    </span>
                    <span className={['lab-card__status', estado.badgeClass].join(' ')}>{statusLabel}</span>
                  </header>

                  <div className="lab-card__body">
                    <h3 className="lab-card__title">{laboratorio.nombre}</h3>
                    <p className="lab-card__subtitle">
                      {laboratorio.codigo && <span className="lab-card__code">{laboratorio.codigo}</span>}
                      {laboratorio.facultad && (
                        <span className="lab-card__faculty">
                          <Building2 size={16} aria-hidden="true" />
                          {laboratorio.facultad}
                        </span>
                      )}
                    </p>

                    <div className="lab-card__meta">
                      {laboratorio.ubicacion && (
                        <div className="lab-card__meta-item">
                          <MapPin size={16} aria-hidden="true" />
                          <span>{laboratorio.ubicacion}</span>
                        </div>
                      )}
                      {typeof laboratorio.capacidad === 'number' && (
                        <div className="lab-card__meta-item">
                          <Users size={16} aria-hidden="true" />
                          <span>Capacidad: {laboratorio.capacidad} persona{laboratorio.capacidad === 1 ? '' : 's'}</span>
                        </div>
                      )}
                      {laboratorio.proximaDisponibilidad && (
                        <div className="lab-card__meta-item">
                          <CalendarDays size={16} aria-hidden="true" />
                          <span>{laboratorio.proximaDisponibilidad}</span>
                        </div>
                      )}
                    </div>

                    {(laboratorio.especialidades?.length ?? 0) > 0 && (
                      <div className="lab-card__section">
                        <h4 className="lab-card__section-title">Especialidades</h4>
                        <ul className="lab-card__list">
                          {laboratorio.especialidades!.map((especialidad: string) => (
                            <li key={`${laboratorio.id}-especialidad-${especialidad}`} className="lab-card__list-item">
                              <CheckCircle2 size={16} aria-hidden="true" />
                              <span>{especialidad}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(laboratorio.equipamiento?.length ?? 0) > 0 && (
                      <div className="lab-card__section">
                        <h4 className="lab-card__section-title">Equipamiento</h4>
                        <ul className="lab-card__list">
                          {laboratorio.equipamiento!.map((equipo: string) => (
                            <li key={`${laboratorio.id}-equipo-${equipo}`} className="lab-card__list-item">
                              <CheckCircle2 size={16} aria-hidden="true" />
                              <span>{equipo}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {laboratorio.notas && (
                      <p className="lab-card__notes">{laboratorio.notas}</p>
                    )}
                  </div>

                  <footer className="lab-card__footer">
                    <button
                      type="button"
                      className="lab-card__button lab-card__button--outline"
                      onClick={() => onVerHorario?.(laboratorio)}
                      disabled={!onVerHorario}
                    >
                      Ver horario
                    </button>
                    <button
                      type="button"
                      className="lab-card__button lab-card__button--primary"
                      onClick={() => onReservar?.(laboratorio)}
                      disabled={!onReservar || laboratorio.estado === 'mantenimiento' || laboratorio.estado === 'ocupado' || laboratorio.estado === 'no_disponible'}
                    >
                      Reservar espacio
                    </button>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}