'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import type { ValidationResult } from '@/lib/validations/claim-validations';

interface ClaimValidationAlertsProps {
  policyValidation?: ValidationResult;
  dateValidation?: ValidationResult;
  amountValidation?: ValidationResult;
  fraudScore?: {
    score: number;
    flags: string[];
    risk: 'low' | 'medium' | 'high';
  };
}

export function ClaimValidationAlerts({
  policyValidation,
  dateValidation,
  amountValidation,
  fraudScore
}: ClaimValidationAlertsProps) {
  const hasErrors = 
    (policyValidation && !policyValidation.valid) ||
    (dateValidation && !dateValidation.valid) ||
    (amountValidation && !amountValidation.valid);

  const hasWarnings =
    (policyValidation?.warnings.length || 0) > 0 ||
    (dateValidation?.warnings.length || 0) > 0 ||
    (amountValidation?.warnings.length || 0) > 0;

  return (
    <div className="space-y-3">
      {/* Errores Críticos */}
      {policyValidation && !policyValidation.valid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Validación de Póliza Fallida</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {policyValidation.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {dateValidation && !dateValidation.valid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Validación de Fechas Fallida</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {dateValidation.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {amountValidation && !amountValidation.valid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Validación de Monto Fallida</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {amountValidation.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Advertencias */}
      {hasWarnings && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Advertencias</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {policyValidation?.warnings.map((warning, idx) => (
                <li key={`policy-${idx}`}>{warning}</li>
              ))}
              {dateValidation?.warnings.map((warning, idx) => (
                <li key={`date-${idx}`}>{warning}</li>
              ))}
              {amountValidation?.warnings.map((warning, idx) => (
                <li key={`amount-${idx}`}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Alerta de Fraude */}
      {fraudScore && fraudScore.risk !== 'low' && (
        <Alert variant={fraudScore.risk === 'high' ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {fraudScore.risk === 'high' ? '⚠️ ALERTA DE FRAUDE ALTA' : '⚠️ Riesgo de Fraude Medio'}
          </AlertTitle>
          <AlertDescription>
            <p className="font-semibold mb-2">Score de Fraude: {fraudScore.score}/100</p>
            <ul className="list-disc list-inside space-y-1">
              {fraudScore.flags.map((flag, idx) => (
                <li key={idx}>{flag}</li>
              ))}
            </ul>
            {fraudScore.risk === 'high' && (
              <p className="mt-3 font-semibold text-red-600">
                Esta reclamación requiere revisión especial antes de aprobar.
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Todo OK */}
      {!hasErrors && !hasWarnings && fraudScore?.risk === 'low' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Validaciones Correctas</AlertTitle>
          <AlertDescription className="text-green-700">
            Todas las validaciones han pasado correctamente. La reclamación puede procesarse.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
