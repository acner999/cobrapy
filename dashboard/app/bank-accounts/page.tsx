'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { Icon } from '@/components/icon';

interface BankAccount {
  id: string;
  bankCode: string;
  accountNumber: string;
  accountAlias: string | null;
  documentType: string | null;
  document: string | null;
  nameOrBusinessName: string | null;
  isDefault: boolean;
  createdAt: string;
}

interface Bank {
  code: string;
  name: string;
}

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    bankCode: '',
    accountType: 'CUENTA_CORRIENTE',
    accountNumber: '',
    alias: '',
    documentType: 'RUC',
    document: '',
    nameOrBusinessName: '',
    isDefault: false,
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const key = localStorage.getItem('cobrapy_api_key');
      const [accountsRes, banksRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/me/bank-accounts`, {
          headers: { Authorization: `Bearer ${key}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/banks`),
      ]);
      if (accountsRes.ok) {
        const data = await accountsRes.json();
        setAccounts(data);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = localStorage.getItem('cobrapy_api_key');
    const method = editingId ? 'PATCH' : 'POST';
    const url = editingId 
      ? `${process.env.NEXT_PUBLIC_API_URL}/merchants/me/bank-accounts/${editingId}`
      : `${process.env.NEXT_PUBLIC_API_URL}/merchants/me/bank-accounts`;

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        bankCode: form.bankCode,
        accountNumber: form.accountNumber,
        accountAlias: form.alias || null,
        documentType: form.documentType,
        document: form.document || null,
        nameOrBusinessName: form.nameOrBusinessName || null,
        isDefault: form.isDefault,
      }),
    });

    if (res.ok) {
      setShowForm(false);
      setEditingId(null);
      setForm({
        bankCode: '',
        accountType: 'CUENTA_CORRIENTE',
        accountNumber: '',
        alias: '',
        documentType: 'RUC',
        document: '',
        nameOrBusinessName: '',
        isDefault: false,
      });
      fetchAccounts();
    }
  };

  const handleEdit = (account: BankAccount) => {
    setEditingId(account.id);
    setForm({
      bankCode: account.bankCode,
      accountType: 'CUENTA_CORRIENTE',
      accountNumber: account.accountNumber,
      alias: account.accountAlias || '',
      documentType: account.documentType || 'RUC',
      document: account.document || '',
      nameOrBusinessName: account.nameOrBusinessName || '',
      isDefault: account.isDefault,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que querés eliminar esta cuenta?')) return;
    
    const key = localStorage.getItem('cobrapy_api_key');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/me/bank-accounts/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${key}` },
    });

    if (res.ok) {
      fetchAccounts();
    }
  };

  const getBankName = (code: string) => {
    const bank = banks.find(b => b.code === code);
    return bank?.name || code;
  };

  return (
    <AppShell breadcrumb={{ section: 'Configuración', current: 'Cuentas Bancarias' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xl">
          <div>
            <h1 className="text-h1 text-on-surface mb-xs">Cuentas Bancarias</h1>
            <p className="text-on-surface-variant">Gestiona las cuentas receptoras de tus pagos</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setForm({
              bankCode: '', accountType: 'CUENTA_CORRIENTE', accountNumber: '',
              alias: '', documentType: 'RUC', document: '', nameOrBusinessName: '', isDefault: false
            }); }}
            className="bg-primary text-on-primary px-lg py-md rounded-xl flex items-center gap-sm font-bold shadow-sm hover:opacity-90"
          >
            <Icon name="add" />
            Nueva Cuenta
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-sm mb-xl">
            <h3 className="text-h3 text-on-surface mb-lg">
              {editingId ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div className="space-y-unit">
                <label className="text-body-sm font-medium text-on-surface-variant">Banco</label>
                <select
                  className="w-full p-md border border-outline-variant rounded-lg text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  value={form.bankCode}
                  onChange={(e) => setForm({ ...form, bankCode: e.target.value })}
                  required
                >
                  <option value="">Seleccionar banco...</option>
                  {BANKS.map((bank) => (
                    <option key={bank.code} value={bank.code}>{bank.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-unit">
                <label className="text-body-sm font-medium text-on-surface-variant">Tipo de Cuenta</label>
                <select
                  className="w-full p-md border border-outline-variant rounded-lg text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  value={form.accountType}
                  onChange={(e) => setForm({ ...form, accountType: e.target.value })}
                >
                  <option value="CUENTA_CORRIENTE">Cuenta Corriente</option>
                  <option value="CAJA_AHORROS">Caja de Ahorros</option>
                </select>
              </div>
              <div className="space-y-unit">
                <label className="text-body-sm font-medium text-on-surface-variant">Alias (opcional)</label>
                <input
                  className="w-full p-md border border-outline-variant rounded-lg text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  type="text"
                  value={form.alias}
                  onChange={(e) => setForm({ ...form, alias: e.target.value })}
                  placeholder="mi-cuenta-banco"
                />
              </div>
              <div className="space-y-unit">
                <label className="text-body-sm font-medium text-on-surface-variant">Tipo de Documento</label>
                <select
                  className="w-full p-md border border-outline-variant rounded-lg text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  value={form.documentType}
                  onChange={(e) => setForm({ ...form, documentType: e.target.value })}
                >
                  <option value="RUC">RUC</option>
                  <option value="CEDULA">Cédula de Identidad</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
              </div>
              <div className="space-y-unit">
                <label className="text-body-sm font-medium text-on-surface-variant">Número de Documento</label>
                <input
                  className="w-full p-md border border-outline-variant rounded-lg font-data-mono text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  type="text"
                  value={form.document}
                  onChange={(e) => setForm({ ...form, document: e.target.value })}
                  placeholder="80123456-7"
                />
              </div>
              <div className="space-y-unit">
                <label className="text-body-sm font-medium text-on-surface-variant">Nombre o Razón Social</label>
                <input
                  className="w-full p-md border border-outline-variant rounded-lg text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  type="text"
                  value={form.nameOrBusinessName}
                  onChange={(e) => setForm({ ...form, nameOrBusinessName: e.target.value })}
                  placeholder="Nombre completo o razón social"
                />
              </div>
              <div className="space-y-unit md:col-span-2">
                <label className="text-body-sm font-medium text-on-surface-variant">Número de Cuenta</label>
                <input
                  className="w-full p-md border border-outline-variant rounded-lg font-data-mono text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  type="text"
                  value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                  placeholder="700123456"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-md cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                    className="w-5 h-5 text-primary rounded border-outline-variant focus:ring-primary"
                  />
                  <span className="text-body-sm text-on-surface">Establecer como cuenta predeterminada</span>
                </label>
              </div>
            </div>
            <div className="flex gap-md mt-lg">
              <button type="submit" className="bg-primary text-on-primary px-lg py-sm rounded-lg font-bold hover:opacity-90">
                {editingId ? 'Actualizar' : 'Crear Cuenta'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-lg py-sm border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-xl text-center text-on-surface-variant">Cargando...</div>
          ) : accounts.length === 0 ? (
            <div className="p-xl text-center">
              <Icon name="account_balance" className="text-5xl text-on-surface-variant mb-md" />
              <p className="text-on-surface-variant">No hay cuentas bancarias registradas</p>
              <p className="text-body-sm text-on-surface-variant">Agregá tu primera cuenta para recibir pagos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">
                  <tr>
                    <th className="px-lg py-md">Banco</th>
                    <th className="px-lg py-md">Tipo</th>
                    <th className="px-lg py-md">Número de Cuenta</th>
                    <th className="px-lg py-md">Titular</th>
                    <th className="px-lg py-md">Documento</th>
                    <th className="px-lg py-md">Estado</th>
                    <th className="px-lg py-md text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-lg py-md">
                        <div className="flex items-center gap-md">
                          <Icon name="account_balance" className="text-primary" />
                          <span className="font-medium text-on-surface">{getBankName(account.bankCode)}</span>
                        </div>
                      </td>
                      <td className="px-lg py-md text-on-surface-variant">
                        {account.accountNumber.startsWith('1') ? 'Caja de Ahorros' : 'Cuenta Corriente'}
                      </td>
                      <td className="px-lg py-md font-data-mono text-on-surface">{account.accountNumber}</td>
                      <td className="px-lg py-md text-on-surface">{account.nameOrBusinessName || '—'}</td>
                      <td className="px-lg py-md text-on-surface-variant text-sm">
                        {account.documentType && account.document ? `${account.documentType}: ${account.document}` : '—'}
                      </td>
                      <td className="px-lg py-md">
                        {account.isDefault && (
                          <span className="px-sm py-xs bg-primary-container text-on-primary-container rounded-full text-[10px] font-bold uppercase">
                            Predeterminada
                          </span>
                        )}
                      </td>
                      <td className="px-lg py-md text-right">
                        <div className="flex items-center justify-end gap-sm">
                          <button
                            onClick={() => handleEdit(account)}
                            className="p-xs rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant"
                            title="Editar"
                          >
                            <Icon name="edit" className="text-[20px]" />
                          </button>
                          <button
                            onClick={() => handleDelete(account.id)}
                            className="p-xs rounded-lg hover:bg-error-container hover:text-error transition-colors text-on-surface-variant"
                            title="Eliminar"
                          >
                            <Icon name="delete" className="text-[20px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}