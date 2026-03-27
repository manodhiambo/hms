import { useEffect, useState } from 'react';
import { Users, CalendarDays, CreditCard, BedDouble, FlaskConical, AlertTriangle, BookOpen, ExternalLink } from 'lucide-react';
import { dashboardApi } from '../../api/services';
import type { Dashboard } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.get().then((r) => setData(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-8 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Patients Today', value: data?.patientsToday ?? 0, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Appointments', value: data?.appointmentsToday ?? 0, icon: CalendarDays, color: 'bg-purple-50 text-purple-600' },
    { label: "Today's Revenue", value: `KES ${(data?.revenueToday ?? 0).toLocaleString()}`, icon: CreditCard, color: 'bg-green-50 text-green-600' },
    { label: 'Bed Occupancy', value: `${data?.bedOccupancyRate ?? 0}%`, icon: BedDouble, color: 'bg-orange-50 text-orange-600' },
  ];

  const departmentData = Object.entries(data?.departmentVisits ?? {}).map(([name, visits]) => ({
    name,
    visits,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm p-5">
            <div className={`w-10 h-10 rounded-2xl ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-xl font-bold text-gray-900">{value}</div>
            <p className="text-xs font-medium text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-gray-900">Visits by Department</h2>
            <div className="text-sm text-gray-500">{data?.visitsToday ?? 0} visits today</div>
          </div>
          {departmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} allowDecimals={false} />
                <Tooltip formatter={(v: number | undefined) => [`${v ?? 0}`, 'Visits']} />
                <Bar dataKey="visits" fill="#1877F2" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">
              No department visit data available
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Alerts</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">{data?.lowStockDrugs?.length ?? 0} Low Stock Drugs</p>
                <p className="text-xs text-red-600 mt-0.5">Reorder needed</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <FlaskConical className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">{data?.pendingLabOrders ?? 0} Pending Lab Orders</p>
                <p className="text-xs text-yellow-600 mt-0.5">Awaiting processing</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <BedDouble className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">{data?.availableBeds ?? 0} Available Beds</p>
                <p className="text-xs text-blue-600 mt-0.5">of {data?.totalBeds ?? 0} total</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Monthly Revenue</h3>
            <div className="text-2xl font-bold text-gray-900">KES {(data?.revenueThisMonth ?? 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* User Manual Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">User Manual</p>
            <p className="text-xs text-primary-100 mt-0.5">Step-by-step guide covering all modules — patients, billing, lab, pharmacy, reports and more.</p>
          </div>
        </div>
        <a
          href="/user-manual.html"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-white text-primary-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-50 transition-colors shrink-0"
        >
          <ExternalLink className="w-4 h-4" /> Open Manual
        </a>
      </div>
    </div>
  );
}
