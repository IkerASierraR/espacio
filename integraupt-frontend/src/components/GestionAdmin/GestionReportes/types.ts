// types.ts
export interface EstadisticasGenerales {
  totalEstudiantes: number;
  totalDocentes: number;
  reservasActivas: number;
  tasaUso: number;
  reservasEsteMes: number;
  reservasMesAnterior: number;
  variacionReservas: string;
}

export interface UsoEspacio {
  nombreEspacio: string;
  codigoEspacio: string;
  tipoEspacio: string;
  totalReservas: number;
  porcentajeUso: number;
}

export interface ReservasMes {
  mes: string;
  anio: number;
  totalReservas: number;
}