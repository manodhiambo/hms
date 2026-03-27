import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, CheckCircle, Clock, FlaskConical, Stethoscope, UserPlus } from 'lucide-react';
import { visitApi, patientApi, userApi } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import type { Visit, TriagePriority, VisitType, User, Patient } from '../../types';

const PRIORITY_CONFIG: Record<TriagePriority, { label: string; color: string; bg: string; border: string }> = {
  IMMEDIATE:   { label: 'Immediate',   color: 'text-red-700',    bg: 'bg-red-100',    border: 'border-red-400' },
  URGENT:      { label: 'Urgent',      color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-400' },
  LESS_URGENT: { label: 'Less Urgent', color: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-400' },
  NON_URGENT:  { label: 'Non-Urgent',  color: 'text-green-700',  bg: 'bg-green-100',  border: 'border-green-400' },
};

const VISIT_TYPES: VisitType[] = ['OPD', 'IPD', 'EMERGENCY'];

export default function TriagePage() {
  const navigate = useNavigate();
  const { userId } = useAuthStore();
  const [queue, setQueue] = useState<Visit[]>([]);
  const [labReview, setLabReview] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'awaiting' | 'triaged' | 'lab-review'>('awaiting');

  // New Visit modal
  const [newVisitOpen, setNewVisitOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [newVisitForm, setNewVisitForm] = useState({ visitType: 'OPD' as VisitType, chiefComplaint: '', doctorId: '' });
  const [submitting, setSubmitting] = useState(false);

  // Triage modal
  const [triageOpen, setTriageOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [triageForm, setTriageForm] = useState({
    triagePriority: 'LESS_URGENT' as TriagePriority,
    triageNotes: '',
    bloodPressure: '',
    temperature: '',
    pulseRate: '',
    respiratoryRate: '',
    weight: '',
    height: '',
    oxygenSaturation: '',
  });

  const fetchQueues = useCallback(async () => {
    setLoading(true);
    try {
      const [queueRes, labRes] = await Promise.all([
        visitApi.getTriageQueue(),
        visitApi.getLabReviewQueue(),
      ]);
      setQueue(queueRes.data.data);
      setLabReview(labRes.data.data);
    } catch { /* handled */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchQueues(); }, [fetchQueues]);

  // Patient search
  useEffect(() => {
    if (patientSearch.trim().length < 2) { setPatientResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await patientApi.search(patientSearch.trim(), 0);
        setPatientResults(res.data.data.content);
      } catch { /* */ }
    }, 300);
    return () => clearTimeout(t);
  }, [patientSearch]);

  const openNewVisit = async () => {
    setSelectedPatient(null);
    setPatientSearch('');
    setPatientResults([]);
    setNewVisitForm({ visitType: 'OPD', chiefComplaint: '', doctorId: '' });
    try {
      const res = await userApi.getByRole('DOCTOR');
      setDoctors(res.data.data);
    } catch { /* */ }
    setNewVisitOpen(true);
  };

  const handleCreateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setSubmitting(true);
    try {
      await visitApi.create({
        patientId: selectedPatient.id,
        visitType: newVisitForm.visitType,
        chiefComplaint: newVisitForm.chiefComplaint,
        doctorId: newVisitForm.doctorId ? Number(newVisitForm.doctorId) : undefined,
      });
      setNewVisitOpen(false);
      fetchQueues();
    } catch { /* */ } finally { setSubmitting(false); }
  };

  const openTriage = (visit: Visit) => {
    setSelectedVisit(visit);
    setTriageForm({
      triagePriority: visit.triagePriority || 'LESS_URGENT',
      triageNotes: visit.triageNotes || '',
      bloodPressure: visit.bloodPressure || '',
      temperature: visit.temperature?.toString() || '',
      pulseRate: visit.pulseRate?.toString() || '',
      respiratoryRate: visit.respiratoryRate?.toString() || '',
      weight: visit.weight?.toString() || '',
      height: visit.height?.toString() || '',
      oxygenSaturation: visit.oxygenSaturation?.toString() || '',
    });
    setTriageOpen(true);
  };

  const handleSaveTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit) return;
    setSubmitting(true);
    try {
      await visitApi.updateTriage(selectedVisit.id, {
        triagePriority: triageForm.triagePriority,
        triageStatus: 'TRIAGED',
        triageNotes: triageForm.triageNotes,
        triagedById: userId || undefined,
        bloodPressure: triageForm.bloodPressure || undefined,
        temperature: triageForm.temperature ? Number(triageForm.temperature) : undefined,
        pulseRate: triageForm.pulseRate ? Number(triageForm.pulseRate) : undefined,
        respiratoryRate: triageForm.respiratoryRate ? Number(triageForm.respiratoryRate) : undefined,
        weight: triageForm.weight ? Number(triageForm.weight) : undefined,
        height: triageForm.height ? Number(triageForm.height) : undefined,
        oxygenSaturation: triageForm.oxygenSaturation ? Number(triageForm.oxygenSaturation) : undefined,
      });
      setTriageOpen(false);
      fetchQueues();
    } catch { /* */ } finally { setSubmitting(false); }
  };

  const waitingQueue = queue.filter(v => v.triageStatus === 'WAITING');
  const triagedQueue = queue.filter(v => v.triageStatus === 'TRIAGED' || v.triageStatus === 'IN_CONSULTATION');

  const triageStats = {
    waiting: waitingQueue.length,
    triaged: triagedQueue.length,
    inConsult: queue.filter(v => v.triageStatus === 'IN_CONSULTATION').length,
    labReview: labReview.length,
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

  const VisitCard = ({ visit }: { visit: Visit }) => {
    const prio = visit.triagePriority ? PRIORITY_CONFIG[visit.triagePriority] : null;
    const waitMinutes = Math.floor((Date.now() - new Date(visit.createdAt).getTime()) / 60000);
    return (
      <div className={`bg-white rounded-xl border-l-4 ${prio ? prio.border : 'border-gray-300'} border border-gray-200 p-4 hover:shadow-sm transition-shadow`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-900 truncate">{visit.patientName}</span>
              <span className="text-xs text-gray-500 shrink-0">{visit.patientNo}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <StatusBadge status={visit.visitType} />
              <StatusBadge status={visit.triageStatus} />
              {prio && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${prio.bg} ${prio.color}`}>
                  {prio.label}
                </span>
              )}
            </div>
            {visit.chiefComplaint && (
              <p className="text-xs text-gray-600 truncate mb-1">
                <span className="font-medium">Complaint:</span> {visit.chiefComplaint}
              </p>
            )}
            {visit.triageNotes && (
              <p className="text-xs text-gray-500 truncate">
                <span className="font-medium">Triage Notes:</span> {visit.triageNotes}
              </p>
            )}
            {visit.doctorName && (
              <p className="text-xs text-gray-500 mt-1">Dr. {visit.doctorName}</p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
              <Clock className="w-3 h-3" />
              <span>{waitMinutes < 60 ? `${waitMinutes}m` : `${Math.floor(waitMinutes/60)}h ${waitMinutes%60}m`}</span>
            </div>
            <div className="flex flex-col gap-1">
              {visit.triageStatus === 'WAITING' && (
                <button onClick={() => openTriage(visit)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  Triage
                </button>
              )}
              {visit.triageStatus === 'TRIAGED' && (
                <button onClick={() => openTriage(visit)}
                  className="px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors">
                  Re-Triage
                </button>
              )}
              <button onClick={() => navigate(`/visits/${visit.id}`)}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1">
                <Stethoscope className="w-3 h-3" /> Consult
              </button>
            </div>
          </div>
        </div>
        {/* Vitals if available */}
        {(visit.bloodPressure || visit.temperature || visit.pulseRate) && (
          <div className="mt-2 pt-2 border-t border-gray-50 flex gap-3 flex-wrap">
            {visit.bloodPressure && <span className="text-xs text-gray-500">BP: <strong>{visit.bloodPressure}</strong></span>}
            {visit.temperature && <span className="text-xs text-gray-500">Temp: <strong>{visit.temperature}°C</strong></span>}
            {visit.pulseRate && <span className="text-xs text-gray-500">Pulse: <strong>{visit.pulseRate} bpm</strong></span>}
            {visit.oxygenSaturation && <span className="text-xs text-gray-500">SpO₂: <strong>{visit.oxygenSaturation}%</strong></span>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Triage</h1>
          <p className="text-sm text-gray-500 mt-0.5">Patient queue and priority management</p>
        </div>
        <button onClick={openNewVisit}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
          <UserPlus className="w-4 h-4" /> New Visit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Awaiting Triage', value: triageStats.waiting, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Triaged / In Queue', value: triageStats.triaged, icon: CheckCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'In Consultation', value: triageStats.inConsult, icon: Stethoscope, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Awaiting Lab Review', value: triageStats.labReview, icon: FlaskConical, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Priority Legend */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Triage Priority Levels</p>
        <div className="flex gap-4 flex-wrap">
          {(Object.entries(PRIORITY_CONFIG) as [TriagePriority, typeof PRIORITY_CONFIG[TriagePriority]][]).map(([key, cfg]) => (
            <div key={key} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${cfg.bg}`}>
              <span className={`w-2 h-2 rounded-full ${cfg.bg} border-2 ${cfg.border}`} />
              <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('awaiting')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'awaiting' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Awaiting Triage
            {triageStats.waiting > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs font-bold rounded-full px-2 py-0.5">
                {triageStats.waiting}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('triaged')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'triaged' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Triaged / In Queue
            {triageStats.triaged > 0 && (
              <span className="bg-orange-100 text-orange-700 text-xs font-bold rounded-full px-2 py-0.5">
                {triageStats.triaged}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('lab-review')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'lab-review' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4" />
            Review Lab Results
            {triageStats.labReview > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-bold rounded-full px-2 py-0.5">
                {triageStats.labReview}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : activeTab === 'awaiting' ? (
        waitingQueue.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No patients awaiting triage</p>
            <p className="text-gray-400 text-sm mt-1">All new arrivals have been triaged</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...waitingQueue].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
              .map(v => <VisitCard key={v.id} visit={v} />)}
          </div>
        )
      ) : activeTab === 'triaged' ? (
        triagedQueue.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <CheckCircle className="w-12 h-12 text-orange-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No triaged patients in queue</p>
            <p className="text-gray-400 text-sm mt-1">Triaged patients awaiting consultation will appear here</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Sort by priority: IMMEDIATE first */}
            {[...triagedQueue].sort((a, b) => {
              const order: Record<string, number> = { IMMEDIATE: 0, URGENT: 1, LESS_URGENT: 2, NON_URGENT: 3 };
              const pa = a.triagePriority ? (order[a.triagePriority] ?? 4) : 5;
              const pb = b.triagePriority ? (order[b.triagePriority] ?? 4) : 5;
              return pa - pb;
            }).map(v => <VisitCard key={v.id} visit={v} />)}
          </div>
        )
      ) : (
        labReview.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FlaskConical className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No pending lab result reviews</p>
            <p className="text-gray-400 text-sm mt-1">Lab results pending doctor review will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">
                <strong>{labReview.length} patient(s)</strong> have lab results ready and require doctor review before their visit can be completed.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {labReview.map(v => (
                <div key={v.id} className="bg-white rounded-xl border-l-4 border-amber-400 border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{v.patientName}</p>
                      <p className="text-xs text-gray-500 mb-2">{v.patientNo}</p>
                      <div className="space-y-1">
                        {v.labOrders?.filter(lo => lo.status === 'RELEASED').map(lo => (
                          <div key={lo.id} className={`text-xs px-2 py-1 rounded ${lo.abnormal ? 'bg-red-50 text-red-700 font-medium' : 'bg-green-50 text-green-700'}`}>
                            {lo.testName}: {lo.result} {lo.abnormal ? '⚠ Abnormal' : '✓ Normal'}
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => navigate(`/visits/${v.id}`)}
                      className="px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition-colors shrink-0">
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* New Visit Modal */}
      <Modal open={newVisitOpen} onClose={() => setNewVisitOpen(false)} title="Register New Visit" size="lg">
        <form onSubmit={handleCreateVisit} className="space-y-4">
          <div>
            <label className={labelClass}>Patient *</label>
            <input type="text" value={patientSearch}
              onChange={(e) => { setPatientSearch(e.target.value); setSelectedPatient(null); }}
              placeholder="Search patient by name, phone, ID..."
              className={inputClass} />
            {patientResults.length > 0 && !selectedPatient && (
              <div className="mt-1 border border-gray-200 rounded-lg max-h-40 overflow-y-auto bg-white shadow-sm">
                {patientResults.map(p => (
                  <button key={p.id} type="button"
                    onClick={() => { setSelectedPatient(p); setPatientSearch(`${p.fullName} (${p.patientNo})`); setPatientResults([]); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0">
                    <span className="font-medium">{p.fullName}</span>
                    <span className="text-gray-400 text-xs ml-2">{p.patientNo} | {p.phone}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedPatient && (
              <div className="mt-2 bg-blue-50 rounded-lg p-2 text-sm">
                <span className="font-medium text-blue-900">{selectedPatient.fullName}</span>
                <span className="text-blue-600 text-xs ml-2">{selectedPatient.patientNo}</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Visit Type *</label>
              <select value={newVisitForm.visitType}
                onChange={(e) => setNewVisitForm(f => ({ ...f, visitType: e.target.value as VisitType }))}
                className={inputClass}>
                {VISIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Assign Doctor</label>
              <select value={newVisitForm.doctorId}
                onChange={(e) => setNewVisitForm(f => ({ ...f, doctorId: e.target.value }))}
                className={inputClass}>
                <option value="">-- Unassigned --</option>
                {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.fullName}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Chief Complaint</label>
            <textarea value={newVisitForm.chiefComplaint}
              onChange={(e) => setNewVisitForm(f => ({ ...f, chiefComplaint: e.target.value }))}
              rows={2} className={inputClass} placeholder="Brief description of patient's complaint" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setNewVisitOpen(false)}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={submitting || !selectedPatient}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create Visit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Triage Modal */}
      <Modal open={triageOpen} onClose={() => setTriageOpen(false)} title={`Triage — ${selectedVisit?.patientName}`} size="lg">
        <form onSubmit={handleSaveTriage} className="space-y-5">
          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Triage Priority *</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(PRIORITY_CONFIG) as [TriagePriority, typeof PRIORITY_CONFIG[TriagePriority]][]).map(([key, cfg]) => (
                <button key={key} type="button"
                  onClick={() => setTriageForm(f => ({ ...f, triagePriority: key }))}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all
                    ${triageForm.triagePriority === key
                      ? `${cfg.bg} ${cfg.border} ${cfg.color}`
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  <span className={`w-3 h-3 rounded-full ${cfg.bg} border-2 ${cfg.border}`} />
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Vitals */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Vital Signs</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Blood Pressure', key: 'bloodPressure', placeholder: 'e.g. 120/80' },
                { label: 'Temperature (°C)', key: 'temperature', placeholder: 'e.g. 36.8' },
                { label: 'Pulse Rate (bpm)', key: 'pulseRate', placeholder: 'e.g. 72' },
                { label: 'Respiratory Rate', key: 'respiratoryRate', placeholder: 'e.g. 16' },
                { label: 'Weight (kg)', key: 'weight', placeholder: 'e.g. 70' },
                { label: 'Height (cm)', key: 'height', placeholder: 'e.g. 170' },
                { label: 'O₂ Saturation (%)', key: 'oxygenSaturation', placeholder: 'e.g. 98' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className={labelClass}>{label}</label>
                  <input
                    type={key === 'bloodPressure' ? 'text' : 'number'}
                    step="0.1"
                    value={(triageForm as Record<string, string>)[key]}
                    onChange={(e) => setTriageForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className={inputClass} />
                </div>
              ))}
            </div>
          </div>

          {/* Triage Notes */}
          <div>
            <label className={labelClass}>Triage Notes</label>
            <textarea value={triageForm.triageNotes}
              onChange={(e) => setTriageForm(f => ({ ...f, triageNotes: e.target.value }))}
              rows={2} className={inputClass}
              placeholder="Additional observations, allergies noted, condition on arrival..." />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setTriageOpen(false)}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={submitting}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {submitting ? 'Saving...' : 'Save & Send to Doctor Queue'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
