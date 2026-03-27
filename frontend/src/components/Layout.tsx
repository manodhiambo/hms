import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useNotificationStore } from '../store/notificationStore';
import { useHospitalStore } from '../store/hospitalStore';
import {
  LayoutDashboard, Users, CalendarDays, Stethoscope, Pill, FlaskConical, Scan,
  CreditCard, Shield, BedDouble, UserCog, BarChart3, Bell, LogOut, Settings,
  Heart, ClipboardList, Activity, ChevronRight, X, Menu, TrendingDown, ScrollText, RotateCcw, Tag, Building2,
} from 'lucide-react';

const baseNavItems = [
  { path: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { path: '/patients',      label: 'Patients',       icon: Users },
  { path: '/appointments',  label: 'Appointments',   icon: CalendarDays },
  { path: '/triage',        label: 'Triage',         icon: Activity },
  { path: '/visits',        label: 'Consultations',  icon: Stethoscope },
  { path: '/pharmacy',      label: 'Pharmacy',       icon: Pill },
  { path: '/lab',           label: 'Laboratory',     icon: FlaskConical },
  { path: '/imaging',       label: 'Imaging',        icon: Scan },
  { path: '/services',      label: 'Services',       icon: Tag },
  { path: '/billing',       label: 'Billing',        icon: CreditCard },
  { path: '/refunds',       label: 'Refunds',        icon: RotateCcw },
  { path: '/expenses',      label: 'Expenses',       icon: TrendingDown },
  { path: '/insurance',     label: 'Insurance',      icon: Shield },
  { path: '/wards',         label: 'Wards & Beds',   icon: BedDouble },
  { path: '/users',         label: 'Staff',          icon: UserCog },
  { path: '/audit',         label: 'Audit Log',      icon: ScrollText },
  { path: '/reports',       label: 'Reports',        icon: BarChart3 },
  { path: '/settings',      label: 'Settings',       icon: Settings },
];

// 4 pinned items + "More" button on mobile bottom nav
const bottomNavItems = [
  { path: '/dashboard',  label: 'Home',      icon: LayoutDashboard },
  { path: '/patients',   label: 'Patients',  icon: Users },
  { path: '/triage',     label: 'Triage',    icon: Activity },
  { path: '/notifications', label: 'Alerts', icon: Bell, isNotif: true },
];

function Avatar({ initials, src, size = 'md' }: { initials: string; src?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm';
  if (src) {
    return <img src={src} alt="Profile" className={`${sz} rounded-full object-cover flex-shrink-0 ring-2 ring-white`} />;
  }
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

export default function Layout() {
  const { fullName, role, userId, logout, profilePicture } = useAuthStore();
  const { setSidebarOpen } = useUIStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const { fetchFromServer } = useHospitalStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchUnreadCount(userId);
    const interval = setInterval(() => fetchUnreadCount(userId), 30000);
    return () => clearInterval(interval);
  }, [userId, fetchUnreadCount]);

  useEffect(() => {
    fetchFromServer();
  }, [fetchFromServer]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const showQueue = role === 'DOCTOR' || role === 'NURSE';
  const isAdmin   = role === 'SUPER_ADMIN';

  const adminOnlyPaths = ['/users', '/audit', '/hospitals'];
  const navItemsBase = [
    ...(showQueue ? [baseNavItems[0], { path: '/my-queue', label: 'My Queue', icon: ClipboardList }, ...baseNavItems.slice(1)] : baseNavItems),
    ...(isAdmin ? [{ path: '/hospitals', label: 'Hospitals', icon: Building2 }] : []),
  ];
  const navItems = navItemsBase.filter(item => !adminOnlyPaths.includes(item.path) || isAdmin);

  const initials = fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="flex h-screen bg-fb-bg overflow-hidden">

      {/* ══════════════════════════════════════
          DESKTOP SIDEBAR
      ══════════════════════════════════════ */}
      <aside className="hidden lg:flex w-64 xl:w-72 flex-col bg-white border-r border-gray-200 shadow-sm flex-shrink-0">

        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-2xl bg-primary-600 flex items-center justify-center shadow-sm">
            <Heart className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-tight">Hospital Information</h1>
            <p className="text-xs text-primary-500 font-semibold tracking-wide">Manager</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = isActive(path);
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  active ? 'bg-primary-100' : 'bg-gray-100 group-hover:bg-gray-200'
                }`}>
                  <Icon className={`w-4 h-4 ${active ? 'text-primary-600' : 'text-gray-500'}`} />
                </div>
                <span className="flex-1">{label}</span>
                {active && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-default">
            <Avatar initials={initials} src={profilePicture} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{fullName}</p>
              <p className="text-xs text-gray-400 truncate">{role?.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </div>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════
          MAIN COLUMN
      ══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── TOP HEADER ── */}
        <header className="flex-shrink-0 h-14 bg-primary-600 lg:bg-white lg:border-b lg:border-gray-200 flex items-center justify-between px-4 shadow-sm lg:shadow-none z-20">

          {/* Left: logo (mobile) */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" fill="currentColor" />
            </div>
            <span className="text-white font-bold text-base tracking-tight">HMS</span>
          </div>

          {/* Left: page title area (desktop) — empty, sidebar has brand */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-500">Hospital Information Manager</span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Link
              to="/notifications"
              className="relative w-9 h-9 rounded-full bg-white/20 lg:bg-gray-100 flex items-center justify-center hover:bg-white/30 lg:hover:bg-gray-200 transition-colors"
            >
              <Bell className="w-5 h-5 text-white lg:text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[17px] h-[17px] flex items-center justify-center px-0.5 leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Avatar (desktop only) */}
            <div className="hidden lg:block">
              <Avatar initials={initials} src={profilePicture} size="sm" />
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <div className="max-w-7xl mx-auto px-3 py-4 lg:px-6 lg:py-6 page-enter">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ══════════════════════════════════════
          MOBILE BOTTOM NAV BAR
      ══════════════════════════════════════ */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-30 safe-area-bottom">
        <div className="flex items-stretch h-14">
          {bottomNavItems.map(({ path, label, icon: Icon, isNotif }) => {
            const active = isActive(path);
            return (
              <Link
                key={path}
                to={path}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className="relative">
                  <Icon className="w-[22px] h-[22px]" />
                  {isNotif && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5 leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold leading-none">{label}</span>
                {active && <div className="absolute bottom-0 w-8 h-0.5 bg-primary-500 rounded-t-full" />}
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Menu className="w-[22px] h-[22px]" />
            <span className="text-[10px] font-semibold leading-none">More</span>
          </button>
        </div>
      </nav>

      {/* ══════════════════════════════════════
          MOBILE DRAWER ("More" menu)
      ══════════════════════════════════════ */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Sheet */}
          <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white rounded-t-3xl z-50 max-h-[88vh] flex flex-col shadow-2xl">
            {/* Handle */}
            <div className="flex justify-between items-center px-5 pt-4 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
              <div className="w-8" />
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center ml-auto"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* User profile row */}
            <div className="flex items-center gap-3 px-5 py-3 mx-4 mb-2 bg-primary-50 rounded-2xl">
              <Avatar initials={initials} src={profilePicture} size="lg" />
              <div className="min-w-0">
                <p className="text-base font-bold text-gray-900 truncate">{fullName}</p>
                <p className="text-xs text-primary-500 font-medium">{role?.replace(/_/g, ' ')}</p>
              </div>
            </div>

            {/* Nav list */}
            <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-0.5">
              {navItems.map(({ path, label, icon: Icon }) => {
                const active = isActive(path);
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-colors ${
                      active
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      active ? 'bg-primary-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-gray-500'}`} />
                    </div>
                    <span className="flex-1 font-medium text-sm">{label}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </Link>
                );
              })}
            </div>

            {/* Sign out */}
            <div className="px-4 py-3 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="flex items-center gap-4 w-full px-4 py-3 rounded-2xl text-red-600 hover:bg-red-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <LogOut className="w-5 h-5 text-red-500" />
                </div>
                <span className="font-medium text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
