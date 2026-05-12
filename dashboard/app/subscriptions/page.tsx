'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/app-shell';
import { Icon } from '@/components/icon';
import { apiFetch, getUserToken } from '@/lib/api';

type BillingInterval = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
type SubStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'PAUSED' | 'CANCELED';

interface Plan {
  id: string; name: string; description: string | null;
  amountGs: number; interval: BillingInterval; intervalCount: number;
  trialDays: number | null; active: boolean; createdAt: string;
  activeSubscribers: number;
}

interface Subscription {
  id: string; planId: string; customerEmail: string; customerName: string;
  customerPhone: string | null; status: SubStatus;
  currentPeriodStart: string; currentPeriodEnd: string; nextChargeAt: string;
  trialEndsAt: string | null; canceledAt: string | null; createdAt: string;
  plan: Plan;
}

interface Stats { activePlans: number; activeSubscribers: number; mrrGs: number }

const INTERVAL_LABELS: Record<BillingInterval, string> = {
  DAILY: 'Diario', WEEKLY: 'Semanal', MONTHLY: 'Mensual', YEARLY: 'Anual',
};

const STATUS_STYLES: Record<SubStatus, { label: string; cls: string }> = {
  TRIALING:  { label: 'Prueba',    cls: 'bg-blue-100 text-blue-800' },
  ACTIVE:    { label: 'Activo',    cls: 'bg-green-100 text-green-800' },
  PAST_DUE:  { label: 'Vencido',   cls: 'bg-red-100 text-red-800' },
  PAUSED:    { label: 'Pausado',   cls: 'bg-yellow-100 text-yellow-800' },
  CANCELED:  { label: 'Cancelado', cls: 'bg-gray-100 text-gray-600' },
};

