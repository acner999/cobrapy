'use client';
import { useEffect, useState } from 'react';
import { adminFetch, type Charge } from '@/lib/api';
import { Icon } from '@/components/icon';

const statusBadge: Record<string, string> = {
  PAID:    'bg-secondary-container text-on-secondary-container',
  PENDING: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  EXPIRED: 'bg-surface-container text-on-surface-variant',
  FAILED:  'bg-error-container text-on-error-container',
};

function fmt(n: number) { return n.toLocaleString('es-PY'); }

export default function AdminChargesPage() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<Charge[]>('/admin-portal/charges?limit=100')
      .then(setCharges)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-xl">
        <h1 className="font-h1 text-h1 text-on-surface mb-xs">Cobros (todos)</h1>
        <p className="text-on-surface-variant font-body-base">Vista global de transacciones del sistema.</p>
      </div>

      {error && <p className="bg-error-container text-on-error-container px-md py-sm rounded-lg mb-md text-body-sm">{error}</p>}

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant">
                <th className="text-left py-md px-lg text-[11px] font-semibold uppercase tracking-widest">ID</th>
                <th className="text-left py-md px-lg text-[11px] font-semibold uppercase tracking-widest">Comercio</th>
                <th className="text-right py-md px-lg text-[11px] font-semibold uppercase tracking-widest">Monto</th>
                <th className="text-center py-md px-lg text-[11px] font-semibold uppercase tracking-widest">Estado</th>
                <th className="text-left py-md px-lg text-[11px] font-semibold uppercase tracking-widest">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="px-lg py-xl text-center text-on-surface-variant">Cargando...</td></tr>}
              {!loading && charges.length === 0 && (
                <tr><td colSpan={5} className="px-lg py-xl text-center text-on-surface-variant">Sin cobros.</td></tr>
              )}
              {charges.map((c) => (
                <tr key={c.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container-low transition">
                  <td className="px-lg py-md font-data-mono text-[12px] text-on-surface">{c.id.slice(0, 16)}…</td>
                  <td className="px-lg py-md text-body-sm">
                    <p className="font-medium">{c.merchant?.businessName ?? '—'}</p>
                    <p className="text-[11px] text-on-surface-variant font-data-mono">{c.merchant?.ruc}</p>
                  </td>
                  <td className="px-lg py-md text-right font-data-mono text-body-sm font-medium">Gs. {fmt(c.amountGs)}</td>
                  <td className="px-lg py-md text-center">
                    <span className={`inline-block px-sm py-1 rounded-md text-[11px] font-bold uppercase ${statusBadge[c.status] ?? 'bg-surface-container'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-lg py-md text-body-sm text-on-surface-variant">
                    {new Date(c.createdAt).toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
