import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, CheckCircle2, XCircle, Clock, LogIn,
  Search, Eye, EyeOff, Plus, X, Loader2
} from 'lucide-react';
import { hospitalApi } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import type { Hospital, SubscriptionStatus } from '../../types';

const statusColor: Record<SubscriptionStatus, string> = {
  TRIAL: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  EXPIRED: 'bg-red-100 text-red-700',
  DEACTIVATED: 'bg-gray-100 text-gray-600',
};

const statusIcon: Record<SubscriptionStatus, React.FC<{ className?: string }>> = {
  TRIAL: Clock,
  ACTIVE: CheckCircle2,
  EXPIRED: XCircle,
  DEACTIVATED: XCircle,
};

interface RegForm {
  name: string; email: string; phone: string;
  contactPerson: string; county: string; address: string;
  adminName: string; adminEmail: string; adminPassword: string;
}
const emptyForm: RegForm = {
  name: '', email: '', phone: '', contactPerson: '',
  county: '', address: '', adminName: '', adminEmail: '', adminPassword: '',
};

export default function HospitalsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const authLogin = useAuthStore((s) => s.login);

  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [actionTarget, setActionTarget] = useState<{ id: number; action: 'activate' | 'deactivate' } | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Register modal
  const [showRegister, setShowRegister] = useState(false);
  const [form, setForm] = useState<RegForm>(emptyForm);
  const [regError, setRegError] = useState('');
  const [showAdminPw, setShowAdminPw] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['hospitals'],
    queryFn: () => hospitalApi.getAll().then(r => r.data.data),
  });

  const activateMut = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) => hospitalApi.activate(id, notes),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hospitals'] }); setActionTarget(null); setNotes(''); },
  });

  const deactivateMut = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) => hospitalApi.deactivate(id, notes),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['hospitals'] }); setActionTarget(null); setNotes(''); },
  });

  const impersonateMut = useMutation({
    mutationFn: (id: number) => hospitalApi.impersonate(id).then(r => r.data.data),
    onSuccess: (authData) => { authLogin(authData); navigate('/dashboard'); },
  });

  const registerMut = useMutation({
    mutationFn: () => hospitalApi.register(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hospitals'] });
      setShowRegister(false);
      setForm(emptyForm);
      setRegError('');
    },
    onError: (err: any) => {
      setRegError(err?.response?.data?.message || 'Registration failed. Please try again.');
    },
  });

  const hospitals = (data || []).filter(h =>
    !search || h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.email?.toLowerCase().includes(search.toLowerCase())
  );

  const confirmAction = () => {
    if (!actionTarget) return;
    if (actionTarget.action === 'activate') activateMut.mutate({ id: actionTarget.id, notes });
    else deactivateMut.mutate({ id: actionTarget.id, notes });
  };

  const trialDaysLeft = (h: Hospital) => {
    if (!h.trialEndsAt) return 0;
    const diff = new Date(h.trialEndsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary-600" /> Hospitals
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage tenant hospitals, subscriptions, and access</p>
        </div>
        <button
          onClick={() => { setShowRegister(true); setRegError(''); }}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Hospital
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none bg-white"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Loading hospitals…</div>
      ) : hospitals.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No hospitals found.</div>
      ) : (
        <div className="space-y-3">
          {hospitals.map(h => {
            const StatusIcon = statusIcon[h.subscriptionStatus];
            const isExpanded = expandedId === h.id;
            const daysLeft = h.subscriptionStatus === 'TRIAL' ? trialDaysLeft(h) : null;
            return (
              <div key={h.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{h.name}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[h.subscriptionStatus]}`}>
                        <StatusIcon className="w-3 h-3" />
                        {h.subscriptionStatus}
                        {daysLeft !== null && ` · ${daysLeft}d left`}
                      </span>
                      {!h.active && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{h.email} · {h.phone} · {h.county}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => impersonateMut.mutate(h.id)}
                      disabled={!h.active || impersonateMut.isPending}
                      title="Login as this hospital's admin"
                      className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                    >
                      <LogIn className="w-3.5 h-3.5" /> Impersonate
                    </button>
                    {h.active ? (
                      <button
                        onClick={() => setActionTarget({ id: h.id, action: 'deactivate' })}
                        className="flex items-center gap-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => setActionTarget({ id: h.id, action: 'activate' })}
                        className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Activate
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : h.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 grid sm:grid-cols-3 gap-3 text-xs">
                    <div><span className="text-gray-400">Contact Person:</span> <span className="font-medium text-gray-700">{h.contactPerson || '—'}</span></div>
                    <div><span className="text-gray-400">Address:</span> <span className="font-medium text-gray-700">{h.address || '—'}</span></div>
                    <div><span className="text-gray-400">Registered:</span> <span className="font-medium text-gray-700">{h.createdAt ? new Date(h.createdAt).toLocaleDateString() : '—'}</span></div>
                    <div><span className="text-gray-400">Trial Ends:</span> <span className="font-medium text-gray-700">{h.trialEndsAt ? new Date(h.trialEndsAt).toLocaleString() : '—'}</span></div>
                    <div><span className="text-gray-400">Sub. Expires:</span> <span className="font-medium text-gray-700">{h.subscriptionExpiresAt ? new Date(h.subscriptionExpiresAt).toLocaleDateString() : '—'}</span></div>
                    {h.notes && <div className="sm:col-span-3"><span className="text-gray-400">Notes:</span> <span className="font-medium text-gray-700">{h.notes}</span></div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Activate / Deactivate Modal ── */}
      {actionTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1 capitalize">{actionTarget.action} Hospital</h3>
            <p className="text-sm text-gray-500 mb-4">
              {actionTarget.action === 'activate'
                ? 'This will activate the hospital and set subscription to ACTIVE (1 year from now).'
                : 'This will deactivate the hospital and disable all user logins.'}
            </p>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              {actionTarget.action === 'activate' ? 'Notes (e.g. payment ref)' : 'Reason'}
            </label>
            <input
              value={notes} onChange={e => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 mb-4"
              placeholder={actionTarget.action === 'activate' ? 'e.g. MPesa ref ABC123' : 'e.g. Trial expired'}
            />
            <div className="flex gap-3">
              <button onClick={() => { setActionTarget(null); setNotes(''); }}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={confirmAction}
                disabled={activateMut.isPending || deactivateMut.isPending}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60 ${actionTarget.action === 'activate' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {activateMut.isPending || deactivateMut.isPending ? 'Processing…' : `Confirm ${actionTarget.action}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Register Hospital Modal ── */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Register New Hospital</h3>
              <button onClick={() => setShowRegister(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <p className="text-xs text-gray-500">Hospital will start on a 5-day free trial.</p>

              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Hospital Details</p>
                {[
                  { name: 'name', label: 'Hospital Name', placeholder: 'e.g. Nairobi General Hospital' },
                  { name: 'email', label: 'Hospital Email', placeholder: 'e.g. info@hospital.co.ke' },
                  { name: 'phone', label: 'Phone', placeholder: 'e.g. 0712345678' },
                  { name: 'contactPerson', label: 'Contact Person', placeholder: 'e.g. Dr. Jane Doe' },
                  { name: 'county', label: 'County', placeholder: 'e.g. Nairobi' },
                  { name: 'address', label: 'Address', placeholder: 'e.g. Hospital Rd, Nairobi' },
                ].map(f => (
                  <div key={f.name}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                    <input
                      name={f.name}
                      value={(form as any)[f.name]}
                      onChange={handleChange}
                      placeholder={f.placeholder}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Admin Account</p>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Admin Full Name</label>
                  <input name="adminName" value={form.adminName} onChange={handleChange}
                    placeholder="e.g. John Mwangi"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Admin Email</label>
                  <input name="adminEmail" value={form.adminEmail} onChange={handleChange}
                    placeholder="e.g. admin@hospital.co.ke"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Admin Password</label>
                  <div className="relative">
                    <input name="adminPassword" value={form.adminPassword} onChange={handleChange}
                      type={showAdminPw ? 'text' : 'password'}
                      placeholder="Set a strong password"
                      className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500" />
                    <button type="button" onClick={() => setShowAdminPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showAdminPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {regError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{regError}</p>}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowRegister(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => registerMut.mutate()}
                disabled={registerMut.isPending || !form.name || !form.adminEmail || !form.adminPassword}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {registerMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering…</> : 'Register Hospital'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
