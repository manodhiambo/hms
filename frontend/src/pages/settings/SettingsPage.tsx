import { useState, useRef } from 'react';
import { Heart, Settings, Lock, Eye, EyeOff, FileText, Printer, Camera, Trash2, Upload, AlertTriangle, UserX, ReceiptText } from 'lucide-react';
import { userApi, dataApi, patientApi, billingApi } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import { useHospitalStore } from '../../store/hospitalStore';
import type { Patient, Billing } from '../../types';

function resizeImage(file: File, maxPx = 300): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const size = Math.min(img.width, img.height, maxPx);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      // Crop to centre square
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

type ClearTarget = { key: string; label: string; description: string; fn: () => Promise<unknown> };

const CLEAR_TARGETS: ClearTarget[] = [
  {
    key: 'patients',
    label: 'All Patients & Clinical Data',
    description: 'Deletes all patients, visits, triage records, consultations, lab orders, prescriptions, imaging orders, admissions, nursing notes, and billing linked to patients.',
    fn: () => dataApi.clearPatients(),
  },
  {
    key: 'wards',
    label: 'Wards, Rooms & Beds',
    description: 'Deletes all wards, rooms, beds, and admissions (including nursing notes). Ward structure must be re-created from scratch.',
    fn: () => dataApi.clearWards(),
  },
  {
    key: 'billing',
    label: 'Billing & Payments',
    description: 'Deletes all invoices, billing line items, payment records, and insurance claims. Patients are kept.',
    fn: () => dataApi.clearBilling(),
  },
  {
    key: 'appointments',
    label: 'Appointments',
    description: 'Deletes all appointment records. Patients and other data are kept.',
    fn: () => dataApi.clearAppointments(),
  },
  {
    key: 'expenses',
    label: 'Expenses',
    description: 'Deletes all expense records.',
    fn: () => dataApi.clearExpenses(),
  },
];

