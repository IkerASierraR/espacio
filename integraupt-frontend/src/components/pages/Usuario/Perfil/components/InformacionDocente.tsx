import React from 'react';
import { GraduationCap, Building, Briefcase, Calendar, Award } from 'lucide-react';
import type { PerfilDocente } from '../types';
import '../styles/Perfil.css';

interface InformacionDocenteProps {
  perfil: PerfilDocente;
}

export const InformacionDocente: React.FC<InformacionDocenteProps> = ({ perfil }) => {
  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="perfil-section">
      <h3 className="perfil-section-title">
        <GraduationCap className="perfil-section-icon" />
        Información Docente
      </h3>
      
      <div className="perfil-grid">
        <div className="perfil-info-item">
          <label className="perfil-info-label">
            <Award className="perfil-info-icon" />
            Código de docente
          </label>
          <p className="perfil-info-value perfil-codigo">{perfil.codigoDocente}</p>
        </div>

        <div className="perfil-info-item">
          <label className="perfil-info-label">
            <Building className="perfil-info-icon" />
            Escuela
          </label>
          <p className="perfil-info-value">{perfil.escuela?.nombre || 'No asignada'}</p>
        </div>

        <div className="perfil-info-item">
          <label className="perfil-info-label">
            <Briefcase className="perfil-info-icon" />
            Tipo de contrato
          </label>
          <p className="perfil-info-value">{perfil.tipoContrato}</p>
        </div>

        <div className="perfil-info-item">
          <label className="perfil-info-label">Especialidad</label>
          <p className="perfil-info-value">{perfil.especialidad || 'No especificada'}</p>
        </div>

        <div className="perfil-info-item">
          <label className="perfil-info-label">
            <Calendar className="perfil-info-icon" />
            Fecha de incorporación
          </label>
          <p className="perfil-info-value">{formatFecha(perfil.fechaIncorporacion)}</p>
        </div>

        {perfil.escuela?.facultad && (
          <div className="perfil-info-item">
            <label className="perfil-info-label">Facultad</label>
            <p className="perfil-info-value">{perfil.escuela.facultad.nombre}</p>
          </div>
        )}
      </div>
    </div>
  );
};