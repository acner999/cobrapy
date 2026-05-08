const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/v1';

export function getApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('cobrapy_api_key');
}

export function setApiKey(key: string) {
  localStorage.setItem('cobrapy_api_key', key);
}

export function clearApiKey() {
  localStorage.removeItem('cobrapy_api_key');
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const key = getApiKey();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function publicFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export interface Charge {
  id: string;
  amountGs: number;
  description: string | null;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'EXPIRED' | 'CANCELED' | 'FAILED';
  paymentType: string;
  qrPayload: string | null;
  qrImageUrl: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export interface Merchant {
  id: string;
  businessName: string;
  ruc: string;
  email: string;
  kycStatus: string;
  plan: string;
}
