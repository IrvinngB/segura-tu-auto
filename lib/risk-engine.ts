// Motor de evaluación de riesgos personalizado para SeguraTuAuto

export interface RiskFactors {
    driver: {
        age: number;
        experience: number;
        violations: number;
        accidents: number;
        gender?: string;
        maritalStatus?: string;
    };
    vehicle: {
        year: number;
        make: string;
        model: string;
        value: number;
        type: string;
        securityFeatures: string[];
        modifications?: string[];
    };
    location: {
        zone: string;
        crimeRate?: number;
        weatherRisk?: number;
    };
    usage: {
        purpose: string;
        annualKilometers: number;
        parkingType?: string;
        nightParking?: boolean;
    };
}

export interface RiskAssessmentResult {
    overallScore: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
    premiumMultiplier: number;
    basePremium: number;
    finalPremium: number;
    factors: RiskFactor[];
    recommendations: string[];
}

export interface RiskFactor {
    category: string;
    factor: string;
    weight: number;
    score: number;
    impact: number;
    description: string;
}

export class RiskAssessmentEngine {
    private readonly baseScore = 50;
    private readonly basePremium = 500;

    // Weight constants for different risk factors
    private readonly weights = {
        age: 0.15,
        experience: 0.12,
        violations: 0.18,
        accidents: 0.2,
        vehicleAge: 0.08,
        vehicleValue: 0.06,
        vehicleType: 0.1,
        zone: 0.15,
        usage: 0.12,
        annualKm: 0.08,
    };

    assessRisk(factors: RiskFactors): RiskAssessmentResult {
        const riskFactors: RiskFactor[] = [];
        let totalScore = this.baseScore;

        // Driver age assessment
        const ageScore = this.assessAge(factors.driver.age);
        riskFactors.push({
            category: "Conductor",
            factor: "Edad",
            weight: this.weights.age,
            score: ageScore,
            impact: ageScore * this.weights.age,
            description: this.getAgeDescription(factors.driver.age),
        });
        totalScore += ageScore * this.weights.age;

        // Driver experience assessment
        const experienceScore = this.assessExperience(
            factors.driver.experience
        );
        riskFactors.push({
            category: "Conductor",
            factor: "Experiencia",
            weight: this.weights.experience,
            score: experienceScore,
            impact: experienceScore * this.weights.experience,
            description: this.getExperienceDescription(
                factors.driver.experience
            ),
        });
        totalScore += experienceScore * this.weights.experience;

        // Traffic violations assessment
        const violationsScore = this.assessViolations(
            factors.driver.violations
        );
        riskFactors.push({
            category: "Historial",
            factor: "Infracciones",
            weight: this.weights.violations,
            score: violationsScore,
            impact: violationsScore * this.weights.violations,
            description: `${factors.driver.violations} infracciones en los últimos 3 años`,
        });
        totalScore += violationsScore * this.weights.violations;

        // Accidents assessment
        const accidentsScore = this.assessAccidents(factors.driver.accidents);
        riskFactors.push({
            category: "Historial",
            factor: "Accidentes",
            weight: this.weights.accidents,
            score: accidentsScore,
            impact: accidentsScore * this.weights.accidents,
            description: `${factors.driver.accidents} accidentes en los últimos 5 años`,
        });
        totalScore += accidentsScore * this.weights.accidents;

        // Vehicle assessments
        const vehicleAgeScore = this.assessVehicleAge(factors.vehicle.year);
        const vehicleTypeScore = this.assessVehicleType(factors.vehicle.type);
        const zoneScore = this.assessZone(factors.location.zone);
        const usageScore = this.assessUsage(factors.usage.purpose);
        const kmScore = this.assessAnnualKilometers(
            factors.usage.annualKilometers
        );

        // Add vehicle factors
        riskFactors.push(
            {
                category: "Vehículo",
                factor: "Antigüedad",
                weight: this.weights.vehicleAge,
                score: vehicleAgeScore,
                impact: vehicleAgeScore * this.weights.vehicleAge,
                description: this.getVehicleAgeDescription(
                    factors.vehicle.year
                ),
            },
            {
                category: "Vehículo",
                factor: "Tipo",
                weight: this.weights.vehicleType,
                score: vehicleTypeScore,
                impact: vehicleTypeScore * this.weights.vehicleType,
                description: `Vehículo tipo ${factors.vehicle.type}`,
            },
            {
                category: "Ubicación",
                factor: "Zona",
                weight: this.weights.zone,
                score: zoneScore,
                impact: zoneScore * this.weights.zone,
                description: this.getZoneDescription(factors.location.zone),
            },
            {
                category: "Uso",
                factor: "Propósito",
                weight: this.weights.usage,
                score: usageScore,
                impact: usageScore * this.weights.usage,
                description: `Uso ${factors.usage.purpose}`,
            },
            {
                category: "Uso",
                factor: "Kilometraje",
                weight: this.weights.annualKm,
                score: kmScore,
                impact: kmScore * this.weights.annualKm,
                description: `${factors.usage.annualKilometers.toLocaleString()} km anuales`,
            }
        );

        totalScore += vehicleAgeScore * this.weights.vehicleAge;
        totalScore += vehicleTypeScore * this.weights.vehicleType;
        totalScore += zoneScore * this.weights.zone;
        totalScore += usageScore * this.weights.usage;
        totalScore += kmScore * this.weights.annualKm;

        // Normalize score to 0-100 range
        const normalizedScore = Math.max(0, Math.min(100, totalScore));

        // Determine risk level
        const riskLevel = this.determineRiskLevel(normalizedScore);

        // Calculate premium
        const premiumMultiplier =
            this.calculatePremiumMultiplier(normalizedScore);
        const finalPremium = Math.round(this.basePremium * premiumMultiplier);

        // Generate recommendations
        const recommendations = this.generateRecommendations(
            factors,
            riskFactors
        );

        return {
            overallScore: Math.round(normalizedScore),
            riskLevel,
            premiumMultiplier,
            basePremium: this.basePremium,
            finalPremium,
            factors: riskFactors,
            recommendations,
        };
    }

