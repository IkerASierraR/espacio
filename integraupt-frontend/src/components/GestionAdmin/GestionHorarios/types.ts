export interface Horario {
  id: number;
  cursoId: number;
  cursoNombre: string;
  docenteId: number;
  docenteNombre: string;
  espacioId: number;
  espacioNombre: string;
  espacioCodigo?: string | null;
  bloqueId: number;
  bloqueNombre: string;
  bloqueHorario?: string | null;
  diaSemana: string;
  fechaInicio: string;
  fechaFin: string;
  estado: boolean;
}

export interface HorarioPayload {
  curso: number;
  docente: number;
  espacio: number;
  bloque: number;
  diaSemana: string;
  fechaInicio: string;
  fechaFin: string;
  estado: boolean;
}

export interface HorarioFormValues {
  cursoId: string;
  docenteId: string;
  espacioId: string;
  bloqueId: string;
  diaSemana: string;
  fechaInicio: string;
  fechaFin: string;
  estado: "activo" | "inactivo";
}

export type HorarioFormMode = "create" | "edit";

export interface CursoCatalogItem {
  id: number;
  nombre: string;
}

export interface DocenteCatalogItem {
  id: number;
  nombres: string;
  apellidos: string;
  codigo?: string | null;
  nombreCompleto?: string | null;
}

export interface EspacioCatalogItem {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  capacidad: number;
}

export interface BloqueCatalogItem {
  id: number;
  nombre: string;
  horaInicio: string;
  horaFinal: string;
}

export interface HorarioCatalogos {
  cursos: CursoCatalogItem[];
  docentes: DocenteCatalogItem[];
  espacios: EspacioCatalogItem[];
  bloques: BloqueCatalogItem[];
}
