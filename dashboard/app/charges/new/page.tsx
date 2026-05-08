'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, getApiKey, type Charge } from '@/lib/api';

export default function NewChargePage() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!getApiKey()) router.replace('/'); }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const charge = await apiFetch<Charge>('/charges', {
        method: 'POST',
        body: JSON.stringify({ amountGs: parseInt(amount, 10), description: description || undefined }),
      });
      router.push(`/charges/${charge.id}`);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-6 max-w-md mx-auto">
      <Link href="/charges" className="text-sm text-zinc-600 hover:text-zinc-900">← Volver</Link>
      <h1 className="text-2xl font-bold mt-4 mb-6">Nuevo cobro</h1>

      <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Monto (Gs.)</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            min={1} max={10_000_000} required
            className="w-full border rounded px-3 py-2 text-lg" placeholder="50000" />
          <p className="text-xs text-zinc-500 mt-1">Máximo Gs. 10.000.000 por operación (límite SIP).</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Descripción (opcional)</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded px-3 py-2" placeholder="Almuerzo, Servicio, etc." />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full bg-brand text-white py-3 rounded-lg font-semibold hover:bg-brand-light disabled:opacity-60">
          {loading ? 'Creando...' : 'Generar QR'}
        </button>
      </form>
    </main>
  );
}
