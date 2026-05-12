'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { Icon } from '@/components/icon';

interface Merchant {
  id: string;
  businessName: string;
  ruc: string;
  email: string;
  phone: string | null;
  kycStatus: string;
  plan: string;
}

interface BankAccount {
  id: string;
  bankCode: string;
  accountNumber: string;
  accountAlias: string | null;
  isDefault: boolean;
}

interface Bank {
  code: string;
  name: string;
}

export default function SettingsPage() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [form, setForm] = useState({
    email: '',
    phone: '',
  });
  
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const key = localStorage.getItem('cobrapy_user_token');
      const headers = { Authorization: `Bearer ${key}` };

      const [merchantRes, accountsRes, banksRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/me`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/me/bank-accounts`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/banks`),
      ]);

      if (merchantRes.ok) {
        const data = await merchantRes.json();
        setMerchant(data);
        setForm({ email: data.email || '', phone: data.phone || '' });
      }
      
      if (accountsRes.ok) {
        const data = await accountsRes.json();
        setBankAccounts(data);
        const def = data.find((a: BankAccount) => a.isDefault);
        if (def) setSelectedAccountId(def.id);
        else if (data.length > 0) setSelectedAccountId(data[0].id);
      }

      if (banksRes.ok) {
        const data = await banksRes.json();
        setBanks(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const key = localStorage.getItem('cobrapy_user_token');
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` };

      const requests: Promise<unknown>[] = [
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/me`, {
          method: 'PATCH', headers,
          body: JSON.stringify({ email: form.email, phone: form.phone }),
        }),
      ];

      if (selectedAccountId) {
        requests.push(
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/me/bank-accounts/${selectedAccountId}`, {
            method: 'PATCH', headers,
            body: JSON.stringify({ isDefault: true }),
          }),
        );
      }

      await Promise.all(requests);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const getKycStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-[#fff7ed] text-[#9a3412] border-[#ffedd5]',
      IN_REVIEW: 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]',
      APPROVED: 'bg-green-100 text-green-800 border-green-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
    };
    const labels: Record<string, string> = {
      PENDING: 'PENDING',
      IN_REVIEW: 'EN REVISIÓN',
      APPROVED: 'APROBADO',
      REJECTED: 'RECHAZADO',
    };
    const style = styles[status] || styles.PENDING;
    const label = labels[status] || status;
    return { style, label };
  };

  const getPlanBadge = (plan: string) => {
    const plans: Record<string, { label: string; color: string }> = {
      FREE: { label: 'Gratis', color: 'text-primary-fixed-dim scale-150' },
      PRO: { label: 'Pro', color: 'text-primary' },
      ENTERPRISE: { label: 'Enterprise', color: 'text-tertiary' },
    };
    return plans[plan] || plans.FREE;
  };

  if (loading) {
    return (
      <AppShell breadcrumb={{ section: 'Configuración', current: 'Ajustes del Comercio' }}>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  const { style: kycStyle, label: kycLabel } = getKycStatusBadge(merchant?.kycStatus || 'PENDING');
  const { label: planLabel, color: planColor } = getPlanBadge(merchant?.plan || 'FREE');

  return (
    <AppShell breadcrumb={{ section: 'Configuración', current: 'Ajustes del Comercio' }}>
      <div className="mb-xl flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div>
          <h1 className="text-h1 text-on-surface mb-xs">Ajustes del Comercio</h1>
          <p className="text-on-surface-variant">Gestiona la identidad de tu empresa y los parámetros de liquidación.</p>
        </div>
        <div className={`inline-flex items-center gap-2 px-md py-2 rounded-full border ${kycStyle}`}>
          <span className={`w-2 h-2 rounded-full ${merchant?.kycStatus === 'APPROVED' ? 'bg-green-500' : merchant?.kycStatus === 'REJECTED' ? 'bg-red-500' : 'bg-[#f59e0b]'}`}></span>
          <span className="font-bold text-[12px] tracking-wide">VERIFICACIÓN KYC: {kycLabel}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
        <div className="md:col-span-8 space-y-lg">
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl shadow-sm">
            <div className="flex items-center gap-md mb-lg">
              <span className="material-symbols-outlined text-primary bg-primary-container/20 p-2 rounded-lg">business</span>
              <h2 className="text-h3">Identidad del Comercio</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
              <div className="space-y-unit">
                <label className="text-body-sm font-medium text-on-surface-variant">Razón Social</label>
                <div className="p-md bg-surface-container-low border border-outline-variant rounded-lg text-on-surface">
                  {merchant?.businessName || '—'}
                </div>
              </div>
              <div className="space-y-unit">
                <label className="text-body-sm font-medium text-on-surface-variant">RUC</label>
                <div className="p-md bg-surface-container-low border border-outline-variant rounded-lg font-data-mono text-on-surface">
                  {merchant?.ruc || '—'}
                </div>
              </div>
              <div className="space-y-unit">
                <label className="text-body-sm font-medium text-on-surface-variant">Email de Notificaciones</label>
                <div className="relative">
                  <input
                    className="w-full p-md pl-10 border border-outline-variant rounded-lg text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-body-sm">mail</span>
                </div>
              </div>
              <div className="space-y-unit">
                <label className="text-body-sm font-medium text-on-surface-variant">Teléfono de Soporte</label>
                <div className="relative">
                  <input
                    className="w-full p-md pl-10 border border-outline-variant rounded-lg text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+595 21 555 1234"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-body-sm">call</span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl shadow-sm">
            <div className="flex items-center justify-between mb-lg">
              <div className="flex items-center gap-md">
                <span className="material-symbols-outlined text-primary bg-primary-container/20 p-2 rounded-lg">account_balance</span>
                <h2 className="text-h3">Cuenta Bancaria Destino (SIP)</h2>
              </div>
              <a href="/bank-accounts" className="text-body-sm text-primary hover:underline flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                Gestionar cuentas
              </a>
            </div>
            <div className="p-lg bg-surface-bright border-l-4 border-primary rounded-r-lg mb-lg">
              <p className="text-body-sm text-on-surface-variant leading-relaxed">
                Los fondos recaudados se liquidarán automáticamente a esta cuenta a través del Sistema de Interconexión de Pagos (SIP) del BCP.
              </p>
            </div>
            {bankAccounts.length === 0 ? (
              <div className="text-center py-lg border-2 border-dashed border-outline-variant rounded-lg">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-sm block">account_balance</span>
                <p className="text-on-surface-variant text-body-sm mb-md">No tenés cuentas bancarias registradas.</p>
                <a href="/bank-accounts" className="text-primary font-bold hover:underline text-body-sm">
                  Agregar una cuenta
                </a>
              </div>
            ) : (
              <div className="space-y-sm">
                {bankAccounts.map((account) => {
                  const bankName = banks.find(b => b.code === account.bankCode)?.name || account.bankCode;
                  const isSelected = selectedAccountId === account.id;
                  return (
                    <label
                      key={account.id}
                      className={`flex items-center gap-md p-md rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary-container/10'
                          : 'border-outline-variant hover:bg-surface-container-low'
                      }`}
                    >
                      <input
                        type="radio"
                        name="defaultAccount"
                        value={account.id}
                        checked={isSelected}
                        onChange={() => setSelectedAccountId(account.id)}
                        className="text-primary"
                      />
                      <span className="material-symbols-outlined text-primary">account_balance</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-on-surface">{bankName}</p>
                        <p className="text-body-sm text-on-surface-variant font-data-mono">
                          {account.accountNumber}
                          {account.accountAlias ? ` · ${account.accountAlias}` : ''}
                        </p>
                      </div>
                      {account.isDefault && (
                        <span className="text-[10px] font-bold uppercase px-sm py-xs bg-primary-container text-on-primary-container rounded-full">
                          Predeterminada
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="md:col-span-4 space-y-lg">
          <div className="bg-inverse-surface text-inverse-on-surface rounded-xl p-xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-xl">
                <div>
                  <p className="text-body-sm font-medium opacity-70">Plan actual</p>
                  <h3 className="text-h2 font-bold">{planLabel}</h3>
                </div>
                <span className={`material-symbols-outlined ${planColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <ul className="space-y-md mb-xl">
                <li className="flex items-center gap-sm text-body-sm">
                  <Icon name="check_circle" className="text-primary-fixed-dim" />
                  Hasta 100 transacciones/mes
                </li>
                <li className="flex items-center gap-sm text-body-sm">
                  <Icon name="check_circle" className="text-primary-fixed-dim" />
                  Webhooks ilimitados
                </li>
                <li className={`flex items-center gap-sm text-body-sm ${merchant?.plan === 'PRO' ? '' : 'opacity-50'}`}>
                  <Icon name={merchant?.plan === 'PRO' ? 'check_circle' : 'cancel'} className={merchant?.plan === 'PRO' ? 'text-primary-fixed-dim' : ''} />
                  Soporte Prioritario 24/7
                </li>
              </ul>
              <button className="w-full py-md bg-primary-fixed-dim text-on-primary-fixed font-bold rounded-lg hover:bg-primary-fixed transition-all active:scale-95">
                Upgrade a Pro
              </button>
            </div>
          </div>

          <div className="bg-surface-container border border-outline-variant rounded-xl p-lg">
            <div className="flex gap-md mb-md">
              <Icon name="info" className="text-[#f59e0b]" style={{ fontVariationSettings: "'FILL' 1" }} />
              <h4 className="font-bold text-on-surface text-body-base">Acción Requerida</h4>
            </div>
            <p className="text-body-sm text-on-surface-variant mb-lg leading-relaxed">
              {merchant?.kycStatus === 'APPROVED' 
                ? 'Tu cuenta está verificada. Podés realizar cobros sin límites.'
                : merchant?.kycStatus === 'REJECTED'
                ? 'Tu verificación fue rechazada. Por favor, contacta soporte para más información.'
                : 'Tu verificación de identidad está en proceso. Para habilitar cobros superiores a 5.000.000 ₲, adjunta tu cédula vigente.'
              }
            </p>
            <button className="w-full py-sm border-2 border-primary text-primary font-bold rounded-lg hover:bg-primary/5 transition-colors">
              {merchant?.kycStatus === 'APPROVED' ? 'Actualizar Documentos' : 'Subir Documentos'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-xl flex justify-end gap-md border-t border-outline-variant pt-xl">
        <button className="px-xl py-md text-on-surface-variant font-medium hover:text-primary transition-colors">
          Descartar
        </button>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-xl py-md bg-primary text-on-primary rounded-lg font-bold shadow-md hover:bg-primary-container transition-all active:scale-95 disabled:opacity-50 flex items-center gap-sm"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Guardando...
            </>
          ) : saved ? (
            <>
              <Icon name="check" className="text-sm" style={{ fontVariationSettings: "'FILL' 1" }} />
              Guardado
            </>
          ) : (
            'Guardar Cambios'
          )}
        </button>
      </div>
    </AppShell>
  );
}