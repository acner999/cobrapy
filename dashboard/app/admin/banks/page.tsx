'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@/components/icon';

interface Bank {
  code: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export default function AdminBanksPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', name: '', active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const token = localStorage.getItem('cobrapy_admin_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin-portal/banks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
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
    setSaving(true);
    try {
      const token = localStorage.getItem('cobrapy_admin_token');
      const method = editingCode ? 'PATCH' : 'POST';
      const url = editingCode
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin-portal/banks/${editingCode}`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin-portal/banks`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: form.code.toUpperCase(),
          name: form.name,
          active: form.active,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingCode(null);
        setForm({ code: '', name: '', active: true });
        fetchBanks();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (bank: Bank) => {
    setEditingCode(bank.code);
    setForm({ code: bank.code, name: bank.name, active: bank.active });
    setShowForm(true);
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`¿Eliminar el banco ${code}?`)) return;
    try {
      const token = localStorage.getItem('cobrapy_admin_token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin-portal/banks/${code}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchBanks();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleActive = async (bank: Bank) => {
    try {
      const token = localStorage.getItem('cobrapy_admin_token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin-portal/banks/${bank.code}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ active: !bank.active }),
      });
      fetchBanks();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-surface-bright p-lg">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-md mb-xl">
          <a href="/admin/merchants" className="p-sm hover:bg-surface-container rounded-lg">
            <Icon name="arrow_back" />
          </a>
          <div>
            <h1 className="text-h1 text-on-surface">Administración de Bancos</h1>
            <p className="text-on-surface-variant">Gestiona los bancos disponibles para cobrar</p>
          </div>
        </div>

        <button
          onClick={() => { setShowForm(true); setEditingCode(null); setForm({ code: '', name: '', active: true }); }}
          className="bg-primary text-on-primary px-lg py-md rounded-xl flex items-center gap-sm font-bold mb-lg"
        >
          <Icon name="add" />
          Nuevo Banco
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant mb-xl">
            <h3 className="text-h3 text-on-surface mb-lg">{editingCode ? 'Editar Banco' : 'Nuevo Banco'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div className="space-y-unit">
                <label className="text-body-sm font-medium text-on-surface-variant">Código</label>
                <input
                  className="w-full p-md border border-outline-variant rounded-lg text-on-surface focus:ring-1 focus:ring-primary outline-none font-mono uppercase"
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="BMP"
                  required
                  disabled={!!editingCode}
                />
              </div>
              <div className="space-y-unit">
                <label className="text-body-sm font-medium text-on-surface-variant">Nombre</label>
                <input
                  className="w-full p-md border border-outline-variant rounded-lg text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Banco Itau Paraguay S.A."
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-md cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="w-5 h-5 text-primary rounded border-outline-variant focus:ring-primary"
                  />
                  <span className="text-body-sm text-on-surface">Activo</span>
                </label>
              </div>
            </div>
            <div className="flex gap-md mt-lg">
              <button type="submit" disabled={saving} className="bg-primary text-on-primary px-lg py-sm rounded-lg font-bold disabled:opacity-50">
                {saving ? 'Guardando...' : editingCode ? 'Actualizar' : 'Crear Banco'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingCode(null); }} className="px-lg py-sm border border-outline-variant rounded-lg text-on-surface-variant">
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
          {loading ? (
            <div className="p-xl text-center text-on-surface-variant">Cargando...</div>
          ) : banks.length === 0 ? (
            <div className="p-xl text-center text-on-surface-variant">No hay bancos registrados</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-surface-container-low text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">
                <tr>
                  <th className="px-lg py-md">Código</th>
                  <th className="px-lg py-md">Nombre</th>
                  <th className="px-lg py-md">Estado</th>
                  <th className="px-lg py-md text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {banks.map((bank) => (
                  <tr key={bank.code} className="hover:bg-surface-container transition-colors">
                    <td className="px-lg py-md font-mono font-bold text-primary">{bank.code}</td>
                    <td className="px-lg py-md text-on-surface">{bank.name}</td>
                    <td className="px-lg py-md">
                      <button
                        onClick={() => toggleActive(bank)}
                        className={`px-sm py-xs rounded-full text-[10px] font-bold uppercase cursor-pointer ${
                          bank.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        {bank.active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-lg py-md text-right">
                      <div className="flex items-center justify-end gap-sm">
                        <button onClick={() => handleEdit(bank)} className="p-xs rounded-lg hover:bg-surface-container text-on-surface-variant" title="Editar">
                          <Icon name="edit" className="text-[20px]" />
                        </button>
                        <button onClick={() => handleDelete(bank.code)} className="p-xs rounded-lg hover:bg-error-container hover:text-error text-on-surface-variant" title="Eliminar">
                          <Icon name="delete" className="text-[20px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}