'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { publicFetch, setUserSession, getUserToken, type UserInfo } from '@/lib/api';
import { Icon } from '@/components/icon';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      const res = await publicFetch<{ token: string } & UserInfo>('/auth/login', {
        method: 'POST', body: JSON.stringify({ email, password }),
      });
      setUserSession(res.token, {
        user: res.user,
        activeMerchant: res.activeMerchant,
        memberships: res.memberships,
      });
      router.push('/charges');
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg.includes('401') ? 'Email o password inválidos' : msg);
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
        <div className="w-full max-w-md bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-xl">
          <div className="mb-xl">
            <h2 className="font-h1 text-h1 text-on-surface mb-xs">Ingresar</h2>
            <p className="font-body-sm text-on-surface-variant">Login con tu email y password.</p>
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
            {error && <p className="font-body-sm text-error flex items-center gap-xs">
              <Icon name="error" className="text-[16px]" /> {error}
            </p>}
            <button disabled={loading} type="submit"
              className="w-full mt-sm bg-primary text-on-primary font-bold py-md rounded-lg hover:bg-primary-container transition shadow-sm active:scale-[0.98] disabled:opacity-60">
              {loading ? 'Validando...' : 'Ingresar'}
            </button>
          </form>
          <div className="mt-xl pt-lg border-t border-outline-variant text-center space-y-sm">
            <p className="font-body-sm text-on-surface-variant">
              ¿Sos nuevo? <Link href="/signup" className="text-primary font-semibold hover:underline">Crear cuenta</Link>
            </p>
            {process.env.NEXT_PUBLIC_SHOW_DEV_HINTS === 'true' && (
              <p className="font-body-sm text-on-surface-variant text-[11px]">
                Solo en dev: revisá <code className="font-data-mono">npm run db:seed</code> para ver las credenciales.
              </p>
            )}
            <p className="text-body-sm">
              <Link href="/admin/login" className="text-tertiary hover:underline text-[12px]">Acceso staff CobraPy →</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
