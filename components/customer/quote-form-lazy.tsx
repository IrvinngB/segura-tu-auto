'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';

const QuoteForm = dynamic(() => import('./quote-form'), {
  loading: () => (
    <Card>
      <CardContent className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3">Cargando formulario de cotización...</span>
        </div>
      </CardContent>
    </Card>
  ),
});

export default QuoteForm;
