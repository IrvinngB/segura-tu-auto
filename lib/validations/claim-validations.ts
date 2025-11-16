import type { Claim, Policy } from '@/lib/types/database';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validatePolicyForClaim(policy: Policy, incidentDate: Date): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (policy.status !== 'active') {
    errors.push('La póliza no está activa');
  }

  const startDate = new Date(policy.start_date);
  const endDate = new Date(policy.end_date);
  
  if (incidentDate < startDate) {
    errors.push('El siniestro ocurrió antes del inicio de la póliza');
  }
  
  if (incidentDate > endDate) {
    errors.push('El siniestro ocurrió después del vencimiento de la póliza');
  }

  const daysToExpire = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  if (daysToExpire < 30 && daysToExpire > 0) {
    warnings.push(`La póliza vence en ${daysToExpire} días`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateClaimDates(incidentDate: Date, reportDate: Date): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (incidentDate > new Date()) {
    errors.push('La fecha del siniestro no puede ser futura');
  }

  const daysBetween = Math.ceil((reportDate.getTime() - incidentDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysBetween > 30) {
    errors.push(`Reporte tardío: ${daysBetween} días (máximo legal: 30 días)`);
  } else if (daysBetween > 7) {
    warnings.push(`Reporte con ${daysBetween} días de retraso`);
  }

  if (reportDate < incidentDate) {
    errors.push('La fecha de reporte no puede ser anterior a la fecha del siniestro');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateClaimAmount(
  estimatedAmount: number,
  policy: Policy,
  vehicleValue: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (estimatedAmount <= 0) {
    errors.push('El monto estimado debe ser mayor a 0');
  }

  if (estimatedAmount > policy.coverage_limit) {
    errors.push(`Monto excede límite de cobertura: $${policy.coverage_limit.toLocaleString()}`);
  }

  if (estimatedAmount > vehicleValue * 0.8) {
    warnings.push(`Monto es > 80% del valor del vehículo ($${vehicleValue.toLocaleString()})`);
  }

  if (estimatedAmount <= policy.deductible_amount) {
    warnings.push(`Monto no cubre el deducible de $${policy.deductible_amount.toLocaleString()}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function calculateNetAmount(
  approvedAmount: number,
  deductible: number,
  faultPercentage: number
): number {
  const amountWithFault = approvedAmount * (faultPercentage / 100);
  const netAmount = amountWithFault - deductible;
  return Math.max(0, netAmount);
}

export interface FraudScore {
  score: number;
  flags: string[];
  risk: 'low' | 'medium' | 'high';
}

export function calculateFraudScore(
  claim: Claim,
  vehicleValue: number,
  recentClaimsCount: number
): FraudScore {
  let score = 0;
  const flags: string[] = [];

  const incidentDate = new Date(claim.incident_date);
  const reportDate = new Date(claim.created_at);
  const daysBetween = Math.ceil((reportDate.getTime() - incidentDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysBetween > 30) {
    score += 25;
    flags.push(`Reporte tardío: ${daysBetween} días`);
  }

  if (claim.estimated_damage_cost && vehicleValue > 0) {
    if (claim.estimated_damage_cost > vehicleValue * 0.8) {
      score += 30;
      flags.push(`Monto excesivo: ${Math.round((claim.estimated_damage_cost / vehicleValue) * 100)}% del valor del vehículo`);
    }
  }

  if (recentClaimsCount > 2) {
    score += 35;
    flags.push(`${recentClaimsCount} reclamaciones en los últimos 6 meses`);
  }

  if (claim.claim_type === 'theft' && !claim.police_report_number) {
    score += 40;
    flags.push('Robo sin reporte policial');
  }

  if (!claim.third_party_involved && claim.claim_type === 'collision') {
    score += 10;
    flags.push('Colisión sin terceros involucrados');
  }

  const risk = score > 60 ? 'high' : score > 30 ? 'medium' : 'low';

  return { score, flags, risk };
}
