import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';

interface CustomerData {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  birth_date?: string;
  license_year?: number;
  has_accidents?: boolean;
  has_claims?: boolean;
  phone?: string;
  country?: string;
}

export function useCustomerDataSimple() {
  const { userProfile } = useAuth();
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      console.log('🔄 SIMPLE: Starting fetch, userProfile:', userProfile);

      if (!userProfile?.id) {
        console.log('❌ SIMPLE: No userProfile.id');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Consulta simple sin relaciones
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('id, user_id')
          .eq('user_id', userProfile.id)
          .single();

        console.log('🔍 SIMPLE: Customer result:', {
          customer,
          customerError,
        });

        if (customerError) {
          console.error('❌ SIMPLE: Customer error:', customerError);
          setError('Error al cargar el cliente');
          return;
        }

        if (!customer) {
          console.log('❌ SIMPLE: No customer found');
          setError('Cliente no encontrado');
          return;
        }

        // Obtener datos adicionales del customer (sin phone, ese está en users)
        const { data: customerDetails, error: customerDetailsError } = await supabase
          .from('customers')
          .select(
            'date_of_birth, driving_experience_years, has_accidents, has_claims, country'
          )
          .eq('id', customer.id)
          .single();

        console.log('🔍 SIMPLE: Customer details result:', {
          customerDetails,
          customerDetailsError,
        });

        console.log('📊 SIMPLE: Detailed customer data:', {
          'customers.date_of_birth': customerDetails?.date_of_birth,
          'customers.driving_experience_years': customerDetails?.driving_experience_years,
          'customers.has_accidents': customerDetails?.has_accidents,
          'customers.has_claims': customerDetails?.has_claims,
          'customers.country': customerDetails?.country,
          'users.phone': userProfile.phone,
        });

        console.log('🌍 SIMPLE: Country data:', {
          customerCountry: customerDetails?.country,
          finalCountry: customerDetails?.country || 'Panamá',
        });

        // Actualizar datos faltantes con valores por defecto
        const updates: any = {};

        // Asegurar que country siempre tenga un valor (Panamá por defecto)
        if (!customerDetails?.country || customerDetails.country === '' || customerDetails.country === null) {
          console.log("⚠️ SIMPLE: No country found, will update with 'Panamá'");
          updates.country = 'Panamá';
        }

        // NO actualizar automáticamente birth_date ni driving_experience_years
        // Dejar que el usuario los complete manualmente en su perfil

        // Aplicar actualizaciones si hay alguna
        if (Object.keys(updates).length > 0) {
          console.log('🔄 SIMPLE: Updating customer with:', updates);
          const { error: updateError } = await supabase
            .from('customers')
            .update(updates)
            .eq('id', customer.id);

          if (updateError) {
            console.error('❌ SIMPLE: Error updating customer:', updateError);
          } else {
            console.log('✅ SIMPLE: Customer updated successfully with:', updates);
            // Actualizar customerDetails con los nuevos valores
            if (customerDetails) {
              Object.assign(customerDetails, updates);
            }
          }
        }

        // Usar datos del userProfile y customerDetails
        const customerInfo: CustomerData = {
          id: customer.id,
          user_id: customer.user_id,
          first_name: userProfile.first_name || '',
          last_name: userProfile.last_name || '',
          email: userProfile.email || '',
          role: userProfile.role || '',
          birth_date: customerDetails?.date_of_birth,
          license_year: customerDetails?.driving_experience_years || undefined, // Solo usar si existe
          has_accidents: customerDetails?.has_accidents || false,
          has_claims: customerDetails?.has_claims || false,
          phone: userProfile.phone || '', // El teléfono SOLO está en users
          country: customerDetails?.country || 'Panamá', // Usar valor por defecto si no existe
        };

        console.log('✅ SIMPLE: Final customer data:', {
          ...customerInfo,
          calculatedAge: customerInfo.birth_date
            ? new Date().getFullYear() - new Date(customerInfo.birth_date).getFullYear()
            : 'No birth_date',
          experienceYears: customerInfo.license_year,
        });
        setCustomerData(customerInfo);
      } catch (error) {
        console.error('💥 SIMPLE: Unexpected error:', error);
        setError('Error inesperado');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userProfile?.id, supabase]);

  return {
    customerData,
    loading,
    error,
    refreshCustomerData: () => {},
  };
}
