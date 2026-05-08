'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { adminFetch, type MerchantWithCounts } from '@/lib/api';
import { Icon } from '@/components/icon';

const kycBadge: Record<string, string> = {
  APPROVED:  'bg-secondary-container text-on-secondary-container',
  PENDING:   'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  IN_REVIEW: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  REJECTED:  'bg-error-container text-on-error-container',
};

export default function AdminMerchantsPage() {
  const params = useSearchParams();
  const initialKyc = params.get('kyc') ?? '';
  const [merchants, setMerchants] = useState<MerchantWithCounts[]>([]);
  const [search, setSearch] = useState('');
  const [kyc, setKyc] = useState(initialKyc);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { load(); }, [kyc]);

  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (kyc) qs.set('kycStatus', kyc);
      const data = await adminFetch<MerchantWithCounts[]>(`/admin-portal/merchants${qs.toString() ? '?' + qs : ''}`);
      setMerchants(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (!search) return merchants;
    const q = search.toLowerCase();
    return merchants.filter((m) =>
      m.businessName.toLowerCase().includes(q) || m.ruc.includes(search) || m.email.toLowerCase().includes(q),
    );
  }, [merchants, search]);

  return (
    <div>
      <div className="mb-xl">
        <h1 className="font-h1 text-h1 text-on-surface mb-xs">Comercios</h1>
        <p className="text-on-surface-variant font-body-base">Gestión de comercios registrados — KYC, suspensión, métricas.</p>
      </div>

      <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-sm mb-lg flex flex-wrap items-center gap-md">
        <div className="flex-1 min-w-[200px] relative">
          <Icon name="search" className="absolute left-md top-1/2 -translate-y-1/2 text-outline" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, RUC o email..."
            className="w-full pl-xl pr-md py-sm rounded-lg border border-outline-variant focus:ring-1 focus:ring-primary focus:border-primary bg-surface-bright outline-none" />
        </div>
        <select value={kyc} onChange={(e) => setKyc(e.target.value)}
          className="bg-surface-bright border border-outline-variant rounded-lg px-md py-sm text-body-sm outline-none focus:ring-1 focus:ring-primary">
          <option value="">Todos KYC</option>
          <option value="PENDING">Pendiente</option>
          <option value="IN_REVIEW">En revisión</option>
          <option value="APPROVED">Aprobado</option>
          <option value="REJECTED">Rechazado</option>
        </select>
      </div>

      {error && <p className="bg-error-container text-on-error-container px-md py-sm rounded-lg mb-md text-body-sm">{error}</p>}

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant">
                <Th align="left">Comercio</Th>
                <Th align="left">RUC</Th>
                <Th align="left">Email</Th>
                <Th align="center">KYC</Th>
                <Th align="center">Plan</Th>
                <Th align="right">Cobros</Th>
                <Th align="right">Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="px-lg py-xl text-center text-on-surface-variant">Cargando...</td></tr>}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-lg py-xl text-center text-on-surface-variant">Sin comercios.</td></tr>
              )}
              {filtered.map((m) => (
                <tr key={m.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container-low transition">
                  <td className="px-lg py-md">
                    <p className="font-medium text-on-surface">{m.businessName}</p>
                    <p className="text-[11px] text-on-surface-variant font-data-mono">{m.id}</p>
                  </td>
                  <td className="px-lg py-md font-data-mono text-body-sm">{m.ruc}</td>
                  <td className="px-lg py-md text-body-sm">{m.email}</td>
                  <td className="px-lg py-md text-center">
                    <span className={`inline-block px-sm py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${kycBadge[m.kycStatus]}`}>
                      {m.kycStatus}
                    </span>
                  </td>
                  <td className="px-lg py-md text-center text-body-sm font-medium">{m.plan}</td>
                  <td className="px-lg py-md text-right font-data-mono text-body-sm">{m._count?.charges ?? 0}</td>
                  <td className="px-lg py-md text-right">
                    <Link href={`/admin/merchants/${m.id}`} className="text-primary text-body-sm font-medium hover:underline">Detalle →</Link>
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

function Th({ children, align }: { children: React.ReactNode; align: 'left' | 'right' | 'center' }) {
  return <th className={`text-${align} py-md px-lg text-[11px] font-semibold uppercase tracking-widest`}>{children}</th>;
}
