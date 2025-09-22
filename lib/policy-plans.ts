// Configuración de planes de seguros con coberturas predefinidas
// Basado en la información de la página pública

export interface PolicyPlan {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    period: string;
    coverages: PolicyCoverage[];
}

export interface PolicyCoverage {
    name: string;
    description: string;
    included: boolean;
    maxAmount?: number;
    percentage?: number;
}

export const POLICY_PLANS: Record<string, PolicyPlan> = {
    basica: {
        id: "basica",
        name: "Básica",
        description: "Protección esencial para conductores responsables",
        basePrice: 299,
        period: "/mes",
        coverages: [
            {
                name: "Responsabilidad Civil Obligatoria",
                description: "Cobertura obligatoria por daños a terceros",
                included: true,
            },
            {
                name: "Asistencia Vial Básica",
                description: "Servicios básicos de asistencia en carretera",
                included: true,
            },
            {
                name: "Gastos Médicos",
                description: "Cobertura de gastos médicos por accidente",
                included: true,
                maxAmount: 50000,
            },
            {
                name: "Defensa Jurídica",
                description: "Asesoría y defensa legal en caso de accidente",
                included: true,
            },
            {
                name: "Robo Total",
                description: "Cobertura por robo total del vehículo",
                included: false,
            },
            {
                name: "Daños Propios",
                description: "Cobertura por daños al vehículo asegurado",
                included: false,
            },
            {
                name: "Fenómenos Naturales",
                description:
                    "Cobertura por daños causados por fenómenos naturales",
                included: false,
            },
            {
                name: "Asistencia 24/7",
                description: "Asistencia las 24 horas los 7 días de la semana",
                included: false,
            },
        ],
    },
    limitada: {
        id: "limitada",
        name: "Limitada",
        description: "La protección ideal para la mayoría de conductores",
        basePrice: 599,
        period: "/mes",
        coverages: [
            {
                name: "Responsabilidad Civil Obligatoria",
                description: "Cobertura obligatoria por daños a terceros",
                included: true,
            },
            {
                name: "Asistencia Vial Completa",
                description: "Servicios completos de asistencia en carretera",
                included: true,
            },
            {
                name: "Gastos Médicos",
                description: "Cobertura de gastos médicos por accidente",
                included: true,
                maxAmount: 100000,
            },
            {
                name: "Defensa Jurídica",
                description: "Asesoría y defensa legal en caso de accidente",
                included: true,
            },
            {
                name: "Robo Total",
                description: "Cobertura por robo total del vehículo",
                included: true,
            },
            {
                name: "Daños Propios",
                description: "Cobertura por daños al vehículo asegurado",
                included: true,
                percentage: 80,
            },
            {
                name: "Fenómenos Naturales",
                description:
                    "Cobertura por daños causados por fenómenos naturales",
                included: true,
            },
            {
                name: "Asistencia 24/7",
                description: "Asistencia las 24 horas los 7 días de la semana",
                included: false,
            },
        ],
    },
    amplia: {
        id: "amplia",
        name: "Amplia",
        description: "Máxima protección sin límites ni restricciones",
        basePrice: 899,
        period: "/mes",
        coverages: [
            {
                name: "Responsabilidad Civil Obligatoria",
                description: "Cobertura obligatoria por daños a terceros",
                included: true,
            },
            {
                name: "Asistencia Vial Premium",
                description: "Servicios premium de asistencia en carretera",
                included: true,
            },
            {
                name: "Gastos Médicos",
                description: "Cobertura de gastos médicos por accidente",
                included: true,
                maxAmount: 200000,
            },
            {
                name: "Defensa Jurídica",
                description: "Asesoría y defensa legal en caso de accidente",
                included: true,
            },
            {
                name: "Robo Total",
                description: "Cobertura por robo total del vehículo",
                included: true,
            },
            {
                name: "Daños Propios",
                description: "Cobertura por daños al vehículo asegurado",
                included: true,
                percentage: 100,
            },
            {
                name: "Fenómenos Naturales",
                description:
                    "Cobertura por daños causados por fenómenos naturales",
                included: true,
            },
            {
                name: "Asistencia 24/7",
                description: "Asistencia las 24 horas los 7 días de la semana",
                included: true,
            },
        ],
    },
};

// Función para obtener las coberturas de un plan específico
export function getPlanCoverages(planType: string): PolicyCoverage[] {
    const plan = POLICY_PLANS[planType];
    return plan ? plan.coverages : [];
}

// Función para obtener información completa del plan
export function getPlanInfo(planType: string): PolicyPlan | null {
    return POLICY_PLANS[planType] || null;
}

// Función para calcular precio base según el plan
export function calculateBasePrice(planType: string): number {
    const plan = POLICY_PLANS[planType];
    return plan ? plan.basePrice : 0;
}
