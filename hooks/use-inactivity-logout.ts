/**
 * Hook para detectar inactividad del usuario y cerrar sesión automáticamente
 * Se activa después de 10 minutos sin interacción
 */

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface UseInactivityLogoutOptions {
  /**
   * Tiempo de inactividad en milisegundos antes de cerrar sesión
   * Por defecto: 10 minutos (600000 ms)
   */
  timeout?: number;
  /**
   * Si está habilitado el auto-logout
   * Por defecto: true
   */
  enabled?: boolean;
  /**
   * Callback que se ejecuta cuando se detecta inactividad
   */
  onInactivity?: () => void;
  /**
   * Callback que se ejecuta después del logout
   */
  onLogout?: () => void;
}

export function useInactivityLogout(options: UseInactivityLogoutOptions = {}) {
  const {
    timeout = 10 * 60 * 1000, // 10 minutos por defecto
    enabled = true,
    onInactivity,
    onLogout,
  } = options;

  const router = useRouter();
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      console.log('🔒 Auto-logout por inactividad iniciado');
      
      if (onInactivity) {
        onInactivity();
      }

      // Cerrar sesión en Supabase
      await supabase.auth.signOut();

      // Limpiar almacenamiento local
      sessionStorage.clear();
      localStorage.clear();

      console.log('✅ Sesión cerrada por inactividad');

      if (onLogout) {
        onLogout();
      }

      // Redirigir al login
      router.push('/login?reason=inactivity');
    } catch (error) {
      console.error('❌ Error al cerrar sesión por inactividad:', error);
    }
  };

  const resetTimer = () => {
    if (!enabled) return;

    // Limpiar el timeout anterior
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    // Configurar nuevo timeout
    timeoutIdRef.current = setTimeout(() => {
      console.log('⏰ Tiempo de inactividad alcanzado');
      handleLogout();
    }, timeout);
  };

  useEffect(() => {
    if (!enabled) return;

    // Eventos que indican actividad del usuario
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Agregar listeners para todos los eventos
    events.forEach((event) => {
      document.addEventListener(event, resetTimer, true);
    });

    // Iniciar el timer
    resetTimer();

    console.log('🔐 Sistema de auto-logout por inactividad activado (10 minutos)');

    // Cleanup
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }

      events.forEach((event) => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [enabled, timeout]);

  return {
    resetTimer,
  };
}
