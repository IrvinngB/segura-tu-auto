import { useState, useEffect } from "react";
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

export function useCustomerDataSimple() {
    const { userProfile } = useAuth();
    const [customerData, setCustomerData] = useState<CustomerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        async function fetchData() {
            console.log("🔄 SIMPLE: Starting fetch, userProfile:", userProfile);

            if (!userProfile?.id) {
                console.log("❌ SIMPLE: No userProfile.id");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Consulta simple sin relaciones
                const { data: customer, error: customerError } = await supabase
                    .from("customers")
                    .select("id, user_id")
                    .eq("user_id", userProfile.id)
                    .single();

                console.log("🔍 SIMPLE: Customer result:", {
                    customer,
                    customerError,
                });

                if (customerError) {
                    console.error("❌ SIMPLE: Customer error:", customerError);
                    setError("Error al cargar el cliente");
                    return;
                }

                if (!customer) {
                    console.log("❌ SIMPLE: No customer found");
                    setError("Cliente no encontrado");
                    return;
                }

                // Obtener datos adicionales del usuario
                const { data: userData, error: userError } = await supabase
                    .from("users")
                    .select(
                        "birth_date, license_year, has_accidents, has_claims"
                    )
                    .eq("id", userProfile.id)
                    .single();

                console.log("🔍 SIMPLE: User data result:", {
                    userData,
                    userError,
                });

                // Usar datos del userProfile y userData
                const customerInfo: CustomerData = {
                    id: customer.id,
                    user_id: customer.user_id,
                    first_name: userProfile.first_name || "",
                    last_name: userProfile.last_name || "",
                    email: userProfile.email || "",
                    role: userProfile.role || "",
                    birth_date: userData?.birth_date,
                    license_year: userData?.license_year,
                    has_accidents: userData?.has_accidents,
                    has_claims: userData?.has_claims,
                };

                console.log("✅ SIMPLE: Customer data set:", customerInfo);
                setCustomerData(customerInfo);
            } catch (error) {
                console.error("💥 SIMPLE: Unexpected error:", error);
                setError("Error inesperado");
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
