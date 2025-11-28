import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, Loader2, Save, Users, X } from 'lucide-react';
import type { ReservaApi } from '../types';
import { updateReserva } from '../services/reservasService';
import { getReservasApiUrl } from '../../../../../utils/apiConfig';
import '../../../../../styles/ReservaModal.css';

interface EditarReservaModalProps {
  onClose: () => void;
  onReservaActualizada?: (reserva: ReservaApi) => void;
}

interface ReservaFormState {
  fechaReserva: string;
  bloqueId: string;
  cursoId: string;
  descripcionUso: string;
  cantidadEstudiantes: string;
}

interface BloqueHorarioOption {
  id: number;
  label: string;
    horaInicio?: string | null;
    horaFinal?: string | null;
}

interface CursoOption {
  id: number;
  nombre: string;
  ciclo?: string;
}

const formatDateToInputValue = (value?: string | null): string => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateToIso = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayIsoDate = (): string => formatDateToIso(new Date());
const isToday = (value: string): boolean => {
  if (!value) return false;

  const [year, month, day] = value.split('-').map(Number);
  if ([year, month, day].some((part) => Number.isNaN(part))) {
    return false;
  }

  const today = new Date();
  return (
    year === today.getFullYear() && month === today.getMonth() + 1 && day === today.getDate()
  );
};


const getCurrentWeekBoundaries = (): { start: Date; end: Date } => {
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  start.setDate(today.getDate() - start.getDay());

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
};

const getCurrentWeekSaturdayIsoDate = (): string => {
  const { end } = getCurrentWeekBoundaries();
  return formatDateToIso(end);
};

const isDateWithinCurrentWeek = (value: string): boolean => {
  if (!value) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  if ([year, month, day].some((part) => Number.isNaN(part))) {
    return false;
  }

  const selectedDate = new Date(year, month - 1, day);
  selectedDate.setHours(0, 0, 0, 0);

  const { start, end } = getCurrentWeekBoundaries();
  return selectedDate >= start && selectedDate <= end;
};

const createFormStateFromReserva = (reserva: ReservaApi | null): ReservaFormState => ({
  fechaReserva: formatDateToInputValue(reserva?.fechaReserva) || getTodayIsoDate(),
  bloqueId: reserva?.bloqueId ? reserva.bloqueId.toString() : '',
  cursoId: reserva?.cursoId ? reserva.cursoId.toString() : '',
  descripcionUso: reserva?.descripcionUso ?? '',
  cantidadEstudiantes: reserva?.cantidadEstudiantes
    ? reserva.cantidadEstudiantes.toString()
    : '',
});

const parseBloques = (data: unknown): BloqueHorarioOption[] => {
  if (!Array.isArray(data)) {
    return [];
  }

  return (data as Array<Record<string, unknown>>)
    .map((item) => {
      const id = typeof item.id === 'number' ? item.id : null;
      const nombre = typeof item.nombre === 'string' ? item.nombre.trim() : null;
      const horaInicio = typeof item.horaInicio === 'string' ? item.horaInicio : null;
      const horaFinal = typeof item.horaFinal === 'string' ? item.horaFinal : null;

      if (id == null) {
        return null;
      }

      const rangoHorario = horaInicio && horaFinal ? `${horaInicio} - ${horaFinal}` : null;
      const label = rangoHorario ?? nombre ?? `Bloque ${id}`;

      return { id, label, horaInicio, horaFinal } satisfies BloqueHorarioOption;
    })
    .filter((item): item is BloqueHorarioOption => Boolean(item));
};
const parseHoraEnMinutos = (hora?: string | null): number | null => {
  if (!hora) {
    return null;
  }

  const [horaParte, minutoParte] = hora.split(':');
  const horas = Number.parseInt(horaParte ?? '', 10);
  const minutos = Number.parseInt(minutoParte ?? '0', 10);

  if (Number.isNaN(horas) || Number.isNaN(minutos)) {
    return null;
  }

  return horas * 60 + minutos;
};

const esBloqueManana = (bloque: BloqueHorarioOption): boolean => {
  const minutos = parseHoraEnMinutos(bloque.horaInicio);
  if (minutos == null) {
    return true;
  }
  const inicioManana = 8 * 60;
  const finManana = 13 * 60;
  return minutos >= inicioManana && minutos < finManana;
};

