const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/v1';

// === Merchant API key ===
const MERCHANT_KEY = 'cobrapy_api_key';
export function getApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(MERCHANT_KEY);
}
export function setApiKey(key: string) { localStorage.setItem(MERCHANT_KEY, key); }
export function clearApiKey() { localStorage.removeItem(MERCHANT_KEY); }

// === Admin JWT ===
const ADMIN_KEY = 'cobrapy_admin_token';
const ADMIN_INFO = 'cobrapy_admin_info';
export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_KEY);
}
export function setAdminToken(token: string, info: AdminInfo) {
  localStorage.setItem(ADMIN_KEY, token);
  localStorage.setItem(ADMIN_INFO, JSON.stringify(info));
}
export function getAdminInfo(): AdminInfo | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(ADMIN_INFO);
  return raw ? (JSON.parse(raw) as AdminInfo) : null;
}
export function clearAdmin() {
  localStorage.removeItem(ADMIN_KEY);
  localStorage.removeItem(ADMIN_INFO);
}

export interface AdminInfo {
  id: string; email: string; name: string; role: 'SUPERADMIN' | 'STAFF' | 'READONLY';
}

// === Fetchers ===
async function doFetch<T>(path: string, init: RequestInit, token: string | null): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export function apiFetch<T>(path: string, init?: RequestInit) { return doFetch<T>(path, init ?? {}, getApiKey()); }
export function adminFetch<T>(path: string, init?: RequestInit) { return doFetch<T>(path, init ?? {}, getAdminToken()); }
export function publicFetch<T>(path: string, init?: RequestInit) { return doFetch<T>(path, init ?? {}, null); }

// === Types ===
export interface Charge {
  id: string;
  merchantId: string;
  amountGs: number;
  description: string | null;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'EXPIRED' | 'CANCELED' | 'FAILED';
  paymentType: string;
  qrPayload: string | null;
  qrImageUrl: string | null;
  externalId: string | null;
  createdAt: string;
  expiresAt: string | null;
  merchant?: { businessName: string; ruc: string };
}

export interface Merchant {
  id: string;
  businessName: string;
  ruc: string;
  email: string;
  phone: string | null;
  kycStatus: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  active: boolean;
  createdAt: string;
}

export interface MerchantWithCounts extends Merchant {
  _count?: { charges: number; apiKeys?: number; webhooks?: number };
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  keyPrefix: string;
  environment: 'TEST' | 'LIVE';
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  createdAt: string;
}

export interface AdminOverview {
  merchants: { total: number; active: number; pendingKyc: number };
  last30d: { chargesCreated: number; chargesPaid: number; volumeGs: number; feesGs: number };
}
