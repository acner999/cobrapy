'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, type Charge } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { Icon } from '@/components/icon';

const MAX_GS = 10_000_000;

export default function NewChargePage() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [externalId, setExternalId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const amountNum = parseInt(amount.replace(/\D/g, ''), 10) || 0;
  const overLimit = amountNum > MAX_GS;
  const formatted = amountNum > 0 ? amountNum.toLocaleString('es-PY') : '';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (amountNum < 1 || overLimit) return;
    setError(null);
    setLoading(true);
    try {
      const charge = await apiFetch<Charge>('/charges', {
        method: 'POST',
        body: JSON.stringify({
          amountGs: amountNum,
          description: description || undefined,
          externalId: externalId || undefined,
        }),
      });
      router.push(`/charges/${charge.id}`);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <AppShell breadcrumb={{ section: 'Cobros', current: 'Nuevo cobro' }}>
      <div className="max-w-xl mx-auto">
        <div className="mb-xl">
          <h1 className="font-h1 text-h1 text-on-surface">Nuevo Cobro</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-sm">
            Generá un QR de pago instantáneo para tu cliente. El QR es interoperable con cualquier banco vía SIP.
          </p>
        </div>

        <form onSubmit={submit} className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
          <div className="p-xl space-y-xl">
            <div className="space-y-sm">
              <label htmlFor="amount" className="font-body-sm text-body-sm font-medium text-on-surface">Monto del Cobro</label>
              <div className="relative flex items-center">
                <span className="absolute left-md font-h2 text-h2 text-outline-variant select-none">Gs.</span>
                <input id="amount" type="text" inputMode="numeric"
                  value={formatted} onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-20 pr-md py-lg border border-outline-variant rounded-lg font-data-mono text-[32px] leading-tight focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-surface-container-low text-on-surface outline-none" />
              </div>
              <p className={`font-body-sm text-body-sm flex items-center gap-xs ${overLimit ? 'text-error' : 'text-on-surface-variant'}`}>
                <Icon name="info" className="text-[16px]" />
                Límite SIP: Gs. {fmt(MAX_GS)} por operación
              </p>
            </div>

            <div className="space-y-sm">
              <label htmlFor="desc" className="font-body-sm text-body-sm font-medium text-on-surface">Descripción</label>
              <input id="desc" value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Pago por consultoría"
                className="w-full px-md py-md border border-outline-variant rounded-lg font-body-base text-body-base focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest outline-none" />
            </div>

            <div className="space-y-sm">
              <label htmlFor="ref" className="font-body-sm text-body-sm font-medium text-on-surface">
                Referencia externa <span className="text-on-surface-variant text-xs">(Opcional)</span>
              </label>
              <input id="ref" value={externalId} onChange={(e) => setExternalId(e.target.value)}
                placeholder="Ej: FAC-001-2026"
                className="w-full px-md py-md border border-outline-variant rounded-lg font-data-mono text-body-base focus:ring-2 focus:ring-primary focus:border-primary bg-surface-container-lowest outline-none" />
              <p className="font-body-sm text-[12px] text-on-surface-variant">
                Si volvés a mandar el mismo external ID, te devolvemos el cobro existente (idempotencia).
              </p>
            </div>

            {error && (
              <p className="font-body-sm text-body-sm text-error flex items-center gap-xs">
                <Icon name="error" className="text-[16px]" /> {error}
              </p>
            )}

            <button type="submit" disabled={loading || amountNum < 1 || overLimit}
              className="w-full bg-primary py-lg rounded-xl text-on-primary font-bold text-lg flex items-center justify-center gap-md shadow-lg hover:bg-primary-container transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
              <Icon name="qr_code_2" />
              {loading ? 'Generando...' : 'Generar QR de pago'}
            </button>
          </div>
        </form>

        <div className="mt-xl grid grid-cols-2 gap-md">
          <InfoCard icon="bolt" title="Instantáneo" body="La acreditación llega en segundos a la cuenta vinculada." />
          <InfoCard icon="shield" title="Seguro" body="Cifrado de grado bancario y tokens únicos por QR." />
        </div>
      </div>
    </AppShell>
  );
}

function fmt(n: number) { return n.toLocaleString('es-PY'); }

function InfoCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="p-md rounded-xl border border-outline-variant bg-surface-container">
      <div className="flex items-center gap-sm mb-xs text-primary">
        <Icon name={icon} />
        <span className="font-bold text-body-sm uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-[12px] text-on-surface-variant leading-tight">{body}</p>
    </div>
  );
}
