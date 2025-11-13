'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, FileText, Send } from 'lucide-react';

interface DocumentRequestSuccessModalProps {
  open: boolean;
  onClose: () => void;
  claimNumber?: string;
  requestedDocuments: string[];
}

const DOCUMENT_TYPE_NAMES: Record<string, string> = {
  photos: 'Fotos adicionales del daño',
  police_report: 'Reporte policial',
  repair_estimate: 'Cotización de reparación',
  medical_report: 'Reporte médico',
  witness_statement: 'Declaración de testigos',
  third_party_info: 'Información de terceros',
  other: 'Otros documentos',
};

export function DocumentRequestSuccessModal({
  open,
  onClose,
  claimNumber,
  requestedDocuments,
}: DocumentRequestSuccessModalProps) {
  const [autoClose, setAutoClose] = useState(5);

  useEffect(() => {
    if (!open) {
      setAutoClose(5);
      return;
    }

    const timer = setInterval(() => {
      setAutoClose(prev => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, onClose]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-green-600">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div>¡Solicitud Enviada!</div>
              <div className="text-sm font-normal text-muted-foreground">
                Reclamación {claimNumber}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <DialogDescription className="text-center">
            La solicitud de documentos ha sido enviada exitosamente al cliente. Recibirá una
            notificación inmediatamente.
          </DialogDescription>

          {/* Documentos solicitados */}
          <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-2 mb-3">
              <Send className="h-4 w-4 text-blue-700 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Documentos solicitados:</span>
            </div>
            <div className="space-y-2">
              {requestedDocuments && requestedDocuments.length > 0 ? (
                requestedDocuments.map((docType, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-blue-900 dark:text-blue-100">
                    <FileText className="h-3 w-3" />
                    {DOCUMENT_TYPE_NAMES[docType] || docType}
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 text-sm text-blue-900 dark:text-blue-100">
                  <FileText className="h-3 w-3" />
                  No se especificaron documentos
                </div>
              )}
            </div>
          </div>

          {/* Estado de la reclamación */}
          <div className="text-center p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-700">
            <p className="text-sm text-orange-900 dark:text-orange-100">
              <strong>Estado actualizado:</strong> Pendiente de Documentación
            </p>
          </div>

          {/* Próximos pasos */}
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <p className="font-medium text-gray-900 dark:text-gray-100">Próximos pasos:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>El cliente recibirá una notificación inmediatamente</li>
              <li>Podrá subir los documentos desde su portal</li>
              <li>Recibirás una alerta cuando los suba</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cerrar {autoClose > 0 && `(${autoClose}s)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
