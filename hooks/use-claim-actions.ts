import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function useClaimActions(claimId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const updateStatus = async (newStatus: string, reason?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/claims/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId, newStatus, reason })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar estado');
      }

      router.refresh();
      return { success: true, data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const approveClaim = async (approvedAmount: number, reason?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/claims/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId, approvedAmount, reason })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al aprobar reclamación');
      }

      router.refresh();
      return { success: true, data: data.data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    updateStatus,
    approveClaim,
    loading,
    error
  };
}
