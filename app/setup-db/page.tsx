'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SetupDatabasePage() {
  const openSupabaseSQL = () => {
    window.open(
      'https://sztuxibgvlwbykaopnqg.supabase.co/project/sztuxibgvlwbykaopnqg/sql',
      '_blank'
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Setup Database para Sistema de Evidencia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">📝 Instrucciones</h3>
            <p className="text-blue-700 text-sm">
              Para completar la configuración del sistema de evidencia, necesitas ejecutar algunos
              comandos SQL en Supabase.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Paso 1: Abrir SQL Editor de Supabase</h3>
            <Button onClick={openSupabaseSQL} className="mb-4">
              🚀 Abrir Supabase SQL Editor
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Paso 2: Ejecutar este SQL</h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
              <pre>{`-- 1. Crear tabla claim_documents
CREATE TABLE IF NOT EXISTS claim_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE NOT NULL,
    document_type VARCHAR(50) NOT NULL DEFAULT 'evidence',
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER,
    uploaded_by UUID REFERENCES users(id),
    upload_source VARCHAR(20) DEFAULT 'web',
    description TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear índices
CREATE INDEX IF NOT EXISTS idx_claim_documents_claim_id ON claim_documents(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_documents_type ON claim_documents(document_type);

-- 3. Habilitar Row Level Security
ALTER TABLE claim_documents ENABLE ROW LEVEL SECURITY;

-- 4. Crear bucket para evidencias (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('claim-evidence', 'claim-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Políticas RLS para claim_documents
CREATE POLICY IF NOT EXISTS "Users can view claim documents" ON claim_documents
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM claims
        WHERE claims.id = claim_documents.claim_id
        AND claims.customer_id IN (
            SELECT id FROM customers WHERE user_id = auth.uid()
        )
    ) OR
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'agent', 'adjuster')
    )
);

CREATE POLICY IF NOT EXISTS "Users can upload claim documents" ON claim_documents
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM claims
        WHERE claims.id = claim_documents.claim_id
        AND claims.customer_id IN (
            SELECT id FROM customers WHERE user_id = auth.uid()
        )
    ) OR
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'agent', 'adjuster')
    )
);

-- 6. Políticas para storage bucket
CREATE POLICY IF NOT EXISTS "Users can upload to claim-evidence" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'claim-evidence' AND
    auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Users can view claim-evidence" ON storage.objects
FOR SELECT USING (
    bucket_id = 'claim-evidence'
);`}</pre>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">✅ Una vez ejecutado el SQL</h3>
            <p className="text-green-700 text-sm">
              El sistema de evidencia estará listo para usar. Los clientes podrán subir fotos de
              daños, documentos y otros archivos directamente a sus reclamaciones.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">🔄 Sistema Completo</h3>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• ✅ Sistema de notificaciones (arreglado)</li>
              <li>• ✅ Sistema de comunicación con archivos</li>
              <li>• ✅ Sistema de evidencia para reclamaciones</li>
              <li>• ✅ Los archivos ahora van al lugar correcto</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
