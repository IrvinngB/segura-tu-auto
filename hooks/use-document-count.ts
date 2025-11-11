'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useDocumentCount() {
  const [documentCount, setDocumentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  console.log('🔥 useDocumentCount hook ejecutándose, documentCount:', documentCount);

  useEffect(() => {
    fetchDocumentCount();

    // Suscripción en tiempo real
    const channel = supabase
      .channel('document-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'claim_customer_documents',
        },
        () => {
          console.log('📄 Cambio detectado en documentos, actualizando contador...');
          fetchDocumentCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDocumentCount = async () => {
    try {
      setLoading(true);

      // Contar documentos pendientes de aprobación
      const { data: documentsData, error } = await supabase
        .from('claim_customer_documents')
        .select('id')
        .eq('status', 'pending');

      console.log('� Documents data:', documentsData);
      console.log('� Documents error:', error);

      if (error) throw error;

      const count = documentsData?.length || 0;
      console.log(`📊 Documentos pendientes: ${count}`);
      
      setDocumentCount(count);
    } catch (error) {
      console.error('Error fetching document count:', error);
      setDocumentCount(0);
    } finally {
      setLoading(false);
    }
  };

  return { documentCount, loading };
}