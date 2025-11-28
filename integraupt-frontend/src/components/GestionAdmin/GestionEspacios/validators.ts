import type { Espacio, EspacioFormValues, EspacioPayload } from "./types";

export const createEmptyFormValues = (): EspacioFormValues => ({
  codigo: "",
  nombre: "",
  tipo: "",
  capacidad: "",
  equipamiento: "",
  escuelaId: "",
  estado: "1"
});

export const mapEspacioToFormValues = (espacio: Espacio): EspacioFormValues => ({
  codigo: espacio.codigo ?? "",
  nombre: espacio.nombre ?? "",
  tipo: espacio.tipo ?? "",
  capacidad: `${espacio.capacidad ?? ""}`,
  equipamiento: espacio.equipamiento ?? "",
  escuelaId: `${espacio.escuelaId ?? ""}`,
  estado: espacio.estado === 0 ? "0" : "1"
});

export const validateEspacioValues = (values: EspacioFormValues): string[] => {
  const errors: string[] = [];

  if (!values.codigo.trim()) {
    errors.push("El codigo es obligatorio.");
  }

  if (!values.nombre.trim()) {
    errors.push("El nombre es obligatorio.");
  }

  if (!values.tipo.trim()) {
    errors.push("El tipo es obligatorio.");
  }

  const capacidadNumber = Number(values.capacidad);
  if (!Number.isFinite(capacidadNumber) || capacidadNumber <= 0) {
    errors.push("La capacidad debe ser un numero mayor a cero.");
  }

  const escuelaNumber = Number(values.escuelaId);
  if (!Number.isFinite(escuelaNumber) || escuelaNumber <= 0) {
    errors.push("La escuela es obligatoria.");
  }

  if (values.equipamiento.trim().length > 1000) {
    errors.push("El equipamiento no puede exceder 1000 caracteres.");
  }

  return errors;
};

export const buildPayloadFromValues = (values: EspacioFormValues): EspacioPayload => {
  const equipamiento = values.equipamiento.trim();
  return {
    codigo: values.codigo.trim(),
    nombre: values.nombre.trim(),
    tipo: values.tipo.trim(),
    capacidad: Number(values.capacidad),
    equipamiento: equipamiento || undefined,
    escuelaId: Number(values.escuelaId),
    estado: values.estado === "0" ? 0 : 1
  };
};
