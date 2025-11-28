import { getLoginApiUrl } from './apiConfig';

const parseUserId = (userId: string | number | null | undefined): number | null => {
  if (typeof userId === 'number' && Number.isFinite(userId)) {
    return userId;
  }

  if (typeof userId === 'string') {
    const trimmed = userId.trim();
    if (/^\d+$/.test(trimmed)) {
      const parsed = Number.parseInt(trimmed, 10);
      return Number.isNaN(parsed) ? null : parsed;
    }
  }

  return null;
};

const buildPayload = (userId: number, token?: string) =>
  JSON.stringify(
    token && token.trim().length > 0
      ? { usuarioId: userId, token: token.trim() }
      : { usuarioId: userId }
  );
const getLogoutUrl = () => getLoginApiUrl('/api/auth/logout');

export const requestBackendLogout = async (
  userId: string | number | null | undefined,
  token?: string | null
): Promise<void> => {
  const numericId = parseUserId(userId);
  if (numericId === null) {
    return;
  }

  try {
    await fetch(getLogoutUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
     body: buildPayload(numericId, token ?? undefined)
    });
  } catch (error) {
    console.error('No se pudo cerrar la sesión en el backend:', error);
  }
};

export const sendLogoutBeacon = (
  userId: string | number | null | undefined,
  token?: string | null
): void => {
  const numericId = parseUserId(userId);
  if (numericId === null) {
    return;
  }
    if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') {
      return;
    }

    try {
        const blob = new Blob([buildPayload(numericId, token ?? undefined)], { type: 'application/json' });
      navigator.sendBeacon(getLogoutUrl(), blob);
    } catch (error) {
      console.error('No se pudo enviar el beacon de cierre de sesión:', error);
    }
  };