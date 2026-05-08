'use client';
import { useEffect, useState } from 'react';
import { apiFetch, type WebhookEndpoint } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { Icon } from '@/components/icon';

const AVAILABLE_EVENTS = ['charge.paid', 'charge.expired', 'charge.failed'];

export default function WebhooksPage() {
  const [hooks, setHooks] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>(['charge.paid']);
  const [creating, setCreating] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      setHooks(await apiFetch<WebhookEndpoint[]>('/webhooks'));
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const created = await apiFetch<WebhookEndpoint>('/webhooks', {
        method: 'POST',
        body: JSON.stringify({ url, events }),
      });
      setCreatedSecret(created.secret);
      setUrl('');
      setEvents(['charge.paid']);
      await load();
    } catch (err) { setError((err as Error).message); }
    finally { setCreating(false); }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este webhook? Se dejarán de enviar notificaciones.')) return;
    try {
      await apiFetch(`/webhooks/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) { setError((err as Error).message); }
  }

  function toggleEvent(ev: string) {
    setEvents((prev) => prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]);
  }

  return (
    <AppShell breadcrumb={{ section: 'Dashboard', current: 'Webhooks' }}>
      <div className="flex justify-between items-end mb-xl">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface mb-xs">Webhooks</h1>
          <p className="text-on-surface-variant font-body-base">
            Endpoints HTTPS que reciben notificaciones cuando cambia el estado de un cobro. Firma HMAC-SHA256 con header <code className="font-data-mono text-[12px] bg-surface-container px-sm py-unit rounded">CobraPy-Signature</code>.
          </p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setCreatedSecret(null); }}
          className="bg-primary text-on-primary px-xl py-md rounded-lg font-bold flex items-center gap-sm shadow-md hover:bg-primary-container transition active:scale-95">
          <Icon name={showForm ? 'close' : 'add_circle'} />
          {showForm ? 'Cancelar' : 'Nuevo webhook'}
        </button>
      </div>

      {error && <p className="bg-error-container text-on-error-container px-md py-sm rounded-lg mb-md text-body-sm">{error}</p>}

      {createdSecret && (
        <div className="bg-surface-container-lowest border-2 border-primary rounded-xl p-lg mb-lg">
          <div className="flex items-start gap-md">
            <Icon name="key" filled className="text-primary text-h3" />
            <div className="flex-1">
              <h3 className="font-h3 text-h3 mb-xs">Webhook creado — guardá el secret</h3>
              <p className="text-body-sm text-on-surface-variant mb-md">
                Lo necesitás para verificar el HMAC de cada delivery. No se vuelve a mostrar.
              </p>
              <code className="block bg-inverse-surface text-primary-fixed-dim font-api-snippet text-api-snippet p-md rounded-lg break-all">
                {createdSecret}
              </code>
            </div>
            <button onClick={() => setCreatedSecret(null)} aria-label="Cerrar" className="text-on-surface-variant hover:text-on-surface">
              <Icon name="close" />
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={create} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl mb-lg space-y-md">
          <div>
            <label className="font-body-sm font-medium text-on-surface mb-xs block">URL del endpoint</label>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://miapp.com/webhooks/cobrapy" required
              className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg font-data-mono text-body-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label className="font-body-sm font-medium text-on-surface mb-sm block">Eventos a suscribir</label>
            <div className="flex flex-wrap gap-sm">
              {AVAILABLE_EVENTS.map((ev) => (
                <button key={ev} type="button" onClick={() => toggleEvent(ev)}
                  className={`px-md py-sm rounded-lg font-data-mono text-body-sm border transition ${
                    events.includes(ev)
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:border-primary'
                  }`}>
                  {events.includes(ev) && <Icon name="check" className="text-[14px] mr-xs align-middle" />}
                  {ev}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={creating || events.length === 0}
            className="bg-primary text-on-primary font-bold py-md px-xl rounded-lg hover:bg-primary-container transition disabled:opacity-50">
            {creating ? 'Creando...' : 'Crear webhook'}
          </button>
        </form>
      )}

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {loading && <p className="p-xl text-center text-on-surface-variant">Cargando...</p>}
        {!loading && hooks.length === 0 && (
          <div className="p-xl text-center">
            <Icon name="webhook" className="text-outline text-[48px]" />
            <p className="text-on-surface-variant mt-sm">No tenés webhooks registrados.</p>
            <p className="text-body-sm text-on-surface-variant mt-xs">Creá uno para recibir notificaciones de pagos.</p>
          </div>
        )}
        {hooks.map((h) => (
          <div key={h.id} className="px-lg py-md border-b border-outline-variant last:border-0 flex items-center justify-between gap-md">
            <div className="flex-1 min-w-0">
              <p className="font-data-mono text-body-sm text-on-surface truncate">{h.url}</p>
              <div className="flex items-center gap-sm mt-xs flex-wrap">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-sm py-unit rounded ${
                  h.active ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container text-on-surface-variant'
                }`}>{h.active ? 'Activo' : 'Inactivo'}</span>
                {h.events.map((ev) => (
                  <span key={ev} className="text-[11px] font-data-mono bg-surface-container text-on-surface-variant px-sm py-unit rounded">{ev}</span>
                ))}
                <span className="text-[11px] text-on-surface-variant">
                  Creado {new Date(h.createdAt).toLocaleDateString('es-PY')}
                </span>
              </div>
            </div>
            <button onClick={() => remove(h.id)}
              className="text-error hover:bg-error-container/30 p-sm rounded-lg transition" aria-label="Eliminar">
              <Icon name="delete" />
            </button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
