// Script para insertar una póliza vencida de prueba
// Ejecutar en la consola del navegador después de estar logueado

async function insertExpiredPolicyTest() {
  const { createClient } = window.supabase || {};
  
  if (!createClient) {
    console.error('Supabase no está disponible');
    return;
  }
  
  const supabase = createClient();
  
  try {
    console.log('🔍 Iniciando inserción de póliza vencida de prueba...');
    
    // Verificar usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ Usuario no autenticado');
      return;
    }
    
    console.log(`✅ Usuario autenticado: ${user.email}`);
    
    // Buscar el customer actual
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', user.id)
      .single();
      
    if (customerError || !customer) {
      console.error('❌ Error buscando customer:', customerError);
      return;
    }
    
    console.log(`✅ Customer encontrado: ${customer.id}`);
    
    // Buscar un vehículo del customer
    let { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('customer_id', customer.id)
      .limit(1)
      .single();
    
    // Si no hay vehículo, crear uno
    if (vehicleError || !vehicle) {
      console.log('🚗 Creando vehículo de prueba...');
      const { data: newVehicle, error: newVehicleError } = await supabase
        .from('vehicles')
        .insert({
          customer_id: customer.id,
          make: 'Toyota',
          model: 'Corolla',
          year: 2019,
          vin: 'VIN' + Date.now(),
          license_plate: 'EXP-' + Math.floor(Math.random() * 1000),
          color: 'Blanco',
          engine_size: '1.8L',
          fuel_type: 'gasoline',
          transmission_type: 'automatic',
          seating_capacity: 5,
          market_value: 42000000,
          usage_type: 'personal',
          mileage: 65000
        })
        .select()
        .single();
        
      if (newVehicleError) {
        console.error('❌ Error creando vehículo:', newVehicleError);
        return;
      }
      
      vehicle = newVehicle;
      console.log(`✅ Vehículo creado: ${vehicle.id}`);
    } else {
      console.log(`✅ Vehículo encontrado: ${vehicle.id}`);
    }
    
    // Crear póliza vencida
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 20); // Vencida hace 20 días
    
    const startDate = new Date(expiredDate);
    startDate.setFullYear(startDate.getFullYear() - 1); // Inició hace 1 año y 20 días
    
    console.log('📅 Creando póliza vencida...');
    
    const { data: expiredPolicy, error: policyError } = await supabase
      .from('policies')
      .insert({
        policy_number: 'POL-EXP-' + Date.now(),
        customer_id: customer.id,
        vehicle_id: vehicle.id,
        policy_type: 'amplia',
        status: 'expired',
        start_date: startDate.toISOString().split('T')[0],
        end_date: expiredDate.toISOString().split('T')[0],
        premium_amount: 980000,
        total_coverage_limit: 120000000,
        payment_frequency: 'monthly',
        auto_renewal: false
      })
      .select()
      .single();
      
    if (policyError) {
      console.error('❌ Error creando póliza:', policyError);
      return;
    }
    
    console.log(`✅ Póliza vencida creada: ${expiredPolicy.policy_number}`);
    
    // Crear coberturas para la póliza
    const { data: coverageTypes } = await supabase
      .from('coverage_types')
      .select('id, name, base_premium')
      .limit(4);
    
    if (coverageTypes && coverageTypes.length > 0) {
      console.log('🛡️ Agregando coberturas...');
      
      const coverages = coverageTypes.map(ct => ({
        policy_id: expiredPolicy.id,
        coverage_type_id: ct.id,
        coverage_limit: ct.name.includes('Responsabilidad') ? 50000000 : 40000000,
        deductible: ct.name.includes('Responsabilidad') ? 0 : 600000,
        premium: ct.base_premium
      }));
      
      const { error: coverageError } = await supabase
        .from('policy_coverages')
        .insert(coverages);
        
      if (coverageError) {
        console.warn('⚠️ Error agregando coberturas:', coverageError);
      } else {
        console.log(`✅ ${coverages.length} coberturas agregadas`);
      }
    }
    
    console.log('🎉 ¡Póliza vencida de prueba creada exitosamente!');
    console.log('📋 Detalles:');
    console.log(`   - Número: ${expiredPolicy.policy_number}`);
    console.log(`   - Vehículo: Toyota Corolla 2019`);
    console.log(`   - Vencimiento: ${expiredDate.toLocaleDateString()}`);
    console.log(`   - Prima: $${expiredPolicy.premium_amount.toLocaleString()}`);
    console.log('');
    console.log('🔄 Refresca la página para ver la póliza en el dashboard');
    
    return expiredPolicy;
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar la función
insertExpiredPolicyTest();