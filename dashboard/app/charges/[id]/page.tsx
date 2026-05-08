'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, getApiKey, type Charge } from '@/lib/api';

export default function ChargeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [charge, setCharge] = useState<Charge | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getApiKey()) { router.replace('/'); return; }
    let timer: ReturnType<typeof setInterval>;
    const load = async () => {
      try {
        const c = await apiFetch<Charge>(`/charges/${params.id}`);
        setCharge(c);
        if (c.status === 'PAID' || c.status === 'EXPIRED' || c.status === 'CANCELED') {
          clearInterval(timer);
        }
      } catch (err) {
        setError((err as Error).message);
        clearInterval(timer);
      }
    };
    load();
    timer = setInterval(load, 3000); // poll cada 3s mientras esté pendiente
    return () => clearInterval(timer);
  }, [params.id, router]);

  if (error) return <main className="p-6"><p className="text-red-600">{error}</p></main>;
  if (!charge) return <main className="p-6">Cargando...</main>;

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto">
      <Link href="/charges" className="text-sm text-zinc-600 hover:text-zinc-900">← Volver</Link>

      <div className="bg-white rounded-xl shadow p-8 mt-4 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-zinc-500">Cobro</p>
            <h1 className="text-3xl font-bold">Gs. {charge.amountGs.toLocaleString('es-PY')}</h1>
            {charge.description && <p className="text-zinc-700 mt-1">{charge.description}</p>}
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            charge.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
            charge.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
            'bg-zinc-200 text-zinc-700'
          }`}>{charge.status}</span>
        </div>

        {charge.qrImageUrl && charge.status === 'PENDING' && (
          <div className="flex flex-col items-center gap-3 py-4 border-y">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={charge.qrImageUrl} alt="QR de pago" className="w-72 h-72" />
            <p className="text-sm text-zinc-600">Escaneá con tu app del banco</p>
          </div>
        )}

        {charge.status === 'PAID' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
            <p className="text-emerald-700 font-semibold">✓ Pago confirmado</p>
          </div>
        )}

        <div className="text-xs text-zinc-500 space-y-1 font-mono">
          <p>ID: {charge.id}</p>
          <p>Creado: {new Date(charge.createdAt).toLocaleString('es-PY')}</p>
          {charge.expiresAt && <p>Expira: {new Date(charge.expiresAt).toLocaleString('es-PY')}</p>}
        </div>

        {charge.status === 'PENDING' && (
          <details className="text-sm border-t pt-4">
            <summary className="cursor-pointer text-zinc-600">Simular pago (modo desarrollo)</summary>
            <SimulatePayButton chargeId={charge.id} />
          </details>
        )}
      </div>
    </main>
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
      setMsg('Pago simulado — recargá en unos segundos');
    } catch (err) { setMsg((err as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <div className="mt-3 space-y-2">
      <input value={token} onChange={(e) => setToken(e.target.value)}
        placeholder="X-Admin-Token (ver .env)" className="w-full border rounded px-3 py-2 text-sm font-mono" />
      <button onClick={fire} disabled={loading || !token}
        className="bg-zinc-800 text-white px-4 py-2 rounded text-sm hover:bg-zinc-700 disabled:opacity-50">
        {loading ? 'Procesando...' : 'Simular pago confirmado'}
      </button>
      {msg && <p className="text-xs text-zinc-600">{msg}</p>}
    </div>
  );
}
