import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Loader2,
  MapPin,
  Users,
  X
} from 'lucide-react';
import type { HorarioSemanal, LaboratorioResumen } from '../types';
import '../../../../../styles/HorarioModal.css';

interface HorarioModalProps {
  laboratorio: LaboratorioResumen;
  horarios: HorarioSemanal[];
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onRetry?: () => void;
}

const DIA_HEADERS: Array<{ key: string; label: string }> = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
];

const normalizarDia = (dia: string): string => dia.trim().toLowerCase();

const TURNOS = [
  { key: 'manana', label: 'Turno mañana', rango: '08:00 - 13:00' },
  { key: 'tarde', label: 'Turno tarde', rango: '13:00 - 21:40' },
] as const;

type Turno = (typeof TURNOS)[number]['key'];

const convertirAHoraEnMinutos = (hora: string): number => {
  const [horas, minutos] = hora.split(':').map((parte) => parseInt(parte, 10));
  if (Number.isNaN(horas) || Number.isNaN(minutos)) {
    return 0;
  }
  return horas * 60 + minutos;
};


export const HorarioModal: React.FC<HorarioModalProps> = ({
  laboratorio,
  horarios,
  isLoading,
  error,
  onClose,
  onRetry
}) => {
    const [turnoActivo, setTurnoActivo] = useState<Turno>('manana');
  const diasPorBloque = useMemo(() => {
    return horarios.map((bloque) => {
      const diasMap = new Map<string, boolean>();
      bloque.dias.forEach((dia) => {
        diasMap.set(normalizarDia(dia.diaSemana), dia.ocupado);
      });

      return {
        bloque,
        diasMap,
      };
    });
  }, [horarios]);

const bloquesFiltrados = useMemo(() => {
    const mananaInicio = 8 * 60;
    const tardeInicio = 13 * 60;
    const tardeFin = 21 * 60 + 40;

    return diasPorBloque.filter(({ bloque }) => {
      const inicio = convertirAHoraEnMinutos(bloque.horaInicio);

      if (turnoActivo === 'manana') {
        return inicio >= mananaInicio && inicio < tardeInicio;
      }

      return inicio >= tardeInicio && inicio <= tardeFin;
    });
  }, [diasPorBloque, turnoActivo]);

  const tieneUbicacion = Boolean(laboratorio.ubicacion || laboratorio.campus || laboratorio.piso);

  return (
       <div
          className="reservas-horario-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="horario-modal-title"
        >
      <div className="horario-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="horario-modal__container">
        <div className="horario-modal__actions">
          <button type="button" className="horario-modal__back" onClick={onClose}>
            <ArrowLeft size={18} aria-hidden="true" />
            Volver a espacios
          </button>
          <button type="button" className="horario-modal__close" onClick={onClose} aria-label="Cerrar horario">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <section className="horario-modal__space-card">
          <div className="horario-modal__space-header">
            <span className="horario-modal__space-tag">{laboratorio.tipo ?? 'Espacio académico'}</span>
            {laboratorio.codigo && (
              <span className="horario-modal__space-code">{laboratorio.codigo}</span>
            )}
          </div>
          <h2 id="horario-modal-title" className="horario-modal__space-title">
            {laboratorio.nombre}
          </h2>
          <div className="horario-modal__space-meta">
            {typeof laboratorio.capacidad === 'number' && (
              <div className="horario-modal__meta-item">
                <Users size={18} aria-hidden="true" />
                <span>Capacidad: {laboratorio.capacidad} personas</span>
              </div>
            )}
            {laboratorio.facultad && (
              <div className="horario-modal__meta-item">
                <Building2 size={18} aria-hidden="true" />
                <span>{laboratorio.facultad}</span>
              </div>
            )}
            {tieneUbicacion && (
              <div className="horario-modal__meta-item">
                <MapPin size={18} aria-hidden="true" />
                <span>
                  {[laboratorio.campus, laboratorio.piso, laboratorio.ubicacion]
                    .filter(Boolean)
                    .join(' • ')}
                </span>
              </div>
            )}
          </div>
          {laboratorio.notas && (
            <p className="horario-modal__space-note">{laboratorio.notas}</p>
          )}
        </section>

        <section className="horario-modal__schedule">
          <header className="horario-modal__schedule-header">
            <div>
              <h3>Horario semanal</h3>
              <p>Bloques de 50 minutos actualizados en tiempo real</p>
            </div>
            <div className="horario-modal__legend" aria-label="Leyenda del horario">
              <span>
                <span className="horario-modal__legend-dot horario-modal__legend-dot--ocupado" aria-hidden="true" />
                Ocupado
              </span>
              <span>
                <span className="horario-modal__legend-dot horario-modal__legend-dot--libre" aria-hidden="true" />
                Disponible
              </span>
            </div>
          </header>

             <div className="horario-modal__filters" role="group" aria-label="Filtrar horario por turno">
                      {TURNOS.map((turno) => {
                        const isActive = turnoActivo === turno.key;
                        return (
                          <button
                            type="button"
                            key={turno.key}
                            className={[
                              'horario-modal__shift-button',
                              isActive ? 'horario-modal__shift-button--active' : '',
                            ].join(' ')}
                            onClick={() => setTurnoActivo(turno.key)}
                            aria-pressed={isActive}
                          >
                            <span className="horario-modal__shift-label">{turno.label}</span>
                            <span className="horario-modal__shift-range">{turno.rango}</span>
                          </button>
                        );
                      })}
                    </div>

          <div className="horario-modal__table-wrapper">
            <table className="horario-modal__table">
              <thead>
                <tr>
                  <th scope="col">Horario</th>
                  {DIA_HEADERS.map((dia) => (
                    <th key={dia.key} scope="col">{dia.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td className="horario-modal__table-cell" colSpan={DIA_HEADERS.length + 1}>
                      <div className="horario-modal__table-status" role="status" aria-live="polite">
                        <Loader2 className="horario-modal__spinner" size={18} aria-hidden="true" />
                        Cargando horario del espacio...
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoading && error && (
                  <tr>
                    <td className="horario-modal__table-cell" colSpan={DIA_HEADERS.length + 1}>
                      <div className="horario-modal__table-status horario-modal__table-status--error" role="alert">
                        <AlertCircle size={18} aria-hidden="true" />
                        <span>{error}</span>
                        {onRetry && (
                          <button type="button" onClick={onRetry} className="horario-modal__retry">
                            Reintentar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoading && !error && diasPorBloque.length === 0 && (
                  <tr>
                    <td className="horario-modal__table-cell" colSpan={DIA_HEADERS.length + 1}>
                      <div className="horario-modal__table-status" role="status">
                        No se registran bloques de horario para este espacio.
                      </div>
                    </td>
                  </tr>
                )}

                  {!isLoading &&
                                 !error &&
                                 diasPorBloque.length > 0 &&
                                 bloquesFiltrados.length === 0 && (
                                   <tr>
                                     <td className="horario-modal__table-cell" colSpan={DIA_HEADERS.length + 1}>
                                       <div className="horario-modal__table-status" role="status">
                                         No se encontraron bloques dentro del turno seleccionado.
                                       </div>
                                     </td>
                                   </tr>
                                 )}

                               {!isLoading && !error && bloquesFiltrados.map(({ bloque, diasMap }) => (
                    <tr key={bloque.bloqueId}>
                                   <th scope="row" className="horario-modal__time">
                                     <span className="horario-modal__time-range horario-modal__time-range--only">
                                       {bloque.horaInicio} - {bloque.horaFin}
                                     </span>
                                   </th>
                    {DIA_HEADERS.map((dia) => {
                      const ocupado = diasMap.get(dia.key) ?? false;
                      return (
                        <td
                          key={`${bloque.bloqueId}-${dia.key}`}
                          className={[
                            'horario-modal__table-cell',
                            ocupado ? 'horario-modal__table-cell--ocupado' : 'horario-modal__table-cell--libre',
                          ].join(' ')}
                        >
                          {ocupado ? (
                            <>
                              <span className="horario-modal__cell-status">Bloque reservado</span>
                              <span className="horario-modal__cell-time">{bloque.horaInicio} - {bloque.horaFin}</span>
                            </>
                          ) : (
                            <span className="horario-modal__cell-status">Disponible</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};