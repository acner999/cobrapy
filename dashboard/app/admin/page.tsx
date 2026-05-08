'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetch, type AdminOverview } from '@/lib/api';
import { Icon } from '@/components/icon';

function fmt(n: number) { return n.toLocaleString('es-PY'); }

export default function AdminHomePage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<AdminOverview>('/admin-portal/overview')
      .then(setData)
      .catch((err) => setError((err as Error).message));
  }, []);

  return (
    <div>
      <div className="mb-xl">
        <h1 className="font-h1 text-h1 text-on-surface mb-xs">Overview</h1>
        <p className="text-on-surface-variant font-body-base">Métricas generales de la plataforma — últimos 30 días.</p>
      </div>

      {error && <p className="bg-error-container text-on-error-container px-md py-sm rounded-lg mb-md text-body-sm">{error}</p>}

      {!data ? (
        <p className="text-on-surface-variant">Cargando...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-xl">
            <Card icon="store" tone="primary" label="Comercios totales" value={String(data.merchants.total)} />
            <Card icon="check_circle" tone="secondary" label="Activos" value={String(data.merchants.active)} />
            <Card icon="hourglass_empty" tone="tertiary" label="KYC pendiente" value={String(data.merchants.pendingKyc)}
              link={data.merchants.pendingKyc > 0 ? '/admin/merchants?kyc=PENDING' : undefined} />
            <Card icon="payments" tone="primary" label="Pagos (30d)" value={String(data.last30d.chargesPaid)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter mb-xl">
            <div className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-sm">
              <p className="text-on-surface-variant uppercase tracking-wider font-semibold text-body-sm mb-sm">Volumen procesado (30d)</p>
              <p className="font-data-mono text-[40px] text-primary leading-none">Gs. {fmt(data.last30d.volumeGs)}</p>
              <p className="text-body-sm text-on-surface-variant mt-sm">{data.last30d.chargesCreated} cobros creados</p>
            </div>
            <div className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-sm">
              <p className="text-on-surface-variant uppercase tracking-wider font-semibold text-body-sm mb-sm">Comisiones cobradas (30d)</p>
              <p className="font-data-mono text-[40px] text-secondary leading-none">Gs. {fmt(data.last30d.feesGs)}</p>
              <p className="text-body-sm text-on-surface-variant mt-sm">
                Tasa efectiva:{' '}
                {data.last30d.volumeGs > 0
                  ? ((data.last30d.feesGs / data.last30d.volumeGs) * 100).toFixed(2)
                  : '0.00'}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <QuickAction href="/admin/merchants" icon="store" title="Comercios" desc="Aprobar KYC, suspender, ver detalles." />
            <QuickAction href="/admin/charges" icon="payments" title="Cobros" desc="Todas las transacciones del sistema." />
            <QuickAction href="/admin/banks" icon="account_balance" title="Bancos" desc="Lista de bancos habilitados en SIP." />
          </div>
        </>
      )}
    </div>
  );
}

function Card({ icon, tone, label, value, link }: { icon: string; tone: 'primary' | 'secondary' | 'tertiary'; label: string; value: string; link?: string }) {
  const inner = (
    <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between h-32">
      <div className="flex justify-between items-start">
        <span className="text-on-surface-variant font-body-sm uppercase tracking-wider font-semibold">{label}</span>
        <Icon name={icon} className={`text-${tone}`} />
      </div>
      <p className="font-data-mono text-h2 text-on-surface">{value}</p>
    </div>
  );
  return link ? <Link href={link} className="hover:scale-[1.02] transition-transform">{inner}</Link> : inner;
}

function QuickAction({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link href={href} className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm hover:border-primary transition-colors group">
      <div className="flex items-center gap-md mb-sm">
        <div className="w-10 h-10 rounded-lg bg-primary-fixed-dim flex items-center justify-center">
          <Icon name={icon} className="text-primary" />
        </div>
        <h3 className="font-h3 text-h3 text-on-surface group-hover:text-primary transition-colors">{title}</h3>
      </div>
      <p className="text-body-sm text-on-surface-variant">{desc}</p>
    </Link>
  );
}
