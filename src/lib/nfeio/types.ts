// Tipos da API NFE.io para NFSe
// Documentacao: https://nfe.io/docs/desenvolvedores/rest-api/nota-fiscal-de-servico-v1/

export interface NfeioCompany {
  id: string;
  name: string;
  federalTaxNumber: number;
  taxRegime: string;
  municipalTaxNumber?: string;
  address: {
    state: string;
    city: { code: string; name: string };
    street: string;
    number: string;
    district?: string;
    postalCode: string;
    country: string;
  };
}

export interface NfeioBorrower {
  federalTaxNumber: string;
  name: string;
  email?: string;
  telephone?: string;
  address?: {
    street: string;
    number: string;
    district?: string;
    city: { code: string; name: string };
    state: string;
    postalCode: string;
    country: string;
  };
}

export interface NfeioServiceInvoiceRequest {
  cityServiceCode: string;
  description: string;
  servicesAmount: number;
  issRate?: number;
  deductionsAmount?: number;
  borrower: NfeioBorrower;
  rpsSerialNumber?: string;
  rpsNumber?: number;
  // Campos opcionais de retencoes
  taxAmountPis?: number;
  taxAmountCofins?: number;
  taxAmountInss?: number;
  taxAmountIr?: number;
  taxAmountCsll?: number;
  // Campos adicionais
  issuanceDate?: string;
  // Id externo para rastreamento
  externalId?: string;
}

export interface NfeioServiceInvoiceResponse {
  id: string;
  companyId: string;
  status: string; // e.g. "Issued", "Cancelled", "Error"
  rpsSerialNumber?: string;
  rpsNumber?: number;
  number?: string;
  verificationCode?: string;
  issuanceDate?: string;
  cityServiceCode?: string;
  description?: string;
  servicesAmount?: number;
  deductionsAmount?: number;
  issRate?: number;
  issTaxAmount?: number;
  netAmount?: number;
  borrower?: NfeioBorrower;
  pdfUrl?: string;
  xmlUrl?: string;
  externalId?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface NfeioApiError {
  code: string;
  message: string;
  details?: string;
}

export type NfeioAction = "emitir" | "consultar" | "cancelar" | "listar";
