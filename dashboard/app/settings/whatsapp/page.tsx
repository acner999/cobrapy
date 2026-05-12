'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/app-shell';
import { Icon } from '@/components/icon';
import { apiFetch } from '@/lib/api';

interface WaAccount {
  id: string;
  phone: string;
  active: boolean;
  verifiedAt: string | null;
  createdAt: string;
}

export default function WhatsAppSettingsPage() {
  const [accounts, setAccounts] = useState<WaAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<WaAccount[]>('/whatsapp/accounts');
      setAccounts(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiFetch('/whatsapp/accounts', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      setPhone('');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUnlink(id: string) {
    if (!confirm('¿Desvincular este número?')) return;
    try {
      await apiFetch(`/whatsapp/accounts/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <AppShell breadcrumb={{ section: 'Configuración', current: 'WhatsApp' }}>
      <div className="max-w-2xl">
        <div className="mb-xl">
          <h1 className="text-h1 text-on-surface mb-xs">WhatsApp</h1>
          <p className="text-on-surface-variant">Vinculá tu número para cobrar directamente desde WhatsApp.</p>
        </div>

        {/* Info box */}
        <div className="p-lg bg-surface-bright border-l-4 border-primary rounded-r-lg mb-xl flex gap-md">
          <Icon name="info" className="text-primary shrink-0 mt-xs" />
          <div className="text-body-sm text-on-surface-variant space-y-xs">
            <p>El bot responde mensajes como <span className="font-data-mono bg-surface-container px-xs rounded">cobro 150000 a Juan</span> generando un QR de pago automáticamente.</p>
            <p>El número debe estar en formato <strong>E.164</strong>: <span className="font-data-mono">+595981000000</span></p>
          </div>
        </div>

        {/* Formulario */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl shadow-sm mb-lg">
          <h2 className="text-h3 mb-lg flex items-center gap-sm">
            <Icon name="add_circle" className="text-primary" />
            Vincular número
          </h2>
          <form onSubmit={handleLink} className="flex gap-md">
            <div className="relative flex-1">
              <Icon name="phone" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+595981000000"
                required
                pattern="^\+\d{10,15}$"
                className="w-full pl-10 pr-md py-sm border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-data-mono"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-on-primary px-lg py-sm rounded-lg font-bold hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
            >
              {saving ? 'Vinculando...' : 'Vincular'}
            </button>
          </form>
          {error && (
            <p className="mt-sm text-body-sm text-error flex items-center gap-xs">
              <Icon name="error" className="text-[16px]" /> {error}
            </p>
          )}
        </section>

        {/* Lista */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div className="px-xl py-lg border-b border-outline-variant">
            <h2 className="text-h3">Números vinculados</h2>
          </div>
          {loading ? (
            <div className="p-xl text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-xl text-center text-on-surface-variant">
              <Icon name="whatsapp" className="text-5xl mb-md block mx-auto opacity-30" />
              <p>No hay números vinculados.</p>
            </div>
          ) : (
            <ul className="divide-y divide-outline-variant">
              {accounts.map(acc => (
                <li key={acc.id} className="flex items-center justify-between px-xl py-md">
                  <div className="flex items-center gap-md">
                    <Icon name="whatsapp" className="text-[#25D366] text-2xl" />
                    <div>
                      <p className="font-data-mono font-medium text-on-surface">{acc.phone}</p>
                      <p className="text-body-sm text-on-surface-variant">
                        {acc.active ? 'Activo' : 'Inactivo'} · vinculado {new Date(acc.createdAt).toLocaleDateString('es-PY')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-sm">
                    <span className={`text-[10px] font-bold px-sm py-xs rounded-full ${acc.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {acc.active ? 'Activo' : 'Inactivo'}
                    </span>
                    <button
                      onClick={() => handleUnlink(acc.id)}
                      className="p-xs rounded hover:bg-error-container hover:text-error text-on-surface-variant transition-colors"
                      title="Desvincular"
                    >
                      <Icon name="link_off" className="text-[20px]" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
