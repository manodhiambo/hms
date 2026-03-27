import { useState, useEffect, useCallback } from 'react';
import { Plus, FlaskConical, ListOrdered, Pencil, Search, X } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { labApi, patientApi, visitApi } from '../../api/services';
import type { LabTest, LabOrder, LabOrderStatus, Visit } from '../../types';

type Tab = 'orders' | 'catalog';

const ORDER_STATUSES: LabOrderStatus[] = ['ORDERED', 'SAMPLE_COLLECTED', 'PROCESSING', 'COMPLETED', 'VERIFIED', 'RELEASED'];
const TEST_CATEGORIES = ['Hematology', 'Biochemistry', 'Microbiology', 'Immunology', 'Urinalysis', 'Parasitology', 'Serology', 'Other'];
const SAMPLE_TYPES = ['Blood', 'Urine', 'Stool', 'Sputum', 'Swab', 'CSF', 'Tissue', 'Other'];

const emptyTest: Partial<LabTest> = {
  testName: '', testCode: '', category: '', sampleType: '', price: 0, referenceRange: '', unit: '',
};

export default function LabPage() {
  const [tab, setTab] = useState<Tab>('orders');

  // Orders state
  const [statusFilter, setStatusFilter] = useState<LabOrderStatus>('ORDERED');
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [ordersPage, setOrdersPage] = useState(0);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Patient search for orders queue
  const [orderSearch, setOrderSearch] = useState('');

  // New order modal
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({ visitId: '', testId: '' });
  const [orderSaving, setOrderSaving] = useState(false);
  // Patient search within new order modal
  const [modalPatientSearch, setModalPatientSearch] = useState('');
  const [modalPatients, setModalPatients] = useState<{ id: number; fullName: string; patientNo: string }[]>([]);
  const [modalVisits, setModalVisits] = useState<Visit[]>([]);

  // Process result modal
  const [processModal, setProcessModal] = useState<LabOrder | null>(null);
  const [resultForm, setResultForm] = useState({ result: '', abnormal: false, remarks: '' });

  // Catalog state
  const [tests, setTests] = useState<LabTest[]>([]);
  const [testsLoading, setTestsLoading] = useState(false);
  const [addTestModal, setAddTestModal] = useState(false);
  const [editTest, setEditTest] = useState<LabTest | null>(null);
  const [testForm, setTestForm] = useState<Partial<LabTest>>(emptyTest);
  const [saving, setSaving] = useState(false);

  // Fetch orders (with optional patient search)
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const q = orderSearch.trim();
      const res = q.length >= 2
        ? await labApi.searchOrders(statusFilter, q, ordersPage)
        : await labApi.getOrdersByStatus(statusFilter, ordersPage);
      setOrders(res.data.data.content);
      setOrdersTotalPages(res.data.data.totalPages);
    } catch { /* handled */ } finally { setOrdersLoading(false); }
  }, [statusFilter, ordersPage, orderSearch]);

  // Fetch tests
  const fetchTests = useCallback(async () => {
    setTestsLoading(true);
    try {
      const res = await labApi.getTests();
      setTests(res.data.data);
    } catch { /* handled */ } finally { setTestsLoading(false); }
  }, []);

  useEffect(() => {
    fetchTests(); // always load tests for the order modal dropdown
    if (tab === 'orders') fetchOrders();
  }, [tab, fetchOrders, fetchTests]);

  useEffect(() => { setOrdersPage(0); }, [statusFilter, orderSearch]);

  // Patient search in new order modal
  useEffect(() => {
    const q = modalPatientSearch.trim();
    if (q.length < 2) { setModalPatients([]); setModalVisits([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await patientApi.search(q);
        setModalPatients(res.data.data.content.map(p => ({ id: p.id, fullName: p.fullName, patientNo: p.patientNo })));
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [modalPatientSearch]);

  const selectModalPatient = async (patientId: number, displayName: string) => {
    setModalPatientSearch(displayName);
    setModalPatients([]);
    setOrderForm(p => ({ ...p, visitId: '' }));
    try {
      const res = await visitApi.getByPatient(patientId);
      setModalVisits(res.data.data.content);
    } catch { setModalVisits([]); }
  };

  // Create order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderSaving(true);
    try {
      const orderedById = Number(localStorage.getItem('userId') || 0);
      await labApi.createOrder(Number(orderForm.visitId), Number(orderForm.testId), orderedById);
      setShowOrderModal(false);
      setOrderForm({ visitId: '', testId: '' });
      fetchOrders();
    } catch { /* handled */ } finally { setOrderSaving(false); }
  };

  // Order actions
  const handleCollectSample = async (order: LabOrder) => {
    setActionLoading(order.id);
    try { await labApi.collectSample(order.id); fetchOrders(); } catch { /* handled */ } finally { setActionLoading(null); }
  };

  const handleOpenProcess = (order: LabOrder) => {
    setProcessModal(order);
    setResultForm({ result: '', abnormal: false, remarks: '' });
  };

  const handleProcessResult = async () => {
    if (!processModal) return;
    setActionLoading(processModal.id);
    try {
      const processedById = Number(localStorage.getItem('userId') || 0);
      await labApi.processResult(processModal.id, { ...resultForm, processedById });
      setProcessModal(null);
      fetchOrders();
    } catch { /* handled */ } finally { setActionLoading(null); }
  };

  const handleVerify = async (order: LabOrder) => {
    setActionLoading(order.id);
    try {
      const verifiedById = Number(localStorage.getItem('userId') || 0);
      await labApi.verify(order.id, verifiedById);
      fetchOrders();
    } catch { /* handled */ } finally { setActionLoading(null); }
  };

  const handleRelease = async (order: LabOrder) => {
    setActionLoading(order.id);
    try { await labApi.release(order.id); fetchOrders(); } catch { /* handled */ } finally { setActionLoading(null); }
  };

  // Test CRUD
  const handleAddTest = async () => {
    setSaving(true);
    try {
      await labApi.createTest(testForm);
      setAddTestModal(false);
      setTestForm(emptyTest);
      fetchTests();
    } catch { /* handled */ } finally { setSaving(false); }
  };

  const handleEditTest = async () => {
    if (!editTest) return;
    setSaving(true);
    try {
      await labApi.updateTest(editTest.id, testForm);
      setEditTest(null);
      setTestForm(emptyTest);
      fetchTests();
    } catch { /* handled */ } finally { setSaving(false); }
  };

  const openEditTest = (test: LabTest) => {
    setEditTest(test);
    setTestForm({
      testName: test.testName, testCode: test.testCode, category: test.category,
      sampleType: test.sampleType, price: test.price, referenceRange: test.referenceRange,
      unit: test.unit, active: test.active,
    });
  };

  const openOrderFromTest = (test: LabTest) => {
    setOrderForm({ visitId: '', testId: String(test.id) });
    setModalPatientSearch('');
    setModalPatients([]);
    setModalVisits([]);
    setShowOrderModal(true);
  };

  const openNewOrderModal = () => {
    setOrderForm({ visitId: '', testId: '' });
    setModalPatientSearch('');
    setModalPatients([]);
    setModalVisits([]);
    setShowOrderModal(true);
  };

  const getActionButton = (order: LabOrder) => {
    const isLoading = actionLoading === order.id;
    const base = 'px-3 py-1.5 text-xs font-medium rounded-lg text-white disabled:opacity-50';
    switch (order.status) {
      case 'ORDERED':
        return <button onClick={() => handleCollectSample(order)} disabled={isLoading} className={`${base} bg-indigo-600 hover:bg-indigo-700`}>{isLoading ? 'Collecting...' : 'Collect Sample'}</button>;
      case 'SAMPLE_COLLECTED':
        return <button onClick={() => handleOpenProcess(order)} disabled={isLoading} className={`${base} bg-purple-600 hover:bg-purple-700`}>Process</button>;
      case 'COMPLETED':
        return <button onClick={() => handleVerify(order)} disabled={isLoading} className={`${base} bg-teal-600 hover:bg-teal-700`}>{isLoading ? 'Verifying...' : 'Verify'}</button>;
      case 'VERIFIED':
        return <button onClick={() => handleRelease(order)} disabled={isLoading} className={`${base} bg-green-600 hover:bg-green-700`}>{isLoading ? 'Releasing...' : 'Release'}</button>;
      default: return null;
    }
  };

  const orderColumns = [
    {
      key: 'patientName', label: 'Patient',
      render: (o: LabOrder) => (
        <div>
          <div className="font-medium text-gray-900">{o.patientName || '—'}</div>
          <div className="text-xs text-gray-500">{o.patientNo || ''}</div>
        </div>
      ),
    },
    { key: 'testName', label: 'Test' },
    { key: 'testCode', label: 'Code' },
    { key: 'category', label: 'Category' },
    { key: 'orderedByName', label: 'Ordered By' },
    { key: 'status', label: 'Status', render: (o: LabOrder) => <StatusBadge status={o.status} /> },
    { key: 'result', label: 'Result', render: (o: LabOrder) => o.result ? <span className={o.abnormal ? 'text-red-600 font-semibold' : ''}>{o.result} {o.abnormal && '(Abnormal)'}</span> : <span className="text-gray-400">--</span> },
    { key: 'createdAt', label: 'Ordered At', render: (o: LabOrder) => new Date(o.createdAt).toLocaleString() },
    { key: 'actions', label: 'Action', render: (o: LabOrder) => getActionButton(o) },
  ];

  const testColumns = [
    { key: 'testName', label: 'Test Name' },
    { key: 'testCode', label: 'Code' },
    { key: 'category', label: 'Category' },
    { key: 'sampleType', label: 'Sample Type' },
    { key: 'price', label: 'Price', render: (t: LabTest) => `KES ${t.price.toLocaleString()}` },
    { key: 'referenceRange', label: 'Ref. Range' },
    { key: 'unit', label: 'Unit' },
    {
      key: 'active', label: 'Status',
      render: (t: LabTest) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {t.active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions',
      render: (t: LabTest) => (
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); openOrderFromTest(t); }}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700">
            Order
          </button>
          <button onClick={(e) => { e.stopPropagation(); openEditTest(t); }}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'orders', label: 'Orders Queue', icon: <ListOrdered className="w-4 h-4" /> },
    { key: 'catalog', label: 'Test Catalog', icon: <FlaskConical className="w-4 h-4" /> },
  ];

  const testFormFields = (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
          <input type="text" value={testForm.testName || ''} onChange={(e) => setTestForm((p) => ({ ...p, testName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Test Code</label>
          <input type="text" value={testForm.testCode || ''} onChange={(e) => setTestForm((p) => ({ ...p, testCode: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select value={testForm.category || ''} onChange={(e) => setTestForm((p) => ({ ...p, category: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select category</option>
            {TEST_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sample Type</label>
          <select value={testForm.sampleType || ''} onChange={(e) => setTestForm((p) => ({ ...p, sampleType: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select sample type</option>
            {SAMPLE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (KES)</label>
          <input type="number" value={testForm.price || 0} onChange={(e) => setTestForm((p) => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
          <input type="text" value={testForm.unit || ''} onChange={(e) => setTestForm((p) => ({ ...p, unit: e.target.value }))}
            placeholder="e.g. mg/dL, mmol/L" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Reference Range</label>
          <input type="text" value={testForm.referenceRange || ''} onChange={(e) => setTestForm((p) => ({ ...p, referenceRange: e.target.value }))}
            placeholder="e.g. 70-100 mg/dL" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Laboratory</h1>
        <div className="flex items-center gap-2">
          {tab === 'orders' && (
            <button onClick={openNewOrderModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> New Order
            </button>
          )}
          {tab === 'catalog' && (
            <button onClick={() => { setTestForm(emptyTest); setAddTestModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Test
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Orders Queue Tab */}
      {tab === 'orders' && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {ORDER_STATUSES.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>
                {s.replace(/_/g, ' ')}
              </button>
            ))}
            <div className="relative ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search patient..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="pl-9 pr-8 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
              />
              {orderSearch && (
                <button onClick={() => setOrderSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <DataTable columns={orderColumns} data={orders} page={ordersPage} totalPages={ordersTotalPages} onPageChange={setOrdersPage} loading={ordersLoading} />
        </>
      )}

      {/* Test Catalog Tab */}
      {tab === 'catalog' && (
        <DataTable columns={testColumns} data={tests} loading={testsLoading} />
      )}

      {/* New Order Modal */}
      <Modal open={showOrderModal} onClose={() => setShowOrderModal(false)} title="New Lab Order">
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Patient</label>
            <input
              type="text"
              value={modalPatientSearch}
              onChange={(e) => { setModalPatientSearch(e.target.value); setModalVisits([]); setOrderForm(p => ({ ...p, visitId: '' })); }}
              placeholder="Type patient name or number..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {modalPatients.length > 0 && (
              <div className="mt-1 border border-gray-200 rounded-lg max-h-36 overflow-y-auto bg-white shadow-sm">
                {modalPatients.map((p) => (
                  <button key={p.id} type="button"
                    onClick={() => selectModalPatient(p.id, `${p.fullName} (${p.patientNo})`)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-b-0">
                    <span className="font-medium">{p.fullName}</span>{' '}
                    <span className="text-gray-500">{p.patientNo}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {modalVisits.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Visit</label>
              <select value={orderForm.visitId} onChange={(e) => setOrderForm(p => ({ ...p, visitId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">Select a visit</option>
                {modalVisits.map((v) => (
                  <option key={v.id} value={v.id}>
                    Visit #{v.id} — {v.visitType} — {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : ''}{v.chiefComplaint ? ` (${v.chiefComplaint})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test</label>
            <select value={orderForm.testId} onChange={(e) => setOrderForm((p) => ({ ...p, testId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              <option value="">Select a test</option>
              {tests.map((t) => (
                <option key={t.id} value={t.id}>{t.testName} ({t.testCode}) - KES {t.price.toLocaleString()}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowOrderModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={orderSaving || !orderForm.visitId || !orderForm.testId}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {orderSaving ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Process Result Modal */}
      <Modal open={processModal !== null} onClose={() => setProcessModal(null)} title={`Process Result - ${processModal?.testName || ''}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
            <textarea value={resultForm.result} onChange={(e) => setResultForm((p) => ({ ...p, result: e.target.value }))}
              rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="abnormal" checked={resultForm.abnormal} onChange={(e) => setResultForm((p) => ({ ...p, abnormal: e.target.checked }))} className="rounded border-gray-300" />
            <label htmlFor="abnormal" className="text-sm font-medium text-gray-700">Mark as Abnormal</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <textarea value={resultForm.remarks} onChange={(e) => setResultForm((p) => ({ ...p, remarks: e.target.value }))}
              rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setProcessModal(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button onClick={handleProcessResult} disabled={!resultForm.result || actionLoading !== null}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50">
              {actionLoading !== null ? 'Saving...' : 'Submit Result'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Test Modal */}
      <Modal open={addTestModal} onClose={() => setAddTestModal(false)} title="Add Lab Test" size="lg">
        {testFormFields}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setAddTestModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={handleAddTest} disabled={saving || !testForm.testName || !testForm.testCode}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Add Test'}
          </button>
        </div>
      </Modal>

      {/* Edit Test Modal */}
      <Modal open={editTest !== null} onClose={() => setEditTest(null)} title={`Edit Test - ${editTest?.testName || ''}`} size="lg">
        {testFormFields}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setEditTest(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={handleEditTest} disabled={saving || !testForm.testName || !testForm.testCode}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Update Test'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
