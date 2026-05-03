import { NfeioServiceInvoiceRequest, NfeioServiceInvoiceResponse, NfeioApiError } from "./types";

const BASE_URL = "https://api.nfe.io/v1";

function getHeaders(apiKey: string): Record<string, string> {
  return {
    "Authorization": apiKey,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
}

export async function emitirNFSe(
  apiKey: string,
  companyId: string,
  payload: NfeioServiceInvoiceRequest
): Promise<NfeioServiceInvoiceResponse> {
  const url = `${BASE_URL}/companies/${companyId}/serviceinvoices`;
  const res = await fetch(url, {
    method: "POST",
    headers: getHeaders(apiKey),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err: NfeioApiError = await res.json().catch(() => ({ code: "ERR_HTTP", message: `HTTP ${res.status}` }));
    throw new Error(`NFE.io emitir erro [${err.code}]: ${err.message}`);
  }

  return res.json();
}

export async function consultarNFSe(
  apiKey: string,
  companyId: string,
  nfseId: string
): Promise<NfeioServiceInvoiceResponse> {
  const url = `${BASE_URL}/companies/${companyId}/serviceinvoices/${nfseId}`;
  const res = await fetch(url, {
    method: "GET",
    headers: getHeaders(apiKey),
  });

  if (!res.ok) {
    const err: NfeioApiError = await res.json().catch(() => ({ code: "ERR_HTTP", message: `HTTP ${res.status}` }));
    throw new Error(`NFE.io consultar erro [${err.code}]: ${err.message}`);
  }

  return res.json();
}

export async function cancelarNFSe(
  apiKey: string,
  companyId: string,
  nfseId: string
): Promise<NfeioServiceInvoiceResponse> {
  const url = `${BASE_URL}/companies/${companyId}/serviceinvoices/${nfseId}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: getHeaders(apiKey),
  });

  if (!res.ok) {
    const err: NfeioApiError = await res.json().catch(() => ({ code: "ERR_HTTP", message: `HTTP ${res.status}` }));
    throw new Error(`NFE.io cancelar erro [${err.code}]: ${err.message}`);
  }

  return res.json();
}

export async function listarNFSe(
  apiKey: string,
  companyId: string,
  options?: { page?: number; pageSize?: number; status?: string }
): Promise<{ items: NfeioServiceInvoiceResponse[]; total: number }> {
  const params = new URLSearchParams();
  if (options?.page) params.set("page", String(options.page));
  if (options?.pageSize) params.set("pageSize", String(options.pageSize));
  if (options?.status) params.set("status", options.status);

  const url = `${BASE_URL}/companies/${companyId}/serviceinvoices?${params.toString()}`;
  const res = await fetch(url, {
    method: "GET",
    headers: getHeaders(apiKey),
  });

  if (!res.ok) {
    const err: NfeioApiError = await res.json().catch(() => ({ code: "ERR_HTTP", message: `HTTP ${res.status}` }));
    throw new Error(`NFE.io listar erro [${err.code}]: ${err.message}`);
  }

  return res.json();
}
