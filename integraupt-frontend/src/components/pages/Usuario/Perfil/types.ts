export interface PerfilUsuario {
  idUsuario: number;
  nombre: string;
  apellido: string;
  tipoDoc: {
    idTipoDoc: number;
    nombre: string;
    abreviatura: string;
  };
  numDoc: string;
  celular: string;
  genero: boolean;
  estado: number;
  fechaRegistro: string;
  rol: {
    idRol: number;
    nombre: string;
  };
  auth?: {
    correoU: string;
  };
}

export interface PerfilEstudiante extends PerfilUsuario {
  idEstudiante: number;
  usuario: PerfilUsuario;
  escuela: {
    idEscuela: number;
    nombre: string;
    facultad: {
      idFacultad: number;
      nombre: string;
      abreviatura: string;
    };
  };
  codigo: string;
}

export interface PerfilDocente extends PerfilUsuario {
  idDocente: number;
  usuario: PerfilUsuario;
  escuela: {
    idEscuela: number;
    nombre: string;
    facultad: {
      idFacultad: number;
      nombre: string;
      abreviatura: string;
    };
  };
  codigoDocente: string;
  tipoContrato: string;
  especialidad: string;
  fechaIncorporacion: string;
}

export interface PerfilAdministrativo extends PerfilUsuario {
  idAdministrativo: number;
  usuario: PerfilUsuario;
  escuela: {
    idEscuela: number;
    nombre: string;
    facultad: {
      idFacultad: number;
      nombre: string;
      abreviatura: string;
    };
  };
  turno: string;
  extension: string;
  fechaIncorporacion: string;
}