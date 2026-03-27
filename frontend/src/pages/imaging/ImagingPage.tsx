import { useState, useEffect, useCallback } from 'react';
import { Plus, FileImage, Search, X, User } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { imagingApi, patientApi, visitApi } from '../../api/services';
import type { ImagingOrder, ImagingType, LabOrderStatus, Patient, Visit } from '../../types';

const IMAGING_TYPES: ImagingType[] = ['XRAY', 'ULTRASOUND', 'CT_SCAN', 'MRI'];
const STATUS_FILTERS: LabOrderStatus[] = ['ORDERED', 'SAMPLE_COLLECTED', 'PROCESSING', 'COMPLETED', 'VERIFIED', 'RELEASED'];

const IMAGING_TYPE_LABELS: Record<ImagingType, string> = {
  XRAY: 'X-Ray',
  ULTRASOUND: 'Ultrasound',
  CT_SCAN: 'CT Scan',
  MRI: 'MRI',
};

export default function ImagingPage() {
  const [orders, setOrders] = useState<ImagingOrder[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<LabOrderStatus | 'ALL'>('ALL');

  // New order modal
  const [newOrderModal, setNewOrderModal] = useState(false);

  // Complete order modal
  const [completeModal, setCompleteModal] = useState<ImagingOrder | null>(null);
  const [completeForm, setCompleteForm] = useState({ findings: '', impression: '', radiologistId: 0 });
  const [completing, setCompleting] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = statusFilter === 'ALL'
        ? await imagingApi.getAll(page)
        : await imagingApi.getByStatus(statusFilter, page);
      setOrders(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter]);

  const handleCompleteOrder = async () => {
    if (!completeModal) return;
    setCompleting(true);
    try {
      await imagingApi.complete(completeModal.id, completeForm);
      setCompleteModal(null);
      setCompleteForm({ findings: '', impression: '', radiologistId: 0 });
      fetchOrders();
    } catch {
      /* handled */
    } finally {
      setCompleting(false);
    }
  };

  const openCompleteModal = (order: ImagingOrder) => {
    const radiologistId = Number(localStorage.getItem('userId') || 0);
    setCompleteModal(order);
    setCompleteForm({ findings: '', impression: '', radiologistId });
  };

  const columns = [
    {
      key: 'imagingType',
      label: 'Type',
      render: (o: ImagingOrder) => (
        <div className="flex items-center gap-2">
          <FileImage className="w-4 h-4 text-gray-400" />
          <span>{IMAGING_TYPE_LABELS[o.imagingType] || o.imagingType}</span>
        </div>
      ),
    },
    { key: 'bodyPart', label: 'Body Part' },
    { key: 'clinicalIndication', label: 'Clinical Indication' },
    {
      key: 'status',
      label: 'Status',
      render: (o: ImagingOrder) => <StatusBadge status={o.status} />,
    },
    {
      key: 'price',
      label: 'Price',
      render: (o: ImagingOrder) => `KES ${o.price.toLocaleString()}`,
    },
    {
      key: 'findings',
      label: 'Findings',
      render: (o: ImagingOrder) => o.findings ? (
        <span className="text-sm">{o.findings.length > 60 ? `${o.findings.slice(0, 60)}...` : o.findings}</span>
      ) : <span className="text-gray-400">--</span>,
    },
    { key: 'radiologistName', label: 'Radiologist' },
    {
      key: 'createdAt',
      label: 'Ordered',
      render: (o: ImagingOrder) => new Date(o.createdAt).toLocaleString(),
    },
    {
      key: 'actions',
      label: 'Action',
      render: (o: ImagingOrder) => {
        if (o.status === 'ORDERED' || o.status === 'PROCESSING') {
          return (
            <button
              onClick={(e) => { e.stopPropagation(); openCompleteModal(o); }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Complete
            </button>
          );
        }
        return null;
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Imaging / Radiology</h1>
        <button
          onClick={() => setNewOrderModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Order
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            statusFilter === 'ALL'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <DataTable
        columns={columns}
        data={orders}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        loading={loading}
      />

      {/* New Order Modal */}
      {newOrderModal && (
        <NewOrderModal
          onClose={() => setNewOrderModal(false)}
          onCreated={() => {
            setNewOrderModal(false);
            fetchOrders();
          }}
        />
      )}

      {/* Complete Order Modal */}
      <Modal
        open={completeModal !== null}
        onClose={() => setCompleteModal(null)}
        title={`Complete Order - ${completeModal ? IMAGING_TYPE_LABELS[completeModal.imagingType] : ''} (${completeModal?.bodyPart || ''})`}
        size="lg"
      >
        <div className="space-y-4">
          {completeModal && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
              <p><span className="font-medium">Clinical Indication:</span> {completeModal.clinicalIndication}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Findings</label>
            <textarea
              value={completeForm.findings}
              onChange={(e) => setCompleteForm((prev) => ({ ...prev, findings: e.target.value }))}
              rows={4}
              placeholder="Describe the imaging findings"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Impression</label>
            <textarea
              value={completeForm.impression}
              onChange={(e) => setCompleteForm((prev) => ({ ...prev, impression: e.target.value }))}
              rows={3}
              placeholder="Overall impression / diagnosis"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Radiologist ID</label>
            <input
              type="number"
              value={completeForm.radiologistId || ''}
              onChange={(e) => setCompleteForm((prev) => ({ ...prev, radiologistId: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setCompleteModal(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCompleteOrder}
              disabled={completing || !completeForm.findings || !completeForm.impression}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {completing ? 'Completing...' : 'Complete Order'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── New Order Modal with Patient Search ──────────────────────────

type OrderStep = 'search' | 'visit' | 'details';

function NewOrderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState<OrderStep>('search');

  // Patient search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Visit selection
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  // Order details
  const [imagingType, setImagingType] = useState<ImagingType | ''>('');
  const [bodyPart, setBodyPart] = useState('');
  const [clinicalIndication, setClinicalIndication] = useState('');
  const [price, setPrice] = useState(0);
  const [saving, setSaving] = useState(false);

  // Debounced patient search
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(() => {
      setSearching(true);
      patientApi.search(searchQuery)
        .then((res) => setSearchResults(res.data.data.content))
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch visits when patient is selected
  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setStep('visit');
    setLoadingVisits(true);
    visitApi.getByPatient(patient.id)
      .then((res) => setVisits(res.data.data.content))
      .catch(() => {})
      .finally(() => setLoadingVisits(false));
  };

  const selectVisit = (visit: Visit) => {
    setSelectedVisit(visit);
    setStep('details');
  };

  const handleCreate = async () => {
    if (!selectedVisit || !imagingType || !bodyPart) return;
    setSaving(true);
    try {
      await imagingApi.create({
        visitId: selectedVisit.id,
        imagingType: imagingType as ImagingType,
        bodyPart,
        clinicalIndication,
        price,
      });
      onCreated();
    } catch {
      alert('Failed to create imaging order');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <Modal open onClose={onClose} title="New Imaging Order" size="lg">
      {/* Breadcrumb / Steps */}
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-5">
        <button
          onClick={() => { setStep('search'); setSelectedPatient(null); setSelectedVisit(null); }}
          className={`font-medium ${step === 'search' ? 'text-blue-600' : 'hover:text-gray-700'}`}
        >
          1. Find Patient
        </button>
        <span>/</span>
        <button
          onClick={() => { if (selectedPatient) setStep('visit'); }}
          className={`font-medium ${step === 'visit' ? 'text-blue-600' : selectedPatient ? 'hover:text-gray-700' : 'opacity-40 cursor-default'}`}
          disabled={!selectedPatient}
        >
          2. Select Visit
        </button>
        <span>/</span>
        <span className={`font-medium ${step === 'details' ? 'text-blue-600' : 'opacity-40'}`}>
          3. Order Details
        </span>
      </div>

      {/* Selected patient banner */}
      {selectedPatient && step !== 'search' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">{selectedPatient.fullName}</p>
              <p className="text-xs text-blue-700">{selectedPatient.patientNo} &middot; {selectedPatient.phone}</p>
            </div>
          </div>
          <button
            onClick={() => { setStep('search'); setSelectedPatient(null); setSelectedVisit(null); setSearchQuery(''); setSearchResults([]); }}
            className="text-blue-500 hover:text-blue-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 1: Patient Search */}
      {step === 'search' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputCls} pl-9`}
              placeholder="Search patient by name, phone, patient number..."
              autoFocus
            />
          </div>
          {searching && <p className="text-xs text-gray-400 py-2">Searching...</p>}
          {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
            <p className="text-xs text-gray-400 py-4 text-center">No patients found for &quot;{searchQuery}&quot;</p>
          )}
          {searchResults.length > 0 && (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectPatient(p)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.fullName}</p>
                    <p className="text-xs text-gray-500">{p.patientNo} &middot; {p.phone} &middot; {p.gender}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Visit Selection */}
      {step === 'visit' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Select a visit for the imaging order:</p>
          {loadingVisits && <p className="text-xs text-gray-400 py-4 text-center">Loading visits...</p>}
          {!loadingVisits && visits.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No visits found for this patient. Create a visit first.</p>
          )}
          {visits.length > 0 && (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
              {visits.map((v) => (
                <button
                  key={v.id}
                  onClick={() => selectVisit(v)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={v.visitType} />
                      {v.completed && <StatusBadge status="COMPLETED" />}
                    </div>
                    <span className="text-xs text-gray-500">{new Date(v.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    <span className="text-gray-500">Doctor:</span> {v.doctorName || 'Unassigned'}
                    {v.chiefComplaint && <> &middot; <span className="text-gray-500">Complaint:</span> {v.chiefComplaint}</>}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Order Details */}
      {step === 'details' && (
        <div className="space-y-4">
          {selectedVisit && (
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600 flex items-center justify-between">
              <span>
                Visit: <span className="font-medium">{selectedVisit.visitType}</span> &middot; {new Date(selectedVisit.createdAt).toLocaleDateString()} &middot; Dr. {selectedVisit.doctorName || 'Unassigned'}
              </span>
              <button onClick={() => { setStep('visit'); setSelectedVisit(null); }} className="text-blue-600 hover:underline text-xs">Change</button>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imaging Type</label>
            <select
              value={imagingType}
              onChange={(e) => setImagingType(e.target.value as ImagingType)}
              className={inputCls}
            >
              <option value="">Select type</option>
              {IMAGING_TYPES.map((t) => (
                <option key={t} value={t}>{IMAGING_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body Part</label>
            <input
              type="text"
              value={bodyPart}
              onChange={(e) => setBodyPart(e.target.value)}
              placeholder="e.g. Chest, Left Knee, Abdomen"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Indication</label>
            <textarea
              value={clinicalIndication}
              onChange={(e) => setClinicalIndication(e.target.value)}
              rows={3}
              placeholder="Reason for imaging request"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (KES)</label>
            <input
              type="number"
              value={price || ''}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className={inputCls}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || !imagingType || !bodyPart}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
