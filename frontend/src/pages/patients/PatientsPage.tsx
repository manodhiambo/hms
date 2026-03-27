import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Pencil, AlertTriangle } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { patientApi, insuranceApi } from '../../api/services';
import type { Patient, InsuranceCompany, Gender } from '../../types';

const genderOptions: Gender[] = ['MALE', 'FEMALE', 'OTHER'];

function calcAge(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function isMinor(dob: string): boolean {
  const age = calcAge(dob);
  return age !== null && age < 18;
}

const emptyForm = {
  fullName: '',
  gender: 'MALE' as Gender,
  phone: '',
  dateOfBirth: '',
  email: '',
  idNumber: '',
  address: '',
  nextOfKinName: '',
  nextOfKinPhone: '',
  nextOfKinRelationship: '',
  allergies: '',
  bloodGroup: '',
  insuranceCompanyId: null as number | null,
  insuranceMemberNumber: '',
};

export default function PatientsPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [insuranceCompanies, setInsuranceCompanies] = useState<InsuranceCompany[]>([]);
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [duplicates, setDuplicates] = useState<Patient[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = search.trim()
        ? await patientApi.search(search.trim(), page)
        : await patientApi.getAll(page);
      const data = res.data.data;
      setPatients(data.content);
      setTotalPages(data.totalPages);
    } catch {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const openModal = async () => {
    setForm(emptyForm);
    setDuplicates([]);
    setModalOpen(true);
    try {
      const res = await insuranceApi.getCompanies();
      setInsuranceCompanies(res.data.data);
    } catch {
      // Ignore
    }
  };

  const checkForDuplicates = async (phone: string, idNumber: string) => {
    if (!phone && !idNumber) { setDuplicates([]); return; }
    setCheckingDuplicates(true);
    try {
      const res = await patientApi.checkDuplicates(phone || '', idNumber || '');
      setDuplicates(res.data.data);
    } catch { /* */ } finally { setCheckingDuplicates(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await patientApi.create(form);
      setModalOpen(false);
      fetchPatients();
    } catch {
      // Error handled silently
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = async (patient: Patient) => {
    setEditingPatient(patient);
    setEditForm({
      fullName: patient.fullName, gender: patient.gender, phone: patient.phone || '',
      dateOfBirth: patient.dateOfBirth || '', email: patient.email || '', idNumber: patient.idNumber || '',
      address: patient.address || '', nextOfKinName: patient.nextOfKinName || '', nextOfKinPhone: patient.nextOfKinPhone || '',
      nextOfKinRelationship: patient.nextOfKinRelationship || '', allergies: patient.allergies || '',
      bloodGroup: patient.bloodGroup || '', insuranceCompanyId: patient.insuranceCompanyId || null,
      insuranceMemberNumber: patient.insuranceMemberNumber || '',
    });
    setEditModal(true);
    try {
      const res = await insuranceApi.getCompanies();
      setInsuranceCompanies(res.data.data);
    } catch { /* ignore */ }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    setSubmitting(true);
    try {
      await patientApi.update(editingPatient.id, editForm);
      setEditModal(false);
      fetchPatients();
    } catch { /* handled */ } finally { setSubmitting(false); }
  };

  const updateField = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateEditField = (field: string, value: unknown) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const columns = [
    { key: 'patientNo', label: 'Patient No' },
    { key: 'fullName', label: 'Full Name' },
    {
      key: 'gender',
      label: 'Gender',
      render: (p: Patient) => p.gender.charAt(0) + p.gender.slice(1).toLowerCase(),
    },
    { key: 'phone', label: 'Phone' },
    { key: 'idNumber', label: 'ID Number' },
    {
      key: 'insuranceCompanyName',
      label: 'Insurance',
      render: (p: Patient) => p.insuranceCompanyName || <span className="text-gray-400">None</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (p: Patient) => (
        <button onClick={(e) => { e.stopPropagation(); openEditModal(p); }}
          className="text-gray-400 hover:text-blue-600 p-1" title="Edit Patient">
          <Pencil className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Register Patient
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, patient number, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <DataTable
        columns={columns}
        data={patients}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onRowClick={(p) => navigate(`/patients/${p.id}`)}
        loading={loading}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Register Patient" size="xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Full Name *</label>
                <input
                  required
                  type="text"
                  value={form.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Gender *</label>
                <select
                  required
                  value={form.gender}
                  onChange={(e) => updateField('gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {genderOptions.map((g) => (
                    <option key={g} value={g}>{g.charAt(0) + g.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Date of Birth *</label>
                <input
                  required
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => updateField('dateOfBirth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {form.dateOfBirth && (
                  <p className="text-xs text-gray-500 mt-1">
                    Age: <span className="font-semibold text-gray-700">{calcAge(form.dateOfBirth)} yrs</span>
                    {isMinor(form.dateOfBirth) && <span className="ml-2 text-amber-600 font-medium">(Minor — phone optional)</span>}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">ID Number</label>
                <input
                  type="text"
                  value={form.idNumber}
                  onChange={(e) => updateField('idNumber', e.target.value)}
                  onBlur={() => checkForDuplicates(form.phone, form.idNumber)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Phone {isMinor(form.dateOfBirth) ? <span className="text-gray-400 font-normal">(optional — minor)</span> : '*'}
                </label>
                <input
                  required={!isMinor(form.dateOfBirth)}
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  onBlur={() => checkForDuplicates(form.phone, form.idNumber)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Duplicate Warning */}
              {checkingDuplicates && (
                <div className="md:col-span-2 text-xs text-gray-400">Checking for existing patients...</div>
              )}
              {duplicates.length > 0 && (
                <div className="md:col-span-2 bg-orange-50 border border-orange-300 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
                    <p className="text-sm font-semibold text-orange-800">Possible Duplicate Patient(s) Found</p>
                  </div>
                  {duplicates.map(d => (
                    <div key={d.id} className="flex items-center justify-between bg-white rounded-lg p-2 mb-1 text-sm border border-orange-200">
                      <div>
                        <span className="font-medium text-gray-900">{d.fullName}</span>
                        <span className="text-gray-500 text-xs ml-2">{d.patientNo} | {d.phone} | ID: {d.idNumber || '-'}</span>
                      </div>
                      <button type="button" onClick={() => { setModalOpen(false); navigate(`/patients/${d.id}`); }}
                        className="text-xs text-blue-600 hover:underline font-medium ml-2 shrink-0">
                        View Patient
                      </button>
                    </div>
                  ))}
                  <p className="text-xs text-orange-700 mt-1">Please verify this is not the same patient before registering.</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Blood Group</label>
                <select
                  value={form.bloodGroup}
                  onChange={(e) => updateField('bloodGroup', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Allergies</label>
                <input
                  type="text"
                  value={form.allergies}
                  onChange={(e) => updateField('allergies', e.target.value)}
                  placeholder="Comma separated"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Next of Kin */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Next of Kin</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  value={form.nextOfKinName}
                  onChange={(e) => updateField('nextOfKinName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.nextOfKinPhone}
                  onChange={(e) => updateField('nextOfKinPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Relationship</label>
                <input
                  type="text"
                  value={form.nextOfKinRelationship}
                  onChange={(e) => updateField('nextOfKinRelationship', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Insurance */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Insurance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Insurance Company</label>
                <select
                  value={form.insuranceCompanyId ?? ''}
                  onChange={(e) =>
                    updateField('insuranceCompanyId', e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  {insuranceCompanies.map((ic) => (
                    <option key={ic.id} value={ic.id}>{ic.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Member Number</label>
                <input
                  type="text"
                  value={form.insuranceMemberNumber}
                  onChange={(e) => updateField('insuranceMemberNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
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
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Registering...' : 'Register Patient'}
            </button>
          </div>
        </form>
      </Modal>
      {/* Edit Patient Modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title={`Edit Patient — ${editingPatient?.fullName || ''}`} size="xl">
        <form onSubmit={handleEdit} className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Full Name *</label>
                <input required type="text" value={editForm.fullName} onChange={(e) => updateEditField('fullName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Gender *</label>
                <select required value={editForm.gender} onChange={(e) => updateEditField('gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {genderOptions.map((g) => <option key={g} value={g}>{g.charAt(0) + g.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Date of Birth</label>
                <input type="date" value={editForm.dateOfBirth} onChange={(e) => updateEditField('dateOfBirth', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {editForm.dateOfBirth && (
                  <p className="text-xs text-gray-500 mt-1">
                    Age: <span className="font-semibold text-gray-700">{calcAge(editForm.dateOfBirth)} yrs</span>
                    {isMinor(editForm.dateOfBirth) && <span className="ml-2 text-amber-600 font-medium">(Minor)</span>}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">ID Number</label>
                <input type="text" value={editForm.idNumber} onChange={(e) => updateEditField('idNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Phone {isMinor(editForm.dateOfBirth) ? <span className="text-gray-400 font-normal">(optional — minor)</span> : '*'}
                </label>
                <input required={!isMinor(editForm.dateOfBirth)} type="tel" value={editForm.phone} onChange={(e) => updateEditField('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                <input type="email" value={editForm.email} onChange={(e) => updateEditField('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
                <input type="text" value={editForm.address} onChange={(e) => updateEditField('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Blood Group</label>
                <select value={editForm.bloodGroup} onChange={(e) => updateEditField('bloodGroup', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Allergies</label>
                <input type="text" value={editForm.allergies} onChange={(e) => updateEditField('allergies', e.target.value)}
                  placeholder="Comma separated"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Next of Kin</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                <input type="text" value={editForm.nextOfKinName} onChange={(e) => updateEditField('nextOfKinName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                <input type="tel" value={editForm.nextOfKinPhone} onChange={(e) => updateEditField('nextOfKinPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Relationship</label>
                <input type="text" value={editForm.nextOfKinRelationship} onChange={(e) => updateEditField('nextOfKinRelationship', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Insurance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Insurance Company</label>
                <select value={editForm.insuranceCompanyId ?? ''} onChange={(e) => updateEditField('insuranceCompanyId', e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">None</option>
                  {insuranceCompanies.map((ic) => <option key={ic.id} value={ic.id}>{ic.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Member Number</label>
                <input type="text" value={editForm.insuranceMemberNumber} onChange={(e) => updateEditField('insuranceMemberNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {submitting ? 'Saving...' : 'Update Patient'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
