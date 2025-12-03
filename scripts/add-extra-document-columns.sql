-- Add columns for extra documents support
ALTER TABLE public.claim_customer_documents 
ADD COLUMN IF NOT EXISTS is_extra_document boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS extra_document_label text;

-- Add comment to explain the columns
COMMENT ON COLUMN public.claim_customer_documents.is_extra_document IS 'Indicates if the document was uploaded as an additional requirement requested by an agent';
COMMENT ON COLUMN public.claim_customer_documents.extra_document_label IS 'The label/name of the requested document type (e.g., "Declaración de testigos")';
