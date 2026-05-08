'use client';
import { useEffect, useState } from 'react';
import { apiFetch, type TeamMember, type MembershipRole, getUserInfo } from '@/lib/api';
import { AppShell } from '@/components/app-shell';
import { Icon } from '@/components/icon';

const roleBadge: Record<MembershipRole, string> = {
  OWNER:    'bg-primary text-on-primary',
  ADMIN:    'bg-secondary-container text-on-secondary-container',
  OPERATOR: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  READONLY: 'bg-surface-container text-on-surface-variant',
};

const roleDescription: Record<MembershipRole, string> = {
  OWNER:    'Acceso total. Solo puede haber uno por comercio.',
  ADMIN:    'Acceso total salvo billing y eliminar el comercio.',
  OPERATOR: 'Crear cobros y ver reportes. Sin acceso a API keys, webhooks ni configuración.',
  READONLY: 'Solo lectura. Ideal para contadores.',
};

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MembershipRole>('OPERATOR');
  const [inviting, setInviting] = useState(false);

  const info = getUserInfo();
  const myRole = info?.memberships.find((m) => m.merchantId === info?.activeMerchant.id)?.role;
  const canManage = myRole === 'OWNER' || myRole === 'ADMIN';

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      setMembers(await apiFetch<TeamMember[]>('/teams'));
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setError(null);
    try {
      await apiFetch('/teams/invite', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      setInviteEmail('');
      setShowInvite(false);
      await load();
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg.includes(': ') ? msg.split(': ').slice(1).join(': ') : msg);
    } finally { setInviting(false); }
  }

  async function changeRole(id: string, role: MembershipRole) {
    try {
      await apiFetch(`/teams/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
      await load();
    } catch (err) { setError((err as Error).message); }
  }

  async function remove(id: string) {
    if (!confirm('¿Quitar este miembro del comercio?')) return;
    try {
      await apiFetch(`/teams/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) { setError((err as Error).message); }
  }

  return (
    <AppShell breadcrumb={{ section: 'Configuración', current: 'Equipo' }}>
      <div className="flex justify-between items-end mb-xl">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface mb-xs">Equipo</h1>
          <p className="text-on-surface-variant font-body-base">
            Miembros con acceso al comercio <strong>{info?.activeMerchant.businessName}</strong>.
          </p>
        </div>
        {canManage && (
          <button onClick={() => setShowInvite(!showInvite)}
            className="bg-primary text-on-primary px-xl py-md rounded-lg font-bold flex items-center gap-sm shadow-md hover:bg-primary-container transition active:scale-95">
            <Icon name={showInvite ? 'close' : 'person_add'} />
            {showInvite ? 'Cancelar' : 'Invitar miembro'}
          </button>
        )}
      </div>

      {error && <p className="bg-error-container text-on-error-container px-md py-sm rounded-lg mb-md text-body-sm">{error}</p>}

      {showInvite && canManage && (
        <form onSubmit={invite} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl mb-lg">
          <h3 className="font-h3 text-h3 mb-md">Invitar miembro</h3>
          <p className="text-body-sm text-on-surface-variant mb-md">
            El usuario tiene que tener una cuenta CobraPy. Si todavía no tiene, pedile que se registre primero.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-md">
            <div>
              <label className="font-body-sm font-medium text-on-surface mb-xs block">Email del usuario</label>
              <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="cajero@cafeteria.py" required
                className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" />
            </div>
            <div>
              <label className="font-body-sm font-medium text-on-surface mb-xs block">Rol</label>
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as MembershipRole)}
                className="w-full px-md py-sm bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary">
                <option value="ADMIN">Admin</option>
                <option value="OPERATOR">Operator</option>
                <option value="READONLY">Read-only</option>
              </select>
              <p className="text-[11px] text-on-surface-variant mt-xs">{roleDescription[inviteRole]}</p>
            </div>
          </div>
          <button type="submit" disabled={inviting}
            className="bg-primary text-on-primary font-bold py-sm px-md rounded-lg hover:bg-primary-container disabled:opacity-50">
            {inviting ? 'Invitando...' : 'Enviar invitación'}
          </button>
        </form>
      )}

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {loading && <p className="p-xl text-center text-on-surface-variant">Cargando...</p>}
        {!loading && members.length === 0 && (
          <p className="p-xl text-center text-on-surface-variant">Sin miembros.</p>
        )}
        {members.map((m) => {
          const isMe = m.userId === info?.user.id;
          const isOwner = m.role === 'OWNER';
          return (
            <div key={m.id} className="px-lg py-md border-b border-outline-variant last:border-0 flex items-center justify-between gap-md">
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
                  <Icon name="person" className="text-on-surface-variant" />
                </div>
                <div>
                  <p className="font-medium text-on-surface">
                    {m.user.name} {isMe && <span className="text-[11px] text-on-surface-variant font-normal">(vos)</span>}
                  </p>
                  <p className="text-body-sm text-on-surface-variant">{m.user.email}</p>
                  {m.user.lastLoginAt && (
                    <p className="text-[11px] text-on-surface-variant">
                      Último login {new Date(m.user.lastLoginAt).toLocaleDateString('es-PY')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-md">
                {canManage && !isOwner && !isMe ? (
                  <select value={m.role} onChange={(e) => changeRole(m.id, e.target.value as MembershipRole)}
                    className="text-[11px] font-bold uppercase tracking-wider px-sm py-unit rounded bg-surface-container border border-outline-variant">
                    <option value="ADMIN">ADMIN</option>
                    <option value="OPERATOR">OPERATOR</option>
                    <option value="READONLY">READONLY</option>
                  </select>
                ) : (
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-sm py-unit rounded ${roleBadge[m.role]}`}>
                    {m.role}
                  </span>
                )}
                {canManage && !isOwner && !isMe && (
                  <button onClick={() => remove(m.id)} className="text-error hover:bg-error-container/30 p-sm rounded-lg transition" aria-label="Quitar">
                    <Icon name="person_remove" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-xl bg-surface-container-low border border-outline-variant rounded-xl p-lg">
        <h3 className="font-body-sm font-bold uppercase tracking-widest text-on-surface-variant mb-md">Roles disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {(Object.keys(roleDescription) as MembershipRole[]).map((r) => (
            <div key={r} className="flex items-start gap-sm">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-sm py-unit rounded shrink-0 ${roleBadge[r]}`}>{r}</span>
              <p className="text-body-sm text-on-surface-variant">{roleDescription[r]}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
