import { useState } from 'react';
import { BarChart3, Download, Printer } from 'lucide-react';
import { reportApi } from '../../api/services';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useHospitalStore } from '../../store/hospitalStore';

type Tab = 'financial' | 'patients' | 'morbidity' | 'moh' | 'revenue';

interface MorbidityEntry {
  diagnosis: string;
  diagnosisCode: string | null;
  count: number;
}

interface MohReport {
  startDate: string;
  endDate: string;
  outpatient: {
    total: number;
    newAttendances: number;
    reAttendances: number;
    byGender: Record<string, number>;
    byVisitType: Record<string, number>;
    byAgeGroup: Record<string, number>;
  };
  inpatient: { admissions: number; discharges: number; currentInpatients: number };
  morbidity: Array<{ rank: number; diagnosis: string; diagnosisCode: string | null; count: number; percent: number }>;
  totalDiagnosedCases: number;
  laboratory: { totalOrders: number; completed: number; abnormal: number; normalResults: number; byCategory: Record<string, number> };
  imaging: { total: number; byType: Record<string, number> };
  pharmacy: { totalPrescriptions: number; dispensed: number; pending: number };
  financial: { totalBilled: number; totalCollected: number; totalExpenses: number; netIncome: number };
}

const fmt = (n: number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(n || 0);
const num = (v: unknown) => Number(v || 0);

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('moh');
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [morbidity, setMorbidity] = useState<MorbidityEntry[] | null>(null);
  const [mohReport, setMohReport] = useState<MohReport | null>(null);
  const [revenueReport, setRevenueReport] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const hospital = useHospitalStore();

  const loadReport = async () => {
    setLoading(true);
    setReport(null); setMorbidity(null); setMohReport(null); setRevenueReport(null);
    try {
      if (tab === 'morbidity') {
        const { data } = await reportApi.morbidity(startDate, endDate);
        setMorbidity(data.data);
      } else if (tab === 'moh') {
        const { data } = await reportApi.moh(startDate, endDate);
        setMohReport(data.data as unknown as MohReport);
      } else if (tab === 'revenue') {
        const { data } = await reportApi.revenue(startDate, endDate);
        setRevenueReport(data.data);
      } else {
        const api = tab === 'financial' ? reportApi.financial : reportApi.patients;
        const { data } = await api(startDate, endDate);
        setReport(data.data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const chartData = report ? [
    { name: 'Revenue', value: num(report.totalRevenue) },
    { name: 'Payments', value: num(report.totalPayments) },
    { name: 'Expenses', value: num(report.totalExpenses) },
    { name: 'Net Income', value: num(report.netIncome) },
  ] : [];

  const morbTotal = morbidity ? morbidity.reduce((s, e) => s + e.count, 0) : 0;

  // ── PRINT MOH REPORT ──
  const printMoh = () => {
    if (!mohReport) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const m = mohReport;
    const ageGroupRows = Object.entries(m.outpatient.byAgeGroup)
      .map(([grp, cnt]) => `<tr><td>${grp}</td><td class="num">${cnt}</td></tr>`).join('');
    const genderRows = Object.entries(m.outpatient.byGender)
      .map(([g, c]) => `<tr><td>${g.charAt(0) + g.slice(1).toLowerCase()}</td><td class="num">${c}</td></tr>`).join('');
    const visitTypeRows = Object.entries(m.outpatient.byVisitType)
      .map(([t, c]) => `<tr><td>${t.replace(/_/g, ' ')}</td><td class="num">${c}</td></tr>`).join('');
    const morbRows = m.morbidity.map(e => `<tr>
      <td class="num">${e.rank}</td>
      <td>${e.diagnosis || '—'}</td>
      <td class="code">${e.diagnosisCode || '—'}</td>
      <td class="num"><strong>${e.count}</strong></td>
      <td class="num">${e.percent}%</td>
    </tr>`).join('');
    const labCatRows = Object.entries(m.laboratory.byCategory)
      .map(([cat, cnt]) => `<tr><td>${cat}</td><td class="num">${cnt}</td></tr>`).join('');
    const imgTypeRows = Object.entries(m.imaging.byType)
      .map(([t, c]) => `<tr><td>${t.replace(/_/g, ' ')}</td><td class="num">${c}</td></tr>`).join('');

    win.document.write(`<!DOCTYPE html><html><head><title>MOH Report — ${m.startDate} to ${m.endDate}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;font-size:11px;color:#111;padding:16px;max-width:800px;margin:0 auto}
  .cover{text-align:center;border-bottom:3px double #000;padding-bottom:12px;margin-bottom:16px}
  .cover h1{font-size:15px;font-weight:bold;letter-spacing:0.5px}
  .cover h2{font-size:13px;font-weight:bold;margin:4px 0}
  .cover p{font-size:10px;color:#444;margin:2px 0}
  .cover .facility{font-size:12px;font-weight:bold;margin-top:6px}
  .cover .period{font-size:11px;color:#222;margin-top:2px}
  .section{margin-bottom:14px;page-break-inside:avoid}
  .section-title{background:#1e3a5f;color:#fff;padding:4px 8px;font-weight:bold;font-size:11px;letter-spacing:0.5px;margin-bottom:6px}
  .subsection-title{background:#e8f0f7;color:#1e3a5f;padding:3px 6px;font-weight:bold;font-size:10px;margin-bottom:4px;margin-top:6px}
  table{width:100%;border-collapse:collapse;font-size:10px;margin-bottom:6px}
  th{background:#e8f0f7;color:#1e3a5f;font-weight:bold;padding:4px 6px;border:1px solid #c0cfe0;text-align:left;font-size:10px}
  td{padding:3px 6px;border:1px solid #ddd}
  .num{text-align:right}
  .code{font-family:monospace;color:#0369a1;font-size:10px}
  .summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:8px}
  .stat-box{border:1px solid #c0cfe0;padding:6px 8px;text-align:center;background:#f7fafd}
  .stat-box .label{font-size:9px;color:#555;text-transform:uppercase;letter-spacing:0.3px}
  .stat-box .value{font-size:15px;font-weight:bold;color:#1e3a5f;margin-top:2px}
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .highlight{font-weight:bold;background:#f0f7ff}
  .total-row{font-weight:bold;background:#e8f0f7}
  .footer{border-top:2px solid #1e3a5f;padding-top:8px;margin-top:16px;text-align:center;font-size:9px;color:#666}
  .moh-logo{font-size:9px;font-weight:bold;color:#1e3a5f;letter-spacing:1px}
  @media print{body{padding:0;font-size:10px}@page{margin:12mm;size:A4}}
</style></head><body>
<div class="cover">
  <div class="moh-logo">KENYA MINISTRY OF HEALTH — HEALTH MANAGEMENT INFORMATION SYSTEM (HMIS)</div>
  <h1>MONTHLY HEALTH FACILITY REPORT</h1>
  <h2 class="facility">${hospital.name}</h2>
  <p>${hospital.address}</p>
  <p>Tel: ${hospital.phone} | ${hospital.email}</p>
  <p class="period">Reporting Period: <strong>${m.startDate}</strong> to <strong>${m.endDate}</strong></p>
</div>

<!-- A: OUTPATIENT -->
<div class="section">
  <div class="section-title">SECTION A: OUTPATIENT ATTENDANCE</div>
  <div class="summary-grid">
    <div class="stat-box"><div class="label">Total OPD Visits</div><div class="value">${m.outpatient.total}</div></div>
    <div class="stat-box"><div class="label">New Attendances</div><div class="value">${m.outpatient.newAttendances}</div></div>
    <div class="stat-box"><div class="label">Re-Attendances</div><div class="value">${m.outpatient.reAttendances}</div></div>
    <div class="stat-box"><div class="label">Total Diagnosed Cases</div><div class="value">${m.totalDiagnosedCases}</div></div>
  </div>
  <div class="two-col">
    <div>
      <div class="subsection-title">By Gender</div>
      <table><thead><tr><th>Gender</th><th>Count</th></tr></thead><tbody>${genderRows}</tbody></table>
      <div class="subsection-title">By Visit Type</div>
      <table><thead><tr><th>Visit Type</th><th>Count</th></tr></thead><tbody>${visitTypeRows}</tbody></table>
    </div>
    <div>
      <div class="subsection-title">By Age Group</div>
      <table><thead><tr><th>Age Group</th><th>Count</th></tr></thead><tbody>${ageGroupRows}</tbody></table>
    </div>
  </div>
</div>

<!-- B: INPATIENT -->
<div class="section">
  <div class="section-title">SECTION B: INPATIENT / WARD STATISTICS</div>
  <table>
    <thead><tr><th>Indicator</th><th>Count</th></tr></thead>
    <tbody>
      <tr><td>Total Admissions in Period</td><td class="num">${m.inpatient.admissions}</td></tr>
      <tr><td>Total Discharges in Period</td><td class="num">${m.inpatient.discharges}</td></tr>
      <tr class="highlight"><td>Currently Admitted (Inpatients)</td><td class="num">${m.inpatient.currentInpatients}</td></tr>
    </tbody>
  </table>
</div>

<!-- C: MORBIDITY -->
<div class="section">
  <div class="section-title">SECTION C: TOP 10 DISEASES / MORBIDITY (MOH 705)</div>
  <table>
    <thead><tr><th>#</th><th>Disease / Condition</th><th>ICD-10 Code</th><th>Cases</th><th>% of Total</th></tr></thead>
    <tbody>
      ${morbRows || '<tr><td colspan="5" style="text-align:center;color:#888">No diagnosed cases recorded in this period</td></tr>'}
      <tr class="total-row"><td colspan="3">TOTAL</td><td class="num">${m.totalDiagnosedCases}</td><td class="num">100%</td></tr>
    </tbody>
  </table>
</div>

<!-- D: LABORATORY -->
<div class="section">
  <div class="section-title">SECTION D: LABORATORY SERVICES</div>
  <div class="summary-grid">
    <div class="stat-box"><div class="label">Total Orders</div><div class="value">${m.laboratory.totalOrders}</div></div>
    <div class="stat-box"><div class="label">Completed</div><div class="value">${m.laboratory.completed}</div></div>
    <div class="stat-box"><div class="label">Abnormal Results</div><div class="value">${m.laboratory.abnormal}</div></div>
    <div class="stat-box"><div class="label">Normal Results</div><div class="value">${m.laboratory.normalResults}</div></div>
  </div>
  ${Object.keys(m.laboratory.byCategory).length > 0 ? `
  <div class="subsection-title">Tests by Category</div>
  <table>
    <thead><tr><th>Test Category</th><th>Total Ordered</th></tr></thead>
    <tbody>${labCatRows}</tbody>
  </table>` : ''}
</div>

<!-- E: IMAGING -->
<div class="section">
  <div class="section-title">SECTION E: IMAGING / RADIOLOGY SERVICES</div>
  <table>
    <thead><tr><th>Indicator</th><th>Count</th></tr></thead>
    <tbody>
      <tr class="highlight"><td>Total Imaging Requests</td><td class="num">${m.imaging.total}</td></tr>
      ${imgTypeRows}
    </tbody>
  </table>
</div>

<!-- F: PHARMACY -->
<div class="section">
  <div class="section-title">SECTION F: PHARMACY SERVICES</div>
  <table>
    <thead><tr><th>Indicator</th><th>Count</th></tr></thead>
    <tbody>
      <tr><td>Total Prescriptions Written</td><td class="num">${m.pharmacy.totalPrescriptions}</td></tr>
      <tr><td>Prescriptions Dispensed</td><td class="num">${m.pharmacy.dispensed}</td></tr>
      <tr class="highlight"><td>Prescriptions Pending Dispensing</td><td class="num">${m.pharmacy.pending}</td></tr>
    </tbody>
  </table>
</div>

<!-- G: FINANCIAL -->
<div class="section">
  <div class="section-title">SECTION G: REVENUE & FINANCIAL SUMMARY</div>
  <table>
    <thead><tr><th>Indicator</th><th>Amount (KES)</th></tr></thead>
    <tbody>
      <tr><td>Total Amount Billed</td><td class="num">${fmt(m.financial.totalBilled)}</td></tr>
      <tr><td>Total Payments Collected</td><td class="num">${fmt(m.financial.totalCollected)}</td></tr>
      <tr><td>Total Expenses</td><td class="num">${fmt(m.financial.totalExpenses)}</td></tr>
      <tr class="total-row"><td>Net Income (Collected − Expenses)</td><td class="num">${fmt(m.financial.netIncome)}</td></tr>
    </tbody>
  </table>
</div>

<!-- SIGNATURES -->
<div class="section" style="margin-top:24px">
  <div class="two-col" style="gap:40px">
    <div>
      <p style="font-size:10px;margin-bottom:2px">Prepared by:</p>
      <div style="border-bottom:1px solid #000;height:30px;margin-bottom:4px"></div>
      <p style="font-size:9px;color:#555">Name &amp; Designation</p>
      <div style="border-bottom:1px solid #000;height:30px;margin-top:8px;margin-bottom:4px"></div>
      <p style="font-size:9px;color:#555">Signature &amp; Date</p>
    </div>
    <div>
      <p style="font-size:10px;margin-bottom:2px">Verified by (In-Charge):</p>
      <div style="border-bottom:1px solid #000;height:30px;margin-bottom:4px"></div>
      <p style="font-size:9px;color:#555">Name &amp; Designation</p>
      <div style="border-bottom:1px solid #000;height:30px;margin-top:8px;margin-bottom:4px"></div>
      <p style="font-size:9px;color:#555">Signature &amp; Date</p>
    </div>
  </div>
</div>

<div class="footer">
  <p>Generated: ${new Date().toLocaleString()} | ${hospital.name}</p>
  <p style="margin-top:2px;font-size:8px">Helvino Hospital Management System — Developed by Helvino Technologies Limited | helvino.org | 0703445756</p>
</div>
</body></html>`);
    win.document.close(); win.focus(); win.print();
  };

  const printMorbidity = () => {
    if (!morbidity) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const total = morbidity.reduce((sum, e) => sum + e.count, 0);
    win.document.write(`<!DOCTYPE html><html><head><title>Morbidity Report</title>
<style>
body{font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:20px;font-size:13px;color:#333}
.header{text-align:center;border-bottom:2px solid #333;padding-bottom:10px;margin-bottom:16px}
.header h1{margin:0;font-size:18px}.header p{margin:2px 0;font-size:11px;color:#666}
.title{font-weight:700;font-size:14px;text-transform:uppercase;letter-spacing:1px;margin-top:8px}
table{width:100%;border-collapse:collapse;margin-top:10px}
th,td{padding:7px 10px;text-align:left;border-bottom:1px solid #eee;font-size:12px}
th{background:#f5f5f5;font-weight:600;font-size:11px;text-transform:uppercase;color:#555}
.rank{color:#aaa;font-size:11px}.code{font-family:monospace;color:#0369a1;font-size:11px}
.total{font-weight:700;background:#f0f9ff}
.footer{text-align:center;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:8px;margin-top:24px}
@media print{body{padding:0}}
</style></head><body>
<div class="header">
<h1>${hospital.name}</h1>
<p>${hospital.address} | Tel: ${hospital.phone}</p>
<div class="title">Morbidity Report</div>
<p>${startDate} to ${endDate} | Total cases: ${total}</p>
</div>
<table>
<thead><tr><th>#</th><th>Disease / Condition</th><th>ICD-11</th><th>Cases</th><th>% of Total</th></tr></thead>
<tbody>
${morbidity.map((e, i) => `<tr>
<td class="rank">${i + 1}</td>
<td>${e.diagnosis}</td>
<td class="code">${e.diagnosisCode || '—'}</td>
<td><strong>${e.count}</strong></td>
<td>${total > 0 ? ((e.count / total) * 100).toFixed(1) : 0}%</td>
</tr>`).join('')}
<tr class="total">
<td colspan="3"><strong>TOTAL</strong></td>
<td><strong>${total}</strong></td>
<td>100%</td>
</tr>
</tbody></table>
<div class="footer">
<p>Generated on ${new Date().toLocaleString()} | ${hospital.name}</p>
<p style="font-size:9px;color:#ccc">Developed by Helvino Technologies Limited</p>
</div>
</body></html>`);
    win.document.close(); win.focus(); win.print();
  };

  const tabBtn = (id: Tab, label: string) => (
    <button onClick={() => { setTab(id); setReport(null); setMorbidity(null); setMohReport(null); setRevenueReport(null); }}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-end mb-6">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg flex-wrap">
            {tabBtn('moh', 'MOH Report')}
            {tabBtn('financial', 'Financial')}
            {tabBtn('revenue', 'Revenue')}
            {tabBtn('patients', 'Patients')}
            {tabBtn('morbidity', 'Morbidity')}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <button onClick={loadReport} disabled={loading}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
            {loading ? 'Loading...' : 'Generate'}
          </button>
          {tab === 'moh' && mohReport && (
            <button onClick={printMoh}
              className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
              <Printer className="w-4 h-4" /> Print MOH Report
            </button>
          )}
          {tab === 'morbidity' && morbidity && (
            <button onClick={printMorbidity}
              className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
              <Printer className="w-4 h-4" /> Print
            </button>
          )}
        </div>

        {/* ── MOH REPORT ── */}
        {tab === 'moh' && mohReport && (
          <div className="space-y-6">
            {/* Header banner */}
            <div className="bg-blue-900 text-white rounded-xl p-4 text-center">
              <p className="text-xs font-semibold tracking-widest opacity-70 uppercase">Kenya Ministry of Health — HMIS</p>
              <h2 className="text-lg font-bold mt-1">Monthly Health Facility Report</h2>
              <p className="text-sm opacity-80 mt-1">{hospital.name} &nbsp;|&nbsp; {mohReport.startDate} to {mohReport.endDate}</p>
            </div>

            {/* Section A: Outpatient */}
            <section>
              <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide border-b-2 border-blue-900 pb-1 mb-3">
                A. Outpatient Attendance
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Total OPD Visits', value: mohReport.outpatient.total, color: 'text-blue-700' },
                  { label: 'New Attendances', value: mohReport.outpatient.newAttendances, color: 'text-green-700' },
                  { label: 'Re-Attendances', value: mohReport.outpatient.reAttendances, color: 'text-amber-700' },
                  { label: 'Diagnosed Cases', value: mohReport.totalDiagnosedCases, color: 'text-purple-700' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Gender */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">By Gender</p>
                  <table className="w-full text-sm border border-gray-100 rounded-lg overflow-hidden">
                    <thead><tr className="bg-blue-50"><th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Gender</th><th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Count</th></tr></thead>
                    <tbody>
                      {Object.entries(mohReport.outpatient.byGender).map(([g, c]) => (
                        <tr key={g} className="border-t border-gray-50">
                          <td className="px-3 py-2">{g.charAt(0) + g.slice(1).toLowerCase()}</td>
                          <td className="px-3 py-2 text-right font-semibold">{c}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Visit Type */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">By Visit Type</p>
                  <table className="w-full text-sm border border-gray-100 rounded-lg overflow-hidden">
                    <thead><tr className="bg-blue-50"><th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Type</th><th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Count</th></tr></thead>
                    <tbody>
                      {Object.entries(mohReport.outpatient.byVisitType).map(([t, c]) => (
                        <tr key={t} className="border-t border-gray-50">
                          <td className="px-3 py-2">{t.replace(/_/g, ' ')}</td>
                          <td className="px-3 py-2 text-right font-semibold">{c}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Age Groups */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">By Age Group</p>
                  <table className="w-full text-sm border border-gray-100 rounded-lg overflow-hidden">
                    <thead><tr className="bg-blue-50"><th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Age Group</th><th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Count</th></tr></thead>
                    <tbody>
                      {Object.entries(mohReport.outpatient.byAgeGroup).map(([g, c]) => (
                        <tr key={g} className="border-t border-gray-50">
                          <td className="px-3 py-2">{g}</td>
                          <td className="px-3 py-2 text-right font-semibold">{c}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Section B: Inpatient */}
            <section>
              <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide border-b-2 border-blue-900 pb-1 mb-3">
                B. Inpatient / Ward Statistics
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Admissions', value: mohReport.inpatient.admissions, color: 'text-blue-700' },
                  { label: 'Discharges', value: mohReport.inpatient.discharges, color: 'text-green-700' },
                  { label: 'Current Inpatients', value: mohReport.inpatient.currentInpatients, color: 'text-orange-700' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Section C: Morbidity Top 10 */}
            <section>
              <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide border-b-2 border-blue-900 pb-1 mb-3">
                C. Top 10 Diseases — MOH 705 Morbidity
              </h3>
              {mohReport.morbidity.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No diagnosed cases in this period.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-blue-50">
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 w-8">#</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Disease / Condition</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 font-mono">ICD-10</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Cases</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 w-36">Proportion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mohReport.morbidity.map((e) => (
                        <tr key={e.rank} className="border-t border-gray-50 hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-400 text-xs">{e.rank}</td>
                          <td className="px-3 py-2 font-medium text-gray-900">{e.diagnosis}</td>
                          <td className="px-3 py-2 font-mono text-xs text-blue-600">{e.diagnosisCode || '—'}</td>
                          <td className="px-3 py-2 text-right font-bold">{e.count}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${e.percent}%` }} />
                              </div>
                              <span className="text-xs text-gray-500 w-10 text-right">{e.percent}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-blue-50 font-semibold border-t-2 border-blue-200">
                        <td className="px-3 py-2" colSpan={3}>Total Diagnosed Cases</td>
                        <td className="px-3 py-2 text-right">{mohReport.totalDiagnosedCases}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </section>

            {/* Section D: Laboratory */}
            <section>
              <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide border-b-2 border-blue-900 pb-1 mb-3">
                D. Laboratory Services
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Total Orders', value: mohReport.laboratory.totalOrders, color: 'text-blue-700' },
                  { label: 'Completed', value: mohReport.laboratory.completed, color: 'text-green-700' },
                  { label: 'Abnormal Results', value: mohReport.laboratory.abnormal, color: 'text-red-700' },
                  { label: 'Normal Results', value: mohReport.laboratory.normalResults, color: 'text-gray-700' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
              {Object.keys(mohReport.laboratory.byCategory).length > 0 && (
                <table className="w-full text-sm border border-gray-100 rounded-lg overflow-hidden">
                  <thead><tr className="bg-blue-50">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Test Category</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Count</th>
                  </tr></thead>
                  <tbody>
                    {Object.entries(mohReport.laboratory.byCategory).map(([cat, cnt]) => (
                      <tr key={cat} className="border-t border-gray-50">
                        <td className="px-3 py-2">{cat}</td>
                        <td className="px-3 py-2 text-right font-semibold">{cnt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* Section E: Imaging */}
            <section>
              <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide border-b-2 border-blue-900 pb-1 mb-3">
                E. Imaging / Radiology Services
              </h3>
              <div className="flex items-center gap-6 mb-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100 min-w-[120px]">
                  <p className="text-xs text-gray-500">Total Requests</p>
                  <p className="text-2xl font-bold text-blue-700">{mohReport.imaging.total}</p>
                </div>
              </div>
              {Object.keys(mohReport.imaging.byType).length > 0 && (
                <table className="w-full text-sm border border-gray-100 rounded-lg overflow-hidden max-w-sm">
                  <thead><tr className="bg-blue-50">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Imaging Type</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">Count</th>
                  </tr></thead>
                  <tbody>
                    {Object.entries(mohReport.imaging.byType).map(([t, c]) => (
                      <tr key={t} className="border-t border-gray-50">
                        <td className="px-3 py-2">{t.replace(/_/g, ' ')}</td>
                        <td className="px-3 py-2 text-right font-semibold">{c}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* Section F: Pharmacy */}
            <section>
              <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide border-b-2 border-blue-900 pb-1 mb-3">
                F. Pharmacy Services
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Prescriptions', value: mohReport.pharmacy.totalPrescriptions, color: 'text-blue-700' },
                  { label: 'Dispensed', value: mohReport.pharmacy.dispensed, color: 'text-green-700' },
                  { label: 'Pending', value: mohReport.pharmacy.pending, color: 'text-amber-700' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Section G: Financial */}
            <section>
              <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide border-b-2 border-blue-900 pb-1 mb-3">
                G. Revenue & Financial Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Total Billed', value: mohReport.financial.totalBilled, color: 'text-blue-700' },
                  { label: 'Total Collected', value: mohReport.financial.totalCollected, color: 'text-green-700' },
                  { label: 'Total Expenses', value: mohReport.financial.totalExpenses, color: 'text-red-700' },
                  { label: 'Net Income', value: mohReport.financial.netIncome, color: Number(mohReport.financial.netIncome) >= 0 ? 'text-green-700' : 'text-red-700' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className={`text-base font-bold ${color}`}>{fmt(Number(value))}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ── FINANCIAL ── */}
        {report && tab === 'financial' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Revenue', value: report.totalRevenue, color: 'text-blue-600' },
                { label: 'Total Payments', value: report.totalPayments, color: 'text-green-600' },
                { label: 'Total Expenses', value: report.totalExpenses, color: 'text-red-600' },
                { label: 'Net Income', value: report.netIncome, color: 'text-purple-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-1">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>KES {num(value).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v: number | undefined) => [`KES ${(v ?? 0).toLocaleString()}`, '']} />
                <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── PATIENTS ── */}
        {report && tab === 'patients' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-500 mb-2">New Patients</p>
              <p className="text-3xl font-bold text-primary-600">{String(report.newPatients || 0)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-500 mb-2">Total Visits</p>
              <p className="text-3xl font-bold text-teal-600">{String(report.totalVisits || 0)}</p>
            </div>
          </div>
        )}

        {/* ── MORBIDITY ── */}
        {morbidity && tab === 'morbidity' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {morbidity.length} disease{morbidity.length !== 1 ? 's' : ''} recorded &mdash; {morbTotal} total cases
              </p>
            </div>
            {morbidity.length === 0 ? (
              <p className="text-center py-10 text-gray-400">No diagnosed cases in this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Disease / Condition</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">ICD-11</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Cases</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase w-40">Proportion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {morbidity.map((entry, i) => {
                      const pct = morbTotal > 0 ? (entry.count / morbTotal) * 100 : 0;
                      return (
                        <tr key={`${entry.diagnosis}-${i}`} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2.5 px-3 text-gray-400 text-xs">{i + 1}</td>
                          <td className="py-2.5 px-3 font-medium text-gray-900">{entry.diagnosis}</td>
                          <td className="py-2.5 px-3 font-mono text-xs text-primary-600">{entry.diagnosisCode || <span className="text-gray-300">—</span>}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-gray-900">{entry.count}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-2">
                                <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-gray-500 w-10 text-right">{pct.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold border-t border-gray-200">
                      <td className="py-2.5 px-3" colSpan={3}>Total</td>
                      <td className="py-2.5 px-3 text-right">{morbTotal}</td>
                      <td className="py-2.5 px-3 text-xs text-gray-500">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── REVENUE BREAKDOWN ── */}
        {revenueReport && tab === 'revenue' && (() => {
          const byMethod = revenueReport.byMethod as Record<string, number> | undefined;
          const total = num(revenueReport.total);
          const methodColors: Record<string, string> = {
            CASH: 'bg-green-500',
            MPESA: 'bg-emerald-500',
            CARD: 'bg-blue-500',
            BANK_TRANSFER: 'bg-indigo-500',
            INSURANCE: 'bg-purple-500',
            DONATION: 'bg-pink-500',
          };
          const methodLabels: Record<string, string> = {
            CASH: 'Cash',
            MPESA: 'M-Pesa',
            CARD: 'Card',
            BANK_TRANSFER: 'Bank Transfer',
            INSURANCE: 'Insurance',
            DONATION: 'Donation',
          };
          const entries = byMethod ? Object.entries(byMethod) : [];
          const barData = entries.map(([m, v]) => ({ name: methodLabels[m] || m, value: num(v) }));
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {entries.map(([method, value]) => {
                  const pct = total > 0 ? ((num(value) / total) * 100).toFixed(1) : '0.0';
                  return (
                    <div key={method} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-3 h-3 rounded-full ${methodColors[method] || 'bg-gray-400'}`} />
                        <p className="text-sm font-medium text-gray-700">{methodLabels[method] || method}</p>
                      </div>
                      <p className="text-xl font-bold text-gray-900">{fmt(num(value))}</p>
                      <p className="text-xs text-gray-500 mt-1">{pct}% of total</p>
                      <div className="mt-2 bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${methodColors[method] || 'bg-gray-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between border border-blue-100">
                <span className="text-sm font-semibold text-blue-800">Total Collections</span>
                <span className="text-xl font-bold text-blue-900">{fmt(total)}</span>
              </div>
              {barData.some(d => d.value > 0) && (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip formatter={(v: number | undefined) => [`KES ${(v ?? 0).toLocaleString()}`, '']} />
                    <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          );
        })()}

        {/* Empty state */}
        {!report && !morbidity && !mohReport && !revenueReport && !loading && (
          <div className="text-center py-12 text-gray-400">
            <Download className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Select date range and click <strong>Generate</strong></p>
            {tab === 'moh' && <p className="text-xs mt-1 text-gray-400">The MOH report covers: OPD attendance, inpatient stats, top 10 diseases, lab, imaging, pharmacy &amp; financials</p>}
            {tab === 'revenue' && <p className="text-xs mt-1 text-gray-400">Shows collections broken down by Cash, M-Pesa, Card, Insurance and Donation</p>}
          </div>
        )}
      </div>
    </div>
  );
}
