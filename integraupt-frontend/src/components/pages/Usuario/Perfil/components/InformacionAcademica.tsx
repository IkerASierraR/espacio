import React from 'react';
import { GraduationCap, Building, BookOpen } from 'lucide-react';
import type { PerfilEstudiante } from '../types';
import '../styles/Perfil.css';

interface InformacionAcademicaProps {
  perfil: PerfilEstudiante;
}

export const InformacionAcademica: React.FC<InformacionAcademicaProps> = ({ perfil }) => {
  return (
    <div className="perfil-section">
      <h3 className="perfil-section-title">
        <GraduationCap className="perfil-section-icon" />
        Información Académica
      </h3>
      
      <div className="perfil-grid">
        <div className="perfil-info-item">
          <label className="perfil-info-label">
            <BookOpen className="perfil-info-icon" />
            Código de estudiante
          </label>
          <p className="perfil-info-value perfil-codigo">{perfil.codigo}</p>
        </div>

        <div className="perfil-info-item">
          <label className="perfil-info-label">
            <Building className="perfil-info-icon" />
            Escuela
          </label>
          <p className="perfil-info-value">{perfil.escuela.nombre}</p>
        </div>

        <div className="perfil-info-item">
          <label className="perfil-info-label">Facultad</label>
          <p className="perfil-info-value">{perfil.escuela.facultad.nombre}</p>
        </div>

        <div className="perfil-info-item">
          <label className="perfil-info-label">Abreviatura facultad</label>
          <p className="perfil-info-value">{perfil.escuela.facultad.abreviatura}</p>
        </div>
      </div>
    </div>
  );
};