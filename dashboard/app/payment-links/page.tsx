'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { Icon } from '@/components/icon';

interface PaymentLink {
  id: string;
  slug: string;
  title: string | null;
  amountGs: number | null;
  description: string | null;
  expiresAt: string | null;
  maxUses: number | null;
  usesCount: number;
  active: boolean;
  createdAt: string;
}

function formatAmount(amount: number | null) {
  if (amount === null) return 'Gs. —';
  return `Gs. ${amount.toLocaleString('es-PY')}`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return 'Sin fecha';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

export default function PaymentLinksPage() {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    amountGs: '',
    description: '',
    expiresAt: '',
    maxUses: '',
  });

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment-links`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('cobrapy_user_token')}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLinks(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const createLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: any = {};
    if (form.title) body.title = form.title;
    if (form.amountGs) body.amountGs = parseInt(form.amountGs);
    if (form.description) body.description = form.description;
    if (form.expiresAt) body.expiresAt = form.expiresAt;
    if (form.maxUses) body.maxUses = parseInt(form.maxUses);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment-links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('cobrapy_user_token')}`,
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setShowForm(false);
      setForm({ title: '', amountGs: '', description: '', expiresAt: '', maxUses: '' });
      fetchLinks();
    }
  };

  const deactivate = async (id: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment-links/${id}/deactivate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('cobrapy_user_token')}` },
    });
    if (res.ok) fetchLinks();
  };

  const copyLink = (slug: string, id: string) => {
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeLinks = links.filter(l => l.active && !isExpired(l.expiresAt));
  const totalRecaudation = links.reduce((acc, l) => acc + (l.amountGs || 0) * l.usesCount, 0);
  const conversion = links.length > 0 ? Math.round((links.filter(l => l.usesCount > 0).length / links.length) * 100) : 0;

  return (
    <AppShell breadcrumb={{ section: 'Dashboard', current: 'Links de Pago' }}>
      <div className="max-w-6xl mx-auto space-y-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
          <div>
            <h2 className="text-h1 text-on-surface mb-xs">Links de Pago</h2>
            <p className="text-body-base text-on-surface-variant">Generá links para cobrar por WhatsApp o redes sociales.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary text-on-primary px-lg py-md rounded-xl flex items-center gap-sm font-bold shadow-sm hover:opacity-80 transition-all active:scale-95"
          >
            <Icon name="add" />
            Nuevo Link
          </button>
        </div>

        {showForm && (
          <form onSubmit={createLink} className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm">
            <h3 className="font-h3 text-h3 text-on-surface mb-md">Crear nuevo link de pago</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase tracking-widest mb-xs">Título</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ej: Pago de factura"
                  className="w-full px-md py-sm border border-outline-variant rounded-lg bg-surface-container-low text-on-surface"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase tracking-widest mb-xs">Monto (PYG)</label>
                <input
                  type="number"
                  value={form.amountGs}
                  onChange={(e) => setForm({ ...form, amountGs: e.target.value })}
                  placeholder="Vacío = cliente elige"
                  className="w-full px-md py-sm border border-outline-variant rounded-lg bg-surface-container-low text-on-surface font-data-mono"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-outline uppercase tracking-widest mb-xs">Descripción</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ej: Servicio de instalación"
                  className="w-full px-md py-sm border border-outline-variant rounded-lg bg-surface-container-low text-on-surface"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase tracking-widest mb-xs">Expira (opcional)</label>
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="w-full px-md py-sm border border-outline-variant rounded-lg bg-surface-container-low text-on-surface"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-outline uppercase tracking-widest mb-xs">Usos máximos (opcional)</label>
                <input
                  type="number"
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                  placeholder="Ilimitado"
                  className="w-full px-md py-sm border border-outline-variant rounded-lg bg-surface-container-low text-on-surface"
                />
              </div>
            </div>
            <div className="flex gap-md mt-lg">
              <button type="submit" className="bg-primary text-on-primary px-lg py-sm rounded-lg font-bold hover:opacity-80">
                Crear Link
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-lg py-sm border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
          <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm flex flex-col gap-sm">
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant font-body-sm font-medium">Links Activos</span>
              <Icon name="link" className="text-primary-container" />
            </div>
            <div className="text-h1">{activeLinks.length}</div>
            <div className="text-[12px] text-primary flex items-center gap-xs font-medium">
              <Icon name="trending_up" className="text-[14px]" />
              {links.length} total
            </div>
          </div>
          <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm flex flex-col gap-sm">
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant font-body-sm font-medium">Recaudación Total</span>
              <Icon name="payments" className="text-primary-container" />
            </div>
            <div className="text-h1 font-data-mono">Gs. {totalRecaudation.toLocaleString('es-PY')}</div>
            <div className="text-[12px] text-on-surface-variant font-medium">Últimos 30 días</div>
          </div>
          <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm flex flex-col gap-sm">
            <div className="flex items-center justify-between">
              <span className="text-on-surface-variant font-body-sm font-medium">Conversión</span>
              <Icon name="ads_click" className="text-primary-container" />
            </div>
            <div className="text-h1">{conversion}%</div>
            <div className="text-[12px] text-primary-container font-medium">Eficiencia de pago</div>
          </div>
        </div>

        <div className="space-y-md">
          <h3 className="font-h3 text-h3 text-on-surface flex items-center gap-sm">
            <Icon name="list" />
            Tus Links Recientes
          </h3>

          {loading ? (
            <div className="text-center py-8 text-on-surface-variant">Cargando...</div>
          ) : links.length === 0 ? (
            <div className="text-center py-12 bg-surface-container-lowest rounded-xl border border-outline-variant">
              <Icon name="link" className="text-4xl text-on-surface-variant mb-md" />
              <p className="text-on-surface-variant">No hay links de pago todavía</p>
              <p className="text-body-sm text-on-surface-variant">Creá tu primer link para cobrar por WhatsApp</p>
            </div>
          ) : (
            links.map((link) => {
              const expired = isExpired(link.expiresAt);
              return (
                <div
                  key={link.id}
                  className={`bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden transition-all hover:shadow-md ${expired ? 'opacity-70 bg-surface-container-high/30' : ''}`}
                >
                  <div className="p-lg">
                    <div className="flex justify-between items-start mb-md">
                      <div className="flex items-center gap-md">
                        <h4 className="font-h3 text-h3 text-on-surface">{link.title || 'Sin título'}</h4>
                        <span className={`px-sm py-[2px] rounded-full text-[12px] font-bold uppercase tracking-wider border ${expired ? 'bg-surface-container-highest text-on-surface-variant border-outline' : 'bg-primary-container/10 text-primary border-primary/20'}`}>
                          {expired ? 'Expirado' : link.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      {!expired && link.active && (
                        <div className="flex items-center gap-sm">
                          <button
                            onClick={() => deactivate(link.id)}
                            className="p-xs rounded-lg hover:bg-error-container hover:text-error transition-colors text-on-surface-variant"
                          >
                            <Icon name="cancel" className="text-[20px]" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-lg">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-outline uppercase tracking-widest mb-xs">Monto</span>
                        <span className="font-data-mono text-h3 text-on-surface">{formatAmount(link.amountGs)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-outline uppercase tracking-widest mb-xs">Utilización</span>
                        <span className="font-body-base text-on-surface">
                          {link.usesCount} usos
                          {link.maxUses ? <span className="text-on-surface-variant text-body-sm"> / {link.maxUses}</span> : <span className="text-on-surface-variant text-body-sm"> / Ilimitado</span>}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-outline uppercase tracking-widest mb-xs">{expired ? 'Finalizado' : 'Expiración'}</span>
                        <span className="font-body-base text-on-surface">{formatDate(link.expiresAt)}</span>
                      </div>
                    </div>
                    <div className="relative group">
                      <div className="flex items-center justify-between p-md bg-surface-container-low rounded-lg border border-outline-variant/30">
                        <code className="font-api-snippet text-on-surface-variant truncate mr-lg">
                          {typeof window !== 'undefined' ? window.location.origin : ''}/p/{link.slug}
                        </code>
                        <button
                          onClick={() => copyLink(link.slug, link.id)}
                          className="flex items-center gap-xs text-primary font-bold hover:opacity-70 transition-opacity"
                        >
                          <Icon name={copiedId === link.id ? 'check' : 'content_copy'} className="text-[18px]" />
                          <span className="text-body-sm">{copiedId === link.id ? 'Copiado' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="bg-primary/5 border-l-4 border-primary p-lg rounded-r-xl flex gap-md items-start">
          <Icon name="info" className="text-primary" style={{ fontVariationSettings: "'FILL' 1" }} />
          <div>
            <h4 className="font-body-base font-bold text-primary">¿Sabías que podés automatizar tus links?</h4>
            <p className="font-body-sm text-on-surface-variant">Podés usar nuestra API para generar links de pago dinámicos integrados directamente en tu plataforma de e-commerce o sistema de facturación.</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}