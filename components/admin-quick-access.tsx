'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminQuickAccess() {
  return (
    <div className="fixed top-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg border">
      <h3 className="text-sm font-semibold mb-2">Acceso Directo Admin</h3>
      <div className="flex flex-col gap-2">
        <Link href="/admin/reports">
          <Button size="sm" className="w-full">
            📊 Reportes
          </Button>
        </Link>
        <Link href="/admin/audit">
          <Button size="sm" variant="outline" className="w-full">
            🔍 Auditoría
          </Button>
        </Link>
        <Link href="/admin/renewals">
          <Button size="sm" variant="outline" className="w-full">
            🔄 Renovaciones
          </Button>
        </Link>
        <Link href="/admin/documents">
          <Button size="sm" variant="outline" className="w-full">
            📁 Documentos
          </Button>
        </Link>
      </div>
    </div>
  );
}
