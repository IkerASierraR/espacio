import type { FC } from 'react';
import { ArrowRight, GraduationCap, Shield } from 'lucide-react';
import type { LoginType } from '../types';

interface TypeSelectionProps {
  onSelectType: (type: LoginType) => void;
}

export const TypeSelection: FC<TypeSelectionProps> = ({ onSelectType }) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <button
          type="button"
          className="login-btn login-btn-academic"
          onClick={() => onSelectType('academic')}
        >
          <GraduationCap className="login-btn-icon" />
          <span>Acceso Académico</span>
          <ArrowRight className="login-btn-arrow" />
        </button>
        <button
          type="button"
          className="login-btn login-btn-admin"
          onClick={() => onSelectType('administrative')}
        >
          <Shield className="login-btn-icon" />
          <span>Acceso Administrativo</span>
          <ArrowRight className="login-btn-arrow" />
        </button>
      </div>
      <div className="login-test-credentials">
        <p className="space-y-1">
          <strong>¿Necesitas ayuda?</strong>
          <br />
          Selecciona el tipo de acceso para continuar con tu autenticación.
        </p>
      </div>
    </div>
  );
};