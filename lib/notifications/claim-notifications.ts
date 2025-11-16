import type { Claim } from '@/lib/types/database';

interface EmailData {
  to: string;
  subject: string;
  body: string;
}

const STATUS_MESSAGES = {
  submitted: {
    subject: 'Reclamación Recibida',
    body: (claim: Claim) => `
      Hola,
      
      Hemos recibido tu reclamación ${claim.claim_number}.
      
      Nuestro equipo la revisará en las próximas 24-48 horas.
      
      Puedes seguir el estado de tu reclamación en tu panel de cliente.
      
      Saludos,
      Equipo de Segura Tu Auto
    `
  },
  under_review: {
    subject: 'Reclamación en Revisión',
    body: (claim: Claim) => `
      Hola,
      
      Tu reclamación ${claim.claim_number} está siendo revisada por nuestro equipo.
      
      Estamos verificando la documentación y los detalles del siniestro.
      
      Te mantendremos informado de cualquier actualización.
      
      Saludos,
      Equipo de Segura Tu Auto
    `
  },
  pending_documentation: {
    subject: 'Documentos Adicionales Requeridos',
    body: (claim: Claim) => `
      Hola,
      
      Para continuar con tu reclamación ${claim.claim_number}, necesitamos documentos adicionales.
      
      Por favor, ingresa a tu panel de cliente para ver qué documentos faltan.
      
      Saludos,
      Equipo de Segura Tu Auto
    `
  },
  approved: {
    subject: 'Reclamación Aprobada',
    body: (claim: Claim) => `
      Hola,
      
      ¡Buenas noticias! Tu reclamación ${claim.claim_number} ha sido aprobada.
      
      Monto aprobado: $${claim.approved_amount?.toLocaleString()}
      Deducible: $${claim.deductible_amount?.toLocaleString()}
      Monto neto a pagar: $${claim.net_amount?.toLocaleString()}
      
      El pago será procesado en los próximos 3-5 días hábiles.
      
      Saludos,
      Equipo de Segura Tu Auto
    `
  },
  denied: {
    subject: 'Reclamación Denegada',
    body: (claim: Claim, reason?: string) => `
      Hola,
      
      Lamentamos informarte que tu reclamación ${claim.claim_number} ha sido denegada.
      
      ${reason ? `Razón: ${reason}` : ''}
      
      Si tienes preguntas o deseas apelar esta decisión, por favor contáctanos.
      
      Saludos,
      Equipo de Segura Tu Auto
    `
  },
  processing_payment: {
    subject: 'Procesando Pago',
    body: (claim: Claim) => `
      Hola,
      
      Estamos procesando el pago de tu reclamación ${claim.claim_number}.
      
      Monto a pagar: $${claim.net_amount?.toLocaleString()}
      
      Recibirás el pago en tu cuenta en 3-5 días hábiles.
      
      Saludos,
      Equipo de Segura Tu Auto
    `
  },
  paid: {
    subject: 'Pago Realizado',
    body: (claim: Claim) => `
      Hola,
      
      El pago de tu reclamación ${claim.claim_number} ha sido realizado.
      
      Monto pagado: $${claim.paid_amount?.toLocaleString()}
      
      Por favor, verifica tu cuenta bancaria.
      
      Saludos,
      Equipo de Segura Tu Auto
    `
  }
};

export async function sendClaimNotification(
  claim: Claim,
  newStatus: string,
  reason?: string
): Promise<void> {
  try {
    const messageConfig = STATUS_MESSAGES[newStatus as keyof typeof STATUS_MESSAGES];
    
    if (!messageConfig) {
      console.warn(`No hay configuración de mensaje para el estado: ${newStatus}`);
      return;
    }

    const customerEmail = claim.customer?.user?.email;
    
    if (!customerEmail) {
      console.warn('No se encontró email del cliente');
      return;
    }

    const emailData: EmailData = {
      to: customerEmail,
      subject: `${messageConfig.subject} - ${claim.claim_number}`,
      body: messageConfig.body(claim, reason)
    };

    console.log('📧 Notificación preparada:', emailData);
    
    // TODO: Integrar con servicio de email real (SendGrid, Resend, etc.)
    // await sendEmail(emailData);
    
    console.log('✅ Notificación enviada exitosamente');
  } catch (error) {
    console.error('Error enviando notificación:', error);
  }
}

export async function sendDocumentRequestNotification(
  claim: Claim,
  documentTypes: string[]
): Promise<void> {
  try {
    const customerEmail = claim.customer?.user?.email;
    
    if (!customerEmail) {
      console.warn('No se encontró email del cliente');
      return;
    }

    const emailData: EmailData = {
      to: customerEmail,
      subject: `Documentos Requeridos - ${claim.claim_number}`,
      body: `
        Hola,
        
        Para continuar con tu reclamación ${claim.claim_number}, necesitamos los siguientes documentos:
        
        ${documentTypes.map(type => `- ${type}`).join('\n')}
        
        Por favor, súbelos a través de tu panel de cliente lo antes posible.
        
        Saludos,
        Equipo de Segura Tu Auto
      `
    };

    console.log('📧 Notificación de documentos preparada:', emailData);
    
    // TODO: Integrar con servicio de email real
    // await sendEmail(emailData);
    
    console.log('✅ Notificación de documentos enviada');
  } catch (error) {
    console.error('Error enviando notificación de documentos:', error);
  }
}
