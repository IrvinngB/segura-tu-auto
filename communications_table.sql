-- Crear tabla communications si no existe
CREATE TABLE IF NOT EXISTS communications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id),
    agent_id UUID REFERENCES users(id),
    claim_id UUID REFERENCES claims(id) NOT NULL,
    communication_type VARCHAR(50) NOT NULL DEFAULT 'chat',
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    subject TEXT,
    content TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'sent',
    attachment_url TEXT,
    attachment_name TEXT,
    attachment_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_communications_claim_id ON communications(claim_id);
CREATE INDEX IF NOT EXISTS idx_communications_customer_id ON communications(customer_id);
CREATE INDEX IF NOT EXISTS idx_communications_agent_id ON communications(agent_id);
CREATE INDEX IF NOT EXISTS idx_communications_created_at ON communications(created_at);
CREATE INDEX IF NOT EXISTS idx_communications_direction ON communications(direction);

-- Crear bucket de Supabase Storage para archivos adjuntos
INSERT INTO storage.buckets (id, name, public)
VALUES ('claim-attachments', 'claim-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Política de seguridad para el bucket
CREATE POLICY IF NOT EXISTS "Users can upload claim attachments" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'claim-attachments' AND
    auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Users can view claim attachments" ON storage.objects
FOR SELECT USING (
    bucket_id = 'claim-attachments'
);

-- Agregar RLS para la tabla communications
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan ver sus propias comunicaciones
CREATE POLICY IF NOT EXISTS "Users can view own communications" ON communications
FOR SELECT USING (
    auth.uid() = customer_id OR 
    auth.uid() = agent_id OR
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'agent', 'adjuster')
    )
);

-- Política para crear comunicaciones
CREATE POLICY IF NOT EXISTS "Users can create communications" ON communications
FOR INSERT WITH CHECK (
    auth.uid() = customer_id OR 
    auth.uid() = agent_id OR
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'agent', 'adjuster')
    )
);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en communications
DROP TRIGGER IF EXISTS update_communications_updated_at ON communications;
CREATE TRIGGER update_communications_updated_at
    BEFORE UPDATE ON communications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();