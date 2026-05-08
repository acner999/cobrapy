'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, getApiKey, type Charge } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { Icon } from '@/components/icon';

const statusMeta: Record<Charge['status'], { label: string; tone: 'pending' | 'success' | 'error' | 'neutral' }> = {
  PENDING:    { label: 'Pendiente',  tone: 'pending' },
  PROCESSING: { label: 'Procesando', tone: 'pending' },
  PAID:       { label: 'Pagado',     tone: 'success' },
  EXPIRED:    { label: 'Expirado',   tone: 'neutral' },
  CANCELED:   { label: 'Cancelado',  tone: 'neutral' },
  FAILED:     { label: 'Fallido',    tone: 'error' },
};

export default function ChargeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [charge, setCharge] = useState<Charge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!getApiKey()) { router.replace('/'); return; }
    let timer: ReturnType<typeof setInterval>;
    const load = async () => {
      try {
        const c = await apiFetch<Charge>(`/charges/${params.id}`);
        setCharge(c);
        if (c.status !== 'PENDING' && c.status !== 'PROCESSING') clearInterval(timer);
      } catch (err) {
        setError((err as Error).message);
        clearInterval(timer);
      }
    };
    load();
    timer = setInterval(load, 3000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(timer); clearInterval(tick); };
  }, [params.id, router]);

  if (error) return <AppShell><p className="text-error">{error}</p></AppShell>;
  if (!charge) return <AppShell><p>Cargando...</p></AppShell>;

  const meta = statusMeta[charge.status];
  const expiresMs = charge.expiresAt ? new Date(charge.expiresAt).getTime() - now : 0;
  const expired = expiresMs <= 0;
  const showCountdown = charge.status === 'PENDING' && !expired;
  const m = Math.max(0, Math.floor(expiresMs / 60_000));
  const s = Math.max(0, Math.floor((expiresMs % 60_000) / 1000));

  return (
    <AppShell breadcrumb={{ section: 'Cobros', current: 'Detalle' }}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-lg">
          <button onClick={() => router.push('/charges')}
            className="text-on-surface-variant font-body-sm flex items-center gap-xs hover:text-primary transition-colors">
            <Icon name="arrow_back" className="text-[18px]" />
            Volver al listado
          </button>
          {charge.status === 'PAID' && (
            <button className="text-primary font-bold flex items-center gap-xs text-body-sm hover:underline">
              <Icon name="download" className="text-[18px]" />
              Descargar Comprobante PDF
            </button>
          )}
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-xl text-center border-b border-outline-variant bg-surface-container-low">
            <p className="font-body-sm text-on-surface-variant uppercase tracking-widest mb-xs">Monto Total</p>
            <h1 className="font-h1 text-h1 text-primary font-data-mono">Gs. {charge.amountGs.toLocaleString('es-PY')}</h1>
            {charge.description && (
              <p className="text-on-surface-variant mt-sm font-body-base">{charge.description}</p>
            )}
          </div>

          {/* QR */}
          <div className="p-xl flex flex-col items-center gap-lg">
            <div className="relative">
              <div className="w-[300px] h-[300px] border-4 border-outline-variant rounded-xl p-md bg-white flex items-center justify-center">
                {charge.qrImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={charge.qrImageUrl} alt="Payment QR Code"
                    className={`w-full h-full object-contain ${meta.tone !== 'pending' ? 'grayscale opacity-50' : ''}`} />
                ) : (
                  <div className="text-on-surface-variant">QR no disponible</div>
                )}
              </div>

              {meta.tone === 'success' && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                  <div className="text-center">
                    <Icon name="verified" filled className="text-primary text-[48px]" />
                    <p className="font-body-sm font-bold text-primary mt-xs">PAGO PROCESADO</p>
                  </div>
                </div>
              )}
              {meta.tone === 'neutral' && expired && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                  <div className="text-center">
                    <Icon name="schedule" className="text-on-surface-variant text-[48px]" />
                    <p className="font-body-sm font-bold text-on-surface-variant mt-xs">QR EXPIRADO</p>
                  </div>
                </div>
              )}
              {meta.tone === 'error' && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                  <div className="text-center">
                    <Icon name="cancel" filled className="text-error text-[48px]" />
                    <p className="font-body-sm font-bold text-error mt-xs">PAGO FALLIDO</p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center max-w-xs">
              {charge.status === 'PENDING' && (
                <p className="font-body-base text-on-surface-variant mb-md">
                  Escaneá este código desde tu app bancaria para pagar.
                </p>
              )}
              {showCountdown && (
                <div className="flex items-center justify-center gap-xs text-tertiary font-data-mono bg-tertiary-fixed px-md py-xs rounded-full">
                  <Icon name="schedule" className="text-[18px]" />
                  <span>Expira en: {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="px-xl py-lg bg-surface-container-low grid grid-cols-2 gap-y-md gap-x-lg border-t border-outline-variant">
            <Field label="ID de Transacción" value={charge.id} mono />
            <Field label="Fecha y Hora" value={new Date(charge.createdAt).toLocaleString('es-PY')} mono />
            <div>
              <p className="font-body-sm text-on-surface-variant mb-1">Estado</p>
              <div className="flex items-center gap-xs">
                <span className={`w-2 h-2 rounded-full ${
                  meta.tone === 'success' ? 'bg-secondary' :
                  meta.tone === 'pending' ? 'bg-tertiary' :
                  meta.tone === 'error' ? 'bg-error' : 'bg-outline'
                }`} />
                <span className={`font-body-sm font-bold uppercase ${
                  meta.tone === 'success' ? 'text-secondary' :
                  meta.tone === 'pending' ? 'text-tertiary' :
                  meta.tone === 'error' ? 'text-error' : 'text-on-surface-variant'
                }`}>{meta.label}</span>
              </div>
            </div>
            <Field label="Método" value="SIP / QR Bancario" />
          </div>
        </div>

        {/* Dev simulate */}
        {charge.status === 'PENDING' && (
          <details className="mt-lg bg-surface-container-lowest border border-outline-variant rounded-xl p-md">
            <summary className="cursor-pointer text-on-surface-variant text-body-sm font-medium flex items-center gap-xs">
              <Icon name="science" className="text-[18px]" />
              Simular pago (modo desarrollo)
            </summary>
            <SimulatePayButton chargeId={charge.id} />
          </details>
        )}
      </div>
    </AppShell>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="font-body-sm text-on-surface-variant mb-1">{label}</p>
      <p className={`text-on-surface ${mono ? 'font-data-mono' : 'font-body-sm font-medium'} break-all`}>{value}</p>
    </div>
  );
}

function SimulatePayButton({ chargeId }: { chargeId: string }) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function fire() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/v1'}/admin/charges/${chargeId}/simulate-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token },
        body: '{}',
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg('Pago simulado — la página se actualiza sola en unos segundos.');
    } catch (err) { setMsg((err as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <div className="mt-md space-y-sm">
      <input value={token} onChange={(e) => setToken(e.target.value)}
        placeholder="X-Admin-Token (ver .env del backend)"
        className="w-full border border-outline-variant rounded-lg px-md py-sm text-body-sm font-data-mono outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
      <button onClick={fire} disabled={loading || !token}
        className="bg-inverse-surface text-inverse-on-surface px-md py-sm rounded-lg text-body-sm hover:opacity-90 disabled:opacity-50 transition">
        {loading ? 'Procesando...' : 'Simular pago confirmado'}
      </button>
      {msg && <p className="text-body-sm text-on-surface-variant">{msg}</p>}
    </div>
  );
}
