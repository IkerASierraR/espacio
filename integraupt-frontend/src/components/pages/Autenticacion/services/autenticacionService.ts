import { getLoginApiUrl } from '../../../../utils/apiConfig';
import type { LoginType, BackendLoginResponse } from '../types';

export const autenticacionService = {
  async login(
    identifier: string, 
    password: string, 
    tipoLogin: LoginType
  ): Promise<BackendLoginResponse> {
    const response = await fetch(getLoginApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codigoOEmail: identifier,
        password,
        tipoLogin
      })
    });

    return await response.json();
  }
};