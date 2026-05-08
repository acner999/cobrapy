'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from './icon';
import { getUserInfo, switchMerchant } from '@/lib/api';

export function MerchantSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState(getUserInfo());
  const [switching, setSwitching] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setInfo(getUserInfo()); }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!info) return null;

  async function pick(mid: string) {
    if (mid === info?.activeMerchant.id) { setOpen(false); return; }
    setSwitching(mid);
    try {
      await switchMerchant(mid);
      router.refresh();
      window.location.reload();
    } finally {
      setSwitching(null);
    }
  }

  const single = info.memberships.length <= 1;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => !single && setOpen(!open)}
        disabled={single}
        className={`flex items-center gap-sm px-md py-sm rounded-lg border transition ${
          single ? 'bg-surface-container border-outline-variant cursor-default' : 'bg-surface-container hover:bg-surface-container-high border-outline-variant cursor-pointer'
        }`}>
        <Icon name="store" className="text-primary text-[18px]" />
        <div className="text-left hidden sm:block">
          <p className="font-body-sm font-bold leading-none">{info.activeMerchant.businessName}</p>
          <p className="text-[10px] text-on-surface-variant font-data-mono">{info.activeMerchant.ruc}</p>
        </div>
        {!single && <Icon name={open ? 'expand_less' : 'expand_more'} className="text-on-surface-variant text-[18px]" />}
      </button>

      {open && !single && (
        <div className="absolute right-0 top-full mt-xs w-72 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-md py-sm bg-surface-container-low border-b border-outline-variant">
            <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">Tus comercios</p>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {info.memberships.map((m) => {
              const active = m.merchantId === info.activeMerchant.id;
              return (
                <li key={m.merchantId}>
                  <button onClick={() => pick(m.merchantId)}
                    disabled={switching !== null}
                    className={`w-full text-left px-md py-sm flex items-center justify-between hover:bg-surface-container transition ${
                      active ? 'bg-primary-fixed-dim/20' : ''
                    }`}>
                    <div className="flex-1 min-w-0">
                      <p className="font-body-sm font-medium text-on-surface truncate">{m.merchant.businessName}</p>
                      <p className="text-[11px] text-on-surface-variant font-data-mono">{m.merchant.ruc}</p>
                    </div>
                    <div className="flex items-center gap-xs">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-sm py-unit rounded ${
                        m.role === 'OWNER' ? 'bg-primary text-on-primary' :
                        m.role === 'ADMIN' ? 'bg-secondary-container text-on-secondary-container' :
                        'bg-surface-container text-on-surface-variant'
                      }`}>{m.role}</span>
                      {active && <Icon name="check" className="text-primary text-[18px]" />}
                      {switching === m.merchantId && <Icon name="hourglass_empty" className="text-[18px] animate-spin" />}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
