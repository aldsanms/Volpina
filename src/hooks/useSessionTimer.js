import { useEffect } from 'react';
import { isSessionExpired } from '../utils/SessionManager';

export default function useSessionTimer(onExpired, delay = 5000) {
  useEffect(() => {
    const id = setInterval(async () => {
      const expired = await isSessionExpired();
      if (expired) onExpired();
    }, delay);

    return () => clearInterval(id);
  }, []);
}
