export interface Escuela {
  id: number;
  nombre: string;
  facultadId: number;
}

export interface Espacio {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string;
  capacidad: number;
  equipamiento?: string | null;
  estado: number;
  escuelaId: number;
  escuelaNombre?: string | null;
}

export type EspacioPayload = {
  codigo: string;
  nombre: string;
  tipo: string;
  capacidad: number;
  equipamiento?: string;
  escuelaId: number;
  estado: number;
};

export interface EspacioFormValues {
  codigo: string;
  nombre: string;
  tipo: string;
  capacidad: string;
  equipamiento: string;
  escuelaId: string;
  estado: "1" | "0";
}

export type EspacioFormMode = "create" | "edit";
