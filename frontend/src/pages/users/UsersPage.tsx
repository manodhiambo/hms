import { useEffect, useState } from 'react';
import { UserCog, Plus, KeyRound, Pencil, UserX, Eye, EyeOff } from 'lucide-react';
import { userApi } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import type { User, UserRole } from '../../types';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';

const roles: UserRole[] = ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECHNICIAN', 'RADIOLOGIST', 'RECEPTIONIST', 'ACCOUNTANT'];

function PasswordCell({ plainPassword }: { plainPassword?: string }) {
  const [show, setShow] = useState(false);
  if (!plainPassword) return <span className="text-gray-400 text-xs">—</span>;
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs font-mono text-gray-700">{show ? plainPassword : '••••••••'}</span>
      <button type="button" onClick={() => setShow(!show)} className="text-gray-400 hover:text-gray-700 ml-1">
        {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

export default function UsersPage() {
  const currentRole = useAuthStore((s) => s.role);
  const isAdmin = currentRole === 'SUPER_ADMIN';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Create modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', role: 'DOCTOR' as UserRole, department: '', specialization: '', licenseNumber: '' });
  const [showCreatePw, setShowCreatePw] = useState(false);

  // Edit modal
  const [editModal, setEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ fullName: '', email: '', phone: '', role: 'DOCTOR' as UserRole, department: '', specialization: '', licenseNumber: '' });

  // Reset password modal (admin — no current password needed)
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [resetPw, setResetPw] = useState('');
  const [showResetPw, setShowResetPw] = useState(false);
  const [resetMsg, setResetMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadUsers = () => {
    setLoading(true);
    userApi.getAll().then((r) => setUsers(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await userApi.create({ ...form, active: true });
    setShowModal(false);
    setForm({ fullName: '', email: '', password: '', phone: '', role: 'DOCTOR', department: '', specialization: '', licenseNumber: '' });
    loadUsers();
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({ fullName: user.fullName, email: user.email, phone: user.phone || '', role: user.role, department: user.department || '', specialization: user.specialization || '', licenseNumber: user.licenseNumber || '' });
    setEditModal(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    await userApi.update(editingUser.id, { ...editForm, active: editingUser.active });
    setEditModal(false);
    loadUsers();
  };

  const handleDelete = async (user: User) => {
    const confirmed = confirm(
      `PERMANENTLY DELETE ${user.fullName}?\n\nThis cannot be undone. The user will be completely erased from the system.`
    );
    if (!confirmed) return;
    await userApi.delete(user.id);
    loadUsers();
  };

  const openResetModal = (user: User) => {
    setResetTarget(user);
    setResetPw('');
    setShowResetPw(false);
    setResetMsg(null);
    setShowResetModal(true);
  };

  const handleAdminReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg(null);
    if (resetPw.length < 6) { setResetMsg({ type: 'error', text: 'Password must be at least 6 characters' }); return; }
    try {
      await userApi.adminResetPassword(resetTarget!.id, resetPw);
      setResetMsg({ type: 'success', text: 'Password reset successfully' });
      loadUsers();
      setTimeout(() => setShowResetModal(false), 1500);
    } catch {
      setResetMsg({ type: 'error', text: 'Failed to reset password' });
    }
  };

  const columns = [
    { key: 'fullName', label: 'Name', render: (u: User) => <div className="font-medium text-gray-900">{u.fullName}</div> },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: (u: User) => u.phone || '-' },
    { key: 'role', label: 'Role', render: (u: User) => <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">{u.role.replace(/_/g, ' ')}</span> },
    { key: 'department', label: 'Department', render: (u: User) => u.department || '-' },
    ...(isAdmin ? [{ key: 'plainPassword', label: 'Password', render: (u: User) => <PasswordCell plainPassword={u.plainPassword} /> }] : []),
    { key: 'active', label: 'Status', render: (u: User) => <StatusBadge status={u.active ? 'AVAILABLE' : 'MAINTENANCE'} /> },
    ...(isAdmin ? [{
      key: 'actions', label: '', render: (u: User) => (
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEditModal(u); }} className="text-gray-400 hover:text-blue-600 p-1" title="Edit"><Pencil className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); openResetModal(u); }} className="text-gray-400 hover:text-primary-600 p-1" title="Reset Password"><KeyRound className="w-4 h-4" /></button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(u); }} className="text-gray-400 hover:text-red-600 p-1" title="Delete Permanently"><UserX className="w-4 h-4" /></button>
        </div>
      )
    }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCog className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        )}
      </div>

      <DataTable columns={columns} data={users} loading={loading} />

      {/* Create Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Staff Member" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input type={showCreatePw ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm pr-10" required />
                <button type="button" onClick={() => setShowCreatePw(!showCreatePw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCreatePw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {roles.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
              <input value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <button type="submit" className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700">Create Staff Member</button>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title={`Edit Staff — ${editingUser?.fullName || ''}`} size="lg">
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {roles.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <input value={editForm.specialization} onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
              <input value={editForm.licenseNumber} onChange={(e) => setEditForm({ ...editForm, licenseNumber: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <button type="submit" className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700">Update Staff Member</button>
        </form>
      </Modal>

      {/* Admin Reset Password Modal */}
      <Modal open={showResetModal} onClose={() => setShowResetModal(false)} title={`Reset Password — ${resetTarget?.fullName || ''}`}>
        <form onSubmit={handleAdminReset} className="space-y-4">
          {resetMsg && (
            <div className={`px-4 py-3 rounded-lg text-sm ${resetMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{resetMsg.text}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showResetPw ? 'text' : 'password'}
                value={resetPw}
                onChange={(e) => setResetPw(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm pr-10"
                placeholder="Enter new password"
                required
                minLength={6}
              />
              <button type="button" onClick={() => setShowResetPw(!showResetPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showResetPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Minimum 6 characters. The user will be able to login with this new password.</p>
          </div>
          <button type="submit" className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700">Reset Password</button>
        </form>
      </Modal>
    </div>
  );
}