    private assessAge(age: number): number {
        if (age < 21) return 30;
        if (age < 25) return 20;
        if (age < 30) return 5;
        if (age < 65) return -5;
        if (age < 75) return 10;
        return 25;
    }

    private assessExperience(years: number): number {
        if (years < 1) return 25;
        if (years < 3) return 15;
        if (years < 5) return 5;
        if (years < 10) return -5;
        return -10;
    }

    private assessViolations(count: number): number {
        return count * 8;
    }

    private assessAccidents(count: number): number {
        return count * 15;
    }

    private assessVehicleAge(year: number): number {
        const age = new Date().getFullYear() - year;
        if (age < 2) return -5;
        if (age < 5) return 0;
        if (age < 10) return 5;
        if (age < 15) return 10;
        return 20;
    }

    private assessVehicleType(type: string): number {
        const typeScores: Record<string, number> = {
            sedan: 0,
            hatchback: -2,
            suv: 5,
            pickup: 8,
            sports: 20,
            luxury: 15,
            motorcycle: 25,
        };
        return typeScores[type.toLowerCase()] || 0;
    }

    private assessZone(zone: string): number {
        const zoneScores: Record<string, number> = {
            low: -15, // Zonas de bajo riesgo
            medium: 0, // Zonas de riesgo medio (baseline)
            high: 15, // Zonas de alto riesgo
            very_high: 25, // Zonas de muy alto riesgo
            // Legacy support
            rural: -10,
            suburban: -5,
            "urban-low": 0,
            "urban-medium": 10,
            "urban-high": 20,
        };
        return zoneScores[zone] || 0;
    }

    private assessUsage(purpose: string): number {
        const usageScores: Record<string, number> = {
            personal: 0,
            work: 5,
            commercial: 15,
            rideshare: 20,
        };
        return usageScores[purpose] || 0;
    }

