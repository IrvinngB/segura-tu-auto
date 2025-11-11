'use client';

import { useState } from 'react';

export function useDocumentCount() {
  const [documentCount] = useState(7); // Valor fijo para prueba
  const [loading] = useState(false);

  console.log('🔥 useDocumentCount ejecutándose, count:', documentCount);

  return { documentCount, loading };
}