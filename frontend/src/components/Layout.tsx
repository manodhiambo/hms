import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useNotificationStore } from '../store/notificationStore';
import { useHospitalStore } from '../store/hospitalStore';
import {
  LayoutDashboard, Users, CalendarDays, Stethoscope, Pill, FlaskConical, Scan,
  CreditCard, Shield, BedDouble, UserCog, BarChart3, Bell, LogOut, Settings,
  Heart, ClipboardList, Activity, ChevronRight, X, TrendingDown, ScrollText,
  RotateCcw, Tag, ArrowLeft, Menu,
} from 'lucide-react';

// ── Nav groups shown in the "More" drawer ────────────────────────────────────
type NavItem = { path: string; label: string; icon: React.FC<{ className?: string; strokeWidth?: number }>; queueOnly?: boolean; adminOnly?: boolean };
const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Clinical',
    items: [
      { path: '/appointments', label: 'Appointments',  icon: CalendarDays },
      { path: '/visits',       label: 'Consultations', icon: Stethoscope  },
      { path: '/my-queue',     label: 'My Queue',      icon: ClipboardList, queueOnly: true },
    ],
  },
  {
    label: 'Pharmacy & Lab',
    items: [
      { path: '/pharmacy', label: 'Pharmacy',    icon: Pill        },
      { path: '/lab',      label: 'Laboratory',  icon: FlaskConical },
      { path: '/imaging',  label: 'Imaging',     icon: Scan        },
    ],
  },
  {
    label: 'Finance',
    items: [
      { path: '/billing',   label: 'Billing',   icon: CreditCard  },
      { path: '/refunds',   label: 'Refunds',   icon: RotateCcw   },
      { path: '/expenses',  label: 'Expenses',  icon: TrendingDown },
      { path: '/insurance', label: 'Insurance', icon: Shield      },
      { path: '/services',  label: 'Services',  icon: Tag         },
    ],
  },
  {
    label: 'Management',
    items: [
      { path: '/wards',    label: 'Wards & Beds', icon: BedDouble,  adminOnly: true },
      { path: '/users',    label: 'Staff',        icon: UserCog,    adminOnly: true },
      { path: '/audit',    label: 'Audit Log',    icon: ScrollText, adminOnly: true },
      { path: '/reports',  label: 'Reports',      icon: BarChart3   },
      { path: '/settings', label: 'Settings',     icon: Settings    },
    ],
  },
];