const esBloqueTarde = (bloque: BloqueHorarioOption): boolean => {
  const minutos = parseHoraEnMinutos(bloque.horaInicio);
  if (minutos == null) {
    return true;
  }
  const inicioTarde = 13 * 60;
  return minutos >= inicioTarde;
};

const esBloqueEnPasado = (bloque: BloqueHorarioOption, fechaReserva: string): boolean => {
  if (!bloque.horaInicio || !isToday(fechaReserva)) {
    return false;
  }

  const minutosInicio = parseHoraEnMinutos(bloque.horaInicio);
  if (minutosInicio == null) {
    return false;
  }

  const ahora = new Date();
  const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes();

  return minutosInicio < minutosActuales;
};


const formatDateDisplay = (value?: string | null): string => {
  if (!value) return 'Fecha no disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('es-PE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const formatTimeRange = (inicio?: string | null, fin?: string | null): string | null => {
  if (!inicio || !fin) return null;
  return `${inicio} - ${fin}`;
};
const parseCursos = (data: unknown): CursoOption[] => {
  if (!Array.isArray(data)) {
    return [];
  }

  return (data as Array<Record<string, unknown>>)
    .map((item) => {
      const id = typeof item.id === 'number' ? item.id : null;
      const nombre = typeof item.nombre === 'string' ? item.nombre.trim() : null;
      const ciclo = typeof item.ciclo === 'string' ? item.ciclo.trim() : '';

      if (id == null || !nombre) {
        return null;
      }

      return { id, nombre, ciclo } satisfies CursoOption;
    })
    .filter((item): item is CursoOption => Boolean(item));
};

export const EditarReservaModal: React.FC<EditarReservaModalProps> = ({
  reserva,
  open,
  onClose,
  onReservaActualizada,
}) => {
  const [formState, setFormState] = useState<ReservaFormState>(() => createFormStateFromReserva(reserva));
  const [bloques, setBloques] = useState<BloqueHorarioOption[]>([]);
  const [cursos, setCursos] = useState<CursoOption[]>([]);
  const [isLoadingOpciones, setIsLoadingOpciones] = useState(false);
  const [opcionesError, setOpcionesError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const determinePeriodoInicial = (horaInicio?: string | null): 'manana' | 'tarde' => {
    const minutos = parseHoraEnMinutos(horaInicio);
    if (minutos == null) {
      return 'manana';
    }

    const finManana = 13 * 60;
    return minutos < finManana ? 'manana' : 'tarde';
  };

  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<'manana' | 'tarde'>(
    () => determinePeriodoInicial(reserva?.bloqueHoraInicio)
  );

 const estaBloqueFueraDeTiempo = useCallback(
    (bloque: BloqueHorarioOption) => esBloqueEnPasado(bloque, formState.fechaReserva),
    [formState.fechaReserva]
  );

  const fechaReservaDisplay = useMemo(
    () => formatDateDisplay(reserva?.fechaReserva ?? formState.fechaReserva),
    [formState.fechaReserva, reserva?.fechaReserva]
  );


    const bloqueSeleccionado = useMemo(
      () => bloques.find((bloque) => bloque.id === Number(formState.bloqueId)) ?? null,
      [bloques, formState.bloqueId]
    );

  const rangoHorario = useMemo(
    () => formatTimeRange(bloqueSeleccionado?.horaInicio, bloqueSeleccionado?.horaFinal),
    [bloqueSeleccionado?.horaFinal, bloqueSeleccionado?.horaInicio]
  );

  const bloquesPorPeriodo = useMemo(
    () =>
      bloques.filter((bloque) =>
        periodoSeleccionado === 'manana' ? esBloqueManana(bloque) : esBloqueTarde(bloque)
      ),
    [bloques, periodoSeleccionado]
  );

  const bloquesDisponiblesEnPeriodo = useMemo(
    () => bloquesPorPeriodo.filter((bloque) => !estaBloqueFueraDeTiempo(bloque)),
    [bloquesPorPeriodo, estaBloqueFueraDeTiempo]
  );

  const bloquesFiltrados = useMemo(() => {
    if (!formState.bloqueId) {
      return bloquesDisponiblesEnPeriodo;
    }

const seleccionado = bloques.find((bloque) => bloque.id.toString() === formState.bloqueId);
    if (seleccionado && !bloquesDisponiblesEnPeriodo.some((bloque) => bloque.id === seleccionado.id)) {
      return [...bloquesDisponiblesEnPeriodo, seleccionado].sort((a, b) => a.id - b.id);
    }

    return bloquesDisponiblesEnPeriodo;
  }, [bloques, bloquesDisponiblesEnPeriodo, formState.bloqueId]);

  const hayBloquesDisponibles = useMemo(
    () => bloquesDisponiblesEnPeriodo.length > 0,
    [bloquesDisponiblesEnPeriodo]
  );

  useEffect(() => {
    if (!formState.bloqueId) {
      return;
    }

    const seleccionado = bloques.find((bloque) => bloque.id.toString() === formState.bloqueId);
    if (seleccionado && estaBloqueFueraDeTiempo(seleccionado)) {
      setFormState((prev) => ({
        ...prev,
        bloqueId: '',
      }));
    }
  }, [bloques, estaBloqueFueraDeTiempo, formState.bloqueId]);

  useEffect(() => {
    if (!open) {
      setBloques([]);
      setCursos([]);
      setOpcionesError(null);
      return;
    }

    if (!reserva?.espacioId) {
      setOpcionesError('No se pudo identificar el espacio asociado a la reserva.');
      setBloques([]);
      setCursos([]);
      return;
    }

    const controller = new AbortController();
    setIsLoadingOpciones(true);
    setOpcionesError(null);

    Promise.all([
      fetch(getReservasApiUrl(`/api/espacios/${reserva.espacioId}/bloques`), {
        signal: controller.signal,
      }),
      fetch(getReservasApiUrl(`/api/espacios/${reserva.espacioId}/cursos`), {
        signal: controller.signal,
      }),
    ])
      .then(async ([bloquesResponse, cursosResponse]) => {
        if (!bloquesResponse.ok) {
          throw new Error('No se pudo obtener la lista de bloques horarios.');
        }
        if (!cursosResponse.ok) {
          throw new Error('No se pudo obtener la lista de cursos disponibles.');
        }

        const bloquesData: unknown = await bloquesResponse.json();
        const cursosData: unknown = await cursosResponse.json();

        setBloques(parseBloques(bloquesData));
        setCursos(parseCursos(cursosData));
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }
        setOpcionesError(
          error instanceof Error
            ? error.message
            : 'Ocurrió un error al cargar la información necesaria para editar la reserva.'
        );
        setBloques([]);
        setCursos([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingOpciones(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [open, reserva?.espacioId]);

  useEffect(() => {
    if (!open) {
      setFormState(createFormStateFromReserva(null));
            setPeriodoSeleccionado('manana');
      setSuccessMessage(null);
      setSubmitError(null);
      return;
    }

    setFormState(createFormStateFromReserva(reserva));
    setPeriodoSeleccionado(determinePeriodoInicial(reserva?.bloqueHoraInicio));
    setSuccessMessage(null);
    setSubmitError(null);
  }, [open, reserva?.bloqueId, reserva?.cantidadEstudiantes, reserva?.cursoId, reserva?.descripcionUso, reserva?.fechaReserva]);

  const handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!reserva) {
        return;
      }

      if (!formState.fechaReserva) {
        setSubmitError('Debes seleccionar la fecha de la reserva.');
        return;
      }

      if (!isDateWithinCurrentWeek(formState.fechaReserva)) {
        setSubmitError('Solo puedes modificar reservas dentro de la semana actual (domingo a sábado).');
        return;
      }

      const bloqueId = Number(formState.bloqueId);
      const cursoId = Number(formState.cursoId);
      const cantidadEstudiantes = Number(formState.cantidadEstudiantes);
      const descripcionUso = formState.descripcionUso.trim();

      if (!Number.isInteger(bloqueId) || bloqueId <= 0) {
        setSubmitError('Selecciona un bloque horario válido.');
        return;
      }

      if (!Number.isInteger(cursoId) || cursoId <= 0) {
        setSubmitError('Selecciona un curso válido.');
        return;
      }

      if (!Number.isInteger(cantidadEstudiantes) || cantidadEstudiantes <= 0) {
        setSubmitError('La cantidad de estudiantes debe ser mayor a cero.');
        return;
      }

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const payload = {
          usuarioId: reserva.usuarioId,
          espacioId: reserva.espacioId,
          bloqueId,
          cursoId,
          fechaReserva: formState.fechaReserva,
          descripcionUso: descripcionUso || null,
          cantidadEstudiantes,
          estado: reserva.estado ?? 'Pendiente',
        };

        const actualizada = await updateReserva(reserva.id, payload);
        setSuccessMessage('La reserva fue actualizada correctamente.');
        if (onReservaActualizada) {
          onReservaActualizada(actualizada);
        }
      } catch (error) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : 'Ocurrió un error inesperado al actualizar la reserva.'
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState, onReservaActualizada, reserva]
  );

  const canEdit = useMemo(() => reserva?.estado === 'Pendiente', [reserva?.estado]);

  if (!open || !reserva) {
    return null;
  }

  return (
    <div className="reserva-modal" role="dialog" aria-modal="true" aria-labelledby="editar-reserva-title">
      <div className="reserva-modal__overlay" onClick={onClose} />
         <div className="reserva-modal__content reserva-modal__content--editing" role="document">
           <header className="reserva-modal__hero">
          <div>
            <p className="reserva-modal__eyebrow">Reserva de espacio académico</p>
            <h2 id="editar-reserva-title" className="reserva-modal__title">
                           {reserva.espacioNombre ?? `Reserva #${reserva.id}`}
            </h2>
            <p className="reserva-modal__subtitle">
              Ajusta los datos de tu solicitud pendiente antes de que sea revisada.
            </p>
            <div className="reserva-modal__chips">
                          <span className="reserva-modal__chip">Capacidad sugerida: {reserva.cantidadEstudiantes} personas</span>
                          <span className="reserva-modal__chip reserva-modal__chip--soft">
                            Estado: {reserva.estado ?? 'Pendiente'}
                          </span>
                        </div>
          </div>
          <button type="button" className="reserva-modal__close" onClick={onClose} aria-label="Cerrar edición">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        {!canEdit ? (
          <div className="reserva-form__error" role="alert">
            Solo puedes editar reservas en estado pendiente.
          </div>
        ) : (
         <div className="reserva-modal__layout">
                     <aside className="reserva-modal__summary">
                       <h3>Resumen de la reserva</h3>
                       <div className="reserva-modal__summary-card">
                         <div className="reserva-modal__summary-row">
                           <CalendarDays size={18} aria-hidden="true" />
                           <div>
                             <p className="reserva-modal__summary-label">Fecha de uso</p>
                             <p className="reserva-modal__summary-value">{fechaReservaDisplay}</p>
                           </div>
                         </div>
                         <div className="reserva-modal__summary-row">
                           <Clock3 size={18} aria-hidden="true" />
                           <div>
                             <p className="reserva-modal__summary-label">Horario actual</p>
                             <p className="reserva-modal__summary-value">
                               {rangoHorario ?? bloqueSeleccionado?.label ?? 'Selecciona un bloque'}
                             </p>
                           </div>
                         </div>
              </div>

              <div className="reserva-modal__summary-details">
                            <div>
                              <p className="reserva-modal__summary-label">Curso vinculado</p>
                              <p className="reserva-modal__summary-value">
                                {cursos.find((c) => c.id === Number(formState.cursoId))?.nombre ?? 'Sin seleccionar'}
                              </p>
                            </div>
                            <div>
                              <p className="reserva-modal__summary-label">Cantidad estimada</p>
                              <p className="reserva-modal__summary-value">{formState.cantidadEstudiantes || '0'} estudiantes</p>
                            </div>
              </div>
              {successMessage && (
                            <div className="reserva-form__feedback" role="status">
                              {successMessage}
                </div>
                )}
                          </aside>

                          <form className="reserva-form reserva-form--editing" onSubmit={handleSubmit}>
                            {isLoadingOpciones && (
                              <div className="reserva-form__feedback" role="status">
                                <Loader2 className="reserva-form__spinner" size={18} aria-hidden="true" /> Cargando opciones...
                              </div>
                            )}
                            {opcionesError && (
                              <div className="reserva-form__error" role="alert">
                                {opcionesError}
                              </div>
                            )}
                            {submitError && (
                              <div className="reserva-form__error" role="alert">
                                {submitError}
                              </div>
                            )}

                            <div className="reserva-form__grid">
                              <label className="reserva-form__field">
                                <span>Fecha de uso</span>
                                <div className="reserva-form__input-wrapper">
                                  <CalendarDays size={16} aria-hidden="true" />
                                  <input
                                    type="date"
                                    name="fechaReserva"
                                    min={getTodayIsoDate()}
                                    max={getCurrentWeekSaturdayIsoDate()}
                                    value={formState.fechaReserva}
                                    onChange={handleChange}
                                    disabled={!canEdit}
                                    required
                                  />
                                </div>
                              </label>

                              <label className="reserva-form__field">
                                <div className="reserva-form__field-header">
                                  <span>Bloque horario</span>
                                  <div className="reserva-form__filters">
                                    <button
                                      type="button"
                                      className={`reserva-form__filter-btn ${periodoSeleccionado === 'manana' ? 'reserva-form__filter-btn--active' : ''}`}
                                      onClick={() => setPeriodoSeleccionado('manana')}
                                      disabled={isLoadingOpciones}
                                    >
                                      Mañana
                                    </button>
                                    <button
                                      type="button"
                                      className={`reserva-form__filter-btn ${periodoSeleccionado === 'tarde' ? 'reserva-form__filter-btn--active' : ''}`}
                                      onClick={() => setPeriodoSeleccionado('tarde')}
                                      disabled={isLoadingOpciones}
                                    >
                                      Tarde
                                    </button>
                                   
                                  </div>
                                </div>
                                <select
                                  name="bloqueId"
                                  value={formState.bloqueId}
                                  onChange={handleSelectChange}
                                  disabled={isLoadingOpciones || !hayBloquesDisponibles}
                                  required
                                >
                                  <option value="" disabled>
                                                                        {isLoadingOpciones
                                                                          ? 'Cargando bloques...'
                                                                          : hayBloquesDisponibles
                                                                            ? 'Selecciona un bloque'
                                                                            : 'No hay bloques disponibles para la fecha seleccionada'}
                    </option>
                   {bloquesFiltrados.map((bloque) => (
                                        <option key={bloque.id} value={bloque.id}>
                                          {bloque.label}
                                        </option>
                                      ))}
                                    </select>
                                        <p className="reserva-form__help">
                                                                          {hayBloquesDisponibles
                                                                            ? 'Solo se muestran los bloques disponibles para la semana actual.'
                                                                            : 'Los bloques anteriores al horario actual se ocultan automáticamente.'}
                                                                        </p>
                                  </label>

                                  <label className="reserva-form__field">
                                    <span>Curso asociado</span>
                                    <select
                                      name="cursoId"
                                      value={formState.cursoId}
                                      onChange={handleSelectChange}
                                      disabled={isLoadingOpciones || cursos.length === 0}
                                      required
                                    >
                                      <option value="" disabled>
                                        {isLoadingOpciones ? 'Cargando cursos...' : 'Selecciona un curso'}
                     </option>
                                                         {cursos.map((curso) => (
                                                           <option key={curso.id} value={curso.id}>
                                                             {curso.nombre}
                                                             {curso.ciclo ? ` · ${curso.ciclo}` : ''}
                                                           </option>
                                                         ))}
                                                       </select>
                                                     </label>

                                                     <label className="reserva-form__field">
                                                       <span>Cantidad estimada de estudiantes</span>
                                                       <div className="reserva-form__input-wrapper">
                                                         <Users size={16} aria-hidden="true" />
                                                         <input
                                                           type="number"
                                                           name="cantidadEstudiantes"
                                                           min={1}
                                                           value={formState.cantidadEstudiantes}
                                                           onChange={handleChange}
                                                           required
                                                         />
                                                       </div>
                                                     </label>

                                                     <label className="reserva-form__field reserva-form__field--full">
                                                       <span>Descripción del uso</span>
                                                       <textarea
                                                         name="descripcionUso"
                                                         value={formState.descripcionUso}
                                                         onChange={handleChange}
                                                         placeholder="Describe brevemente el uso previsto del espacio"
                                                         rows={3}
                                                       />
                                                     </label>
                             </div>

            <div className="reserva-form__actions">
                            <button
                                                         type="button"
                                                         className="reserva-form__button reserva-form__button--secondary"
                                                         onClick={onClose}
                                                         disabled={isSubmitting}
                                                       >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="reserva-form__button reserva-form__button--primary"
                              disabled={isSubmitting || isLoadingOpciones}
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="reserva-form__spinner" size={16} aria-hidden="true" /> Guardando...
                                </>
                              ) : (
                                <>
                                  <Save size={16} aria-hidden="true" /> Confirmar reserva
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
        )}
      </div>
    </div>
  );
};