-- Script para insertar una póliza vencida para testing de renovación
-- Este script inserta datos de prueba para demostrar la funcionalidad de renovación

-- Primero verificamos si existe el usuario y cliente de prueba
DO $$
DECLARE
    test_user_id UUID;
    test_customer_id UUID;
    test_vehicle_id UUID;
    test_policy_id UUID;
    expired_date DATE;
BEGIN
    -- Fecha de vencimiento: hace 15 días
    expired_date := CURRENT_DATE - INTERVAL '15 days';
    
    -- Buscar o crear usuario de prueba
    SELECT id INTO test_user_id 
    FROM users 
    WHERE email = 'cliente.test@example.com';
    
    IF test_user_id IS NULL THEN
        INSERT INTO users (
            email, 
            first_name, 
            last_name, 
            phone, 
            role, 
            is_active
        ) VALUES (
            'cliente.test@example.com',
            'Cliente',
            'Prueba',
            '+57 300 123 4567',
            'customer',
            true
        ) RETURNING id INTO test_user_id;
        
        RAISE NOTICE 'Usuario de prueba creado: %', test_user_id;
    ELSE
        RAISE NOTICE 'Usuario de prueba existente: %', test_user_id;
    END IF;
    
    -- Buscar o crear cliente
    SELECT id INTO test_customer_id 
    FROM customers 
    WHERE user_id = test_user_id;
    
    IF test_customer_id IS NULL THEN
        INSERT INTO customers (
            user_id,
            date_of_birth,
            gender,
            address,
            city,
            state,
            postal_code,
            country,
            license_number,
            license_expiry,
            driving_experience_years,
            marital_status,
            occupation,
            annual_income,
            risk_score
        ) VALUES (
            test_user_id,
            '1985-06-15',
            'M',
            'Calle 123 #45-67',
            'Bogotá',
            'Cundinamarca',
            '110111',
            'Colombia',
            'LIC123456789',
            '2028-06-15',
            15,
            'married',
            'Ingeniero',
            60000000,
            75
        ) RETURNING id INTO test_customer_id;
        
        RAISE NOTICE 'Cliente de prueba creado: %', test_customer_id;
    ELSE
        RAISE NOTICE 'Cliente de prueba existente: %', test_customer_id;
    END IF;
    
    -- Buscar o crear vehículo
    SELECT id INTO test_vehicle_id 
    FROM vehicles 
    WHERE customer_id = test_customer_id;
    
    IF test_vehicle_id IS NULL THEN
        INSERT INTO vehicles (
            customer_id,
            make,
            model,
            year,
            vin,
            license_plate,
            color,
            engine_size,
            fuel_type,
            transmission_type,
            seating_capacity,
            market_value,
            usage_type,
            mileage
        ) VALUES (
            test_customer_id,
            'Toyota',
            'Corolla',
            2020,
            'VIN1234567890TEST',
            'ABC-123',
            'Blanco',
            '1.8L',
            'gasoline',
            'automatic',
            5,
            45000000,
            'personal',
            45000
        ) RETURNING id INTO test_vehicle_id;
        
        RAISE NOTICE 'Vehículo de prueba creado: %', test_vehicle_id;
    ELSE
        RAISE NOTICE 'Vehículo de prueba existente: %', test_vehicle_id;
    END IF;
    
    -- Insertar póliza vencida
    INSERT INTO policies (
        policy_number,
        customer_id,
        vehicle_id,
        policy_type,
        status,
        start_date,
        end_date,
        premium_amount,
        total_coverage_limit,
        payment_frequency,
        auto_renewal,
        discount_applied,
        risk_assessment
    ) VALUES (
        'POL-EXPIRED-' || EXTRACT(EPOCH FROM NOW())::TEXT,
        test_customer_id,
        test_vehicle_id,
        'amplia',
        'expired',
        expired_date - INTERVAL '365 days',
        expired_date,
        850000,
        150000000,
        'monthly',
        false,
        0,
        '{"risk_score": 75, "factors": ["good_driver", "safe_vehicle"]}'::jsonb
    ) RETURNING id INTO test_policy_id;
    
    RAISE NOTICE 'Póliza vencida creada: % (Número: POL-EXPIRED-%)', test_policy_id, EXTRACT(EPOCH FROM NOW())::TEXT;
    
    -- Insertar coberturas para la póliza
    INSERT INTO policy_coverages (policy_id, coverage_type_id, coverage_limit, deductible, premium)
    SELECT 
        test_policy_id,
        ct.id,
        CASE 
            WHEN ct.name LIKE '%Responsabilidad Civil%' THEN 50000000
            WHEN ct.name LIKE '%Daños Propios%' THEN 45000000
            WHEN ct.name LIKE '%Robo%' THEN 45000000
            ELSE 10000000
        END,
        CASE 
            WHEN ct.name LIKE '%Responsabilidad Civil%' THEN 0
            ELSE 500000
        END,
        ct.base_premium
    FROM coverage_types ct
    WHERE ct.name IN (
        'Responsabilidad Civil Extracontractual',
        'Daños Propios por Colisión',
        'Robo Total',
        'Asistencia Vial 24 Horas'
    )
    AND EXISTS (SELECT 1 FROM coverage_types LIMIT 1);
    
    -- Insertar algunos pagos para dar historial
    INSERT INTO payments (
        policy_id,
        customer_id,
        payment_type,
        amount,
        payment_method,
        payment_status,
        payment_date,
        due_date,
        reference_number
    ) VALUES 
    (
        test_policy_id,
        test_customer_id,
        'premium',
        850000,
        'credit_card',
        'completed',
        expired_date - INTERVAL '365 days',
        expired_date - INTERVAL '365 days',
        'PAY-' || EXTRACT(EPOCH FROM NOW())::TEXT || '-1'
    ),
    (
        test_policy_id,
        test_customer_id,
        'premium',
        850000,
        'credit_card',
        'completed',
        expired_date - INTERVAL '335 days',
        expired_date - INTERVAL '335 days',
        'PAY-' || EXTRACT(EPOCH FROM NOW())::TEXT || '-2'
    );
    
    RAISE NOTICE '✅ Póliza vencida y datos de prueba insertados exitosamente';
    RAISE NOTICE '📧 Email del usuario: cliente.test@example.com';
    RAISE NOTICE '🚗 Vehículo: Toyota Corolla 2020 (ABC-123)';
    RAISE NOTICE '📅 Fecha de vencimiento: %', expired_date;
    RAISE NOTICE '💰 Prima: $850.000 COP';
    
END $$;

-- Verificar la inserción
SELECT 
    p.policy_number,
    p.status,
    p.start_date,
    p.end_date,
    p.premium_amount,
    c.first_name || ' ' || c.last_name as customer_name,
    u.email,
    v.make || ' ' || v.model || ' ' || v.year as vehicle_info,
    v.license_plate,
    CASE 
        WHEN p.end_date < CURRENT_DATE THEN 'VENCIDA'
        WHEN p.end_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'POR VENCER'
        ELSE 'VIGENTE'
    END as renewal_status
FROM policies p
JOIN customers c ON p.customer_id = c.id
JOIN users u ON c.user_id = u.id
JOIN vehicles v ON p.vehicle_id = v.id
WHERE u.email = 'cliente.test@example.com'
ORDER BY p.created_at DESC
LIMIT 1;