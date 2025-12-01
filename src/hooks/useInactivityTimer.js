import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { setLastActive } from '../utils/SessionManager';
import securityConfig from '../config/securityConfig';

export default function useInactivityTimer(onTimeout) {
  const delay = securityConfig.INACTIVITY_LOCK_MS;

  const timeoutRef = useRef(null);

  //  RESET du timer
  const reset = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(onTimeout, delay);
    setLastActive(); // met à jour l'activité backend/session
  };

  useEffect(() => {
    //  Lancer le timer au montage
    reset();

    //  Quand l'app redevient active
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        reset();
      }
    });

    //  On expose reset globalement pour App.js
    globalThis.resetInactivity = reset;

    //  Nettoyage
    return () => {
      clearTimeout(timeoutRef.current);
      appStateSub.remove();
      globalThis.resetInactivity = null;
    };
  }, []);

  return { reset };
}
