'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch, type Charge } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { Icon } from '@/components/icon';

const statusBadge: Record<Charge['status'], { label: string; cls: string }> = {
  PAID:       { label: 'Pagado',     cls: 'bg-secondary-container text-on-secondary-container' },
  PROCESSING: { label: 'Procesando', cls: 'bg-tertiary-fixed text-on-tertiary-fixed-variant' },
  PENDING:    { label: 'Pendiente',  cls: 'bg-tertiary-fixed text-on-tertiary-fixed-variant' },
  EXPIRED:    { label: 'Expirado',   cls: 'bg-surface-container text-on-surface-variant' },
  CANCELED:   { label: 'Cancelado',  cls: 'bg-surface-container text-on-surface-variant' },
  FAILED:     { label: 'Fallido',    cls: 'bg-error-container text-on-error-container' },
};

function fmt(n: number) {
  return n.toLocaleString('es-PY');
}

export default function ChargesPage() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Charge[]>('/charges?limit=100');
      setCharges(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return charges.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (search && !c.id.includes(search) && !(c.description?.includes(search) ?? false)) return false;
      return true;
    });
  }, [charges, search, statusFilter]);

  const today = new Date().toDateString();
  const todayPaid = charges.filter((c) => c.status === 'PAID' && new Date(c.createdAt).toDateString() === today);
  const todayTotal = todayPaid.reduce((s, c) => s + c.amountGs, 0);
  const pending = charges.filter((c) => c.status === 'PENDING').length;
  const paidCount = charges.filter((c) => c.status === 'PAID').length;
  const successRate = charges.length > 0 ? ((paidCount / charges.length) * 100).toFixed(1) : '—';

  return (
    <AppShell breadcrumb={{ section: 'Dashboard', current: 'Cobros' }}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xl">
        <div>
          <h2 className="font-h1 text-h1 text-on-surface mb-xs">Listado de Cobros</h2>
          <p className="text-on-surface-variant font-body-base">Gestioná y monitoreá las transacciones entrantes de tu comercio.</p>
        </div>
        <Link href="/charges/new"
          className="bg-primary hover:bg-primary-container text-on-primary px-xl py-md rounded-lg font-bold flex items-center gap-sm shadow-md transition-all active:scale-95 self-start md:self-auto">
          <Icon name="add_circle" />
          Nuevo cobro
        </Link>
      </div>

      {/* Bento metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-xl">
        <Metric label="Recaudado (Hoy)" icon="payments" iconCls="text-primary"
          value={`Gs. ${fmt(todayTotal)}`} />
        <Metric label="Pendientes" icon="schedule" iconCls="text-tertiary"
          value={String(pending)} />
        <Metric label="Tasa de Éxito" icon="check_circle" iconCls="text-secondary"
          value={typeof successRate === 'string' ? successRate : `${successRate}%`} suffix={successRate === '—' ? '' : '%'} />
        <Metric label="Total cobros" icon="receipt_long" iconCls="text-on-surface-variant"
          value={String(charges.length)} />
      </div>

      {/* Filters */}
      <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-sm mb-lg flex flex-wrap items-center gap-md">
        <div className="flex-1 min-w-[200px] relative">
          <Icon name="search" className="absolute left-md top-1/2 -translate-y-1/2 text-outline" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-xl pr-md py-sm rounded-lg border border-outline-variant focus:ring-1 focus:ring-primary focus:border-primary bg-surface-bright outline-none"
            placeholder="Buscar por ID o descripción..." type="text" />
        </div>
        <div className="flex items-center gap-sm">
          <label className="font-body-sm font-medium text-on-surface-variant">Estado:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface-bright border border-outline-variant rounded-lg px-md py-sm font-body-sm text-on-surface focus:ring-primary focus:border-primary outline-none">
            <option value="">Todos los estados</option>
            <option value="PAID">Pagado</option>
            <option value="PENDING">Pendiente</option>
            <option value="EXPIRED">Expirado</option>
            <option value="FAILED">Fallido</option>
          </select>
        </div>
      </div>

      {error && <p className="bg-error-container text-on-error-container px-md py-sm rounded-lg mb-md text-body-sm">{error}</p>}

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant">
                <Th align="left">ID Transacción</Th>
                <Th align="left">Descripción</Th>
                <Th align="right">Monto</Th>
                <Th align="center">Estado</Th>
                <Th align="left">Fecha</Th>
                <Th align="right">Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-lg py-xl text-center text-on-surface-variant">Cargando...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-lg py-xl text-center text-on-surface-variant">
                  Todavía no hay cobros. <Link href="/charges/new" className="text-primary font-semibold hover:underline">Creá el primero</Link>.
                </td></tr>
              )}
              {filtered.map((c) => {
                const badge = statusBadge[c.status];
                return (
                  <tr key={c.id} className="border-b border-outline-variant last:border-0 hover:bg-surface-container-low transition-colors">
                    <td className="px-lg py-md font-data-mono text-[12px] text-on-surface">{c.id.slice(0, 16)}…</td>
                    <td className="px-lg py-md text-body-sm text-on-surface">{c.description ?? '—'}</td>
                    <td className="px-lg py-md text-right font-data-mono text-body-sm font-medium">Gs. {fmt(c.amountGs)}</td>
                    <td className="px-lg py-md text-center">
                      <span className={`inline-flex items-center px-sm py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-lg py-md text-body-sm text-on-surface-variant">
                      {new Date(c.createdAt).toLocaleString('es-PY', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-lg py-md text-right">
                      <Link href={`/charges/${c.id}`} className="inline-flex items-center gap-xs text-primary font-medium hover:underline text-body-sm">
                        Ver <Icon name="arrow_forward" className="text-[16px]" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

function Metric({ label, icon, iconCls, value, suffix }: { label: string; icon: string; iconCls: string; value: string; suffix?: string }) {
  return (
    <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between h-32">
      <div className="flex justify-between items-start">
        <span className="text-on-surface-variant font-body-sm uppercase tracking-wider font-semibold">{label}</span>
        <Icon name={icon} className={iconCls} />
      </div>
      <p className="font-data-mono text-h2 text-on-surface">{value}{suffix ?? ''}</p>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align: 'left' | 'right' | 'center' }) {
  return <th className={`text-${align} py-md px-lg font-body-sm uppercase tracking-widest text-[11px] font-semibold`}>{children}</th>;
}
