import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Filter, TrendingDown } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { expenseApi } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import type { Expense } from '../../types';

const CATEGORIES = [
  'Salaries & Wages',
  'Medical Supplies',
  'Medications',
  'Equipment',
  'Utilities',
  'Maintenance & Repairs',
  'Catering & Food',
  'Cleaning & Sanitation',
  'Insurance',
  'Transport & Fuel',
  'Marketing & Outreach',
  'Training & Development',
  'Administrative',
  'Other',
];

const emptyForm = {
  category: '',
  description: '',
  amount: 0,
  expenseDate: new Date().toISOString().split('T')[0],
  referenceNumber: '',
  vendor: '',
};

export default function ExpensesPage() {
  const { userId } = useAuthStore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');

  // Date range filter
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(todayStr);
  const [useRange, setUseRange] = useState(false);

  // Summary
  const [periodTotal, setPeriodTotal] = useState<number>(0);

  // Create/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = useRange
        ? await expenseApi.getByDateRange(startDate, endDate, page)
        : await expenseApi.getAll(page);
      setExpenses(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch { /* handled */ } finally { setLoading(false); }
  }, [page, useRange, startDate, endDate]);

  const fetchTotal = useCallback(async () => {
    try {
      const res = await expenseApi.getTotal(startDate, endDate);
      setPeriodTotal(res.data.data || 0);
    } catch { /* */ }
  }, [startDate, endDate]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);
  useEffect(() => { fetchTotal(); }, [fetchTotal]);
  useEffect(() => { setPage(0); }, [useRange, startDate, endDate]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (e: Expense) => {
    setEditingId(e.id);
    setForm({
      category: e.category,
      description: e.description,
      amount: e.amount,
      expenseDate: e.expenseDate || todayStr,
      referenceNumber: e.referenceNumber || '',
      vendor: e.vendor || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      if (editingId) {
        await expenseApi.update(editingId, { ...form, amount: Number(form.amount) });
      } else {
        await expenseApi.create({ ...form, amount: Number(form.amount) }, userId || undefined);
      }
      setModalOpen(false);
      fetchExpenses();
      fetchTotal();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg || 'Failed to save expense. Please try again.');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await expenseApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchExpenses();
      fetchTotal();
    } catch { /* handled */ } finally { setDeleting(false); }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount || 0);

  const filtered = categoryFilter
    ? expenses.filter(e => e.category === categoryFilter)
    : expenses;

  const columns = [
    { key: 'expenseDate', label: 'Date', render: (e: Expense) => e.expenseDate || '-' },
    {
      key: 'category', label: 'Category',
      render: (e: Expense) => (
        <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
          {e.category}
        </span>
      ),
    },
    { key: 'description', label: 'Description' },
    { key: 'vendor', label: 'Vendor', render: (e: Expense) => e.vendor || <span className="text-gray-400">—</span> },
    { key: 'referenceNumber', label: 'Ref #', render: (e: Expense) => e.referenceNumber || <span className="text-gray-400">—</span> },
    {
      key: 'amount', label: 'Amount',
      render: (e: Expense) => <span className="font-semibold text-red-600">{formatCurrency(e.amount)}</span>,
    },
    { key: 'recordedByName', label: 'Recorded By', render: (e: Expense) => e.recordedByName || <span className="text-gray-400">—</span> },
    {
      key: 'actions', label: '',
      render: (e: Expense) => (
        <div className="flex gap-1">
          <button onClick={(evt) => { evt.stopPropagation(); openEdit(e); }}
            className="text-gray-400 hover:text-blue-600 p-1" title="Edit">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={(evt) => { evt.stopPropagation(); setDeleteTarget(e); }}
            className="text-gray-400 hover:text-red-600 p-1" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelClass = 'block text-sm font-medium text-gray-600 mb-1';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Record Expense
        </button>
      </div>

      {/* Summary card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-red-600 font-medium">Period Total ({startDate} → {endDate})</p>
            <p className="text-lg font-bold text-red-700">{formatCurrency(periodTotal)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">Filters</span>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">Date Range</label>
            <input type="checkbox" checked={useRange} onChange={(e) => setUseRange(e.target.checked)}
              className="rounded text-blue-600" />
          </div>
          <div>
            <label className={labelClass}>From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className={labelClass}>To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        loading={loading}
      />

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Expense' : 'Record Expense'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{formError}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Category *</label>
              <select required value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))}
                className={inputClass}>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Expense Date *</label>
              <input required type="date" value={form.expenseDate}
                onChange={(e) => setForm(p => ({ ...p, expenseDate: e.target.value }))}
                className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Description *</label>
              <input required type="text" value={form.description}
                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="e.g. Monthly electricity bill, Staff salaries for January..."
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Amount (KES) *</label>
              <input required type="number" min={0} step="0.01" value={form.amount || ''}
                onChange={(e) => setForm(p => ({ ...p, amount: Number(e.target.value) || 0 }))}
                placeholder="0.00" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Vendor / Payee</label>
              <input type="text" value={form.vendor}
                onChange={(e) => setForm(p => ({ ...p, vendor: e.target.value }))}
                placeholder="e.g. Kenya Power, ABC Suppliers..."
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Reference / Receipt Number</label>
              <input type="text" value={form.referenceNumber}
                onChange={(e) => setForm(p => ({ ...p, referenceNumber: e.target.value }))}
                placeholder="e.g. INV-1234, MPESA ref..."
                className={inputClass} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {submitting ? 'Saving...' : editingId ? 'Update Expense' : 'Record Expense'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Expense">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this expense?
          </p>
          {deleteTarget && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-gray-900">{deleteTarget.description}</p>
              <p className="text-gray-500 text-xs mt-1">
                {deleteTarget.category} | {deleteTarget.expenseDate} | {formatCurrency(deleteTarget.amount)}
              </p>
            </div>
          )}
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
      </Modal>
    </div>
  );
}
