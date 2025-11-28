import type { FC } from 'react';
import type { LoginType } from '../types';

interface LoginHeaderProps {
  selectedType: LoginType | null;
  subtitleText: string;
}

export const LoginHeader: FC<LoginHeaderProps> = ({ selectedType, subtitleText }) => {
  return (
    <div className="login-header">
      <div
        className={`login-logo ${
          selectedType === 'administrative' ? 'login-logo-gray' : 'login-logo-blue'
        }`}
      >
        {selectedType === 'administrative' ? (
          <img 
            src="/upt_transparent_icon.png" 
            alt="admin logo" 
            className="login-logo-icon" 
            style={{ width: '50px', height: '60px' }}
          />
        ) : (
          <img 
            src="/upt_transparent_icon.png" 
            alt="user logo" 
            className="login-logo-icon" 
            style={{ width: '50px', height: '60px' }}
          />
        )}
      </div>
      <h1
        className={`login-title ${
          selectedType === 'administrative' ? 'login-title-gray' : ''
        }`}
      >
        IntegraUPT
      </h1>
      <p
        className={`login-subtitle ${
          selectedType === 'administrative' ? 'login-subtitle-gray' : ''
        }`}
      >
        {subtitleText}
      </p>
      <p className="login-description">
        Utiliza tus credenciales institucionales para ingresar.
      </p>
    </div>
  );
};