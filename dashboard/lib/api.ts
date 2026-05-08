const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/v1';

// === User session (JWT con merchant activo en claim mid) ===
const USER_TOKEN = 'cobrapy_user_token';
const USER_INFO = 'cobrapy_user_info';

export interface UserInfo {
  user: { id: string; email: string; name: string };
  activeMerchant: ActiveMerchant;
  memberships: Array<{ merchantId: string; role: MembershipRole; merchant: ActiveMerchant }>;
}

export interface ActiveMerchant {
  id: string; businessName: string; ruc: string; kycStatus: string; plan: string; active: boolean;
}

export type MembershipRole = 'OWNER' | 'ADMIN' | 'OPERATOR' | 'READONLY';

export function getUserToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(USER_TOKEN);
}
export function setUserSession(token: string, info: UserInfo) {
  localStorage.setItem(USER_TOKEN, token);
  localStorage.setItem(USER_INFO, JSON.stringify(info));
}
export function getUserInfo(): UserInfo | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_INFO);
  return raw ? (JSON.parse(raw) as UserInfo) : null;
}
export function clearUserSession() {
  localStorage.removeItem(USER_TOKEN);
  localStorage.removeItem(USER_INFO);
}

// Aliases para mantener compat con código existente que usaba "ApiKey"
export const getApiKey = getUserToken;
export const clearApiKey = clearUserSession;
export function setApiKey(token: string) { localStorage.setItem(USER_TOKEN, token); }

// === Admin JWT (staff portal) ===
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
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
export function apiFetch<T>(path: string, init?: RequestInit) { return doFetch<T>(path, init ?? {}, getUserToken()); }
export function adminFetch<T>(path: string, init?: RequestInit) { return doFetch<T>(path, init ?? {}, getAdminToken()); }
export function publicFetch<T>(path: string, init?: RequestInit) { return doFetch<T>(path, init ?? {}, null); }

// === Helpers ===
export async function switchMerchant(merchantId: string): Promise<void> {
  const res = await apiFetch<{ token: string; activeMerchantId: string; role: MembershipRole }>(
    '/auth/switch-merchant',
    { method: 'POST', body: JSON.stringify({ merchantId }) },
  );
  const info = getUserInfo();
  if (info) {
    const found = info.memberships.find((m) => m.merchantId === merchantId);
    if (found) info.activeMerchant = found.merchant;
    localStorage.setItem(USER_TOKEN, res.token);
    localStorage.setItem(USER_INFO, JSON.stringify(info));
  } else {
    localStorage.setItem(USER_TOKEN, res.token);
  }
}

// === Tipos compartidos ===
export interface Charge {
  id: string; merchantId: string; amountGs: number; description: string | null;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'EXPIRED' | 'CANCELED' | 'FAILED';
  paymentType: string; qrPayload: string | null; qrImageUrl: string | null;
  externalId: string | null; createdAt: string; expiresAt: string | null;
  merchant?: { businessName: string; ruc: string };
}
export interface Merchant {
  id: string; businessName: string; ruc: string; email: string; phone: string | null;
  kycStatus: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  plan: 'FREE' | 'PRO' | 'ENTERPRISE'; active: boolean; createdAt: string;
}
export interface MerchantWithCounts extends Merchant {
  _count?: { charges: number; apiKeys?: number; webhooks?: number };
}
export interface ApiKeyInfo {
  id: string; name: string; keyPrefix: string;
  environment: 'TEST' | 'LIVE';
  lastUsedAt: string | null; revokedAt: string | null; createdAt: string;
}
export interface WebhookEndpoint {
  id: string; url: string; secret: string; events: string[]; active: boolean; createdAt: string;
}
export interface AdminOverview {
  merchants: { total: number; active: number; pendingKyc: number };
  last30d: { chargesCreated: number; chargesPaid: number; volumeGs: number; feesGs: number };
}
export interface TeamMember {
  id: string; userId: string; merchantId: string; role: MembershipRole;
  acceptedAt: string | null; createdAt: string;
  user: { id: string; name: string; email: string; lastLoginAt: string | null };
}
