import React from 'react';
import { User, Mail, Phone, IdCard, Calendar, Shield } from 'lucide-react';
import type { PerfilUsuario } from '../types';
import '../styles/Perfil.css';

interface InformacionPersonalProps {
  perfil: PerfilUsuario;
}

export const InformacionPersonal: React.FC<InformacionPersonalProps> = ({ perfil }) => {
  const formatFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Fecha no disponible';
    }
  };

  const getGeneroTexto = (genero: boolean | null) => {
    if (genero === null || genero === undefined) return 'No especificado';
    return genero ? 'Femenino' : 'Masculino';
  };

  const getEstadoTexto = (estado: number) => {
    return estado === 1 ? 'Activo' : 'Inactivo';
  };

  // Función segura para obtener el tipo de documento
  const getTipoDocumento = () => {
    if (!perfil.tipoDoc) return 'No disponible';
    return `${perfil.tipoDoc.abreviatura || ''} - ${perfil.numDoc || ''}`.trim();
  };

  return (
    <div className="perfil-section">
      <h3 className="perfil-section-title">
        <User className="perfil-section-icon" />
        Información Personal
      </h3>
      
      <div className="perfil-grid">
        <div className="perfil-info-item">
          <label className="perfil-info-label">Nombre completo</label>
          <p className="perfil-info-value">
            {perfil.nombre || 'No disponible'} {perfil.apellido || ''}
          </p>
        </div>

        <div className="perfil-info-item">
          <label className="perfil-info-label">
            <Mail className="perfil-info-icon" />
            Correo electrónico
          </label>
          <p className="perfil-info-value">{perfil.auth?.correoU || 'No disponible'}</p>
        </div>

        <div className="perfil-info-item">
          <label className="perfil-info-label">
            <IdCard className="perfil-info-icon" />
            Documento de identidad
          </label>
          <p className="perfil-info-value">{getTipoDocumento()}</p>
        </div>

        <div className="perfil-info-item">
          <label className="perfil-info-label">
            <Phone className="perfil-info-icon" />
            Celular
          </label>
          <p className="perfil-info-value">{perfil.celular || 'No registrado'}</p>
        </div>

        <div className="perfil-info-item">
          <label className="perfil-info-label">Género</label>
          <p className="perfil-info-value">{getGeneroTexto(perfil.genero)}</p>
        </div>

        <div className="perfil-info-item">
          <label className="perfil-info-label">
            <Shield className="perfil-info-icon" />
            Estado
          </label>
          <p className="perfil-info-value">
            <span className={`estado-badge estado-${getEstadoTexto(perfil.estado).toLowerCase()}`}>
              {getEstadoTexto(perfil.estado)}
            </span>
          </p>
        </div>

        <div className="perfil-info-item">
          <label className="perfil-info-label">
            <Calendar className="perfil-info-icon" />
            Fecha de registro
          </label>
          <p className="perfil-info-value">{formatFecha(perfil.fechaRegistro)}</p>
        </div>

        <div className="perfil-info-item">
          <label className="perfil-info-label">Rol</label>
          <p className="perfil-info-value">{perfil.rol?.nombre || 'No disponible'}</p>
        </div>
      </div>
    </div>
  );
};