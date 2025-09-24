// Función de emergencia para actualizar pólizas vencidas
// Usa esta función si las funciones automáticas no funcionan
import { createClient } from "@/lib/supabase/client";

export async function forceUpdateExpiredPolicies() {
    const supabase = createClient();

    try {
        console.log("🔍 Verificando pólizas vencidas...");

        // Primero ver qué pólizas están vencidas
        const { data: expiredPolicies, error: selectError } = await supabase
            .from("policies")
            .select("policy_number, status, end_date")
            .eq("status", "active")
            .lt("end_date", new Date().toISOString().split("T")[0]);

        if (selectError) {
            console.error("Error al consultar pólizas vencidas:", selectError);
            return { success: false, error: selectError.message };
        }

        console.log(
            `📊 Encontradas ${expiredPolicies?.length || 0} pólizas vencidas:`,
            expiredPolicies
        );

        if (!expiredPolicies || expiredPolicies.length === 0) {
            console.log("✅ No hay pólizas vencidas para actualizar");
            return {
                success: true,
                updatedCount: 0,
                message: "No hay pólizas vencidas",
            };
        }

        // Actualizar las pólizas vencidas
        const { data: updateResult, error: updateError } = await supabase
            .from("policies")
            .update({
                status: "expired",
                updated_at: new Date().toISOString(),
            })
            .eq("status", "active")
            .lt("end_date", new Date().toISOString().split("T")[0])
            .select("policy_number, status, end_date");

        if (updateError) {
            console.error("❌ Error al actualizar pólizas:", updateError);
            return { success: false, error: updateError.message };
        }

        console.log("✅ Pólizas actualizadas exitosamente:", updateResult);

        return {
            success: true,
            updatedCount: updateResult?.length || 0,
            updatedPolicies: updateResult,
            message: `Se actualizaron ${
                updateResult?.length || 0
            } pólizas vencidas`,
        };
    } catch (error) {
        console.error("💥 Error inesperado:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Error desconocido",
        };
    }
}

// Función para verificar el estado de las pólizas
export async function checkPolicyStatuses() {
    const supabase = createClient();

    try {
        const { data: allPolicies, error } = await supabase
            .from("policies")
            .select("policy_number, status, start_date, end_date")
            .order("end_date", { ascending: false });

        if (error) {
            console.error("Error al obtener pólizas:", error);
            return [];
        }

        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];

        const analysis = allPolicies?.map((policy) => ({
            ...policy,
            shouldBeExpired: policy.end_date < todayStr,
            isCorrectStatus:
                policy.end_date < todayStr
                    ? policy.status === "expired"
                    : policy.status !== "expired",
            daysFromExpiry: Math.ceil(
                (new Date(policy.end_date).getTime() - today.getTime()) /
                    (1000 * 60 * 60 * 24)
            ),
        }));

        console.log("📊 Análisis de pólizas:", analysis);

        return analysis || [];
    } catch (error) {
        console.error("Error en análisis de pólizas:", error);
        return [];
    }
}
