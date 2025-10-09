-- Crear tabla de métodos de pago
CREATE TABLE public.payment_methods (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    customer_id uuid NOT NULL,
    type character varying NOT NULL CHECK (type::text = ANY (ARRAY['credit_card'::character varying, 'debit_card'::character varying, 'bank_account'::character varying, 'digital_wallet'::character varying]::text[])),
    name character varying NOT NULL,
    last_four character varying NOT NULL,
    expiry_date character varying,
    brand character varying,
    bank_name character varying,
    is_primary boolean DEFAULT false,
    is_active boolean DEFAULT true,
    encrypted_data jsonb, -- Para almacenar datos encriptados si es necesario
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payment_methods_pkey PRIMARY KEY (id),
    CONSTRAINT payment_methods_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE
);

-- Crear índice para búsquedas rápidas por customer_id
CREATE INDEX idx_payment_methods_customer_id ON public.payment_methods(customer_id);

-- Crear función para asegurar que solo haya un método de pago primario por cliente
CREATE OR REPLACE FUNCTION ensure_single_primary_payment_method()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el nuevo método se está marcando como primario
    IF NEW.is_primary = true THEN
        -- Desmarcar todos los otros métodos de pago del mismo cliente como no primarios
        UPDATE public.payment_methods 
        SET is_primary = false, updated_at = CURRENT_TIMESTAMP
        WHERE customer_id = NEW.customer_id AND id != NEW.id AND is_primary = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para la función
CREATE TRIGGER trigger_ensure_single_primary_payment_method
    BEFORE INSERT OR UPDATE ON public.payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_primary_payment_method();

-- Insertar algunos datos de ejemplo para testing (opcional)
-- Estos datos se pueden eliminar una vez que los usuarios reales agreguen sus métodos
/*
INSERT INTO public.payment_methods (customer_id, type, name, last_four, expiry_date, brand, is_primary) VALUES 
    ('customer-uuid-1', 'credit_card', 'Visa **** 4532', '4532', '12/27', 'Visa', true),
    ('customer-uuid-1', 'debit_card', 'Mastercard **** 8945', '8945', '08/26', 'Mastercard', false),
    ('customer-uuid-2', 'bank_account', 'Bancolombia **** 1234', '1234', null, 'Bancolombia', true);
*/