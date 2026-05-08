'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icon';
import { DarkModeToggle } from '@/components/dark-mode-toggle';
import { clearAdmin, getAdminInfo, getAdminToken } from '@/lib/api';

const navItems = [
  { href: '/admin', label: 'Overview', icon: 'dashboard', exact: true },
  { href: '/admin/merchants', label: 'Comercios', icon: 'store' },
  { href: '/admin/charges', label: 'Cobros', icon: 'payments' },
  { href: '/admin/banks', label: 'Bancos', icon: 'account_balance' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    if (pathname === '/admin/login') { setAuthed(true); return; }
    const token = getAdminToken();
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    setAuthed(true);
  }, [pathname, router]);

  if (authed !== true) return null;
  if (pathname === '/admin/login') return <>{children}</>;

  const info = getAdminInfo();

  function logout() {
    clearAdmin();
    router.push('/admin/login');
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname?.startsWith(href);
  }

  return (
    <div className="min-h-screen flex">
      <aside className="bg-inverse-surface text-inverse-on-surface w-64 hidden lg:flex flex-col fixed left-0 top-0 h-screen z-50">
        <div className="px-lg py-md border-b border-on-surface-variant/30">
          <h1 className="font-h2 text-h2 font-bold text-primary-fixed-dim">CobraPy</h1>
          <p className="text-[11px] uppercase tracking-widest text-tertiary-fixed-dim font-bold">Admin Portal</p>
        </div>
        <nav className="flex-1 px-sm pt-md space-y-unit">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-md px-md py-sm rounded-lg transition-colors text-body-sm ${
                  active ? 'bg-primary text-on-primary font-bold' : 'text-inverse-on-surface/80 hover:bg-on-surface-variant/30'
                }`}>
                <Icon name={item.icon} filled={active} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-md py-md border-t border-on-surface-variant/30">
          <p className="text-body-sm font-bold mb-xs">{info?.name ?? 'Admin'}</p>
          <p className="text-[11px] text-inverse-on-surface/60 mb-md font-data-mono">{info?.email}</p>
          <button onClick={logout} className="w-full text-body-sm bg-on-surface-variant/30 hover:bg-on-surface-variant/50 py-sm rounded-lg transition">
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 lg:ml-64 min-h-screen flex flex-col bg-surface-bright">
        <header className="h-14 bg-surface-container-lowest border-b border-outline-variant px-lg flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-md">
            <button className="lg:hidden p-sm text-on-surface-variant" aria-label="Menu">
              <Icon name="menu" />
            </button>
            <span className="text-body-sm text-on-surface-variant">
              CobraPy <span className="text-tertiary font-bold">/ Admin</span>
            </span>
          </div>
          <div className="flex items-center gap-md">
            <span className="text-[11px] font-bold tracking-widest bg-tertiary-container text-on-tertiary-container px-sm py-unit rounded uppercase">
              Staff Portal
            </span>
            <DarkModeToggle />
          </div>
        </header>
        <main className="flex-1 p-lg max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