export default function SubscriptionsPage() {
  const [tab, setTab] = useState<'plans' | 'subscribers'>('plans');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showSubForm, setShowSubForm] = useState(false);
  const [planForm, setPlanForm] = useState({ name: '', description: '', amountGs: '', interval: 'MONTHLY' as BillingInterval, intervalCount: 1, trialDays: '' });
  const [subForm, setSubForm] = useState({ planId: '', customerEmail: '', customerName: '', customerPhone: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, s, st] = await Promise.all([
        apiFetch<Plan[]>('/subscriptions/plans'),
        apiFetch<Subscription[]>('/subscriptions'),
        apiFetch<Stats>('/subscriptions/stats'),
      ]);
      setPlans(p); setSubs(s); setStats(st);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      await apiFetch('/subscriptions/plans', {
        method: 'POST',
        body: JSON.stringify({ ...planForm, amountGs: Number(planForm.amountGs), trialDays: planForm.trialDays ? Number(planForm.trialDays) : undefined }),
      });
      setShowPlanForm(false);
      setPlanForm({ name: '', description: '', amountGs: '', interval: 'MONTHLY', intervalCount: 1, trialDays: '' });
      await load();
    } catch (e) { alert((e as Error).message); }
    finally { setSaving(false); }
  }

  async function handleTogglePlan(id: string) {
    await apiFetch(`/subscriptions/plans/${id}/toggle`, { method: 'PATCH' });
    await load();
  }

  async function handleDeletePlan(id: string) {
    if (!confirm('¿Eliminar este plan?')) return;
    try {
      await apiFetch(`/subscriptions/plans/${id}`, { method: 'DELETE' });
      await load();
    } catch (e) { alert((e as Error).message); }
  }

  async function handleCreateSub(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      await apiFetch('/subscriptions', { method: 'POST', body: JSON.stringify(subForm) });
      setShowSubForm(false);
      setSubForm({ planId: '', customerEmail: '', customerName: '', customerPhone: '' });
      await load();
    } catch (e) { alert((e as Error).message); }
    finally { setSaving(false); }
  }

  async function handleSubAction(id: string, action: 'cancel' | 'pause' | 'resume') {
    await apiFetch(`/subscriptions/${id}/${action}`, { method: 'PATCH' });
    await load();
  }

  const fmt = (n: number) => new Intl.NumberFormat('es-PY').format(n);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-PY');

  if (loading) return (
    <AppShell breadcrumb={{ section: 'Negocio', current: 'Suscripciones' }}>
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    </AppShell>
  );

  return (
    <AppShell breadcrumb={{ section: 'Negocio', current: 'Suscripciones' }}>
      {/* Header */}
      <div className="mb-xl flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div>
          <h1 className="text-h1 text-on-surface mb-xs">Suscripciones</h1>
          <p className="text-on-surface-variant">Gestioná planes recurrentes y tus suscriptores.</p>
        </div>
        <button
          onClick={() => tab === 'plans' ? setShowPlanForm(true) : setShowSubForm(true)}
          className="bg-primary text-on-primary px-lg py-md rounded-xl flex items-center gap-sm font-bold shadow-sm hover:opacity-90"
        >
          <Icon name="add" />
          {tab === 'plans' ? 'Nuevo Plan' : 'Nuevo Suscriptor'}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-md mb-xl">
          {[
            { label: 'Planes activos',     value: stats.activePlans,       icon: 'layers' },
            { label: 'Suscriptores activos', value: stats.activeSubscribers, icon: 'group' },
            { label: 'MRR',                value: `₲ ${fmt(stats.mrrGs)}`, icon: 'trending_up' },
          ].map(s => (
            <div key={s.label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm">
              <div className="flex items-center gap-sm mb-sm">
                <Icon name={s.icon} className="text-primary" />
                <span className="text-body-sm text-on-surface-variant">{s.label}</span>
              </div>
              <p className="text-h2 font-bold text-on-surface">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-xs mb-lg border-b border-outline-variant">
        {(['plans', 'subscribers'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-lg py-sm font-medium text-body-sm border-b-2 -mb-px transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
            {t === 'plans' ? `Planes (${plans.length})` : `Suscriptores (${subs.length})`}
          </button>
        ))}
      </div>

      {/* ── PLANES ── */}
      {tab === 'plans' && (
        <>
          {showPlanForm && (
            <form onSubmit={handleCreatePlan} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl mb-lg shadow-sm">
              <h3 className="text-h3 mb-lg">Nuevo Plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="space-y-xs">
                  <label className="text-body-sm font-medium text-on-surface-variant">Nombre</label>
                  <input className="w-full p-md border border-outline-variant rounded-lg outline-none focus:ring-1 focus:ring-primary"
                    value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} required />
                </div>
                <div className="space-y-xs">
                  <label className="text-body-sm font-medium text-on-surface-variant">Monto (₲)</label>
                  <input type="number" className="w-full p-md border border-outline-variant rounded-lg font-data-mono outline-none focus:ring-1 focus:ring-primary"
                    value={planForm.amountGs} onChange={e => setPlanForm({ ...planForm, amountGs: e.target.value })} required />
                </div>
                <div className="space-y-xs">
                  <label className="text-body-sm font-medium text-on-surface-variant">Intervalo</label>
                  <select className="w-full p-md border border-outline-variant rounded-lg outline-none focus:ring-1 focus:ring-primary"
                    value={planForm.interval} onChange={e => setPlanForm({ ...planForm, interval: e.target.value as BillingInterval })}>
                    {Object.entries(INTERVAL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-xs">
                  <label className="text-body-sm font-medium text-on-surface-variant">Días de prueba (opcional)</label>
                  <input type="number" className="w-full p-md border border-outline-variant rounded-lg outline-none focus:ring-1 focus:ring-primary"
                    value={planForm.trialDays} onChange={e => setPlanForm({ ...planForm, trialDays: e.target.value })} placeholder="0" />
                </div>
                <div className="space-y-xs md:col-span-2">
                  <label className="text-body-sm font-medium text-on-surface-variant">Descripción (opcional)</label>
                  <input className="w-full p-md border border-outline-variant rounded-lg outline-none focus:ring-1 focus:ring-primary"
                    value={planForm.description} onChange={e => setPlanForm({ ...planForm, description: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-md mt-lg">
                <button type="submit" disabled={saving} className="bg-primary text-on-primary px-lg py-sm rounded-lg font-bold hover:opacity-90 disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Crear Plan'}
                </button>
                <button type="button" onClick={() => setShowPlanForm(false)} className="px-lg py-sm border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-container">
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
            {plans.length === 0 ? (
              <div className="md:col-span-3 text-center py-xl text-on-surface-variant">
                <Icon name="layers" className="text-5xl mb-md block mx-auto" />
                <p>No hay planes creados. Creá el primero.</p>
              </div>
            ) : plans.map(plan => (
              <div key={plan.id} className={`bg-surface-container-lowest border rounded-xl p-lg shadow-sm ${plan.active ? 'border-outline-variant' : 'border-outline-variant opacity-60'}`}>
                <div className="flex items-start justify-between mb-sm">
                  <div>
                    <h3 className="font-bold text-on-surface">{plan.name}</h3>
                    {plan.description && <p className="text-body-sm text-on-surface-variant">{plan.description}</p>}
                  </div>
                  <span className={`text-[10px] font-bold px-sm py-xs rounded-full ${plan.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {plan.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="text-h2 font-bold text-primary mb-xs">₲ {fmt(plan.amountGs)}</p>
                <p className="text-body-sm text-on-surface-variant mb-md">
                  {INTERVAL_LABELS[plan.interval]}{plan.intervalCount > 1 ? ` cada ${plan.intervalCount}` : ''}
                  {plan.trialDays ? ` · ${plan.trialDays}d prueba` : ''}
                </p>
                <div className="flex items-center justify-between border-t border-outline-variant pt-md">
                  <span className="text-body-sm text-on-surface-variant flex items-center gap-xs">
                    <Icon name="group" className="text-[16px]" /> {plan.activeSubscribers} activos
                  </span>
                  <div className="flex gap-xs">
                    <button onClick={() => handleTogglePlan(plan.id)} className="p-xs rounded hover:bg-surface-container text-on-surface-variant" title={plan.active ? 'Desactivar' : 'Activar'}>
                      <Icon name={plan.active ? 'pause' : 'play_arrow'} className="text-[18px]" />
                    </button>
                    <button onClick={() => handleDeletePlan(plan.id)} className="p-xs rounded hover:bg-error-container hover:text-error text-on-surface-variant" title="Eliminar">
                      <Icon name="delete" className="text-[18px]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── SUSCRIPTORES ── */}
      {tab === 'subscribers' && (
        <>
          {showSubForm && (
            <form onSubmit={handleCreateSub} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl mb-lg shadow-sm">
              <h3 className="text-h3 mb-lg">Nuevo Suscriptor</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="space-y-xs md:col-span-2">
                  <label className="text-body-sm font-medium text-on-surface-variant">Plan</label>
                  <select className="w-full p-md border border-outline-variant rounded-lg outline-none focus:ring-1 focus:ring-primary"
                    value={subForm.planId} onChange={e => setSubForm({ ...subForm, planId: e.target.value })} required>
                    <option value="">Seleccionar plan...</option>
                    {plans.filter(p => p.active).map(p => (
                      <option key={p.id} value={p.id}>{p.name} — ₲ {fmt(p.amountGs)} / {INTERVAL_LABELS[p.interval]}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-xs">
                  <label className="text-body-sm font-medium text-on-surface-variant">Nombre del cliente</label>
                  <input className="w-full p-md border border-outline-variant rounded-lg outline-none focus:ring-1 focus:ring-primary"
                    value={subForm.customerName} onChange={e => setSubForm({ ...subForm, customerName: e.target.value })} required />
                </div>
                <div className="space-y-xs">
                  <label className="text-body-sm font-medium text-on-surface-variant">Email</label>
                  <input type="email" className="w-full p-md border border-outline-variant rounded-lg outline-none focus:ring-1 focus:ring-primary"
                    value={subForm.customerEmail} onChange={e => setSubForm({ ...subForm, customerEmail: e.target.value })} required />
                </div>
                <div className="space-y-xs">
                  <label className="text-body-sm font-medium text-on-surface-variant">Teléfono (opcional)</label>
                  <input className="w-full p-md border border-outline-variant rounded-lg outline-none focus:ring-1 focus:ring-primary"
                    value={subForm.customerPhone} onChange={e => setSubForm({ ...subForm, customerPhone: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-md mt-lg">
                <button type="submit" disabled={saving} className="bg-primary text-on-primary px-lg py-sm rounded-lg font-bold hover:opacity-90 disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Suscribir'}
                </button>
                <button type="button" onClick={() => setShowSubForm(false)} className="px-lg py-sm border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-container">
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            {subs.length === 0 ? (
              <div className="p-xl text-center text-on-surface-variant">
                <Icon name="group" className="text-5xl mb-md block mx-auto" />
                <p>No hay suscriptores aún.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">
                    <tr>
                      <th className="px-lg py-md">Cliente</th>
                      <th className="px-lg py-md">Plan</th>
                      <th className="px-lg py-md">Estado</th>
                      <th className="px-lg py-md">Próximo cobro</th>
                      <th className="px-lg py-md text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {subs.map(sub => {
                      const { label, cls } = STATUS_STYLES[sub.status];
                      return (
                        <tr key={sub.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-lg py-md">
                            <p className="font-medium text-on-surface">{sub.customerName}</p>
                            <p className="text-body-sm text-on-surface-variant">{sub.customerEmail}</p>
                          </td>
                          <td className="px-lg py-md">
                            <p className="font-medium text-on-surface">{sub.plan.name}</p>
                            <p className="text-body-sm text-on-surface-variant font-data-mono">₲ {fmt(sub.plan.amountGs)}</p>
                          </td>
                          <td className="px-lg py-md">
                            <span className={`px-sm py-xs rounded-full text-[10px] font-bold uppercase ${cls}`}>{label}</span>
                          </td>
                          <td className="px-lg py-md text-on-surface-variant text-body-sm">
                            {sub.status === 'CANCELED' ? '—' : fmtDate(sub.nextChargeAt)}
                          </td>
                          <td className="px-lg py-md text-right">
                            <div className="flex items-center justify-end gap-xs">
                              {sub.status === 'ACTIVE' && (
                                <button onClick={() => handleSubAction(sub.id, 'pause')} title="Pausar"
                                  className="p-xs rounded hover:bg-surface-container text-on-surface-variant">
                                  <Icon name="pause" className="text-[18px]" />
                                </button>
                              )}
                              {sub.status === 'PAUSED' && (
                                <button onClick={() => handleSubAction(sub.id, 'resume')} title="Reanudar"
                                  className="p-xs rounded hover:bg-surface-container text-on-surface-variant">
                                  <Icon name="play_arrow" className="text-[18px]" />
                                </button>
                              )}
                              {sub.status !== 'CANCELED' && (
                                <button onClick={() => handleSubAction(sub.id, 'cancel')} title="Cancelar"
                                  className="p-xs rounded hover:bg-error-container hover:text-error text-on-surface-variant">
                                  <Icon name="cancel" className="text-[18px]" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}
