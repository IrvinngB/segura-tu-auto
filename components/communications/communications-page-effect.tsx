'use client';

import { useEffect } from 'react';

export function CommunicationsPageEffect() {
  useEffect(() => {
    console.log('📄 Página de comunicaciones cargada - NO marcando automáticamente como leído');
    console.log('🔄 El sistema de re-entrada del hook se encargará del marcado');
    
    // Este componente ya no hace nada - el hook maneja la lógica de re-entrada
  }, []);

  return null; // Este componente no renderiza nada visible
}