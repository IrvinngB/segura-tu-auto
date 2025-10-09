import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";

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
}

export function useCustomerData() {
    const { userProfile } = useAuth();
    const [customerData, setCustomerData] = useState<CustomerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    const fetchCustomerData = useCallback(async () => {
        console.log(
            "🔄 fetchCustomerData iniciado - userProfile:",
            userProfile
        );

        if (!userProfile?.id) {
            console.log("❌ No hay userProfile.id");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            console.log(
                "📊 Iniciando fetch para userProfile.id:",
                userProfile.id
            );

            // Cache simple para evitar consultas repetidas
            const cacheKey = `customer_data_${userProfile.id}`;
            const cached = sessionStorage.getItem(cacheKey);
            console.log("🗄️ Cache check:", { cacheKey, cached: !!cached });

            if (cached) {
                const parsed = JSON.parse(cached);
                // Cache válido por 10 minutos (increased from 5)
                if (Date.now() - parsed.timestamp < 10 * 60 * 1000) {
                    console.log("✅ Usando datos del cache");
                    setCustomerData(parsed.data);
                    setLoading(false);
                    return;
                }
                console.log("⏰ Cache expirado, haciendo nueva consulta");
            }

            const { data: customer, error: customerError } = await supabase
                .from("customers")
                .select(
                    `
          id,
          user_id,
          user:users!customers_user_id_fkey(
            first_name,
            last_name,
            email,
            role,
            birth_date,
            license_year,
            has_accidents,
            has_claims
          )
        `
                )
                .eq("user_id", userProfile.id)
                .single();

            console.log("🔍 Resultado de consulta customer:", {
                customer,
                customerError,
                userProfileId: userProfile.id,
            });

            if (customerError) {
                console.error(
                    "❌ Error fetching customer data:",
                    customerError
                );
                setError("Error al cargar los datos del cliente");
                return;
            }

            if (customer) {
                console.log("👤 Datos de customer encontrados:", customer);
                console.log("👤 Datos de user:", customer.user);

                const customerInfo = {
                    id: customer.id,
                    user_id: customer.user_id,
                    first_name: customer.user[0].first_name,
                    last_name: customer.user[0].last_name,
                    email: customer.user[0].email,
                    role: customer.user[0].role,
                    birth_date: customer.user[0].birth_date,
                    license_year: customer.user[0].license_year,
                    has_accidents: customer.user[0].has_accidents,
                    has_claims: customer.user[0].has_claims,
                };

                console.log("✅ CustomerInfo creado:", customerInfo);
                setCustomerData(customerInfo);

                // Guardar en cache
                sessionStorage.setItem(
                    cacheKey,
                    JSON.stringify({
                        data: customerInfo,
                        timestamp: Date.now(),
                    })
                );
            } else {
                console.log("❌ No se encontró customer");
                setError("No se encontró el perfil de cliente");
            }
        } catch (error) {
            console.error("💥 Error inesperado fetching customer data:", error);
            setError("Error inesperado al cargar los datos del cliente");
        } finally {
            console.log("🏁 fetchCustomerData finalizado");
            setLoading(false);
        }
    }, [userProfile?.id]); // Removido supabase de las dependencias

    useEffect(() => {
        fetchCustomerData();
    }, [fetchCustomerData]);

    const refreshCustomerData = useCallback(() => {
        // Limpiar cache y recargar
        if (userProfile?.id) {
            const cacheKey = `customer_data_${userProfile.id}`;
            sessionStorage.removeItem(cacheKey);
        }
        fetchCustomerData();
    }, [fetchCustomerData, userProfile?.id]);

    return {
        customerData,
        loading,
        error,
        refreshCustomerData,
    };
}
