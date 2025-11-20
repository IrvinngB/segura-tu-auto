// Función ultra-simple para actualizar pólizas vencidas
// Esta función es más directa y debería funcionar siempre
import { createClient } from '@/lib/supabase/client';

export async function simpleUpdateExpiredPolicies() {
  const supabase = createClient();

  try {
    // Obtener fecha actual en formato YYYY-MM-DD
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    console.log('📅 Fecha actual:', todayString);

    // 1. Primero, obtener todas las pólizas activas
    const { data: activePolicies, error: fetchError } = await supabase
      .from('policies')
      .select('id, policy_number, status, end_date')
      .eq('status', 'active');

    if (fetchError) {
      console.error('❌ Error al obtener pólizas activas:', fetchError);
      return { success: false, error: fetchError.message };
    }

    console.log('📋 Pólizas activas encontradas:', activePolicies?.length || 0);

    if (!activePolicies || activePolicies.length === 0) {
      return {
        success: true,
        updatedCount: 0,
        message: 'No hay pólizas activas',
      };
    }

    // 2. Filtrar las que están vencidas (fecha de fin menor a hoy)
    const expiredPolicies = activePolicies.filter(policy => {
      const endDate = new Date(policy.end_date);
      const currentDate = new Date(todayString);
      const isExpired = endDate < currentDate;

      console.log(
        `🔍 Póliza ${policy.policy_number}: vence ${policy.end_date}, ¿vencida? ${isExpired}`
      );
      return isExpired;
    });

    console.log(`📊 Pólizas vencidas a actualizar: ${expiredPolicies.length}`);

    if (expiredPolicies.length === 0) {
      return {
        success: true,
        updatedCount: 0,
        message: 'No hay pólizas vencidas',
      };
    }

    // 3. Actualizar cada póliza vencida individualmente
    const updatePromises = expiredPolicies.map(async policy => {
      const { data, error } = await supabase
        .from('policies')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('id', policy.id)
        .select('policy_number, status, end_date');

      if (error) {
        console.error(`❌ Error actualizando póliza ${policy.policy_number}:`, error);
        return null;
      }

      console.log(`✅ Póliza ${policy.policy_number} actualizada a 'expired'`);
      return data?.[0] || null;
    });

    // 4. Esperar a que todas las actualizaciones terminen
    const results = await Promise.all(updatePromises);
    const successfulUpdates = results.filter(result => result !== null);

    return {
      success: true,
      updatedCount: successfulUpdates.length,
      updatedPolicies: successfulUpdates,
      message: `Se actualizaron ${successfulUpdates.length} pólizas a estado 'expired'`,
    };
  } catch (error) {
    console.error('💥 Error inesperado en actualización simple:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Función para mostrar el estado actual de todas las pólizas
export async function debugPolicyStatuses() {
  const supabase = createClient();

  try {
    const { data: policies, error } = await supabase
      .from('policies')
      .select('policy_number, status, start_date, end_date')
      .order('end_date', { ascending: true });

    if (error) {
      console.error('Error obteniendo pólizas:', error);
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    console.log('📊 DEBUG: Estado de todas las pólizas:');
    console.log('📅 Fecha actual:', today);
    console.log('─'.repeat(80));

    policies?.forEach(policy => {
      const isExpired = policy.end_date < today;
      const statusCorrect = isExpired ? policy.status === 'expired' : policy.status !== 'expired';

      console.log(`📋 ${policy.policy_number}:`);
      console.log(`   Estado: ${policy.status}`);
      console.log(`   Vence: ${policy.end_date}`);
      console.log(`   ¿Vencida?: ${isExpired ? 'SÍ' : 'NO'}`);
      console.log(`   ¿Estado correcto?: ${statusCorrect ? 'SÍ' : 'NO'}`);
      console.log('─'.repeat(40));
    });
  } catch (error) {
    console.error('Error en debug:', error);
  }
}

// Función para cambiar pólizas de draft a approved cuando el agente las aprueba
export async function activateDraftPolicies() {
  const supabase = createClient();

  try {
    console.log("🔄 Aprobando pólizas en estado 'draft'...");

    // Buscar pólizas en estado "draft" que tienen agent_id (fueron aprobadas)
    const { data: draftPolicies, error: fetchError } = await supabase
      .from('policies')
      .select('id, policy_number, status, agent_id, start_date, end_date')
      .eq('status', 'draft')
      .not('agent_id', 'is', null);

    if (fetchError) {
      console.error('❌ Error al obtener pólizas en draft:', fetchError);
      return { success: false, error: fetchError.message };
    }

    console.log('📋 Pólizas en draft aprobadas por agente:', draftPolicies?.length || 0);

    if (!draftPolicies || draftPolicies.length === 0) {
      return {
        success: true,
        updatedCount: 0,
        message: 'No hay pólizas en draft para aprobar',
      };
    }

    // Verificar que las pólizas no hayan expirado
    const today = new Date().toISOString().split('T')[0];
    const validPolicies = draftPolicies.filter(policy => {
      const endDate = policy.end_date;
      const isValid = endDate >= today;
      console.log(`🔍 Póliza ${policy.policy_number}: vence ${endDate}, ¿válida? ${isValid}`);
      return isValid;
    });

    console.log(`📊 Pólizas válidas para aprobar: ${validPolicies.length}`);

    if (validPolicies.length === 0) {
      return {
        success: true,
        updatedCount: 0,
        message: 'No hay pólizas válidas en draft para aprobar',
      };
    }

    // Actualizar cada póliza a estado "approved" (esperando pago)
    const updatePromises = validPolicies.map(async policy => {
      const { data, error } = await supabase
        .from('policies')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', policy.id)
        .select('policy_number, status');

      if (error) {
        console.error(`❌ Error aprobando póliza ${policy.policy_number}:`, error);
        return null;
      }

      console.log(`✅ Póliza ${policy.policy_number} aprobada (esperando pago)`);
      return data?.[0] || null;
    });

    const results = await Promise.all(updatePromises);
    const successfulUpdates = results.filter(result => result !== null);

    return {
      success: true,
      updatedCount: successfulUpdates.length,
      message: `${successfulUpdates.length} pólizas aprobadas (esperando pago)`,
      details: successfulUpdates,
    };
  } catch (error) {
    console.error('❌ Error aprobando pólizas en draft:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// Función para activar póliza cuando el cliente paga
export async function activatePolicyAfterPayment(policyId: string) {
  const supabase = createClient();

  try {
    console.log(`💳 Activando póliza ${policyId} después del pago...`);

    const { data, error } = await supabase
      .from('policies')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', policyId)
      .eq('status', 'approved')
      .select('policy_number, status');

    if (error) {
      console.error('❌ Error activando póliza:', error);
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        error: 'Póliza no encontrada o no está en estado approved',
      };
    }

    console.log(`✅ Póliza ${data[0].policy_number} activada exitosamente`);

    return {
      success: true,
      policy: data[0],
      message: 'Póliza activada correctamente',
    };
  } catch (error) {
    console.error('❌ Error activando póliza después del pago:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