export default function SettingsPage() {
  const { userId, fullName, role, profilePicture, setProfilePicture } = useAuthStore();
  const isAdmin = role === 'SUPER_ADMIN';
  const hospital = useHospitalStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [picPreview, setPicPreview] = useState<string | null>(null);
  const [picLoading, setPicLoading] = useState(false);
  const [picMsg, setPicMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPicMsg({ type: 'error', text: 'Please select an image file.' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPicMsg({ type: 'error', text: 'Image must be smaller than 10 MB.' });
      return;
    }
    setPicLoading(true);
    setPicMsg(null);
    try {
      const resized = await resizeImage(file);
      setPicPreview(resized);
    } catch {
      setPicMsg({ type: 'error', text: 'Failed to process image.' });
    } finally {
      setPicLoading(false);
      e.target.value = '';
    }
  };

  const handleSavePicture = () => {
    if (!picPreview) return;
    setProfilePicture(picPreview);
    setPicPreview(null);
    setPicMsg({ type: 'success', text: 'Profile photo updated!' });
    setTimeout(() => setPicMsg(null), 3000);
  };

  const handleRemovePicture = () => {
    setProfilePicture(null);
    setPicPreview(null);
    setPicMsg({ type: 'success', text: 'Profile photo removed.' });
    setTimeout(() => setPicMsg(null), 3000);
  };

  const displayPic = picPreview ?? profilePicture;
  const initials = fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const [profileForm, setProfileForm] = useState({
    name: hospital.name,
    tagline: hospital.tagline,
    address: hospital.address,
    phone: hospital.phone,
    email: hospital.email,
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Data management — bulk
  const [clearTarget, setClearTarget] = useState<ClearTarget | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [clearLoading, setClearLoading] = useState(false);
  const [clearMsg, setClearMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Data management — single record
  const [singleDeleteTab, setSingleDeleteTab] = useState<'patient' | 'billing'>('patient');
  const [patientSearch, setPatientSearch] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([]);
  const [patientSearching, setPatientSearching] = useState(false);
  const [selectedDeletePatient, setSelectedDeletePatient] = useState<Patient | null>(null);
  const [deletePatientConfirm, setDeletePatientConfirm] = useState('');
  const [deletingPatient, setDeletingPatient] = useState(false);
  const [deletePatientMsg, setDeletePatientMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [billingSearch, setBillingSearch] = useState('');
  const [billingSearchResults, setBillingSearchResults] = useState<Billing[]>([]);
  const [billingSearching, setBillingSearching] = useState(false);
  const [selectedDeleteBilling, setSelectedDeleteBilling] = useState<Billing | null>(null);
  const [deleteBillingConfirm, setDeleteBillingConfirm] = useState('');
  const [deletingBilling, setDeletingBilling] = useState(false);
  const [deleteBillingMsg, setDeleteBillingMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleClear = async () => {
    if (!clearTarget || confirmText !== 'DELETE') return;
    setClearLoading(true);
    setClearMsg(null);
    try {
      const res = await clearTarget.fn() as { data: { message: string } };
      setClearMsg({ type: 'success', text: res.data.message });
      setClearTarget(null);
      setConfirmText('');
    } catch {
      setClearMsg({ type: 'error', text: 'Failed to clear data. Please try again.' });
    } finally {
      setClearLoading(false);
    }
  };

  const searchPatientForDelete = async () => {
    if (!patientSearch.trim()) return;
    setPatientSearching(true);
    setDeletePatientMsg(null);
    try {
      const res = await patientApi.search(patientSearch, 0);
      setPatientSearchResults(res.data.data.content);
      if (res.data.data.content.length === 0) setDeletePatientMsg({ type: 'error', text: 'No patients found.' });
    } catch { setDeletePatientMsg({ type: 'error', text: 'Search failed.' }); }
    finally { setPatientSearching(false); }
  };

  const handleDeletePatient = async () => {
    if (!selectedDeletePatient || deletePatientConfirm !== 'DELETE') return;
    setDeletingPatient(true);
    setDeletePatientMsg(null);
    try {
      await dataApi.deletePatient(selectedDeletePatient.id);
      setDeletePatientMsg({ type: 'success', text: `Patient "${selectedDeletePatient.fullName}" and all linked records deleted.` });
      setSelectedDeletePatient(null);
      setPatientSearch('');
      setPatientSearchResults([]);
      setDeletePatientConfirm('');
    } catch { setDeletePatientMsg({ type: 'error', text: 'Failed to delete patient.' }); }
    finally { setDeletingPatient(false); }
  };

  const searchBillingForDelete = async () => {
    if (!billingSearch.trim()) return;
    setBillingSearching(true);
    setDeleteBillingMsg(null);
    try {
      // Search by looking through all billings (by patient name or invoice)
      const term = billingSearch.trim();
      // Try patient search first, then get their billings
      const patRes = await patientApi.search(term, 0);
      const patients = patRes.data.data.content;
      if (patients.length > 0) {
        const billRes = await billingApi.getByPatient(patients[0].id, 0);
        setBillingSearchResults(billRes.data.data.content);
        if (billRes.data.data.content.length === 0) setDeleteBillingMsg({ type: 'error', text: 'No invoices found for this patient.' });
      } else {
        setDeleteBillingMsg({ type: 'error', text: 'No patients found. Search by patient name.' });
        setBillingSearchResults([]);
      }
    } catch { setDeleteBillingMsg({ type: 'error', text: 'Search failed.' }); }
    finally { setBillingSearching(false); }
  };

  const handleDeleteBilling = async () => {
    if (!selectedDeleteBilling || deleteBillingConfirm !== 'DELETE') return;
    setDeletingBilling(true);
    setDeleteBillingMsg(null);
    try {
      await dataApi.deleteBilling(selectedDeleteBilling.id);
      setDeleteBillingMsg({ type: 'success', text: `Invoice "${selectedDeleteBilling.invoiceNumber}" deleted.` });
      setSelectedDeleteBilling(null);
      setBillingSearch('');
      setBillingSearchResults([]);
      setDeleteBillingConfirm('');
    } catch { setDeleteBillingMsg({ type: 'error', text: 'Failed to delete billing.' }); }
    finally { setDeletingBilling(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage(null);

    if (pwForm.newPassword.length < 6) {
      setPwMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (!userId) return;

    setPwLoading(true);
    try {
      await userApi.changePassword(userId, pwForm.currentPassword, pwForm.newPassword);
      setPwMessage({ type: 'success', text: 'Password changed successfully' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      setPwMessage({ type: 'error', text: 'Failed to change password. Check your current password.' });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* ── Profile Picture ── */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Camera className="w-5 h-5 text-gray-700" />
          <h2 className="font-semibold text-gray-900">Profile Photo</h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar preview */}
          <div className="relative flex-shrink-0">
            <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-primary-100">
              {displayPic ? (
                <img src={displayPic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-white text-3xl font-bold">
                  {initials}
                </div>
              )}
            </div>
            {/* Camera overlay button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-md hover:bg-primary-700 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Info + actions */}
          <div className="flex-1 text-center sm:text-left">
            <p className="font-semibold text-gray-900 text-base">{fullName}</p>
            <p className="text-xs text-gray-400 mb-4">{role?.replace(/_/g, ' ')}</p>

            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={picLoading}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                <Upload className="w-4 h-4" />
                {picLoading ? 'Processing…' : 'Upload Photo'}
              </button>
              {picPreview && (
                <button
                  onClick={handleSavePicture}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Save Photo
                </button>
              )}
              {(profilePicture || picPreview) && (
                <button
                  onClick={() => { setPicPreview(null); if (!picPreview) handleRemovePicture(); }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {picPreview ? 'Cancel' : 'Remove'}
                </button>
              )}
            </div>

            <p className="text-xs text-gray-400 mt-3">JPG, PNG or GIF · max 10 MB · auto-cropped to square</p>

            {picMsg && (
              <div className={`mt-3 text-sm px-3 py-2 rounded-xl inline-block ${picMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {picMsg.text}
              </div>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Change Password */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-gray-700" />
            <h2 className="font-semibold text-gray-900">Change Password</h2>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm pr-10"
                  required
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={pwForm.newPassword}
                  onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm pr-10"
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            {pwMessage && (
              <div className={`text-sm px-3 py-2 rounded-lg ${pwMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {pwMessage.text}
              </div>
            )}
            <button type="submit" disabled={pwLoading}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {pwLoading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">System Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">System Version</span>
              <span className="text-sm font-medium text-gray-900">OCMC v1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">License</span>
              <span className="text-sm font-medium text-gray-900">Enterprise</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Database</span>
              <span className="text-sm font-medium text-gray-900">PostgreSQL</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-500">Java Version</span>
              <span className="text-sm font-medium text-gray-900">21</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-xl">
              <Heart className="w-8 h-8 text-primary-600" fill="currentColor" />
              <div>
                <p className="text-sm font-semibold text-primary-900">Helvino Technologies Limited</p>
                <p className="text-xs text-primary-600">helvinotechltd@gmail.com | +254 703 445 756 | helvino.org</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Data Management (SUPER_ADMIN only) ── */}
      {isAdmin && (
        <div className="bg-white rounded-xl border-2 border-red-200 p-6">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="font-semibold text-red-700">Data Management</h2>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">SUPER ADMIN ONLY</span>
          </div>
          <p className="text-sm text-red-500 mb-5">
            Permanently delete categories of data. All actions are logged in the Audit Log and cannot be undone.
          </p>

          {clearMsg && (
            <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${clearMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {clearMsg.text}
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CLEAR_TARGETS.map((t) => (
              <div key={t.key} className="border border-red-100 rounded-xl p-4 bg-red-50/40">
                <p className="font-semibold text-gray-800 text-sm mb-1">{t.label}</p>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">{t.description}</p>
                <button
                  onClick={() => { setClearTarget(t); setConfirmText(''); setClearMsg(null); }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-800 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear {t.label}
                </button>
              </div>
            ))}
          </div>

          {/* Confirmation dialog inline */}
          {clearTarget && (
            <div className="mt-5 p-4 bg-red-50 border-2 border-red-300 rounded-xl">
              <p className="text-sm font-semibold text-red-800 mb-1">
                Confirm: Clear "{clearTarget.label}"
              </p>
              <p className="text-xs text-red-600 mb-3">
                This will permanently delete all matching records. Type <strong>DELETE</strong> to confirm.
              </p>
              <div className="flex items-center gap-3">
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder='Type DELETE here'
                  className="flex-1 border-2 border-red-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-red-500"
                />
                <button
                  onClick={handleClear}
                  disabled={confirmText !== 'DELETE' || clearLoading}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {clearLoading ? 'Clearing...' : 'Confirm Delete'}
                </button>
                <button
                  onClick={() => { setClearTarget(null); setConfirmText(''); }}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Single Record Delete */}
      {isAdmin && (
        <div className="bg-white rounded-xl border-2 border-orange-200 p-6">
          <div className="flex items-center gap-2 mb-1">
            <Trash2 className="w-5 h-5 text-orange-600" />
            <h2 className="font-semibold text-orange-700">Delete Specific Record</h2>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">ADMIN ONLY</span>
          </div>
          <p className="text-sm text-orange-500 mb-5">Search and delete a specific patient or billing record. This action is permanent and logged.</p>

          {/* Tab */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => setSingleDeleteTab('patient')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${singleDeleteTab === 'patient' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <UserX className="w-3.5 h-3.5" /> Delete Patient
            </button>
            <button onClick={() => setSingleDeleteTab('billing')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${singleDeleteTab === 'billing' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <ReceiptText className="w-3.5 h-3.5" /> Delete Invoice
            </button>
          </div>

          {singleDeleteTab === 'patient' && (
            <div className="space-y-3">
              {deletePatientMsg && (
                <div className={`px-3 py-2 rounded-lg text-sm ${deletePatientMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {deletePatientMsg.text}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  value={patientSearch}
                  onChange={e => { setPatientSearch(e.target.value); setSelectedDeletePatient(null); setPatientSearchResults([]); }}
                  onKeyDown={e => e.key === 'Enter' && searchPatientForDelete()}
                  placeholder="Search patient by name, phone, or patient number..."
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <button onClick={searchPatientForDelete} disabled={patientSearching || !patientSearch.trim()}
                  className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 disabled:opacity-50">
                  {patientSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
              {patientSearchResults.length > 0 && !selectedDeletePatient && (
                <div className="border border-gray-200 rounded-lg divide-y max-h-40 overflow-y-auto">
                  {patientSearchResults.map(p => (
                    <button key={p.id} onClick={() => { setSelectedDeletePatient(p); setDeletePatientConfirm(''); }}
                      className="w-full text-left px-3 py-2.5 hover:bg-orange-50 transition-colors">
                      <div className="text-sm font-medium text-gray-900">{p.fullName}</div>
                      <div className="text-xs text-gray-500">{p.patientNo} | {p.phone || 'No phone'}</div>
                    </button>
                  ))}
                </div>
              )}
              {selectedDeletePatient && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-red-900">{selectedDeletePatient.fullName}</p>
                      <p className="text-xs text-red-600">{selectedDeletePatient.patientNo} | {selectedDeletePatient.phone}</p>
                    </div>
                    <button onClick={() => { setSelectedDeletePatient(null); setDeletePatientConfirm(''); }}
                      className="text-xs text-gray-400 hover:text-gray-600 underline">Change</button>
                  </div>
                  <p className="text-xs text-red-700">This will permanently delete this patient and ALL linked visits, prescriptions, lab orders, billing, and admissions. Type <strong>DELETE</strong> to confirm.</p>
                  <div className="flex gap-2">
                    <input
                      value={deletePatientConfirm}
                      onChange={e => setDeletePatientConfirm(e.target.value.toUpperCase())}
                      placeholder="Type DELETE"
                      className="flex-1 border-2 border-red-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-red-500"
                    />
                    <button onClick={handleDeletePatient} disabled={deletePatientConfirm !== 'DELETE' || deletingPatient}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-40 whitespace-nowrap">
                      {deletingPatient ? 'Deleting...' : 'Delete Patient'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {singleDeleteTab === 'billing' && (
            <div className="space-y-3">
              {deleteBillingMsg && (
                <div className={`px-3 py-2 rounded-lg text-sm ${deleteBillingMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {deleteBillingMsg.text}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  value={billingSearch}
                  onChange={e => { setBillingSearch(e.target.value); setSelectedDeleteBilling(null); setBillingSearchResults([]); }}
                  onKeyDown={e => e.key === 'Enter' && searchBillingForDelete()}
                  placeholder="Search by patient name..."
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <button onClick={searchBillingForDelete} disabled={billingSearching || !billingSearch.trim()}
                  className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 disabled:opacity-50">
                  {billingSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
              {billingSearchResults.length > 0 && !selectedDeleteBilling && (
                <div className="border border-gray-200 rounded-lg divide-y max-h-40 overflow-y-auto">
                  {billingSearchResults.map(b => (
                    <button key={b.id} onClick={() => { setSelectedDeleteBilling(b); setDeleteBillingConfirm(''); }}
                      className="w-full text-left px-3 py-2.5 hover:bg-orange-50 transition-colors">
                      <div className="text-sm font-medium text-gray-900">{b.invoiceNumber}</div>
                      <div className="text-xs text-gray-500">{b.patientName} | KES {b.totalAmount?.toLocaleString()} | {b.status}</div>
                    </button>
                  ))}
                </div>
              )}
              {selectedDeleteBilling && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-red-900">{selectedDeleteBilling.invoiceNumber}</p>
                      <p className="text-xs text-red-600">{selectedDeleteBilling.patientName} | KES {selectedDeleteBilling.totalAmount?.toLocaleString()} | {selectedDeleteBilling.status}</p>
                    </div>
                    <button onClick={() => { setSelectedDeleteBilling(null); setDeleteBillingConfirm(''); }}
                      className="text-xs text-gray-400 hover:text-gray-600 underline">Change</button>
                  </div>
                  <p className="text-xs text-red-700">This will permanently delete this invoice and all its payment records. Type <strong>DELETE</strong> to confirm.</p>
                  <div className="flex gap-2">
                    <input
                      value={deleteBillingConfirm}
                      onChange={e => setDeleteBillingConfirm(e.target.value.toUpperCase())}
                      placeholder="Type DELETE"
                      className="flex-1 border-2 border-red-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-red-500"
                    />
                    <button onClick={handleDeleteBilling} disabled={deleteBillingConfirm !== 'DELETE' || deletingBilling}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-40 whitespace-nowrap">
                      {deletingBilling ? 'Deleting...' : 'Delete Invoice'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Receipt / Invoice Settings — full width */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-5 h-5 text-gray-700" />
          <h2 className="font-semibold text-gray-900">Receipt / Invoice Settings</h2>
        </div>
        <p className="text-xs text-gray-500 mb-5">Edit the details that appear on printed receipts and invoices.</p>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Edit form */}
          <form onSubmit={async (e) => {
            e.preventDefault();
            setProfileSaving(true);
            setProfileError('');
            try {
              await hospital.update(profileForm);
              setProfileSaved(true);
              setTimeout(() => setProfileSaved(false), 3000);
            } catch {
              setProfileError('Failed to save settings. Please try again.');
            } finally {
              setProfileSaving(false);
            }
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hospital / Facility Name</label>
              <input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
              <input value={profileForm.tagline} onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Quality Healthcare Services" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. P.O. Box 00000, Nairobi, Kenya" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            {profileSaved && (
              <div className="text-sm px-3 py-2 rounded-lg bg-green-50 text-green-700">
                Receipt settings saved successfully
              </div>
            )}
            {profileError && (
              <div className="text-sm px-3 py-2 rounded-lg bg-red-50 text-red-700">
                {profileError}
              </div>
            )}
            <button type="submit" disabled={profileSaving} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {profileSaving ? 'Saving...' : 'Save Receipt Settings'}
            </button>
          </form>

          {/* Live preview */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Printer className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Receipt Preview</span>
            </div>
            <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
              <div className="bg-white rounded-lg p-6 shadow-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
                {/* Header */}
                <div className="text-center border-b-2 border-gray-800 pb-3 mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{profileForm.name || 'Hospital Name'}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{profileForm.tagline || 'Tagline'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {profileForm.address || 'Address'} | Tel: {profileForm.phone || 'Phone'} | {profileForm.email || 'Email'}
                  </p>
                  <p className="text-xs font-semibold text-gray-700 mt-2">Receipt / Invoice</p>
                </div>
                {/* Sample body */}
                <div className="flex justify-between text-xs text-gray-600 mb-3">
                  <div>
                    <p><span className="font-semibold">Patient:</span> John Doe</p>
                    <p><span className="font-semibold">Patient No:</span> PT-001</p>
                  </div>
                  <div className="text-right">
                    <p><span className="font-semibold">Invoice:</span> INV-001</p>
                    <p><span className="font-semibold">Date:</span> {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                <table className="w-full text-xs mb-3">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left p-1.5 font-semibold text-gray-600">Description</th>
                      <th className="text-right p-1.5 font-semibold text-gray-600">Qty</th>
                      <th className="text-right p-1.5 font-semibold text-gray-600">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="p-1.5 text-gray-600">Consultation</td>
                      <td className="p-1.5 text-gray-600 text-right">1</td>
                      <td className="p-1.5 text-gray-600 text-right">KES 1,500</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="p-1.5 text-gray-600">Lab - Full Blood Count</td>
                      <td className="p-1.5 text-gray-600 text-right">1</td>
                      <td className="p-1.5 text-gray-600 text-right">KES 800</td>
                    </tr>
                  </tbody>
                </table>
                <div className="text-right text-xs mb-3">
                  <p className="font-bold text-gray-900">Total: KES 2,300</p>
                </div>
                {/* Footer */}
                <div className="border-t border-gray-200 pt-2 text-center">
                  <p className="text-[10px] text-gray-400">Thank you for choosing {profileForm.name || 'Hospital Name'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
