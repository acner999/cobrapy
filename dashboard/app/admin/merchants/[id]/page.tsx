'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminFetch, type Merchant } from '@/lib/api';
import { Icon } from '@/components/icon';

interface MerchantDetail extends Merchant {
  _count?: { charges: number; apiKeys: number; webhooks: number };
  bankAccounts: Array<{
    id: string; bankCode: string; accountNumber: string; accountAlias: string | null; isDefault: boolean;
  }>;
}

export default function AdminMerchantDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [merchant, setMerchant] = useState<MerchantDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { load(); }, [params.id]);

  async function load() {
    try {
      const data = await adminFetch<MerchantDetail>(`/admin-portal/merchants/${params.id}`);
      setMerchant(data);
    } catch (err) { setError((err as Error).message); }
  }

  async function action(path: string, body?: object) {
    setActionLoading(true);
    try {
      await adminFetch(`/admin-portal/merchants/${params.id}/${path}`, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      });
      await load();
    } catch (err) { setError((err as Error).message); }
    finally { setActionLoading(false); }
  }

  if (error) return <p className="text-error">{error}</p>;
  if (!merchant) return <p className="text-on-surface-variant">Cargando...</p>;

  return (
    <div>
      <button onClick={() => router.push('/admin/merchants')} className="text-on-surface-variant text-body-sm hover:text-primary flex items-center gap-xs mb-md">
        <Icon name="arrow_back" className="text-[18px]" /> Volver
      </button>

      <div className="flex items-start justify-between mb-xl">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface mb-xs">{merchant.businessName}</h1>
          <p className="text-on-surface-variant font-data-mono text-body-sm">{merchant.id}</p>
        </div>
        <span className={`px-md py-sm rounded-full text-body-sm font-bold ${merchant.active ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
          {merchant.active ? 'Activo' : 'Suspendido'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter mb-xl">
        <Stat label="Cobros" value={String(merchant._count?.charges ?? 0)} />
        <Stat label="API Keys" value={String(merchant._count?.apiKeys ?? 0)} />
        <Stat label="Webhooks" value={String(merchant._count?.webhooks ?? 0)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm">
          <h2 className="font-h3 text-h3 mb-md">Datos del comercio</h2>
          <dl className="space-y-sm text-body-sm">
            <Row label="RUC" value={merchant.ruc} mono />
            <Row label="Email" value={merchant.email} />
            <Row label="Teléfono" value={merchant.phone ?? '—'} />
            <Row label="Plan" value={merchant.plan} />
            <Row label="Creado" value={new Date(merchant.createdAt).toLocaleDateString('es-PY')} />
          </dl>
        </div>

        <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm">
          <h2 className="font-h3 text-h3 mb-md">Cuentas bancarias</h2>
          {merchant.bankAccounts.length === 0 ? (
            <p className="text-on-surface-variant text-body-sm">Sin cuentas registradas.</p>
          ) : (
            <ul className="space-y-sm">
              {merchant.bankAccounts.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-body-sm">
                  <div>
                    <p className="font-medium">{a.bankCode}</p>
                    <p className="font-data-mono text-on-surface-variant">{a.accountNumber}</p>
                  </div>
                  {a.isDefault && <span className="text-[11px] bg-primary-fixed text-on-primary-fixed px-sm py-unit rounded font-bold uppercase">Default</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="md:col-span-2 bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm">
          <h2 className="font-h3 text-h3 mb-md">Estado KYC</h2>
          <div className="flex items-center gap-md mb-md">
            <span className="text-body-sm text-on-surface-variant">Estado actual:</span>
            <span className={`px-sm py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
              merchant.kycStatus === 'APPROVED' ? 'bg-secondary-container text-on-secondary-container' :
              merchant.kycStatus === 'REJECTED' ? 'bg-error-container text-on-error-container' :
              'bg-tertiary-fixed text-on-tertiary-fixed-variant'
            }`}>{merchant.kycStatus}</span>
          </div>
          <div className="flex flex-wrap gap-sm">
            {merchant.kycStatus !== 'APPROVED' && (
              <button onClick={() => action('kyc/approve')} disabled={actionLoading}
                className="bg-primary text-on-primary px-md py-sm rounded-lg text-body-sm font-bold hover:bg-primary-container transition disabled:opacity-50 flex items-center gap-xs">
                <Icon name="check_circle" className="text-[18px]" /> Aprobar KYC
              </button>
            )}
            {merchant.kycStatus !== 'REJECTED' && (
              <button onClick={() => action('kyc/reject')} disabled={actionLoading}
                className="bg-error-container text-on-error-container px-md py-sm rounded-lg text-body-sm font-bold hover:opacity-80 transition disabled:opacity-50 flex items-center gap-xs">
                <Icon name="cancel" className="text-[18px]" /> Rechazar KYC
              </button>
            )}
            <button onClick={() => action('suspend', { active: !merchant.active })} disabled={actionLoading}
              className="bg-surface-container hover:bg-surface-container-high border border-outline-variant px-md py-sm rounded-lg text-body-sm font-bold transition disabled:opacity-50 flex items-center gap-xs">
              <Icon name={merchant.active ? 'block' : 'play_circle'} className="text-[18px]" />
              {merchant.active ? 'Suspender comercio' : 'Reactivar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm">
      <p className="text-on-surface-variant text-body-sm uppercase tracking-wider font-semibold mb-xs">{label}</p>
      <p className="font-data-mono text-h2">{value}</p>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-md">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className={`text-on-surface ${mono ? 'font-data-mono' : ''} text-right`}>{value}</dd>
    </div>
  );
}
