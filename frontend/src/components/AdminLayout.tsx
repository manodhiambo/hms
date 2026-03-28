import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { userApi } from '../api/services';
import { Building2, LogOut, Heart, KeyRound, X, Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

// ── Password strength helpers ─────────────────────────────────────────────────

const checks = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number (0-9)', test: (p: string) => /[0-9]/.test(p) },
  { label: 'Special character (@, #, $, !…)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function strengthScore(password: string): number {
  return checks.filter(c => c.test(password)).length;
}

const strengthLabel = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const strengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-emerald-500'];

// ── Change Password Modal ─────────────────────────────────────────────────────

interface ChangePasswordModalProps {
  userId: number;
  onClose: () => void;
}

function ChangePasswordModal({ userId, onClose }: ChangePasswordModalProps) {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const score = strengthScore(newPw);
  const passwordsMatch = newPw.length > 0 && confirmPw.length > 0 && newPw === confirmPw;
  const passwordsMismatch = confirmPw.length > 0 && newPw !== confirmPw;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPw) { setError('Current password is required'); return; }
    if (!newPw) { setError('New password is required'); return; }
    if (!confirmPw) { setError('Please confirm your new password'); return; }
    if (newPw !== confirmPw) { setError('New password and confirmation do not match'); return; }
    if (score < 5) { setError('Password does not meet all strength requirements'); return; }

    setLoading(true);
    try {
      await userApi.changeSuperAdminPassword(userId, currentPw, newPw, confirmPw);
      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {success ? (
          <div className="px-6 py-10 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-lg font-bold text-gray-900">Password Changed</p>
            <p className="text-sm text-gray-500 mt-1">Your password has been updated successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowCurrent(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                  placeholder="Enter new password"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowNew(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {newPw.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= score ? strengthColor[score] : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-semibold ${score <= 2 ? 'text-red-500' : score === 3 ? 'text-yellow-600' : score === 4 ? 'text-blue-600' : 'text-emerald-600'}`}>
                    {strengthLabel[score]}
                  </p>
                </div>
              )}

              {/* Requirements checklist */}
              {newPw.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {checks.map(c => {
                    const passed = c.test(newPw);
                    return (
                      <li key={c.label} className={`flex items-center gap-1.5 text-xs ${passed ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {passed ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> : <XCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                        {c.label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  className={`w-full px-3 py-2.5 pr-10 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 ${
                    passwordsMismatch ? 'border-red-300 bg-red-50' : passwordsMatch ? 'border-emerald-400' : 'border-gray-200'
                  }`}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordsMismatch && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
              {passwordsMatch && <p className="text-xs text-emerald-600 mt-1">Passwords match</p>}
            </div>

            {/* History notice */}
            <p className="text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-lg">
              You cannot reuse any of your last 5 passwords.
            </p>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-sm px-3 py-2.5 rounded-xl">
                <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || score < 5 || !passwordsMatch || !currentPw}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</> : 'Change Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function AdminLayout() {
  const { fullName, userId, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [showChangePw, setShowChangePw] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'SA';

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">

      {/* ── Mobile / Desktop top bar ── */}
      <header className="flex-shrink-0 h-14 bg-gray-900 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
            <Heart className="w-4 h-4 text-white" fill="currentColor" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 leading-none">Helvino Technologies</p>
            <p className="text-sm font-bold text-white leading-snug">Platform Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChangePw(true)}
            title="Change Password"
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm px-2 py-1.5 rounded-lg hover:bg-gray-800 transition-all"
          >
            <KeyRound className="w-4 h-4" />
            <span className="hidden sm:inline">Change Password</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 text-sm px-2 py-1.5 rounded-lg hover:bg-gray-800 transition-all">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Desktop sidebar ── */}
        <aside className="hidden lg:flex w-52 flex-col bg-gray-900 flex-shrink-0 border-r border-gray-800">
          <nav className="flex-1 py-4 px-3 space-y-0.5">
            <Link to="/hospitals"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive('/hospitals')
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4 flex-shrink-0" />
              Hospitals
            </Link>
          </nav>
        </aside>

        {/* ── Main ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-4 py-5 page-enter">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-800 z-30 bottom-nav">
        <div className="flex items-stretch" style={{ height: '56px' }}>
          <Link to="/hospitals"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              isActive('/hospitals') ? 'text-primary-400' : 'text-gray-500'
            }`}
          >
            <Building2 className="w-5 h-5" strokeWidth={isActive('/hospitals') ? 2.5 : 2} />
            <span className="text-[10px] font-semibold leading-none">Hospitals</span>
          </Link>
          <button
            onClick={() => setShowChangePw(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-500 active:text-white"
          >
            <KeyRound className="w-5 h-5" />
            <span className="text-[10px] font-semibold leading-none">Password</span>
          </button>
          <button onClick={handleLogout}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-500 active:text-red-400">
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] font-semibold leading-none">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Mobile bottom padding */}
      <div className="lg:hidden" style={{ height: '56px' }} />

      {/* Change Password Modal */}
      {showChangePw && userId && (
        <ChangePasswordModal userId={userId} onClose={() => setShowChangePw(false)} />
      )}
    </div>
  );
}
