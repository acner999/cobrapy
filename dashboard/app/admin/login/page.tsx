'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { publicFetch, setAdminToken, getAdminToken, type AdminInfo } from '@/lib/api';
import { Icon } from '@/components/icon';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getAdminToken()) router.replace('/admin');
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await publicFetch<{ token: string; admin: AdminInfo }>(
        '/admin-portal/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) },
      );
      setAdminToken(res.token, res.admin);
      router.push('/admin');
    } catch (err) {
      setError((err as Error).message.includes('401') ? 'Email o password inválidos' : (err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-inverse-surface text-inverse-on-surface">
      <header className="px-lg py-md flex items-center justify-between">
        <Link href="/" className="font-h2 text-h2 font-bold text-primary-fixed-dim">CobraPy</Link>
        <span className="text-[11px] font-bold tracking-widest bg-tertiary-container text-on-tertiary-container px-sm py-unit rounded uppercase">
          Staff Portal
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center p-lg">
        <div className="w-full max-w-md bg-surface-container-lowest text-on-surface rounded-xl shadow-xl p-xl">
          <div className="mb-xl">
            <div className="w-12 h-12 rounded-lg bg-tertiary-container flex items-center justify-center mb-md">
              <Icon name="admin_panel_settings" className="text-on-tertiary-container" />
            </div>
            <h1 className="font-h1 text-h1 mb-xs">Acceso staff</h1>
            <p className="font-body-sm text-on-surface-variant">
              Solo personal autorizado de CobraPy. ¿Sos comercio?{' '}
              <Link href="/login" className="text-primary hover:underline">Login de comercio</Link>.
            </p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-md">
            <div className="flex flex-col gap-xs">
              <label htmlFor="email" className="font-body-sm font-medium text-on-surface">Email</label>
              <div className="relative">
                <Icon name="mail" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required autoComplete="email"
                  className="w-full pl-10 pr-md py-sm bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
              </div>
            </div>
            <div className="flex flex-col gap-xs">
              <label htmlFor="pwd" className="font-body-sm font-medium text-on-surface">Password</label>
              <div className="relative">
                <Icon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input id="pwd" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  required autoComplete="current-password"
                  className="w-full pl-10 pr-md py-sm bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
              </div>
            </div>

            {error && (
              <p className="font-body-sm text-error flex items-center gap-xs">
                <Icon name="error" className="text-[16px]" /> {error}
              </p>
            )}

            <button disabled={loading} type="submit"
              className="w-full mt-sm bg-primary text-on-primary font-bold py-md rounded-lg hover:bg-primary-container transition shadow-sm active:scale-[0.98] disabled:opacity-60">
              {loading ? 'Validando...' : 'Ingresar'}
            </button>
          </form>

          {process.env.NEXT_PUBLIC_SHOW_DEV_HINTS === 'true' && (
            <p className="font-body-sm text-[11px] text-on-surface-variant text-center mt-lg pt-md border-t border-outline-variant">
              Solo en dev: revisá las credenciales que imprimió <code className="font-data-mono">npm run db:seed</code>.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
