import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, AlertTriangle, Pill, ClipboardList, FileText, X, Pencil, RotateCcw, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { pharmacyApi, patientApi, visitApi, refundApi } from '../../api/services';
import { useAuthStore } from '../../store/authStore';
import type { Drug, Prescription, Patient, Visit, Refund } from '../../types';

type Tab = 'inventory' | 'prescriptions' | 'refunds';

const DRUG_CATEGORIES = [
  'Analgesics', 'Antacids', 'Antiarrhythmics', 'Anticoagulants', 'Antidepressants',
  'Antidiabetics', 'Anti Diuretic', 'Anti Epileptic', 'Antifungals', 'Antihelminthics',
  'Antihistamines', 'Antihyperlipidemics', 'Antihypertensives', 'Anti Hypertensive',
  'Anti Malarials', 'Antiparasitics', 'Anti Pyretic', 'Antipsychotics', 'Anti Scabies',
  'Antibiotics', 'Anti Asthmatic', 'Antiviral', 'Bronchodilators', 'Cannabinoids',
  'Decongestants', 'Dissociatives', 'Erectile Dysfunction Drugs', 'Hallucinogens',
  'Muscle Relaxants', 'Opioids/Narcotics', 'Painkillers', 'Sedatives',
  'Steroid Inhaler', 'Stimulants', 'Vitamins', 'Other',
];
const FORMULATIONS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Drops', 'Inhaler', 'Suspension'];
const FREQUENCIES = ['Once daily', 'Twice daily', '3 times daily', '4 times daily', 'Every 4 hours', 'Every 6 hours', 'Every 8 hours', 'Every 12 hours', 'As needed', 'At bedtime'];
const DURATIONS = ['1 day', '3 days', '5 days', '7 days', '10 days', '14 days', '21 days', '30 days', '60 days', '90 days'];

const emptyDrug: Partial<Drug> = {
  genericName: '', brandName: '', category: '', formulation: '', strength: '',
  quantityInStock: 0, reorderLevel: 10, batchNumber: '', expiryDate: '',
  supplier: '', costPrice: 0, sellingPrice: 0,
};

