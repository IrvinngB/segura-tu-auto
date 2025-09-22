-- Script para actualizar los tipos de póliza en la base de datos
-- Cambiar de valores con mayúsculas a minúsculas

-- 1. Primero, agregar los nuevos valores permitidos a la restricción
ALTER TABLE policies 
DROP CONSTRAINT IF EXISTS policies_policy_type_check;

ALTER TABLE policies 
ADD CONSTRAINT policies_policy_type_check 
CHECK (policy_type IN ('basica', 'limitada', 'amplia', 'Básica', 'Limitada', 'Amplia', 'Premium'));

-- 2. Actualizar los registros existentes para usar los nuevos valores
UPDATE policies 
SET policy_type = 'basica' 
WHERE policy_type IN ('Básica', 'Básico', 'basic', 'liability');

UPDATE policies 
SET policy_type = 'limitada' 
WHERE policy_type IN ('Limitada', 'Completo', 'comprehensive');

UPDATE policies 
SET policy_type = 'amplia' 
WHERE policy_type IN ('Amplia', 'Premium');

-- 3. Finalmente, actualizar la restricción para solo permitir los nuevos valores
ALTER TABLE policies 
DROP CONSTRAINT policies_policy_type_check;

ALTER TABLE policies 
ADD CONSTRAINT policies_policy_type_check 
CHECK (policy_type IN ('basica', 'limitada', 'amplia'));

-- Verificar los cambios
SELECT policy_type, COUNT(*) as cantidad 
FROM policies 
GROUP BY policy_type;