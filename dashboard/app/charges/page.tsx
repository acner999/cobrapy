'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, clearApiKey, getApiKey, type Charge } from '@/lib/api';

const statusColor: Record<Charge['status'], string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  PAID: 'bg-emerald-100 text-emerald-700',
  EXPIRED: 'bg-zinc-200 text-zinc-700',
  CANCELED: 'bg-zinc-200 text-zinc-700',
  FAILED: 'bg-red-100 text-red-700',
};

export default function ChargesPage() {
  const router = useRouter();
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getApiKey()) { router.replace('/'); return; }
    load();
  }, [router]);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Charge[]>('/charges?limit=50');
      setCharges(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearApiKey();
    router.push('/');
  }

  return (
    <main className="min-h-screen p-6 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-brand">CobraPy</h1>
        <div className="flex gap-3">
          <Link href="/charges/new" className="bg-brand text-white px-4 py-2 rounded-lg font-medium hover:bg-brand-light">
            + Nuevo cobro
          </Link>
          <button onClick={logout} className="text-sm text-zinc-600 hover:text-zinc-900">Salir</button>
        </div>
      </header>

      {error && <p className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</p>}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Monto</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Creado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading && <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Cargando...</td></tr>}
            {!loading && charges.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Todavía no hay cobros. Creá el primero.</td></tr>
            )}
            {charges.map((c) => (
              <tr key={c.id} className="border-t hover:bg-zinc-50">
                <td className="px-4 py-3 font-mono text-xs text-zinc-600">{c.id}</td>
                <td className="px-4 py-3 font-semibold">Gs. {c.amountGs.toLocaleString('es-PY')}</td>
                <td className="px-4 py-3 text-zinc-700">{c.description ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColor[c.status]}`}>{c.status}</span>
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{new Date(c.createdAt).toLocaleString('es-PY')}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/charges/${c.id}`} className="text-brand hover:underline text-sm">Ver QR →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
