import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Building2, LogOut, Heart } from 'lucide-react';

export default function AdminLayout() {
  const { fullName, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

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
          <button onClick={handleLogout}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-500 active:text-red-400">
            <LogOut className="w-5 h-5" />
            <span className="text-[10px] font-semibold leading-none">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Mobile bottom padding */}
      <div className="lg:hidden" style={{ height: '56px' }} />
    </div>
  );
}
