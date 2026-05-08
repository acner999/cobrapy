'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setApiKey, getApiKey, publicFetch } from '@/lib/api';
import { Icon } from '@/components/icon';

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [apiKey, setApiKeyInput] = useState('');
  const [form, setForm] = useState({ businessName: '', ruc: '', email: '', phone: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getApiKey()) router.replace('/charges');
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
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
      setApiKey(res.apiKey.secret);
      router.push(`/onboarding/api-key?key=${encodeURIComponent(res.apiKey.secret)}`);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full px-lg py-md border-b border-outline-variant bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-h2 text-h2 font-bold text-primary">CobraPy</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Infraestructura Fintech para Paraguay</p>
          </div>
          <div className="flex items-center gap-sm text-on-surface-variant text-body-sm">
            <Icon name="lock" className="text-[18px]" />
            <span className="hidden sm:inline">Conexión encriptada de grado bancario</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-lg">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-xl">
          <div className="mb-xl">
            <h2 className="font-h1 text-h1 text-on-surface mb-xs">
              {mode === 'signup' ? 'Crear cuenta' : 'Ingresar'}
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {mode === 'signup'
                ? 'Comenzá a cobrar con QR sobre el SIP en menos de 5 minutos.'
                : 'Pegá tu API key para acceder al dashboard.'}
            </p>
          </div>

          <div className="flex gap-xs mb-lg p-unit bg-surface-container rounded-lg text-body-sm">
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-sm rounded-md font-medium transition ${mode === 'signup' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'}`}
            >
              Crear cuenta
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-sm rounded-md font-medium transition ${mode === 'login' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'}`}
            >
              Tengo API key
            </button>
          </div>

          {mode === 'signup' ? (
            <form onSubmit={handleSignup} className="flex flex-col gap-md">
              <Field id="bn" label="Nombre del comercio" icon="store"
                value={form.businessName} onChange={(v) => setForm({ ...form, businessName: v })}
                placeholder="Ej. Cafetería El Tereré" required />
              <Field id="ruc" label="RUC" icon="badge" hint="Usá el formato con dígito verificador."
                value={form.ruc} onChange={(v) => setForm({ ...form, ruc: v })}
                placeholder="Ej. 80012345-1" required />
              <Field id="email" label="Correo electrónico" icon="mail" type="email"
                value={form.email} onChange={(v) => setForm({ ...form, email: v })}
                placeholder="admin@comercio.com.py" required />
              <Field id="phone" label="Teléfono" icon="call" type="tel"
                value={form.phone} onChange={(v) => setForm({ ...form, phone: v })}
                placeholder="Ej. 0981 123 456" />

              {error && <p className="font-body-sm text-body-sm text-error flex items-center gap-xs">
                <Icon name="error" className="text-[16px]" /> {error}
              </p>}

              <button disabled={loading} type="submit"
                className="w-full mt-sm bg-primary text-on-primary font-bold py-md rounded-lg hover:bg-primary-container transition shadow-sm active:scale-[0.98] disabled:opacity-60">
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="flex flex-col gap-md">
              <Field id="key" label="API Key" icon="vpn_key" mono
                value={apiKey} onChange={setApiKeyInput}
                placeholder="ck_test_..." required />
              <button type="submit"
                className="w-full mt-sm bg-primary text-on-primary font-bold py-md rounded-lg hover:bg-primary-container transition shadow-sm active:scale-[0.98]">
                Ingresar
              </button>
            </form>
          )}

          <div className="mt-xl pt-lg border-t border-outline-variant text-center">
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {mode === 'signup' ? '¿Ya tenés cuenta? ' : '¿Sos nuevo? '}
              <button onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
                className="text-primary font-semibold hover:underline">
                {mode === 'signup' ? 'Iniciar sesión' : 'Crear cuenta'}
              </button>
            </p>
          </div>
        </div>
      </main>

      <footer className="w-full py-lg bg-surface-container-highest border-t border-outline-variant">
        <p className="font-body-sm text-[12px] text-on-surface-variant text-center px-lg">
          © 2026 CobraPy. Al registrarte, aceptás nuestros{' '}
          <a className="underline" href="#">Términos de Servicio</a> y{' '}
          <a className="underline" href="#">Política de Privacidad</a>.
        </p>
      </footer>
    </div>
  );
}

interface FieldProps {
  id: string; label: string; icon: string; type?: string; mono?: boolean;
  value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; hint?: string;
}

function Field({ id, label, icon, type = 'text', mono, value, onChange, placeholder, required, hint }: FieldProps) {
  return (
    <div className="flex flex-col gap-xs">
      <label htmlFor={id} className="font-body-sm text-body-sm font-medium text-on-surface">{label}</label>
      <div className="relative">
        <Icon name={icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
        <input
          id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} required={required}
          className={`w-full pl-10 pr-md py-sm bg-surface-container-low border border-outline-variant rounded-lg text-body-base focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all ${mono ? 'font-data-mono' : 'font-body-base'}`}
        />
      </div>
      {hint && <p className="font-body-sm text-[11px] text-on-surface-variant mt-1">{hint}</p>}
    </div>
  );
}
