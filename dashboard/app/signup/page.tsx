'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { publicFetch, setUserSession, getUserToken, type ActiveMerchant } from '@/lib/api';
import { Icon } from '@/components/icon';

interface RegisterResponse {
  token: string;
  user: { id: string; email: string; name: string };
  merchant: ActiveMerchant;
  apiKey: { id: string; secret: string };
}

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    businessName: '', ruc: '', phone: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getUserToken()) router.replace('/charges');
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await publicFetch<RegisterResponse>('/auth/register', {
        method: 'POST', body: JSON.stringify(form),
      });
      setUserSession(res.token, {
        user: res.user,
        activeMerchant: res.merchant,
        memberships: [{ merchantId: res.merchant.id, role: 'OWNER', merchant: res.merchant }],
      });
      router.push(`/onboarding/api-key?key=${encodeURIComponent(res.apiKey.secret)}`);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full px-lg py-md border-b border-outline-variant bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="font-h2 text-h2 font-bold text-primary">CobraPy</Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-lg">
        <div className="w-full max-w-lg bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-xl">
          <div className="mb-xl">
            <h2 className="font-h1 text-h1 text-on-surface mb-xs">Crear cuenta</h2>
            <p className="font-body-sm text-on-surface-variant">Cuenta de usuario + comercio en un solo paso. Vas a ser el OWNER del comercio.</p>
          </div>
          <form onSubmit={submit} className="flex flex-col gap-md">
            <div className="text-[11px] uppercase tracking-widest font-bold text-on-surface-variant mt-sm">Tu cuenta</div>
            <Field id="name" label="Nombre completo" icon="person"
              value={form.name} onChange={(v) => setForm({ ...form, name: v })}
              placeholder="Juan Pérez" required />
            <Field id="email" label="Email" icon="mail" type="email"
              value={form.email} onChange={(v) => setForm({ ...form, email: v })}
              placeholder="juan@cafeteria.py" required />
            <Field id="pwd" label="Password" icon="lock" type="password"
              value={form.password} onChange={(v) => setForm({ ...form, password: v })}
              placeholder="Mínimo 8 caracteres" required hint="Mínimo 8 caracteres." />

            <div className="text-[11px] uppercase tracking-widest font-bold text-on-surface-variant mt-sm">Tu comercio</div>
            <Field id="bn" label="Nombre del comercio" icon="store"
              value={form.businessName} onChange={(v) => setForm({ ...form, businessName: v })}
              placeholder="Cafetería El Tereré" required />
            <Field id="ruc" label="RUC" icon="badge"
              value={form.ruc} onChange={(v) => setForm({ ...form, ruc: v })}
              placeholder="80012345-1" required hint="Formato con dígito verificador." />
            <Field id="phone" label="Teléfono (opcional)" icon="call" type="tel"
              value={form.phone} onChange={(v) => setForm({ ...form, phone: v })}
              placeholder="0981 123 456" />

            {error && <p className="font-body-sm text-error flex items-center gap-xs">
              <Icon name="error" className="text-[16px]" /> {error}
            </p>}

            <button disabled={loading} type="submit"
              className="w-full mt-sm bg-primary text-on-primary font-bold py-md rounded-lg hover:bg-primary-container transition shadow-sm active:scale-[0.98] disabled:opacity-60">
              {loading ? 'Creando...' : 'Crear cuenta'}
            </button>
          </form>
          <div className="mt-xl pt-lg border-t border-outline-variant text-center">
            <p className="font-body-sm text-on-surface-variant">
              ¿Ya tenés cuenta? <Link href="/login" className="text-primary font-semibold hover:underline">Iniciar sesión</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

interface FieldProps {
  id: string; label: string; icon: string; type?: string;
  value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; hint?: string;
}
function Field({ id, label, icon, type = 'text', value, onChange, placeholder, required, hint }: FieldProps) {
  return (
    <div className="flex flex-col gap-xs">
      <label htmlFor={id} className="font-body-sm font-medium text-on-surface">{label}</label>
      <div className="relative">
        <Icon name={icon} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
        <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} required={required}
          className="w-full pl-10 pr-md py-sm bg-surface-container-low border border-outline-variant rounded-lg text-body-base focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" />
      </div>
      {hint && <p className="text-[11px] text-on-surface-variant mt-1">{hint}</p>}
    </div>
  );
}