// ── Desktop sidebar — flat list ───────────────────────────────────────────────
const sidebarItems: NavItem[] = [
  { path: '/dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
  { path: '/patients',     label: 'Patients',       icon: Users           },
  { path: '/my-queue',     label: 'My Queue',       icon: ClipboardList, queueOnly: true },
  { path: '/appointments', label: 'Appointments',   icon: CalendarDays    },
  { path: '/triage',       label: 'Triage',         icon: Activity        },
  { path: '/visits',       label: 'Consultations',  icon: Stethoscope     },
  { path: '/pharmacy',     label: 'Pharmacy',       icon: Pill            },
  { path: '/lab',          label: 'Laboratory',     icon: FlaskConical    },
  { path: '/imaging',      label: 'Imaging',        icon: Scan            },
  { path: '/services',     label: 'Services',       icon: Tag             },
  { path: '/billing',      label: 'Billing',        icon: CreditCard      },
  { path: '/refunds',      label: 'Refunds',        icon: RotateCcw       },
  { path: '/expenses',     label: 'Expenses',       icon: TrendingDown    },
  { path: '/insurance',    label: 'Insurance',      icon: Shield          },
  { path: '/wards',        label: 'Wards & Beds',   icon: BedDouble,  adminOnly: true },
  { path: '/users',        label: 'Staff',          icon: UserCog,    adminOnly: true },
  { path: '/audit',        label: 'Audit Log',      icon: ScrollText, adminOnly: true },
  { path: '/reports',      label: 'Reports',        icon: BarChart3       },
  { path: '/settings',     label: 'Settings',       icon: Settings        },
];

function Avatar({ initials, src, size = 'md' }: { initials: string; src?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm';
  if (src) return <img src={src} alt="Profile" className={`${sz} rounded-full object-cover flex-shrink-0 ring-2 ring-white/50`} />;
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

export default function Layout() {
  const { fullName, role, userId, logout, profilePicture, isImpersonating, exitImpersonation, hospitalName } = useAuthStore();
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

  useEffect(() => { fetchFromServer(); }, [fetchFromServer]);

  useEffect(() => {
    setDrawerOpen(false);
    setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const handleExitImpersonation = () => { exitImpersonation(); navigate('/hospitals'); };

  const isHospitalAdmin = role === 'HOSPITAL_ADMIN';
  const showQueue = role === 'DOCTOR' || role === 'NURSE';

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const initials = fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  // Filter sidebar items
  const visibleSidebarItems = sidebarItems.filter(item => {
    if (item.queueOnly && !showQueue) return false;
    if (item.adminOnly && !isHospitalAdmin) return false;
    return true;
  });

  // Filter drawer groups
  const visibleGroups = navGroups.map(g => ({
    ...g,
    items: g.items.filter(item => {
      if (item.queueOnly && !showQueue) return false;
      if (item.adminOnly && !isHospitalAdmin) return false;
      return true;
    }),
  })).filter(g => g.items.length > 0);

  return (
    <div className="flex flex-col h-screen bg-fb-bg overflow-hidden">

      {/* ── Impersonation banner ───────────────────────────────────────── */}
      {isImpersonating && (
        <div className="flex-shrink-0 bg-amber-500 text-white flex items-center justify-between px-4 py-2 text-sm z-50">
          <span className="font-medium truncate">
            <span className="font-bold">Impersonating: </span>{hospitalName || 'Hospital'}
          </span>
          <button
            onClick={handleExitImpersonation}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg font-semibold whitespace-nowrap ml-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Admin
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">

        {/* ═══════════════════════════════════════════
            DESKTOP SIDEBAR
        ═══════════════════════════════════════════ */}
        <aside className="hidden lg:flex w-60 xl:w-64 flex-col bg-white border-r border-gray-200 flex-shrink-0">

          {/* Brand */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shadow-sm flex-shrink-0">
              <Heart className="w-4 h-4 text-white" fill="currentColor" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-gray-900 leading-tight truncate">Hospital Information</p>
              <p className="text-[11px] text-primary-500 font-semibold tracking-wide">Manager</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
            {visibleSidebarItems.map(({ path, label, icon: Icon }) => {
              const active = isActive(path);
              return (
                <Link key={path} to={path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all group ${
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    active ? 'bg-primary-100' : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-primary-600' : 'text-gray-500'}`} />
                  </div>
                  <span className="flex-1 truncate">{label}</span>
                  {active && <div className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />}
                </Link>
              );
            })}
          </nav>

          {/* User card */}
          <div className="p-2 border-t border-gray-100 space-y-0.5">
            <Link to="/notifications" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors relative">
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Bell className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <span className="text-[13px] font-medium text-gray-600">Notifications</span>
              {unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
              <Avatar initials={initials} src={profilePicture} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-900 truncate">{fullName}</p>
                <p className="text-[11px] text-gray-400 truncate">{role?.replace(/_/g, ' ')}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all">
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-3.5 h-3.5" />
              </div>
              Sign Out
            </button>
          </div>
        </aside>

        {/* ═══════════════════════════════════════════
            MAIN CONTENT COLUMN
        ═══════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* ── Mobile Top Header ─────────────────── */}
          <header className="lg:hidden flex-shrink-0 bg-primary-600 h-14 flex items-center justify-between px-4 z-20 shadow-md">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" fill="currentColor" />
              </div>
              <span className="text-white font-bold text-[15px] tracking-tight">HMS</span>
            </div>
            {/* Right actions */}
            <div className="flex items-center gap-1">
              <Link to="/notifications"
                className="relative w-10 h-10 rounded-full bg-white/15 flex items-center justify-center active:bg-white/25">
                <Bell className="w-5 h-5 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5 leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <button onClick={() => setDrawerOpen(true)}
                className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center active:bg-white/25">
                <Menu className="w-5 h-5 text-white" />
              </button>
            </div>
          </header>

          {/* ── Desktop Top Bar ───────────────────── */}
          <header className="hidden lg:flex flex-shrink-0 h-12 bg-white border-b border-gray-100 items-center justify-between px-5 z-10">
            <span className="text-sm font-semibold text-gray-500">Hospital Information Manager</span>
            <div className="flex items-center gap-2">
              <Link to="/notifications" className="relative w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                <Bell className="w-4 h-4 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              <Avatar initials={initials} src={profilePicture} size="sm" />
            </div>
          </header>

          {/* ── Page Content ──────────────────────── */}
          <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
            <div className="max-w-5xl mx-auto px-3 py-4 lg:px-5 lg:py-5 page-enter">
              <Outlet />
            </div>
          </main>
        </div>
      </div>{/* end flex row */}

      {/* ═══════════════════════════════════════════
          MOBILE BOTTOM TAB BAR
      ═══════════════════════════════════════════ */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-30 bottom-nav">
        <div className="flex items-stretch" style={{ height: '56px' }}>
          {[
            { path: '/dashboard', label: 'Home',     icon: LayoutDashboard },
            { path: '/patients',  label: 'Patients', icon: Users           },
            { path: '/triage',    label: 'Triage',   icon: Activity        },
          ].map(({ path, label, icon: Icon }) => {
            const active = isActive(path);
            return (
              <Link key={path} to={path}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
                  active ? 'text-primary-600' : 'text-gray-400'
                }`}
              >
                {active && <div className="absolute top-0 inset-x-2 h-0.5 bg-primary-500 rounded-b-full" />}
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-semibold leading-none">{label}</span>
              </Link>
            );
          })}

          {/* Notifications */}
          <Link to="/notifications"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
              isActive('/notifications') ? 'text-primary-600' : 'text-gray-400'
            }`}
          >
            {isActive('/notifications') && <div className="absolute top-0 inset-x-2 h-0.5 bg-primary-500 rounded-b-full" />}
            <div className="relative">
              <Bell className="w-5 h-5" strokeWidth={isActive('/notifications') ? 2.5 : 2} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-red-500 text-white text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5 leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold leading-none">Alerts</span>
          </Link>

          {/* More */}
          <button onClick={() => setDrawerOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-400 active:text-gray-600">
            <div className="flex flex-col gap-[3px] items-center">
              <div className="flex gap-[3px]">
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
              </div>
              <div className="flex gap-[3px]">
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
              </div>
            </div>
            <span className="text-[10px] font-semibold leading-none mt-0.5">More</span>
          </button>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════
          MOBILE DRAWER ("More" sheet)
      ═══════════════════════════════════════════ */}
      {drawerOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px]"
            onClick={() => setDrawerOpen(false)} />

          <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white rounded-t-2xl z-50 max-h-[86vh] flex flex-col shadow-2xl sheet-enter">

            {/* Handle + header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
              <div className="absolute left-1/2 -translate-x-1/2 top-2 w-9 h-1 rounded-full bg-gray-300" />
              <div className="flex items-center gap-3 pt-1">
                <Avatar initials={initials} src={profilePicture} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{fullName}</p>
                  <p className="text-xs text-primary-500 font-medium">{role?.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <button onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Nav groups */}
            <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-3">
              {visibleGroups.map(group => (
                <div key={group.label}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-1">{group.label}</p>
                  <div className="space-y-0.5">
                    {group.items.map(({ path, label, icon: Icon }) => {
                      const active = isActive(path);
                      return (
                        <Link key={path} to={path}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                            active ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            active ? 'bg-primary-100' : 'bg-gray-100'
                          }`}>
                            <Icon className={`w-4.5 h-4.5 ${active ? 'text-primary-600' : 'text-gray-500'}`} />
                          </div>
                          <span className="flex-1 text-sm font-medium">{label}</span>
                          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Sign out */}
            <div className="flex-shrink-0 px-3 py-3 border-t border-gray-100 bottom-nav">
              <button onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <LogOut className="w-4.5 h-4.5 text-red-500" />
                </div>
                <span className="text-sm font-semibold">Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
