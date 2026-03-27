import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Stethoscope, Search, X } from 'lucide-react';
import { visitApi, patientApi, userApi } from '../../api/services';
import type { Visit, Patient, User } from '../../types';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';

export default function VisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [doctors, setDoctors] = useState<User[]>([]);
  const [form, setForm] = useState({ patientId: '', doctorId: '', visitType: 'OPD', chiefComplaint: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const loadVisits = useCallback((p = 0, q = searchQuery) => {
    setLoading(true);
    const req = q.trim().length >= 2
      ? visitApi.search(q.trim(), p)
      : visitApi.getAll(p);
    req.then((r) => {
      setVisits(r.data.data.content);
      setTotalPages(r.data.data.totalPages);
      setPage(p);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [searchQuery]);

  useEffect(() => { loadVisits(0, ''); }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => loadVisits(0, searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const searchPatients = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setPatients([]);
      return;
    }
    try {
      const res = await patientApi.search(q.trim());
      setPatients(res.data.data.content);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchPatients(patientSearch), 300);
    return () => clearTimeout(timer);
  }, [patientSearch, searchPatients]);

  const openModal = () => {
    userApi.getByRole('DOCTOR').then((r) => setDoctors(r.data.data)).catch(() => {});
    setPatientSearch('');
    setPatients([]);
    setForm({ patientId: '', doctorId: '', visitType: 'OPD', chiefComplaint: '' });
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await visitApi.create({
      patientId: Number(form.patientId), doctorId: form.doctorId ? Number(form.doctorId) : undefined,
      visitType: form.visitType as Visit['visitType'], chiefComplaint: form.chiefComplaint,
    });
    setShowModal(false);
    setForm({ patientId: '', doctorId: '', visitType: 'OPD', chiefComplaint: '' });
    loadVisits();
  };

  const selectedDoctor = doctors.find((d) => String(d.id) === form.doctorId);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'patientName', label: 'Patient', render: (v: Visit) => (
      <div><div className="font-medium text-gray-900">{v.patientName}</div><div className="text-xs text-gray-500">{v.patientNo}</div></div>
    )},
    { key: 'doctorName', label: 'Doctor', render: (v: Visit) => v.doctorName || '-' },
    { key: 'visitType', label: 'Type', render: (v: Visit) => <StatusBadge status={v.visitType} /> },
    { key: 'chiefComplaint', label: 'Complaint', render: (v: Visit) => <span className="truncate max-w-[200px] block">{v.chiefComplaint || '-'}</span> },
    { key: 'completed', label: 'Status', render: (v: Visit) => <StatusBadge status={v.completed ? 'COMPLETED' : 'IN_PROGRESS'} /> },
    { key: 'createdAt', label: 'Date', render: (v: Visit) => v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Stethoscope className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Consultations</h1>
        </div>
        <button onClick={openModal} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
          <Plus className="w-4 h-4" /> New Visit
        </button>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by patient name or number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <DataTable columns={columns} data={visits} page={page} totalPages={totalPages} onPageChange={(p) => loadVisits(p, searchQuery)}
        onRowClick={(v) => navigate(`/visits/${v.id}`)} loading={loading} />

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Visit">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
            <input
              type="text"
              placeholder="Search patient by name or number..."
              value={patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value);
                setForm({ ...form, patientId: '' });
              }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {patients.length > 0 && !form.patientId && (
              <div className="mt-1 border border-gray-200 rounded-lg max-h-40 overflow-y-auto bg-white shadow-sm">
                {patients.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, patientId: String(p.id) });
                      setPatientSearch(`${p.fullName} (${p.patientNo})`);
                      setPatients([]);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
                  >
                    <span className="font-medium">{p.fullName}</span>{' '}
                    <span className="text-gray-500">{p.patientNo}</span>
                  </button>
                ))}
              </div>
            )}
            {form.patientId && (
              <p className="text-xs text-green-600 mt-1">Patient selected</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
            <select value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.fullName} — {d.department || 'N/A'} ({d.specialization || 'N/A'})
                </option>
              ))}
            </select>
            {selectedDoctor && (
              <p className="text-xs text-gray-500 mt-1">
                {selectedDoctor.department}{selectedDoctor.specialization ? ` - ${selectedDoctor.specialization}` : ''}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visit Type</label>
            <select value={form.visitType} onChange={(e) => setForm({ ...form, visitType: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="OPD">OPD</option><option value="IPD">IPD</option><option value="EMERGENCY">Emergency</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
            <textarea value={form.chiefComplaint} onChange={(e) => setForm({ ...form, chiefComplaint: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" rows={3} />
          </div>
          <button type="submit" disabled={!form.patientId} className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed">
            Create Visit
          </button>
        </form>
      </Modal>
    </div>
  );
}
