import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Tag, ToggleLeft, ToggleRight } from 'lucide-react';
import Modal from '../../components/Modal';
import { medicalServiceApi } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import type { MedicalService } from '../../types';

const SERVICE_CATEGORIES = [
  'Procedure', 'Consultation', 'Injection', 'Wound Care', 'Dental',
  'Physiotherapy', 'Surgical', 'Nursing', 'Radiology', 'Other',
];

const emptyForm = { serviceName: '', category: 'Procedure', price: 0, description: '', active: true };

export default function ServicesPage() {
  const { role } = useAuthStore();
  const isAdmin = role === 'SUPER_ADMIN' || role === 'HOSPITAL_ADMIN';

  const [services, setServices] = useState<MedicalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MedicalService | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<MedicalService | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await medicalServiceApi.getAll();
      setServices(res.data.data);
    } catch { /* handled */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (svc: MedicalService) => {
    setEditing(svc);
    setForm({
      serviceName: svc.serviceName,
      category: svc.category,
      price: svc.price,
      description: svc.description || '',
      active: svc.active,
    });
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editing) {
        await medicalServiceApi.update(editing.id, form);
      } else {
        await medicalServiceApi.create(form);
      }
      setModalOpen(false);
      fetchServices();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to save service.');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await medicalServiceApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchServices();
    } catch { /* handled */ } finally { setDeleting(false); }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount || 0);

  const categories = Array.from(new Set(services.map(s => s.category))).sort();
  const filtered = categoryFilter ? services.filter(s => s.category === categoryFilter) : services;
  const grouped: Record<string, MedicalService[]> = {};
  filtered.forEach(s => {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  });

  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelClass = 'block text-sm font-medium text-gray-600 mb-1';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medical Services</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage chargeable services like procedures, injections, wound care, etc.</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Service
          </button>
        )}
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Tag className="w-4 h-4 text-gray-400" />
          <button
            onClick={() => setCategoryFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${categoryFilter === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${categoryFilter === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No services yet</p>
          {isAdmin && (
            <button onClick={openCreate} className="mt-3 text-sm text-blue-600 hover:underline">
              Add your first service
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                <Tag className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-700">{category}</h3>
                <span className="text-xs text-gray-400">({items.length})</span>
              </div>
              <div className="divide-y divide-gray-50">
                {items.map(svc => (
                  <div key={svc.id} className={`flex items-center gap-4 px-4 py-3 ${!svc.active ? 'opacity-50' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900">{svc.serviceName}</span>
                        {!svc.active && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500">Inactive</span>
                        )}
                      </div>
                      {svc.description && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{svc.description}</p>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-blue-700 flex-shrink-0">
                      {formatCurrency(svc.price)}
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => openEdit(svc)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(svc)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Service' : 'Add Service'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>Service Name *</label>
              <input
                required
                type="text"
                value={form.serviceName}
                onChange={e => setForm(f => ({ ...f, serviceName: e.target.value }))}
                className={inputClass}
                placeholder="e.g. IV Injection, Stitching, Wound Dressing"
              />
            </div>
            <div>
              <label className={labelClass}>Category *</label>
              <select
                required
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className={inputClass}
              >
                {SERVICE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Price (KES) *</label>
              <input
                required
                type="number"
                min={0}
                step="0.01"
                value={form.price || ''}
                onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) || 0 }))}
                className={inputClass}
                placeholder="0.00"
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Description</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className={inputClass}
                placeholder="Optional description"
              />
            </div>
            {editing && (
              <div className="md:col-span-2">
                <label className={labelClass}>Status</label>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                  className="flex items-center gap-2 text-sm"
                >
                  {form.active ? (
                    <><ToggleRight className="w-6 h-6 text-green-500" /><span className="text-green-700 font-medium">Active</span></>
                  ) : (
                    <><ToggleLeft className="w-6 h-6 text-gray-400" /><span className="text-gray-500">Inactive</span></>
                  )}
                </button>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {submitting ? 'Saving...' : editing ? 'Update Service' : 'Add Service'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Service">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <strong>{deleteTarget.serviceName}</strong>?
              This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
