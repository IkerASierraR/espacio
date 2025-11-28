import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Copy, Download, Loader2, Users, X } from 'lucide-react';
import type { LaboratorioResumen, ReservaCreacionResponse } from '../types';
import '../../../../../styles/ReservaModal.css';
import { getReservasApiUrl } from '../../../../../utils/apiConfig';
import { fetchHorarioSemanalPorEspacio } from '../services/horariosService';

interface ReservaModalProps {
  laboratorio: LaboratorioResumen;
  userId: number | null;
  onClose: () => void;
  onReservaCreada?: (respuesta: ReservaCreacionResponse) => void;
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
  horaInicio: string | null;
  horaFinal: string | null;
}

type BloquesOcupadosMap = Map<number, Set<string>>;


interface CursoOption {
  id: number;
  nombre: string;
  ciclo: string;
}

const formatDateToInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayIsoDate = (): string => formatDateToInputValue(new Date());

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
  return formatDateToInputValue(end);
};

const isToday = (value: string): boolean => {
  if (!value) return false;

  const [year, month, day] = value.split('-').map(Number);
  if ([year, month, day].some((part) => Number.isNaN(part))) {
    return false;
  }

  const today = new Date();
  return (
    year === today.getFullYear() &&
    month === today.getMonth() + 1 &&
    day === today.getDate()
  );
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

const normalizarDiaSemana = (dia: string): string => dia.trim().toLowerCase();

const getDiaSemanaFromDate = (value: string): string | null => {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  if ([year, month, day].some((part) => Number.isNaN(part))) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  return diasSemana[date.getUTCDay()] ?? null;
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

const createInitialFormState = (): ReservaFormState => ({
  fechaReserva: getTodayIsoDate(),
  bloqueId: '',
  cursoId: '',
  descripcionUso: '',
  cantidadEstudiantes: ''
});

export const ReservaModal: React.FC<ReservaModalProps> = ({
  laboratorio,
  userId,
  onClose,
  onReservaCreada
}) => {
  const [formState, setFormState] = useState<ReservaFormState>(() => createInitialFormState());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingOpciones, setIsLoadingOpciones] = useState(false);
     const [opcionesError, setOpcionesError] = useState<string | null>(null);
     const [bloques, setBloques] = useState<BloqueHorarioOption[]>([]);
     const [cursos, setCursos] = useState<CursoOption[]>([]);
     const [bloquesOcupados, setBloquesOcupados] = useState<BloquesOcupadosMap>(new Map());
  const [resultadoReserva, setResultadoReserva] = useState<ReservaCreacionResponse | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<'manana' | 'tarde'>('manana');
  const laboratorioTitulo = useMemo(() => {
    const codigo = laboratorio.codigo ? `${laboratorio.codigo} - ` : '';
    return `${codigo}${laboratorio.nombre}`;
  }, [laboratorio.codigo, laboratorio.nombre]);

  const handleChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSelectChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    if (!laboratorio.espacioId) {
      setBloques([]);
      setCursos([]);
      setOpcionesError('No se pudo determinar el espacio seleccionado.');
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    const fetchOpciones = async () => {
      setIsLoadingOpciones(true);
      setOpcionesError(null);

      try {
        const [bloquesResponse, cursosResponse] = await Promise.all([
          fetch(getReservasApiUrl(`/api/espacios/${laboratorio.espacioId}/bloques`), {
                      signal: controller.signal
                    }),
                    fetch(getReservasApiUrl(`/api/espacios/${laboratorio.espacioId}/cursos`), {
                      signal: controller.signal
                    })
        ]);

        if (!bloquesResponse.ok) {
          throw new Error('No se pudo obtener la lista de bloques horarios.');
        }
        if (!cursosResponse.ok) {
          throw new Error('No se pudo obtener la lista de cursos disponibles.');
        }

        const bloquesData: unknown = await bloquesResponse.json();
        const cursosData: unknown = await cursosResponse.json();

        const parseBloques = Array.isArray(bloquesData)
          ? (bloquesData as Array<Record<string, unknown>>)
              .map((bloque) => {
                const id = typeof bloque.id === 'number' ? bloque.id : null;
                const nombre =
                  typeof bloque.nombre === 'string' && bloque.nombre.trim().length > 0
                    ? bloque.nombre.trim()
                    : null;
                const horaInicio = typeof bloque.horaInicio === 'string' ? bloque.horaInicio : null;
                const horaFinal = typeof bloque.horaFinal === 'string' ? bloque.horaFinal : null;

                if (id == null) {
                  return null;
                }

                    const rangoHorario = horaInicio && horaFinal ? `${horaInicio} - ${horaFinal}` : null;
                    const label = rangoHorario ?? nombre ?? `Bloque ${id}`;

                     return { id, label, horaInicio, horaFinal } satisfies BloqueHorarioOption;
              })
              .filter((bloque): bloque is BloqueHorarioOption => Boolean(bloque))
          : [];

        const parseCursos = Array.isArray(cursosData)
          ? (cursosData as Array<Record<string, unknown>>)
              .map((curso) => {
                const id = typeof curso.id === 'number' ? curso.id : null;
                const nombre =
                  typeof curso.nombre === 'string' && curso.nombre.trim().length > 0
                    ? curso.nombre.trim()
                    : null;
                const ciclo = typeof curso.ciclo === 'string' ? curso.ciclo.trim() : '';

                if (id == null || !nombre) {
                  return null;
                }

                               return { id, nombre, ciclo } satisfies CursoOption;
              })
              .filter((curso): curso is CursoOption => Boolean(curso))
          : [];

        if (isMounted) {
          setBloques(parseBloques);
          setCursos(parseCursos);
        }
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }
        const message =
          fetchError instanceof Error
            ? fetchError.message
            : 'Ocurrió un error al cargar la información del formulario.';
        if (isMounted) {
          setOpcionesError(message);
          setBloques([]);
          setCursos([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingOpciones(false);
        }
      }
    };

    void fetchOpciones();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [laboratorio.espacioId]);
 useEffect(() => {
    if (!laboratorio.espacioId) {
      setBloquesOcupados(new Map());
      return;
    }

    const espacioId = laboratorio.espacioId;
    const controller = new AbortController();
    let isMounted = true;

    const fetchHorarios = async () => {
      try {
        const horarios = await fetchHorarioSemanalPorEspacio(espacioId, controller.signal);

        if (!isMounted) return;

        const ocupadosMap: BloquesOcupadosMap = new Map();
        horarios.forEach((horario) => {
          const diasOcupados = horario.dias
            .filter((dia) => dia.ocupado)
            .map((dia) => normalizarDiaSemana(dia.diaSemana));

          if (diasOcupados.length > 0) {
            ocupadosMap.set(horario.bloqueId, new Set(diasOcupados));
          }
        });

        setBloquesOcupados(ocupadosMap);
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }
        // Si ocurre un error al obtener los horarios, permitimos la selección normal
        setBloquesOcupados(new Map());
        console.error('Error al cargar horarios del espacio:', fetchError);
      }
    };

    void fetchHorarios();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [laboratorio.espacioId]);

  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      bloqueId: prev.bloqueId && bloques.some((bloque) => bloque.id.toString() === prev.bloqueId)
        ? prev.bloqueId
        : '',
      cursoId: prev.cursoId && cursos.some((curso) => curso.id.toString() === prev.cursoId)
        ? prev.cursoId
        : ''
    }));
  }, [bloques, cursos]);
  const resetFormState = useCallback(() => {
    setFormState(createInitialFormState());
    setError(null);
  }, []);

  const clearCopyFeedback = useCallback(() => {
    setCopyStatus('idle');
    setCopyMessage(null);
  }, []);

  const handleNuevaReserva = useCallback(() => {
    setResultadoReserva(null);
    clearCopyFeedback();
    resetFormState();
  }, [clearCopyFeedback, resetFormState]);

  const handleCloseModal = useCallback(() => {
    handleNuevaReserva();
    onClose();
  }, [handleNuevaReserva, onClose]);

  const formatFecha = useCallback((valor?: string | null) => {
    if (!valor) {
      return 'Por confirmar';
    }
    const date = new Date(valor);
    if (Number.isNaN(date.getTime())) {
      return valor;
    }
    return new Intl.DateTimeFormat('es-PE', { dateStyle: 'long' }).format(date);
  }, []);

  const formatEstado = useCallback((estado?: string | null) => {
    if (!estado) {
      return 'Pendiente';
    }
    const trimmed = estado.trim();
    if (!trimmed) {
      return 'Pendiente';
    }
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  }, []);

  const qrDataUrl = useMemo(() => {
    const base64 = resultadoReserva?.qr?.qrBase64?.trim();
    return base64 ? `data:image/png;base64,${base64}` : null;
  }, [resultadoReserva?.qr?.qrBase64]);

  const verificationUrl = useMemo(
    () => resultadoReserva?.qr?.verificationUrl?.trim() ?? '',
    [resultadoReserva?.qr?.verificationUrl]
  );

  const qrInfo = resultadoReserva?.qr?.reserva;
  const reservaConfirmada = resultadoReserva?.reserva;

   const diaSemanaSeleccionado = useMemo(
      () => getDiaSemanaFromDate(formState.fechaReserva),
      [formState.fechaReserva]
    );

    const isBloqueOcupadoEnDia = useCallback(
      (bloqueId: number, diaSemana: string | null): boolean => {
        if (!diaSemana) return false;
        const diasOcupados = bloquesOcupados.get(bloqueId);
        if (!diasOcupados) return false;
        return diasOcupados.has(diaSemana);
      },
      [bloquesOcupados]
    );

    const estaBloqueFueraDeTiempo = useCallback(
      (bloque: BloqueHorarioOption) => esBloqueEnPasado(bloque, formState.fechaReserva),
      [formState.fechaReserva]
    );

    useEffect(() => {
      const bloqueId = Number(formState.bloqueId);
      if (
        Number.isInteger(bloqueId) &&
        bloqueId > 0 &&
        isBloqueOcupadoEnDia(bloqueId, diaSemanaSeleccionado)
      ) {
        setFormState((prev) => ({
          ...prev,
          bloqueId: '',
        }));
      }
    }, [diaSemanaSeleccionado, formState.bloqueId, isBloqueOcupadoEnDia]);


    useEffect(() => {
      if (!formState.bloqueId) {
        return;
      }

      const bloqueSeleccionado = bloques.find((bloque) => bloque.id.toString() === formState.bloqueId);
      if (bloqueSeleccionado && estaBloqueFueraDeTiempo(bloqueSeleccionado)) {
        setFormState((prev) => ({
          ...prev,
          bloqueId: '',
        }));
      }
    }, [bloques, estaBloqueFueraDeTiempo, formState.bloqueId]);



  const fechaReservaFormateada = useMemo(
    () => formatFecha(qrInfo?.fecha ?? reservaConfirmada?.fechaReserva),
    [formatFecha, qrInfo?.fecha, reservaConfirmada?.fechaReserva]
  );

  const horarioReserva = useMemo(() => {
    if (qrInfo?.hora && qrInfo.hora.trim().length > 0) {
      return qrInfo.hora.trim();
    }
    return reservaConfirmada?.bloqueId
      ? `Bloque ${reservaConfirmada.bloqueId}`
      : 'Horario por definir';
  }, [qrInfo?.hora, reservaConfirmada?.bloqueId]);

  const estadoReserva = useMemo(
    () => formatEstado(reservaConfirmada?.estado ?? qrInfo?.estado),
    [formatEstado, qrInfo?.estado, reservaConfirmada?.estado]
  );

  const cantidadReserva = useMemo(() => {
    const cantidad = reservaConfirmada?.cantidadEstudiantes;
    if (typeof cantidad === 'number' && Number.isFinite(cantidad)) {
      return `${cantidad} estudiante${cantidad === 1 ? '' : 's'}`;
    }
    return 'No especificado';
  }, [reservaConfirmada?.cantidadEstudiantes]);

  const laboratorioNombre = useMemo(() => {
    const nombreQr = qrInfo?.laboratorio?.trim();
    if (nombreQr) {
      return nombreQr;
    }
    return laboratorioTitulo;
  }, [laboratorioTitulo, qrInfo?.laboratorio]);

  useEffect(() => {
    if (copyStatus !== 'success') {
      return;
    }
    const timer = setTimeout(() => {
      clearCopyFeedback();
    }, 4000);
    return () => clearTimeout(timer);
  }, [clearCopyFeedback, copyStatus]);

  const handleCopyVerificationUrl = useCallback(async () => {
    const url = verificationUrl;
    if (!url) {
      setCopyStatus('error');
      setCopyMessage('No hay enlace de verificación disponible.');
      return;
    }

    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        await navigator.clipboard.writeText(url);
      } else {
        throw new Error('clipboard-not-supported');
      }
      setCopyStatus('success');
      setCopyMessage('Enlace copiado en el portapapeles.');
    } catch {
      setCopyStatus('error');
      setCopyMessage('No se pudo copiar automáticamente. Copia manualmente el enlace de verificación.');
    }
  }, [verificationUrl]);


  const handleSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(
    async (event) => {
      event.preventDefault();

      if (!laboratorio.espacioId) {
        setError('No se pudo identificar el espacio seleccionado. Intenta nuevamente.');
        return;
      }

      if (userId == null) {
        setError('No se pudo identificar al usuario autenticado.');
        return;
      }

      if (!formState.fechaReserva) {
        setError('Debes seleccionar la fecha de la reserva.');
        return;
      }

     if (!isDateWithinCurrentWeek(formState.fechaReserva)) {
          setError('Solo puedes reservar dentro de la semana actual (domingo a sábado).');
          return;
        }


      const bloqueId = Number(formState.bloqueId);
      const cursoId = Number(formState.cursoId);
      const cantidadEstudiantes = Number(formState.cantidadEstudiantes);
      const descripcionUso = formState.descripcionUso.trim();

      if (!Number.isInteger(bloqueId) || bloqueId <= 0) {
       setError('Selecciona un bloque horario válido.');
        return;
      }

     const bloqueSeleccionado = bloques.find((bloque) => bloque.id === bloqueId) ?? null;
        if (bloqueSeleccionado && esBloqueEnPasado(bloqueSeleccionado, formState.fechaReserva)) {
          setError('No puedes reservar un horario que ya pasó en el día seleccionado.');
          return;
        }

      if (!Number.isInteger(cursoId) || cursoId <= 0) {
        setError('Selecciona un curso válido.');
        return;
      }

      if (!Number.isInteger(cantidadEstudiantes) || cantidadEstudiantes <= 0) {
        setError('La cantidad de estudiantes debe ser mayor a cero.');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const payload = {
          usuarioId: userId,
          espacioId: laboratorio.espacioId,
          bloqueId,
          cursoId,
          fechaReserva: formState.fechaReserva,
           descripcionUso: descripcionUso || null,
          cantidadEstudiantes
        };

        const response = await fetch(getReservasApiUrl('/api/reservas'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error('No fue posible registrar la reserva.');
        }

        const data = (await response.json().catch(() => null)) as ReservaCreacionResponse | null;

                if (!data || !data.reserva) {
                  setResultadoReserva(null);
                  setCopyStatus('error');
                  setCopyMessage(
                    'La reserva fue registrada, pero no se pudo obtener la confirmación. Revisa tu historial para validarla.'
                  );
                  resetFormState();
                  if (onReservaCreada) {
                    onReservaCreada({
                      reserva: {
                        id: data?.reserva?.id ?? 0,
                        usuarioId: userId,
                        espacioId: laboratorio.espacioId,
                        bloqueId,
                        cursoId,
                        fechaReserva: formState.fechaReserva,
                        descripcionUso: descripcionUso || null,
                        cantidadEstudiantes,
                        estado: data?.reserva?.estado ?? 'Pendiente'
                      },
                      qr: data?.qr
                    });
                  }
                  return;
                }

                setResultadoReserva(data);
                clearCopyFeedback();
                resetFormState();


        if (onReservaCreada) {
           onReservaCreada(data);
           }
      } catch (submitError) {
        const message =
          submitError instanceof Error
            ? submitError.message
            : 'Ocurrió un error inesperado al registrar la reserva.';
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
         bloques,
              clearCopyFeedback,
              formState,
              laboratorio.espacioId,
              onReservaCreada,
              resetFormState,
              userId
            ]
  );

  const cursoSeleccionado = useMemo(
    () => cursos.find((curso) => curso.id.toString() === formState.cursoId) ?? null,
    [cursos, formState.cursoId]
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

  const hayBloquesEnPeriodo = useMemo(
    () => bloquesDisponiblesEnPeriodo.length > 0,
    [bloquesDisponiblesEnPeriodo]
  );
  const estaBloqueDisponible = useCallback(
    (bloque: BloqueHorarioOption, diaSemana: string | null) => {
      const bloqueOcupado = isBloqueOcupadoEnDia(bloque.id, diaSemana);
      const bloqueEnPasado = estaBloqueFueraDeTiempo(bloque);
      return !bloqueOcupado && !bloqueEnPasado;
    },
    [estaBloqueFueraDeTiempo, isBloqueOcupadoEnDia]
  );
const bloquesDisponiblesEnDia = useMemo(
    () => bloquesFiltrados.filter((bloque) => estaBloqueDisponible(bloque, diaSemanaSeleccionado)),
    [bloquesFiltrados, diaSemanaSeleccionado, estaBloqueDisponible]
  );

  const hayBloquesDisponiblesEnDia = useMemo(
    () => bloquesDisponiblesEnDia.length > 0,
    [bloquesDisponiblesEnDia]
  );
  const disponibilidadPorPeriodo = useMemo(
    () => ({
      manana: bloques.some(
        (bloque) => esBloqueManana(bloque) && estaBloqueDisponible(bloque, diaSemanaSeleccionado)
      ),
      tarde: bloques.some(
        (bloque) => esBloqueTarde(bloque) && estaBloqueDisponible(bloque, diaSemanaSeleccionado)
      )
    }),
    [bloques, diaSemanaSeleccionado, estaBloqueDisponible]
  );

  useEffect(() => {
    if (disponibilidadPorPeriodo[periodoSeleccionado]) {
      return;
    }

    const periodoAlternativo = periodoSeleccionado === 'manana' ? 'tarde' : 'manana';
    if (disponibilidadPorPeriodo[periodoAlternativo]) {
      setPeriodoSeleccionado(periodoAlternativo);
    }
  }, [disponibilidadPorPeriodo, periodoSeleccionado]);

  const handlePeriodoChange = useCallback((periodo: 'manana' | 'tarde') => {
    setPeriodoSeleccionado(periodo);
  }, []);


  return (
    <div className="reserva-modal" role="dialog" aria-modal="true" aria-labelledby="reserva-modal-title">
     <div className="reserva-modal__overlay" onClick={isSubmitting ? undefined : handleCloseModal} />
      <div className="reserva-modal__content">
        <header className="reserva-modal__header">
          <div>
           <p className="reserva-modal__eyebrow">
              {resultadoReserva ? 'Reserva confirmada' : 'Reserva de espacio académico'}
            </p>
            <h2 id="reserva-modal-title" className="reserva-modal__title">
              {laboratorioTitulo}
            </h2>
            {laboratorio.capacidad && !resultadoReserva && (
            <p className="reserva-modal__subtitle">
              <Users size={16} aria-hidden="true" /> Capacidad sugerida: {laboratorio.capacidad} persona
              {laboratorio.capacidad === 1 ? '' : 's'}
            </p>
            )}
          </div>
          <button
            type="button"
            className="reserva-modal__close"
             onClick={handleCloseModal}
            disabled={isSubmitting}
            aria-label={resultadoReserva ? 'Cerrar confirmación de reserva' : 'Cerrar formulario de reserva'}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

       {resultadoReserva ? (
        <div className="reserva-confirmacion">
          <div className="reserva-confirmacion__icon" aria-hidden="true">
            <CheckCircle2 size={40} />
          </div>
          <h3 className="reserva-confirmacion__title">¡Reserva registrada con éxito!</h3>
          <p className="reserva-confirmacion__subtitle">
            Presenta este código QR y tu documento de identidad el día de tu reserva para validar tu acceso.
          </p>

          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Código QR de la reserva"
              className="reserva-confirmacion__qr"
            />
          ) : (
            <div className="reserva-confirmacion__alert" role="status">
              No se pudo generar el código QR automáticamente. Utiliza el enlace de verificación para validar tu reserva.
            </div>
          )}
          <div className="reserva-confirmacion__details">
            <dl className="reserva-confirmacion__details-grid">
              <div className="reserva-confirmacion__detail-item">
                <dt className="reserva-confirmacion__detail-label">Laboratorio</dt>
                <dd className="reserva-confirmacion__detail-value">{laboratorioNombre}</dd>
              </div>
              <div className="reserva-confirmacion__detail-item">
                <dt className="reserva-confirmacion__detail-label">ID de reserva</dt>
                <dd className="reserva-confirmacion__detail-value">
                  {reservaConfirmada?.id ?? 'Por confirmar'}
                </dd>
              </div>
              <div className="reserva-confirmacion__detail-item">
                <dt className="reserva-confirmacion__detail-label">Fecha</dt>
                <dd className="reserva-confirmacion__detail-value">{fechaReservaFormateada}</dd>
              </div>
              <div className="reserva-confirmacion__detail-item">
                <dt className="reserva-confirmacion__detail-label">Horario</dt>
                <dd className="reserva-confirmacion__detail-value">{horarioReserva}</dd>
              </div>
              <div className="reserva-confirmacion__detail-item">
                <dt className="reserva-confirmacion__detail-label">Estado</dt>
                <dd className="reserva-confirmacion__detail-value">{estadoReserva}</dd>
              </div>
              <div className="reserva-confirmacion__detail-item">
                <dt className="reserva-confirmacion__detail-label">Asistentes</dt>
                <dd className="reserva-confirmacion__detail-value">{cantidadReserva}</dd>
              </div>
            </dl>
            {verificationUrl && (
              <div className="reserva-confirmacion__detail-link">
                <span>Enlace de verificación:</span>
                <a href={verificationUrl} target="_blank" rel="noopener noreferrer">
                  {verificationUrl}
                </a>
              </div>
            )}
          </div>

          {copyMessage && (
            <div
              className={`reserva-confirmacion__message ${
                copyStatus === 'error'
                  ? 'reserva-confirmacion__message--error'
                  : 'reserva-confirmacion__message--success'
              }`}
              role={copyStatus === 'error' ? 'alert' : 'status'}
            >
            <p>{copyMessage}</p>
              {copyStatus === 'error' && verificationUrl && (
                <p className="reserva-confirmacion__message-link">
                  <a href={verificationUrl} target="_blank" rel="noopener noreferrer">
                    {verificationUrl}
                  </a>
                </p>
              )}
          </div>
          )}
          <div className="reserva-confirmacion__actions">
            {qrDataUrl && (
              <a
                className="reserva-form__button reserva-form__button--primary"
                href={qrDataUrl}
                download={`reserva-${reservaConfirmada?.id ?? 'qr'}.png`}
              >
                <Download size={16} aria-hidden="true" /> Descargar QR
              </a>
            )}
            {verificationUrl && (
              <button
                type="button"
                className="reserva-form__button reserva-form__button--secondary"
                onClick={handleCopyVerificationUrl}
              >
                <Copy size={16} aria-hidden="true" />
                {copyStatus === 'success' ? 'Enlace copiado' : 'Copiar enlace de verificación'}
              </button>
            )}
            <button
              type="button"
              className="reserva-form__button"
              onClick={handleNuevaReserva}
            >
              Crear otra reserva
            </button>
            <button
              type="button"
              className="reserva-form__button reserva-form__button--primary"
              onClick={handleCloseModal}
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : (
        <form className="reserva-form" onSubmit={handleSubmit}>
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
          <div className="reserva-form__grid">
            <label className="reserva-form__field reserva-form__field--fecha">
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
                  required
                />
              </div>
            </label>

            <label className="reserva-form__field reserva-form__field--bloque">
              <div className="reserva-form__field-header">
                <span>Bloque horario</span>
                <div
                  className="reserva-form__filters"
                  role="group"
                  aria-label="Filtrar bloques por turno"
                >
                  <button
                    type="button"
                    className={`reserva-form__filter-btn ${
                      periodoSeleccionado === 'manana'
                        ? 'reserva-form__filter-btn--active'
                        : ''
                    }`}
                    onClick={() => handlePeriodoChange('manana')}
                    disabled={
                      periodoSeleccionado === 'manana' ||
                      !disponibilidadPorPeriodo.manana
                    }
                  >
                    Mañana
                  </button>
                  <button
                    type="button"
                    className={`reserva-form__filter-btn ${
                      periodoSeleccionado === 'tarde'
                        ? 'reserva-form__filter-btn--active'
                        : ''
                    }`}
                    onClick={() => handlePeriodoChange('tarde')}
                    disabled={
                      periodoSeleccionado === 'tarde' ||
                      !disponibilidadPorPeriodo.tarde
                    }
                  >
                    Tarde
                  </button>
                </div>
              </div>
            <select
              name="bloqueId"
              value={formState.bloqueId}
              onChange={handleSelectChange}
              disabled={
                isLoadingOpciones ||
                !hayBloquesEnPeriodo ||
                !hayBloquesDisponiblesEnDia
              }
              required
            >
              <option value="" disabled>
                {isLoadingOpciones
                  ? 'Cargando bloques...'
                  : hayBloquesEnPeriodo && hayBloquesDisponiblesEnDia
                  ? 'Selecciona un bloque'
                  : 'Sin bloques disponibles para este turno y fecha'}
              </option>
              {bloquesFiltrados.map((bloque) => {
                const ocupado = isBloqueOcupadoEnDia(
                  bloque.id,
                  diaSemanaSeleccionado
                );
                const noDisponible = ocupado;
                let label = bloque.label;
                if (ocupado) {
                  label = `${label} (No disponible)`;
                }

                return (
                  <option key={bloque.id} value={bloque.id} disabled={noDisponible}>
                    {label}
                  </option>
                );
              })}
            </select>
            {!isLoadingOpciones && !hayBloquesEnPeriodo && bloques.length > 0 && (
              <p className="reserva-form__help">
                No hay horarios disponibles entre las 8:00 y las 13:00 o entre las 13:00 y las 21:40
                para este espacio. Cambia de turno para ver otras opciones.
              </p>
            )}
            {!isLoadingOpciones &&
              hayBloquesEnPeriodo &&
              !hayBloquesDisponiblesEnDia && (
                <p className="reserva-form__help">
                  Los bloques de este turno ya no están disponibles para la fecha
                  seleccionada (ocupados o ya pasaron en el día). Prueba con otra
                  fecha o turno.
                </p>
              )
            }
            </label>
            <label className="reserva-form__field reserva-form__field--curso">
              <span>Selecciona un curso</span>
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
                  </option>
                ))}
              </select>
            </label>
            <label className="reserva-form__field reserva-form__field--ciclo">
              <span>Ciclo</span>
              <input
                type="text"
                value={cursoSeleccionado?.ciclo ?? ''}
                readOnly
                placeholder="Selecciona un curso"
              />
            </label>
            <label className="reserva-form__field reserva-form__field--cantidad">
              <span>Cantidad de estudiantes</span>
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
          </div>
          <label className="reserva-form__field reserva-form__field--full">
            <span>Descripción del uso</span>
            <textarea
              name="descripcionUso"
              value={formState.descripcionUso}
              onChange={handleChange}
              rows={4}
              placeholder="Describe brevemente la actividad o el curso que realizará la reserva"
            />
          </label>
          {error && (
          <div className="reserva-form__error" role="alert">
            {error}
          </div>
          )}
          <div className="reserva-form__actions">
            <button
              type="button"
              className="reserva-form__button reserva-form__button--secondary"
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="reserva-form__button reserva-form__button--primary"
              disabled={isSubmitting || isLoadingOpciones || !!opcionesError}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="reserva-form__spinner" size={16} aria-hidden="true" />
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} aria-hidden="true" />
                  Confirmar reserva
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  </div>
  );
};
