'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setApiKey, getApiKey, publicFetch } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [apiKey, setApiKeyInput] = useState('');
  const [form, setForm] = useState({ businessName: '', ruc: '', email: '', phone: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  useEffect(() => {
    if (getApiKey()) router.replace('/charges');
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setApiKey(apiKey);
    router.push('/charges');
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await publicFetch<{ merchant: { id: string }; apiKey: { secret: string } }>(
        '/merchants',
        { method: 'POST', body: JSON.stringify(form) },
      );
      setNewKey(res.apiKey.secret);
      setApiKey(res.apiKey.secret);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (newKey) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 space-y-4">
          <h1 className="text-2xl font-bold text-brand">Cuenta creada</h1>
          <p className="text-zinc-700">Guardá esta API key — no se vuelve a mostrar.</p>
          <code className="block bg-zinc-100 p-4 rounded text-sm break-all">{newKey}</code>
          <button
            onClick={() => router.push('/charges')}
            className="w-full bg-brand text-white py-3 rounded-lg font-semibold hover:bg-brand-light"
          >
            Continuar al dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-brand">CobraPy</h1>
          <p className="text-zinc-600 text-sm">Cobros instantáneos sobre el SIP</p>
        </div>

        <div className="flex gap-2 text-sm">
          <button
            className={`flex-1 py-2 rounded ${mode === 'login' ? 'bg-brand text-white' : 'bg-zinc-100'}`}
            onClick={() => setMode('login')}
          >Ingresar</button>
          <button
            className={`flex-1 py-2 rounded ${mode === 'signup' ? 'bg-brand text-white' : 'bg-zinc-100'}`}
            onClick={() => setMode('signup')}
          >Crear cuenta</button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">API Key</label>
              <input
                value={apiKey}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="ck_test_..."
                className="w-full border rounded px-3 py-2 font-mono text-sm"
                required
              />
            </div>
            <button className="w-full bg-brand text-white py-3 rounded-lg font-semibold hover:bg-brand-light">
              Ingresar
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-3">
            <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              placeholder="Nombre del comercio" className="w-full border rounded px-3 py-2" required />
            <input value={form.ruc} onChange={(e) => setForm({ ...form, ruc: e.target.value })}
              placeholder="RUC (ej: 80012345-6)" className="w-full border rounded px-3 py-2" required />
            <input value={form.email} type="email" onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email" className="w-full border rounded px-3 py-2" required />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Teléfono (opcional)" className="w-full border rounded px-3 py-2" />
            <button disabled={loading} className="w-full bg-brand text-white py-3 rounded-lg font-semibold hover:bg-brand-light disabled:opacity-60">
              {loading ? 'Creando...' : 'Crear cuenta'}
            </button>
          </form>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </main>
  );
}