    private assessAnnualKilometers(km: number): number {
        if (km < 10000) return -5;
        if (km < 20000) return 0;
        if (km < 30000) return 5;
        if (km < 50000) return 15;
        return 25;
    }

    private determineRiskLevel(
        score: number
    ): "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH" {
        if (score <= 30) return "LOW";
        if (score <= 50) return "MEDIUM";
        if (score <= 75) return "HIGH";
        return "VERY_HIGH";
    }

    private calculatePremiumMultiplier(score: number): number {
        // Base multiplier of 1.0, increases with risk score
        return 0.7 + (score / 100) * 1.5;
    }

    private getAgeDescription(age: number): string {
        if (age < 21) return "Conductor muy joven - Alto riesgo";
        if (age < 25) return "Conductor joven - Riesgo elevado";
        if (age < 30) return "Conductor joven adulto - Riesgo moderado";
        if (age < 65) return "Conductor adulto - Riesgo óptimo";
        if (age < 75) return "Conductor mayor - Riesgo moderado";
        return "Conductor de edad avanzada - Alto riesgo";
    }

    private getExperienceDescription(years: number): string {
        if (years < 1) return "Sin experiencia - Alto riesgo";
        if (years < 3) return "Poca experiencia - Riesgo elevado";
        if (years < 5) return "Experiencia moderada";
        if (years < 10) return "Buena experiencia - Menor riesgo";
        return "Mucha experiencia - Riesgo reducido";
    }

    private getVehicleAgeDescription(year: number): string {
        const age = new Date().getFullYear() - year;
        if (age < 2) return "Vehículo nuevo - Menor riesgo";
        if (age < 5) return "Vehículo reciente";
        if (age < 10) return "Vehículo usado";
        if (age < 15) return "Vehículo antiguo - Mayor riesgo";
        return "Vehículo muy antiguo - Alto riesgo";
    }

    private getZoneDescription(zone: string): string {
        const descriptions: Record<string, string> = {
            low: "Zona de bajo riesgo - Prima reducida",
            medium: "Zona de riesgo medio - Prima estándar",
            high: "Zona de alto riesgo - Prima elevada",
            very_high: "Zona de muy alto riesgo - Prima máxima",
            // Legacy support
            rural: "Zona rural - Menor riesgo de robo",
            suburban: "Zona suburbana - Riesgo moderado",
            "urban-low": "Zona urbana segura",
            "urban-medium": "Zona urbana - Riesgo moderado",
            "urban-high": "Zona urbana de alto riesgo",
        };
        return descriptions[zone] || "Zona no especificada";
    }

    private generateRecommendations(
        factors: RiskFactors,
        riskFactors: RiskFactor[]
    ): string[] {
        const recommendations: string[] = [];

        // High-impact negative factors
        const highRiskFactors = riskFactors.filter((f) => f.impact > 5);

        if (factors.driver.violations > 0) {
            recommendations.push(
                "Mantener un historial de conducción limpio puede reducir significativamente la prima"
            );
        }

        if (factors.driver.accidents > 0) {
            recommendations.push(
                "Considerar un curso de manejo defensivo para mejorar el perfil de riesgo"
            );
        }

        if (factors.vehicle.year < new Date().getFullYear() - 10) {
            recommendations.push(
                "Actualizar a un vehículo más nuevo con mejores características de seguridad"
            );
        }

        if (factors.usage.annualKilometers > 30000) {
            recommendations.push(
                "Reducir el kilometraje anual puede disminuir el riesgo y la prima"
            );
        }

        if (factors.location.zone.includes("high")) {
            recommendations.push(
                "Considerar estacionamiento seguro o sistema de alarma antirrobo"
            );
        }

        if (recommendations.length === 0) {
            recommendations.push(
                "Su perfil de riesgo es favorable. Mantenga sus buenos hábitos de conducción."
            );
        }

        return recommendations;
    }
}

// Singleton instance
export const riskEngine = new RiskAssessmentEngine();
