import { useState, useEffect, useCallback } from 'react';
import { CalendarPlus, CalendarDays, CheckCircle, XCircle, LogIn } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { appointmentApi, patientApi, userApi } from '../../api/services';
import type { Appointment, Patient, User, AppointmentType } from '../../types';

const appointmentTypes: AppointmentType[] = ['NEW', 'REVIEW', 'FOLLOW_UP', 'EMERGENCY'];

const emptyForm = {
  patientId: '' as string | number,
  doctorId: '' as string | number,
  appointmentDate: '',
  appointmentTime: '',
  appointmentType: 'NEW' as AppointmentType,
  notes: '',
  walkIn: false,
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [patientSearch, setPatientSearch] = useState('');

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = dateFilter
        ? await appointmentApi.getByDate(dateFilter, page)
        : await appointmentApi.getAll(page);
      const data = res.data.data;
      setAppointments(data.content);
      setTotalPages(data.totalPages);
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  }, [dateFilter, page]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    setPage(0);
  }, [dateFilter]);

  const openModal = async () => {
    setForm(emptyForm);
    setPatientSearch('');
    setModalOpen(true);
    try {
      const res = await userApi.getByRole('DOCTOR');
      setDoctors(res.data.data);
    } catch {
      // Ignore
    }
  };

  const searchPatients = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setPatients([]);
      return;
    }
    try {
      const res = await patientApi.search(q.trim());
      setPatients(res.data.data.content);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchPatients(patientSearch), 300);
    return () => clearTimeout(timer);
  }, [patientSearch, searchPatients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.doctorId) return;
    setSubmitting(true);
    try {
      await appointmentApi.create({
        patientId: Number(form.patientId),
        doctorId: Number(form.doctorId),
        appointmentDate: form.appointmentDate,
        appointmentTime: form.appointmentTime,
        appointmentType: form.appointmentType,
        notes: form.notes,
        walkIn: form.walkIn,
      });
      setModalOpen(false);
      setDateFilter(form.appointmentDate);
      fetchAppointments();
    } catch {
      // Error
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await appointmentApi.updateStatus(id, status);
      fetchAppointments();
    } catch {
      // Error
    }
  };

  const updateField = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const columns = [
    {
      key: 'appointmentTime',
      label: 'Time',
      render: (a: Appointment) => (
        <span className="font-medium text-gray-900">{a.appointmentTime?.slice(0, 5)}</span>
      ),
    },
    { key: 'patientName', label: 'Patient' },
    { key: 'doctorName', label: 'Doctor' },
    { key: 'department', label: 'Department' },
    {
      key: 'appointmentType',
      label: 'Type',
      render: (a: Appointment) => (
        <span className="text-xs font-medium text-gray-600">
          {a.appointmentType.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (a: Appointment) => <StatusBadge status={a.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (a: Appointment) => (
        <div className="flex items-center gap-1">
          {a.status === 'SCHEDULED' && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); updateStatus(a.id, 'CHECKED_IN'); }}
                title="Check In"
                className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
              >
                <LogIn className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); updateStatus(a.id, 'CANCELLED'); }}
                title="Cancel"
                className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}
          {(a.status === 'CHECKED_IN' || a.status === 'IN_PROGRESS') && (
            <button
              onClick={(e) => { e.stopPropagation(); updateStatus(a.id, 'COMPLETED'); }}
              title="Complete"
              className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <CalendarPlus className="w-4 h-4" />
          Book Appointment
        </button>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-3">
        <CalendarDays className="w-5 h-5 text-gray-400" />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {dateFilter && (
          <button
            onClick={() => setDateFilter('')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear filter
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={appointments}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        loading={loading}
      />

      {/* Book Appointment Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Book Appointment" size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Patient Search */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Patient *</label>
            <input
              type="text"
              placeholder="Search patient by name or number..."
              value={patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value);
                updateField('patientId', '');
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {patients.length > 0 && !form.patientId && (
              <div className="mt-1 border border-gray-200 rounded-lg max-h-40 overflow-y-auto bg-white shadow-sm">
                {patients.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      updateField('patientId', p.id);
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

          {/* Doctor */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Doctor *</label>
            <select
              required
              value={form.doctorId}
              onChange={(e) => updateField('doctorId', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName}{d.specialization ? ` - ${d.specialization}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Date *</label>
              <input
                required
                type="date"
                value={form.appointmentDate}
                onChange={(e) => updateField('appointmentDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Time *</label>
              <input
                required
                type="time"
                value={form.appointmentTime}
                onChange={(e) => updateField('appointmentTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Type *</label>
              <select
                required
                value={form.appointmentType}
                onChange={(e) => updateField('appointmentType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {appointmentTypes.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.walkIn}
                  onChange={(e) => updateField('walkIn', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Walk-in</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !form.patientId}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