export default function PharmacyPage() {
  const { role } = useAuthStore();
  const isAdmin = role === 'SUPER_ADMIN' || role === 'HOSPITAL_ADMIN';
  const [tab, setTab] = useState<Tab>('inventory');
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Drug>>(emptyDrug);
  const [saving, setSaving] = useState(false);
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [rxLoading, setRxLoading] = useState(false);
  const [rxView, setRxView] = useState<'pending' | 'dispensed'>('pending');
  const [dispensing, setDispensing] = useState<number | null>(null);
  const [lowStock, setLowStock] = useState<Drug[]>([]);

  // Refunds
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundPage, setRefundPage] = useState(0);
  const [refundTotalPages, setRefundTotalPages] = useState(1);
  const [refundFilterStatus, setRefundFilterStatus] = useState('ALL');
  const [refundModal, setRefundModal] = useState(false);
  const [refundRx, setRefundRx] = useState<Prescription | null>(null);
  const [refundForm, setRefundForm] = useState({ quantityReturned: 1, reason: '', notes: '' });
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [processingRefund, setProcessingRefund] = useState<number | null>(null);
  const [approveModal, setApproveModal] = useState(false);
  const [approveRefund, setApproveRefundState] = useState<Refund | null>(null);
  const [approveForm, setApproveForm] = useState({ refundMethod: 'CASH', referenceNumber: '' });

  const [deletingRx, setDeletingRx] = useState<number | null>(null);

  // Prescribe modal
  const [prescribeModal, setPrescribeModal] = useState(false);
  const [prescribeDrug, setPrescribeDrug] = useState<Drug | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientVisits, setPatientVisits] = useState<Visit[]>([]);
  const [showPatientDD, setShowPatientDD] = useState(false);
  const [searchingPatient, setSearchingPatient] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [rxForm, setRxForm] = useState({
    visitId: '', dosage: '', frequency: '', duration: '', quantityPrescribed: 1, instructions: '',
  });
  const [prescribing, setPrescribing] = useState(false);

  const fetchDrugs = useCallback(async () => {
    setLoading(true);
    try {
      const res = search ? await pharmacyApi.searchDrugs(search, page) : await pharmacyApi.getDrugs(page);
      setDrugs(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch { /* handled */ } finally { setLoading(false); }
  }, [page, search]);

  const fetchPrescriptions = useCallback(async () => {
    setRxLoading(true);
    try {
      const res = rxView === 'pending'
        ? await pharmacyApi.getPendingRx()
        : await pharmacyApi.getDispensedRx();
      setPrescriptions(res.data.data);
    } catch { /* handled */ } finally { setRxLoading(false); }
  }, [rxView]);

  const fetchLowStock = useCallback(async () => {
    try { const res = await pharmacyApi.getLowStock(); setLowStock(res.data.data); }
    catch { /* handled */ }
  }, []);

  const fetchRefunds = useCallback(async () => {
    setRefundLoading(true);
    try {
      const res = refundFilterStatus === 'ALL'
        ? await refundApi.getAll(refundPage)
        : await refundApi.getByStatus(refundFilterStatus, refundPage);
      setRefunds(res.data.data.content);
      setRefundTotalPages(res.data.data.totalPages);
    } catch { /* handled */ } finally { setRefundLoading(false); }
  }, [refundPage, refundFilterStatus]);

  useEffect(() => {
    if (tab === 'inventory') fetchDrugs();
    else if (tab === 'prescriptions') fetchPrescriptions();
    else fetchRefunds();
  }, [tab, fetchDrugs, fetchPrescriptions, fetchRefunds]);

  useEffect(() => { fetchLowStock(); }, [fetchLowStock]);
  useEffect(() => { const t = setTimeout(() => setPage(0), 300); return () => clearTimeout(t); }, [search]);

  const handleAddDrug = async () => {
    setSaving(true);
    try { await pharmacyApi.createDrug(form); setAddModalOpen(false); setForm(emptyDrug); fetchDrugs(); fetchLowStock(); }
    catch { /* handled */ } finally { setSaving(false); }
  };

  const openEditModal = (drug: Drug) => {
    setEditingDrug(drug);
    setForm({
      genericName: drug.genericName, brandName: drug.brandName, category: drug.category,
      formulation: drug.formulation, strength: drug.strength, quantityInStock: drug.quantityInStock,
      reorderLevel: drug.reorderLevel, batchNumber: drug.batchNumber, expiryDate: drug.expiryDate || '',
      supplier: drug.supplier || '', costPrice: drug.costPrice, sellingPrice: drug.sellingPrice,
    });
    setEditModalOpen(true);
  };

  const handleEditDrug = async () => {
    if (!editingDrug) return;
    setSaving(true);
    try {
      await pharmacyApi.updateDrug(editingDrug.id, form);
      setEditModalOpen(false); setEditingDrug(null); setForm(emptyDrug); fetchDrugs(); fetchLowStock();
    } catch { /* handled */ } finally { setSaving(false); }
  };

  const handleDispense = async (rx: Prescription) => {
    setDispensing(rx.id);
    try {
      const pharmacistId = Number(localStorage.getItem('userId') || 0);
      await pharmacyApi.dispense(rx.id, pharmacistId);
      fetchPrescriptions(); fetchLowStock();
    } catch { /* handled */ } finally { setDispensing(null); }
  };

  const handleDeleteRx = async (rx: Prescription) => {
    if (!window.confirm(`Delete prescription for ${rx.drugName} (${rx.patientName})?`)) return;
    setDeletingRx(rx.id);
    try {
      await pharmacyApi.deleteRx(rx.id);
      fetchPrescriptions();
    } catch { /* handled */ } finally { setDeletingRx(null); }
  };

  // Patient search
  const handlePatientSearch = (query: string) => {
    setPatientSearch(query);
    setSelectedPatient(null);
    setPatientVisits([]);
    setRxForm((p) => ({ ...p, visitId: '' }));
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (query.length < 2) { setPatientResults([]); setShowPatientDD(false); return; }
    setSearchingPatient(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await patientApi.search(query, 0);
        setPatientResults(res.data.data.content);
        setShowPatientDD(true);
      } catch { /* handled */ } finally { setSearchingPatient(false); }
    }, 300);
  };

  const selectPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearch(`${patient.fullName} (${patient.patientNo})`);
    setShowPatientDD(false);
    // Load patient's visits
    try {
      const res = await visitApi.getByPatient(patient.id, 0);
      setPatientVisits(res.data.data.content);
    } catch { /* handled */ }
  };

  const openPrescribeModal = (drug: Drug) => {
    setPrescribeDrug(drug);
    setSelectedPatient(null);
    setPatientSearch('');
    setPatientResults([]);
    setPatientVisits([]);
    setRxForm({ visitId: '', dosage: '', frequency: '', duration: '', quantityPrescribed: 1, instructions: '' });
    setPrescribeModal(true);
  };

  const handlePrescribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescribeDrug || !rxForm.visitId) return;
    setPrescribing(true);
    try {
      await pharmacyApi.createPrescription({
        visitId: Number(rxForm.visitId),
        drugId: prescribeDrug.id,
        dosage: rxForm.dosage,
        frequency: rxForm.frequency,
        duration: rxForm.duration,
        quantityPrescribed: rxForm.quantityPrescribed,
        instructions: rxForm.instructions,
      });
      setPrescribeModal(false);
      fetchPrescriptions();
    } catch { /* handled */ } finally { setPrescribing(false); }
  };

  const openRefundModal = (rx: Prescription) => {
    setRefundRx(rx);
    setRefundForm({ quantityReturned: 1, reason: '', notes: '' });
    setRefundModal(true);
  };

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundRx) return;
    setSubmittingRefund(true);
    try {
      await refundApi.create({
        prescriptionId: refundRx.id,
        quantityReturned: refundForm.quantityReturned,
        reason: refundForm.reason,
        notes: refundForm.notes,
      });
      setRefundModal(false);
      if (tab === 'refunds') fetchRefunds();
    } catch { /* handled */ } finally { setSubmittingRefund(false); }
  };

  const openApproveModal = (refund: Refund) => {
    setApproveRefundState(refund);
    setApproveForm({ refundMethod: 'CASH', referenceNumber: '' });
    setApproveModal(true);
  };

  const handleApproveRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveRefund) return;
    setProcessingRefund(approveRefund.id);
    try {
      const userId = localStorage.getItem('userId') || '0';
      await refundApi.approve(approveRefund.id, { processedById: userId, ...approveForm });
      setApproveModal(false);
      fetchRefunds(); fetchLowStock();
    } catch { /* handled */ } finally { setProcessingRefund(null); }
  };

  const handleRejectRefund = async (refundId: number) => {
    setProcessingRefund(refundId);
    try {
      const userId = localStorage.getItem('userId') || '0';
      await refundApi.reject(refundId, { processedById: userId });
      fetchRefunds();
    } catch { /* handled */ } finally { setProcessingRefund(null); }
  };

  const updateForm = (field: string, value: string | number) => setForm((prev) => ({ ...prev, [field]: value }));
  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  const drugColumns = [
    { key: 'genericName', label: 'Generic Name' },
    { key: 'brandName', label: 'Brand Name' },
    { key: 'category', label: 'Category' },
    { key: 'formulation', label: 'Form / Strength', render: (d: Drug) => `${d.formulation} ${d.strength}` },
    {
      key: 'quantityInStock', label: 'Stock',
      render: (d: Drug) => <span className={d.quantityInStock <= d.reorderLevel ? 'text-red-600 font-semibold' : ''}>{d.quantityInStock}</span>,
    },
    { key: 'expiryDate', label: 'Expiry', render: (d: Drug) => d.expiryDate ? new Date(d.expiryDate).toLocaleDateString() : '-' },
    { key: 'sellingPrice', label: 'Price', render: (d: Drug) => `KES ${(d.sellingPrice || 0).toLocaleString()}` },
    {
      key: 'actions', label: 'Action',
      render: (d: Drug) => (
        <div className="flex gap-2">
          {isAdmin && (
            <button onClick={(e) => { e.stopPropagation(); openEditModal(d); }}
              className="p-1.5 text-gray-400 hover:text-blue-600" title="Edit Drug">
              <Pencil className="w-4 h-4" />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); openPrescribeModal(d); }}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700">
            Prescribe
          </button>
        </div>
      ),
    },
  ];

  const rxColumns = [
    {
      key: 'patientName', label: 'Patient',
      render: (rx: Prescription) => (
        <div>
          <div className="font-medium text-gray-900">{rx.patientName || '—'}</div>
          <div className="text-xs text-gray-500">{rx.patientNo || ''}</div>
        </div>
      ),
    },
    { key: 'drugName', label: 'Drug' },
    { key: 'dosage', label: 'Dosage' },
    { key: 'frequency', label: 'Frequency' },
    { key: 'duration', label: 'Duration' },
    { key: 'quantityPrescribed', label: 'Qty' },
    { key: 'instructions', label: 'Instructions' },
    { key: 'createdAt', label: 'Ordered', render: (rx: Prescription) => new Date(rx.createdAt).toLocaleString() },
    {
      key: 'actions', label: 'Action',
      render: (rx: Prescription) => (
        <div className="flex gap-2">
          {!rx.dispensed ? (
            <button onClick={(e) => { e.stopPropagation(); handleDispense(rx); }} disabled={dispensing === rx.id}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
              {dispensing === rx.id ? 'Dispensing...' : 'Dispense'}
            </button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); openRefundModal(rx); }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-orange-500 text-white hover:bg-orange-600">
              <RotateCcw className="w-3 h-3" /> Refund
            </button>
          )}
          {isAdmin && !rx.dispensed && (
            <button onClick={(e) => { e.stopPropagation(); handleDeleteRx(rx); }} disabled={deletingRx === rx.id}
              className="p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-50" title="Delete prescription">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const refundStatusColor: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    PROCESSED: 'bg-emerald-100 text-emerald-800',
    REJECTED: 'bg-red-100 text-red-800',
  };

  const refundColumns = [
    { key: 'refundNumber', label: 'Ref #' },
    {
      key: 'patient', label: 'Patient',
      render: (r: Refund) => (
        <div>
          <div className="font-medium text-gray-900">{r.patientName}</div>
          <div className="text-xs text-gray-500">{r.patientNo}</div>
        </div>
      ),
    },
    { key: 'drugName', label: 'Drug' },
    { key: 'quantityReturned', label: 'Qty Returned' },
    { key: 'refundAmount', label: 'Amount', render: (r: Refund) => `KES ${(r.refundAmount || 0).toLocaleString()}` },
    { key: 'reason', label: 'Reason' },
    {
      key: 'status', label: 'Status',
      render: (r: Refund) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${refundStatusColor[r.status] || 'bg-gray-100 text-gray-800'}`}>
          {r.status}
        </span>
      ),
    },
    { key: 'createdAt', label: 'Date', render: (r: Refund) => new Date(r.createdAt).toLocaleDateString() },
    {
      key: 'actions', label: 'Action',
      render: (r: Refund) => r.status === 'PENDING' ? (
        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); openApproveModal(r); }}
            disabled={processingRefund === r.id}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
            <CheckCircle className="w-3.5 h-3.5" /> Approve
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleRejectRefund(r.id); }}
            disabled={processingRefund === r.id}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
            <XCircle className="w-3.5 h-3.5" /> Reject
          </button>
        </div>
      ) : (
        <span className="text-xs text-gray-400">{r.processedByName || '—'}</span>
      ),
    },
  ];

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'inventory', label: 'Drug Inventory', icon: <Pill className="w-4 h-4" /> },
    { key: 'prescriptions', label: 'Pending Prescriptions', icon: <ClipboardList className="w-4 h-4" /> },
    { key: 'refunds', label: 'Refunds', icon: <RotateCcw className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pharmacy</h1>
        {tab === 'inventory' && isAdmin && (
          <button onClick={() => { setForm(emptyDrug); setAddModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Add Drug
          </button>
        )}
      </div>

      {lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-800">Low Stock Alert ({lowStock.length} items)</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((d) => (
              <span key={d.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                {d.genericName} ({d.brandName}) &mdash; {d.quantityInStock} left
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>{t.icon} {t.label}</button>
        ))}
      </div>

      {tab === 'inventory' && (
        <>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search drugs..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <DataTable columns={drugColumns} data={drugs} page={page} totalPages={totalPages} onPageChange={setPage} loading={loading} />
        </>
      )}

      {tab === 'prescriptions' && (
        <>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
            {(['pending', 'dispensed'] as const).map((v) => (
              <button key={v} onClick={() => setRxView(v)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  rxView === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {v === 'pending' ? 'Pending' : 'Dispensed'}
              </button>
            ))}
          </div>
          <DataTable columns={rxColumns} data={prescriptions} loading={rxLoading} />
        </>
      )}

      {tab === 'refunds' && (
        <>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Filter by status:</label>
            <select value={refundFilterStatus} onChange={(e) => { setRefundFilterStatus(e.target.value); setRefundPage(0); }}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="ALL">All</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSED">Processed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <DataTable columns={refundColumns} data={refunds} page={refundPage} totalPages={refundTotalPages}
            onPageChange={setRefundPage} loading={refundLoading} />
        </>
      )}

      {/* Add Drug Modal */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Drug" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Generic Name</label>
            <input type="text" value={form.genericName || ''} onChange={(e) => updateForm('genericName', e.target.value)} className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
            <input type="text" value={form.brandName || ''} onChange={(e) => updateForm('brandName', e.target.value)} className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.category || ''} onChange={(e) => updateForm('category', e.target.value)} className={inputClass}>
              <option value="">Select category</option>{DRUG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Formulation</label>
            <select value={form.formulation || ''} onChange={(e) => updateForm('formulation', e.target.value)} className={inputClass}>
              <option value="">Select formulation</option>{FORMULATIONS.map((f) => <option key={f} value={f}>{f}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Strength</label>
            <input type="text" value={form.strength || ''} onChange={(e) => updateForm('strength', e.target.value)} placeholder="e.g. 500mg" className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Quantity in Stock</label>
            <input type="number" value={form.quantityInStock || 0} onChange={(e) => updateForm('quantityInStock', parseInt(e.target.value) || 0)} className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
            <input type="number" value={form.reorderLevel || 0} onChange={(e) => updateForm('reorderLevel', parseInt(e.target.value) || 0)} className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
            <input type="text" value={form.batchNumber || ''} onChange={(e) => updateForm('batchNumber', e.target.value)} className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
            <input type="date" value={form.expiryDate || ''} onChange={(e) => updateForm('expiryDate', e.target.value)} className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <input type="text" value={form.supplier || ''} onChange={(e) => updateForm('supplier', e.target.value)} className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (KES)</label>
            <input type="number" value={form.costPrice || 0} onChange={(e) => updateForm('costPrice', parseFloat(e.target.value) || 0)} className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (KES)</label>
            <input type="number" value={form.sellingPrice || 0} onChange={(e) => updateForm('sellingPrice', parseFloat(e.target.value) || 0)} className={inputClass} /></div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={handleAddDrug} disabled={saving || !form.genericName || !form.category}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Add Drug'}</button>
        </div>
      </Modal>

      {/* Edit Drug Modal */}
      <Modal open={editModalOpen} onClose={() => { setEditModalOpen(false); setEditingDrug(null); }} title="Edit Drug" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Generic Name</label>
            <input type="text" value={form.genericName || ''} onChange={(e) => updateForm('genericName', e.target.value)} className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
            <input type="text" value={form.brandName || ''} onChange={(e) => updateForm('brandName', e.target.value)} className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.category || ''} onChange={(e) => updateForm('category', e.target.value)} className={inputClass}>
              <option value="">Select category</option>{DRUG_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Formulation</label>
            <select value={form.formulation || ''} onChange={(e) => updateForm('formulation', e.target.value)} className={inputClass}>
              <option value="">Select formulation</option>{FORMULATIONS.map((f) => <option key={f} value={f}>{f}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Strength</label>
            <input type="text" value={form.strength || ''} onChange={(e) => updateForm('strength', e.target.value)} placeholder="e.g. 500mg" className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Quantity in Stock</label>
            <input type="number" value={form.quantityInStock || 0} onChange={(e) => updateForm('quantityInStock', parseInt(e.target.value) || 0)} className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
            <input type="number" value={form.reorderLevel || 0} onChange={(e) => updateForm('reorderLevel', parseInt(e.target.value) || 0)} className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
            <input type="text" value={form.batchNumber || ''} onChange={(e) => updateForm('batchNumber', e.target.value)} className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
            <input type="date" value={form.expiryDate || ''} onChange={(e) => updateForm('expiryDate', e.target.value)} className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <input type="text" value={form.supplier || ''} onChange={(e) => updateForm('supplier', e.target.value)} className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (KES)</label>
            <input type="number" value={form.costPrice || 0} onChange={(e) => updateForm('costPrice', parseFloat(e.target.value) || 0)} className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (KES)</label>
            <input type="number" value={form.sellingPrice || 0} onChange={(e) => updateForm('sellingPrice', parseFloat(e.target.value) || 0)} className={inputClass} /></div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => { setEditModalOpen(false); setEditingDrug(null); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={handleEditDrug} disabled={saving || !form.genericName || !form.category}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Update Drug'}</button>
        </div>
      </Modal>

      {/* Prescribe Modal */}
      <Modal open={prescribeModal} onClose={() => setPrescribeModal(false)}
        title={prescribeDrug ? `Prescribe ${prescribeDrug.genericName} (${prescribeDrug.formulation} ${prescribeDrug.strength})` : 'Prescribe Drug'}
        size="lg">
        <form onSubmit={handlePrescribe} className="space-y-4">
          {/* Drug info */}
          {prescribeDrug && (
            <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">{prescribeDrug.genericName} ({prescribeDrug.brandName})</p>
                <p className="text-xs text-blue-700">{prescribeDrug.formulation} {prescribeDrug.strength} | Stock: {prescribeDrug.quantityInStock} | KES {(prescribeDrug.sellingPrice || 0).toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Patient search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={patientSearch} onChange={(e) => handlePatientSearch(e.target.value)}
                onFocus={() => patientResults.length > 0 && !selectedPatient && setShowPatientDD(true)}
                placeholder="Search by name, phone, or patient number..."
                className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {selectedPatient && (
                <button type="button" onClick={() => { setSelectedPatient(null); setPatientSearch(''); setPatientResults([]); setPatientVisits([]); setRxForm((p) => ({ ...p, visitId: '' })); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              )}
            </div>
            {searchingPatient && <p className="text-xs text-gray-400 mt-1">Searching...</p>}
            {showPatientDD && patientResults.length > 0 && !selectedPatient && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {patientResults.map((p) => (
                  <button key={p.id} type="button" onClick={() => selectPatient(p)}
                    className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0">
                    <div className="font-medium text-sm text-gray-900">{p.fullName}</div>
                    <div className="text-xs text-gray-500">{p.patientNo} {p.phone ? `| ${p.phone}` : ''}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Visit selection */}
          {selectedPatient && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visit *</label>
              {patientVisits.length > 0 ? (
                <select value={rxForm.visitId} onChange={(e) => setRxForm((p) => ({ ...p, visitId: e.target.value }))} className={inputClass} required>
                  <option value="">Select a visit</option>
                  {patientVisits.map((v) => (
                    <option key={v.id} value={v.id}>Visit #{v.id} - {new Date(v.createdAt).toLocaleDateString()} ({v.completed ? 'Completed' : 'In Progress'})</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-amber-600">No visits found for this patient. Create a visit first.</p>
              )}
            </div>
          )}

          {/* Prescription details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dosage *</label>
              <input type="text" value={rxForm.dosage} onChange={(e) => setRxForm((p) => ({ ...p, dosage: e.target.value }))}
                placeholder="e.g. 1 tablet, 5ml, 2 capsules" className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency *</label>
              <select value={rxForm.frequency} onChange={(e) => setRxForm((p) => ({ ...p, frequency: e.target.value }))} className={inputClass} required>
                <option value="">Select frequency</option>
                {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration *</label>
              <select value={rxForm.duration} onChange={(e) => setRxForm((p) => ({ ...p, duration: e.target.value }))} className={inputClass} required>
                <option value="">Select duration</option>
                {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <input type="number" min={1} value={rxForm.quantityPrescribed}
                onChange={(e) => setRxForm((p) => ({ ...p, quantityPrescribed: Number(e.target.value) || 1 }))}
                className={inputClass} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
            <textarea value={rxForm.instructions} onChange={(e) => setRxForm((p) => ({ ...p, instructions: e.target.value }))}
              rows={2} placeholder="e.g. Take after meals, avoid alcohol" className={inputClass} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setPrescribeModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit"
              disabled={prescribing || !selectedPatient || !rxForm.visitId || !rxForm.dosage || !rxForm.frequency || !rxForm.duration}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {prescribing ? 'Prescribing...' : 'Create Prescription'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Request Refund Modal */}
      <Modal open={refundModal} onClose={() => setRefundModal(false)}
        title={refundRx ? `Refund: ${refundRx.drugName}` : 'Request Refund'} size="md">
        <form onSubmit={handleSubmitRefund} className="space-y-4">
          {refundRx && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-orange-900">{refundRx.drugName}</p>
              <p className="text-orange-700">Dispensed: {refundRx.quantityDispensed} | Patient: {refundRx.patientName}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Return *</label>
            <input type="number" min={1} max={refundRx?.quantityDispensed || 1}
              value={refundForm.quantityReturned}
              onChange={(e) => setRefundForm((p) => ({ ...p, quantityReturned: Number(e.target.value) || 1 }))}
              className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
            <input type="text" value={refundForm.reason}
              onChange={(e) => setRefundForm((p) => ({ ...p, reason: e.target.value }))}
              placeholder="e.g. Wrong medication, patient adverse reaction"
              className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={refundForm.notes}
              onChange={(e) => setRefundForm((p) => ({ ...p, notes: e.target.value }))}
              rows={2} className={inputClass} placeholder="Additional notes..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setRefundModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={submittingRefund || !refundForm.reason}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50">
              {submittingRefund ? 'Submitting...' : 'Submit Refund Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Approve Refund Modal */}
      <Modal open={approveModal} onClose={() => setApproveModal(false)} title="Process Refund" size="md">
        <form onSubmit={handleApproveRefund} className="space-y-4">
          {approveRefund && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-emerald-900">{approveRefund.drugName}</p>
              <p className="text-emerald-700">
                Patient: {approveRefund.patientName} | Qty Returned: {approveRefund.quantityReturned}
              </p>
              <p className="text-emerald-700 font-semibold">
                Refund Amount: KES {(approveRefund.refundAmount || 0).toLocaleString()}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Refund Method *</label>
            <select value={approveForm.refundMethod}
              onChange={(e) => setApproveForm((p) => ({ ...p, refundMethod: e.target.value }))}
              className={inputClass} required>
              {['CASH', 'MPESA', 'CARD', 'BANK_TRANSFER'].map((m) => (
                <option key={m} value={m}>{m.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
            <input type="text" value={approveForm.referenceNumber}
              onChange={(e) => setApproveForm((p) => ({ ...p, referenceNumber: e.target.value }))}
              placeholder="M-Pesa code, receipt no., etc."
              className={inputClass} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setApproveModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={processingRefund === approveRefund?.id}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {processingRefund === approveRefund?.id ? 'Processing...' : 'Approve & Process'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
