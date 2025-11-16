'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';

const AdminDashboard = dynamic(() => import('./page'), {
  loading: () => (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <span className="ml-4 text-lg">Cargando panel de administración...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  ),
  ssr: false,
});

export default AdminDashboard;
