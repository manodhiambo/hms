import { useState, useEffect, useCallback } from 'react';
import { Plus, CheckCircle, XCircle, Filter, Search } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { refundApi, pharmacyApi } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import type { Refund, RefundStatus, Prescription, PaymentMethod } from '../../types';

const refundStatuses: RefundStatus[] = ['PENDING', 'PROCESSED', 'REJECTED'];
const paymentMethods: PaymentMethod[] = ['CASH', 'MPESA', 'CARD', 'BANK_TRANSFER', 'INSURANCE'];

export default function RefundPage() {
  const { userId, role } = useAuthStore();
  const canApprove = role === 'SUPER_ADMIN' || role === 'HOSPITAL_ADMIN';

  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // New refund modal
  const [createOpen, setCreateOpen] = useState(false);
  const [dispensedRx, setDispensedRx] = useState<Prescription[]>([]);
  const [rxSearch, setRxSearch] = useState('');
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
  const [newForm, setNewForm] = useState({ quantityReturned: 1, reason: '', notes: '' });
  const [createError, setCreateError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Approve modal
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveRefund, setApproveRefund] = useState<Refund | null>(null);
  const [approveForm, setApproveForm] = useState({ refundMethod: 'CASH' as PaymentMethod, referenceNumber: '' });
  const [approveError, setApproveError] = useState('');

  // Reject modal
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectRefund, setRejectRefund] = useState<Refund | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [rejectError, setRejectError] = useState('');

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const res = statusFilter
        ? await refundApi.getByStatus(statusFilter, page)
        : await refundApi.getAll(page);
      setRefunds(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch { /* handled */ } finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchRefunds(); }, [fetchRefunds]);
  useEffect(() => { setPage(0); }, [statusFilter]);

  const openCreate = async () => {
    setCreateError('');
    setSelectedRx(null);
    setRxSearch('');
    setNewForm({ quantityReturned: 1, reason: '', notes: '' });
    setCreateOpen(true);
    try {
      const res = await pharmacyApi.getDispensedRx();
      setDispensedRx(res.data.data);
    } catch { setDispensedRx([]); }
  };

  const filteredRx = dispensedRx.filter((rx) => {
    const q = rxSearch.toLowerCase();
    return (
      rx.drugName?.toLowerCase().includes(q) ||
      rx.patientName?.toLowerCase().includes(q) ||
      rx.patientNo?.toLowerCase().includes(q)
    );
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRx) return;
    setSubmitting(true);
    setCreateError('');
    try {
      await refundApi.create({
        prescriptionId: selectedRx.id,
        quantityReturned: newForm.quantityReturned,
        reason: newForm.reason,
        notes: newForm.notes || undefined,
      });
      setCreateOpen(false);
      fetchRefunds();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setCreateError(msg || 'Failed to submit refund request.');
    } finally { setSubmitting(false); }
  };

  const openApprove = (refund: Refund) => {
    setApproveRefund(refund);
    setApproveForm({ refundMethod: 'CASH', referenceNumber: '' });
    setApproveError('');
    setApproveOpen(true);
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveRefund || !userId) return;
    setSubmitting(true);
    setApproveError('');
    try {
      await refundApi.approve(approveRefund.id, {
        processedById: String(userId),
        refundMethod: approveForm.refundMethod,
        referenceNumber: approveForm.referenceNumber || undefined,
      });
      setApproveOpen(false);
      fetchRefunds();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApproveError(msg || 'Failed to approve refund.');
    } finally { setSubmitting(false); }
  };

  const openReject = (refund: Refund) => {
    setRejectRefund(refund);
    setRejectNotes('');
    setRejectError('');
    setRejectOpen(true);
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectRefund || !userId) return;
    setSubmitting(true);
    setRejectError('');
    try {
      await refundApi.reject(rejectRefund.id, {
        processedById: String(userId),
        notes: rejectNotes || undefined,
      });
      setRejectOpen(false);
      fetchRefunds();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setRejectError(msg || 'Failed to reject refund.');
    } finally { setSubmitting(false); }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount || 0);

  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelClass = 'block text-sm font-medium text-gray-600 mb-1';

  const columns = [
    { key: 'refundNumber', label: 'Refund #' },
    {
      key: 'patientName', label: 'Patient',
      render: (r: Refund) => (
        <div>
          <div className="font-medium text-gray-900">{r.patientName}</div>
          <div className="text-xs text-gray-500">{r.patientNo}</div>
        </div>
      ),
    },
    {
      key: 'drugName', label: 'Drug',
      render: (r: Refund) => (
        <div>
          <div className="text-sm text-gray-900">{r.drugName}</div>
          <div className="text-xs text-gray-500">{r.dosage}</div>
        </div>
      ),
    },
    {
      key: 'quantityReturned', label: 'Qty Returned',
      render: (r: Refund) => (
        <span className="text-sm text-gray-700">{r.quantityReturned} / {r.quantityDispensed} dispensed</span>
      ),
    },
    {
      key: 'refundAmount', label: 'Amount',
      render: (r: Refund) => <span className="font-medium text-blue-700">{formatCurrency(r.refundAmount)}</span>,
    },
    { key: 'status', label: 'Status', render: (r: Refund) => <StatusBadge status={r.status} /> },
    {
      key: 'createdAt', label: 'Requested',
      render: (r: Refund) => new Date(r.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions', label: '',
      render: (r: Refund) => r.status === 'PENDING' && canApprove ? (
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); openApprove(r); }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Approve
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openReject(r); }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" /> Reject
          </button>
        </div>
      ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Refunds</h1>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Refund Request
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-gray-400" />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            All
          </button>
          {refundStatuses.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <DataTable columns={columns} data={refunds} page={page} totalPages={totalPages} onPageChange={setPage} loading={loading} />

      {/* New Refund Request Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Refund Request" size="lg">
        <div className="space-y-4">
          {/* Prescription Search */}
          <div>
            <label className={labelClass}>Search Dispensed Prescription *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={rxSearch}
                onChange={(e) => { setRxSearch(e.target.value); setSelectedRx(null); }}
                placeholder="Search by drug name, patient name, or patient number..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Prescription List */}
          {!selectedRx && (
            <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
              {filteredRx.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  {dispensedRx.length === 0 ? 'Loading prescriptions...' : 'No dispensed prescriptions found'}
                </p>
              ) : (
                filteredRx.map((rx) => (
                  <button
                    key={rx.id}
                    type="button"
                    onClick={() => { setSelectedRx(rx); setNewForm((f) => ({ ...f, quantityReturned: rx.quantityDispensed || 1 })); }}
                    className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <div className="font-medium text-sm text-gray-900">{rx.drugName}</div>
                    <div className="text-xs text-gray-500">
                      {rx.patientName} ({rx.patientNo}) · Dispensed: {rx.quantityDispensed} · {rx.dosage}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Selected Prescription */}
          {selectedRx && (
            <div className="bg-blue-50 rounded-lg p-3 text-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-blue-900">{selectedRx.drugName}</div>
                  <div className="text-blue-700 text-xs mt-0.5">
                    {selectedRx.patientName} ({selectedRx.patientNo}) · Dispensed: {selectedRx.quantityDispensed} · {selectedRx.dosage}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRx(null)}
                  className="text-blue-400 hover:text-blue-600 text-xs ml-2 underline"
                >
                  Change
                </button>
              </div>
            </div>
          )}

          {/* Refund Form */}
          {selectedRx && (
            <form onSubmit={handleCreate} className="space-y-3">
              {createError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{createError}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Quantity to Return *</label>
                  <input
                    required
                    type="number"
                    min={1}
                    max={selectedRx.quantityDispensed}
                    value={newForm.quantityReturned}
                    onChange={(e) => setNewForm((f) => ({ ...f, quantityReturned: Number(e.target.value) }))}
                    className={inputClass}
                  />
                  <p className="text-xs text-gray-400 mt-0.5">Max: {selectedRx.quantityDispensed}</p>
                </div>
                <div>
                  <label className={labelClass}>Reason *</label>
                  <input
                    required
                    type="text"
                    value={newForm.reason}
                    onChange={(e) => setNewForm((f) => ({ ...f, reason: e.target.value }))}
                    className={inputClass}
                    placeholder="e.g. Patient reaction, wrong drug"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Additional Notes</label>
                <textarea
                  rows={2}
                  value={newForm.notes}
                  onChange={(e) => setNewForm((f) => ({ ...f, notes: e.target.value }))}
                  className={inputClass}
                  placeholder="Optional details..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Refund Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Approve Refund Modal */}
      <Modal open={approveOpen} onClose={() => setApproveOpen(false)} title="Approve Refund">
        {approveRefund && (
          <form onSubmit={handleApprove} className="space-y-4">
            {/* Summary */}
            <div className="bg-green-50 rounded-lg p-3 text-sm">
              <div className="font-semibold text-green-900">{approveRefund.refundNumber}</div>
              <div className="text-green-700 text-xs mt-0.5">
                {approveRefund.patientName} · {approveRefund.drugName} · {approveRefund.quantityReturned} units returned
              </div>
              <div className="text-green-800 font-semibold mt-1">
                Refund Amount: {formatCurrency(approveRefund.refundAmount)}
              </div>
            </div>

            {approveError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{approveError}</div>
            )}

            <div>
              <label className={labelClass}>Refund Method *</label>
              <select
                required
                value={approveForm.refundMethod}
                onChange={(e) => setApproveForm((f) => ({ ...f, refundMethod: e.target.value as PaymentMethod }))}
                className={inputClass}
              >
                {paymentMethods.map((m) => (
                  <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Reference Number</label>
              <input
                type="text"
                value={approveForm.referenceNumber}
                onChange={(e) => setApproveForm((f) => ({ ...f, referenceNumber: e.target.value }))}
                className={inputClass}
                placeholder={approveForm.refundMethod === 'MPESA' ? 'M-Pesa transaction code' : 'Optional reference'}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setApproveOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
                {submitting ? 'Processing...' : 'Confirm Approval'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Reject Refund Modal */}
      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Refund">
        {rejectRefund && (
          <form onSubmit={handleReject} className="space-y-4">
            {/* Summary */}
            <div className="bg-red-50 rounded-lg p-3 text-sm">
              <div className="font-semibold text-red-900">{rejectRefund.refundNumber}</div>
              <div className="text-red-700 text-xs mt-0.5">
                {rejectRefund.patientName} · {rejectRefund.drugName} · {formatCurrency(rejectRefund.refundAmount)}
              </div>
            </div>

            {rejectError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{rejectError}</div>
            )}

            <div>
              <label className={labelClass}>Reason for Rejection</label>
              <textarea
                rows={3}
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                className={inputClass}
                placeholder="Explain why this refund is being rejected..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setRejectOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                {submitting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
