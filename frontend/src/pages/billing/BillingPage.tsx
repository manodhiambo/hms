import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Filter, Search, X, Printer, SplitSquareVertical, Pencil, Trash2, Settings } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { billingApi, patientApi, medicalServiceApi, pharmacyApi } from '../../api/services';
import { useHospitalStore } from '../../store/hospitalStore';
import { useAuthStore } from '../../store/authStore';
import type { Billing, BillingItem, Patient, PaymentStatus, PaymentMethod, MedicalService, Drug } from '../../types';

const paymentStatuses: PaymentStatus[] = ['PENDING', 'PARTIAL', 'PAID', 'REFUNDED', 'WAIVED'];
const paymentMethods: PaymentMethod[] = ['CASH', 'MPESA', 'CARD', 'BANK_TRANSFER', 'INSURANCE', 'DONATION'];
const serviceTypes = [
  'Consultation', 'Laboratory', 'Pharmacy', 'Imaging', 'Procedure',
  'Bed Charges', 'Nursing', 'Surgical', 'Dental', 'Physiotherapy', 'Other',
];

const emptyItemForm = { serviceType: '', description: '', quantity: 1, unitPrice: 0, serviceId: undefined as number | undefined };
const emptySplitEntry = () => ({ paymentMethod: 'CASH' as PaymentMethod, amount: 0, referenceNumber: '' });

export default function BillingPage() {
  const hospital = useHospitalStore();
  const auth = useAuthStore();
  const isAdmin = auth.role === 'SUPER_ADMIN' || auth.role === 'HOSPITAL_ADMIN';
  const [invoices, setInvoices] = useState<Billing[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Invoice search (by patient name, patient number, or invoice number)
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceSearchInput, setInvoiceSearchInput] = useState('');
  const filterSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Create invoice
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [visitId, setVisitId] = useState('');
  const [createBilledDate, setCreateBilledDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detail modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Billing | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Add item
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [addItemError, setAddItemError] = useState('');
  const [catalog, setCatalog] = useState<MedicalService[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  // Drug search (for Pharmacy service type)
  const [drugSearch, setDrugSearch] = useState('');
  const [drugResults, setDrugResults] = useState<Drug[]>([]);
  const drugSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Edit item
  const [editingItem, setEditingItem] = useState<BillingItem | null>(null);
  const [editItemForm, setEditItemForm] = useState(emptyItemForm);
  const [editItemError, setEditItemError] = useState('');

  // Edit invoice (insurance, notes, date)
  const [editInvoiceOpen, setEditInvoiceOpen] = useState(false);
  const [editInvoiceForm, setEditInvoiceForm] = useState({ insuranceCoveredAmount: 0, notes: '', billedDate: '' });
  const [editInvoiceError, setEditInvoiceError] = useState('');

  // Split payment
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [splitEntries, setSplitEntries] = useState([emptySplitEntry()]);
  const [paymentError, setPaymentError] = useState('');

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (invoiceSearch.trim().length >= 2) {
        res = await billingApi.search(invoiceSearch.trim(), page);
      } else if (statusFilter) {
        res = await billingApi.getByStatus(statusFilter, page);
      } else {
        res = await billingApi.getAll(page);
      }
      setInvoices(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
    } catch { /* handled */ } finally { setLoading(false); }
  }, [page, statusFilter, invoiceSearch]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
  useEffect(() => { setPage(0); }, [statusFilter, invoiceSearch]);

  // Patient search with debounce
  const handlePatientSearch = (query: string) => {
    setPatientSearch(query);
    setSelectedPatient(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (query.length < 2) { setPatientResults([]); setShowPatientDropdown(false); return; }
    setSearchingPatient(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await patientApi.search(query, 0);
        setPatientResults(res.data.data.content);
        setShowPatientDropdown(true);
      } catch { /* handled */ } finally { setSearchingPatient(false); }
    }, 300);
  };

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearch(`${patient.fullName} (${patient.patientNo})`);
    setShowPatientDropdown(false);
  };

  // Invoice search handler (debounced)
  const handleInvoiceSearchInput = (value: string) => {
    setInvoiceSearchInput(value);
    if (filterSearchTimeout.current) clearTimeout(filterSearchTimeout.current);
    filterSearchTimeout.current = setTimeout(() => {
      setInvoiceSearch(value);
    }, 400);
  };

  const clearInvoiceSearch = () => {
    setInvoiceSearchInput('');
    setInvoiceSearch('');
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    setSubmitting(true);
    try {
      const res = await billingApi.create({
        patientId: selectedPatient.id,
        visitId: visitId ? Number(visitId) : null,
        billedDate: createBilledDate || undefined,
      });
      setCreateModalOpen(false);
      setSelectedPatient(null);
      setPatientSearch('');
      setVisitId('');
      setCreateBilledDate('');
      const newInvoice = res.data.data;
      fetchInvoices();
      openDetail(newInvoice);
    } catch { /* handled */ } finally { setSubmitting(false); }
  };

  const openDetail = async (invoice: Billing) => {
    setDetailModalOpen(true);
    setDetailLoading(true);
    setAddItemOpen(false);
    setEditingItem(null);
    setPaymentOpen(false);
    setEditInvoiceOpen(false);
    try {
      const res = await billingApi.getById(invoice.id);
      setSelectedInvoice(res.data.data);
    } catch { setSelectedInvoice(invoice); } finally { setDetailLoading(false); }
  };

  const refreshDetail = async () => {
    if (!selectedInvoice) return;
    try {
      const res = await billingApi.getById(selectedInvoice.id);
      setSelectedInvoice(res.data.data);
      fetchInvoices();
    } catch { /* */ }
  };

  // Load catalog when Add Service is opened
  const openAddItem = async () => {
    setItemForm(emptyItemForm);
    setAddItemError('');
    setEditingItem(null);
    setAddItemOpen(true);
    setDrugSearch('');
    setDrugResults([]);
    setCatalogLoading(true);
    try {
      const res = await medicalServiceApi.getActive();
      setCatalog(res.data.data);
    } catch { setCatalog([]); } finally { setCatalogLoading(false); }
  };

  const pickFromCatalog = (svc: MedicalService) => {
    setItemForm(f => ({ ...f, serviceType: svc.category, description: svc.serviceName, unitPrice: svc.price, serviceId: svc.id }));
  };

  // Drug search for Pharmacy service type
  const handleDrugSearchChange = (q: string) => {
    setDrugSearch(q);
    setDrugResults([]);
    if (drugSearchTimeout.current) clearTimeout(drugSearchTimeout.current);
    if (q.trim().length < 2) return;
    drugSearchTimeout.current = setTimeout(async () => {
      try {
        const res = await pharmacyApi.searchDrugs(q.trim());
        setDrugResults(res.data.data.content);
      } catch { /* ignore */ }
    }, 300);
  };

  const pickDrug = (drug: Drug) => {
    const desc = `${drug.genericName}${drug.brandName ? ` (${drug.brandName})` : ''}${drug.strength ? ` ${drug.strength}` : ''}`.trim();
    setItemForm(f => ({ ...f, description: desc, unitPrice: drug.sellingPrice || 0 }));
    setDrugSearch(desc);
    setDrugResults([]);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setSubmitting(true);
    setAddItemError('');
    try {
      await billingApi.addItem(selectedInvoice.id, {
        serviceType: itemForm.serviceType,
        description: itemForm.description,
        quantity: itemForm.quantity,
        unitPrice: itemForm.unitPrice,
        serviceId: itemForm.serviceId,
      });
      setAddItemOpen(false);
      setItemForm(emptyItemForm);
      await refreshDetail();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setAddItemError(msg || 'Failed to add service. Please try again.');
    } finally { setSubmitting(false); }
  };

  // Edit item
  const startEditItem = (item: BillingItem) => {
    setEditingItem(item);
    setEditItemForm({
      serviceType: item.serviceType,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      serviceId: undefined,
    });
    setEditItemError('');
    setAddItemOpen(false);
    setPaymentOpen(false);
    setEditInvoiceOpen(false);
  };

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !editingItem) return;
    setSubmitting(true);
    setEditItemError('');
    try {
      await billingApi.updateItem(selectedInvoice.id, editingItem.id, {
        serviceType: editItemForm.serviceType,
        description: editItemForm.description,
        quantity: editItemForm.quantity,
        unitPrice: editItemForm.unitPrice,
      });
      setEditingItem(null);
      await refreshDetail();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setEditItemError(msg || 'Failed to update item.');
    } finally { setSubmitting(false); }
  };

  const handleDeleteItem = async (item: BillingItem) => {
    if (!selectedInvoice) return;
    if (!window.confirm(`Remove "${item.description}" from this invoice?`)) return;
    try {
      await billingApi.deleteItem(selectedInvoice.id, item.id);
      await refreshDetail();
    } catch { /* handled */ }
  };

  // Edit invoice
  const openEditInvoice = () => {
    if (!selectedInvoice) return;
    const effectiveDate = selectedInvoice.billedDate
      ? selectedInvoice.billedDate
      : selectedInvoice.createdAt?.slice(0, 10);
    setEditInvoiceForm({
      insuranceCoveredAmount: selectedInvoice.insuranceCoveredAmount || 0,
      notes: selectedInvoice.notes || '',
      billedDate: effectiveDate || '',
    });
    setEditInvoiceError('');
    setAddItemOpen(false);
    setEditingItem(null);
    setPaymentOpen(false);
    setEditInvoiceOpen(true);
  };

  const handleEditInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setSubmitting(true);
    setEditInvoiceError('');
    try {
      await billingApi.update(selectedInvoice.id, {
        insuranceCoveredAmount: editInvoiceForm.insuranceCoveredAmount,
        notes: editInvoiceForm.notes,
        billedDate: editInvoiceForm.billedDate || undefined,
      });
      setEditInvoiceOpen(false);
      await refreshDetail();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setEditInvoiceError(msg || 'Failed to update invoice.');
    } finally { setSubmitting(false); }
  };

  // Split payment
  const splitTotal = splitEntries.reduce((sum, e) => sum + (e.amount || 0), 0);

  const openPayment = () => {
    const balance = invoiceBalance > 0 ? invoiceBalance : 0;
    setSplitEntries([{ paymentMethod: 'CASH', amount: balance, referenceNumber: '' }]);
    setPaymentError('');
    setAddItemOpen(false);
    setEditingItem(null);
    setEditInvoiceOpen(false);
    setPaymentOpen(true);
  };

  const addSplitEntry = () => setSplitEntries(prev => [...prev, emptySplitEntry()]);
  const removeSplitEntry = (idx: number) => setSplitEntries(prev => prev.filter((_, i) => i !== idx));
  const updateSplitEntry = (idx: number, field: string, value: string | number) =>
    setSplitEntries(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    const valid = splitEntries.filter(p => p.amount > 0);
    if (valid.length === 0) { setPaymentError('Enter at least one payment amount.'); return; }
    setSubmitting(true);
    setPaymentError('');
    try {
      for (const entry of valid) {
        await billingApi.processPayment({
          billingId: selectedInvoice.id,
          amount: entry.amount,
          paymentMethod: entry.paymentMethod,
          referenceNumber: entry.referenceNumber || undefined,
        });
      }
      setPaymentOpen(false);
      setSplitEntries([emptySplitEntry()]);
      await refreshDetail();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setPaymentError(msg || 'Failed to record payment. Please try again.');
    } finally { setSubmitting(false); }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount || 0);

  const getEffectiveDate = (invoice: Billing) =>
    invoice.billedDate ? new Date(invoice.billedDate).toLocaleDateString() : new Date(invoice.createdAt).toLocaleDateString();

  const printReceipt = (invoice: Billing) => {
    const win = window.open('', '_blank');
    if (!win) return;
    const balance = Math.max(0, (invoice.totalAmount || 0) - (invoice.paidAmount || 0) - (invoice.insuranceCoveredAmount || 0));
    win.document.write(`<!DOCTYPE html><html><head><title>Receipt — ${invoice.invoiceNumber}</title>
<style>
  body{font-family:Arial,sans-serif;max-width:380px;margin:0 auto;padding:20px;font-size:12px;color:#222}
  .center{text-align:center}
  .header{border-bottom:2px dashed #aaa;padding-bottom:10px;margin-bottom:10px}
  .header h2{margin:0 0 2px;font-size:16px}
  .header p{margin:2px 0;font-size:10px;color:#666}
  .title{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:8px 0}
  .info-row{display:flex;justify-content:space-between;margin:3px 0;font-size:11px}
  .info-row .label{color:#666}
  .divider{border-top:1px dashed #ccc;margin:8px 0}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th{text-align:left;padding:4px 2px;border-bottom:1px solid #ddd;font-size:10px;color:#666;text-transform:uppercase}
  td{padding:4px 2px;border-bottom:1px solid #f0f0f0}
  .text-right{text-align:right}
  .total-row{font-weight:700;font-size:12px}
  .payment-section{margin-top:8px}
  .status-badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;
    background:${invoice.status === 'PAID' ? '#dcfce7' : invoice.status === 'PARTIAL' ? '#fff7ed' : '#fef2f2'};
    color:${invoice.status === 'PAID' ? '#166534' : invoice.status === 'PARTIAL' ? '#9a3412' : '#991b1b'}}
  .footer{border-top:2px dashed #aaa;padding-top:10px;margin-top:12px;text-align:center;font-size:10px;color:#888}
  @media print{body{padding:0}}
</style></head><body>
<div class="header center">
  <h2>${hospital.name}</h2>
  <p>${hospital.tagline}</p>
  <p>${hospital.address}</p>
  <p>Tel: ${hospital.phone} | ${hospital.email}</p>
</div>
<div class="center">
  <div class="title">Official Receipt</div>
  <span class="status-badge">${invoice.status}</span>
</div>
<div class="divider"></div>
<div class="info-row"><span class="label">Invoice No:</span><strong>${invoice.invoiceNumber}</strong></div>
<div class="info-row"><span class="label">Patient:</span><span>${invoice.patientName}</span></div>
<div class="info-row"><span class="label">Patient No:</span><span>${invoice.patientNo}</span></div>
${invoice.patientAge != null ? `<div class="info-row"><span class="label">Age:</span><span>${invoice.patientAge} years${invoice.patientAge < 18 ? ' (Minor)' : ''}</span></div>` : ''}
<div class="info-row"><span class="label">Date:</span><span>${getEffectiveDate(invoice)}</span></div>
${invoice.visitId ? `<div class="info-row"><span class="label">Visit #:</span><span>${invoice.visitId}</span></div>` : ''}
${invoice.notes ? `<div class="info-row"><span class="label">Notes:</span><span>${invoice.notes}</span></div>` : ''}
<div class="divider"></div>
<p style="font-size:11px;font-weight:600;margin:6px 0 4px">Services</p>
<table>
  <thead><tr><th>Description</th><th>Qty</th><th class="text-right">Price</th><th class="text-right">Total</th></tr></thead>
  <tbody>
    ${(invoice.items || []).map(item => `
    <tr>
      <td>${item.description}<br><span style="color:#888;font-size:10px">${item.serviceType}</span></td>
      <td>${item.quantity}</td>
      <td class="text-right">${formatCurrency(item.unitPrice)}</td>
      <td class="text-right">${formatCurrency(item.totalPrice)}</td>
    </tr>`).join('')}
    <tr class="total-row">
      <td colspan="3" class="text-right">Sub Total:</td>
      <td class="text-right">${formatCurrency(invoice.totalAmount)}</td>
    </tr>
    ${invoice.insuranceCoveredAmount ? `<tr><td colspan="3" class="text-right" style="color:#0369a1">Insurance:</td><td class="text-right" style="color:#0369a1">-${formatCurrency(invoice.insuranceCoveredAmount)}</td></tr>` : ''}
    <tr class="total-row" style="font-size:13px">
      <td colspan="3" class="text-right">BALANCE DUE:</td>
      <td class="text-right" style="color:${balance > 0 ? '#dc2626' : '#16a34a'}">${formatCurrency(balance)}</td>
    </tr>
  </tbody>
</table>
${invoice.payments && invoice.payments.length > 0 ? `
<div class="divider"></div>
<p style="font-size:11px;font-weight:600;margin:6px 0 4px">Payments Received</p>
<table>
  <thead><tr><th>Receipt No</th><th>Method</th><th class="text-right">Amount</th><th>Date</th></tr></thead>
  <tbody>
    ${invoice.payments.map(p => `<tr>
      <td>${p.receiptNumber}</td>
      <td>${p.paymentMethod.replace(/_/g, ' ')}</td>
      <td class="text-right" style="color:#16a34a">${formatCurrency(p.amount)}</td>
      <td style="font-size:10px">${new Date(p.createdAt).toLocaleDateString()}</td>
    </tr>`).join('')}
    <tr class="total-row"><td colspan="2" class="text-right">Total Paid:</td>
      <td class="text-right" style="color:#16a34a">${formatCurrency(invoice.paidAmount)}</td><td></td></tr>
  </tbody>
</table>` : ''}
<div class="footer">
  <p>Thank you for choosing ${hospital.name}</p>
  <p>Printed: ${new Date().toLocaleString()}</p>
  <p style="margin-top:4px;font-size:9px">Developed by Helvino Technologies Limited | helvino.org | 0703445756</p>
</div>
</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  const columns = [
    { key: 'invoiceNumber', label: 'Invoice #' },
    {
      key: 'patientName', label: 'Patient',
      render: (b: Billing) => (
        <div>
          <div className="font-medium text-gray-900">{b.patientName}</div>
          <div className="text-xs text-gray-500">{b.patientNo}</div>
        </div>
      ),
    },
    { key: 'totalAmount', label: 'Total', render: (b: Billing) => <span className="font-medium">{formatCurrency(b.totalAmount)}</span> },
    { key: 'paidAmount', label: 'Paid', render: (b: Billing) => <span className="text-green-700">{formatCurrency(b.paidAmount)}</span> },
    {
      key: 'balance', label: 'Balance',
      render: (b: Billing) => {
        const balance = (b.totalAmount || 0) - (b.paidAmount || 0) - (b.insuranceCoveredAmount || 0);
        return <span className={balance > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>{formatCurrency(Math.max(0, balance))}</span>;
      },
    },
    { key: 'status', label: 'Status', render: (b: Billing) => <StatusBadge status={b.status} /> },
    { key: 'date', label: 'Date', render: (b: Billing) => getEffectiveDate(b) },
  ];

  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelClass = 'block text-sm font-medium text-gray-600 mb-1';

  const itemTotal = itemForm.quantity * itemForm.unitPrice;
  const editItemTotal = editItemForm.quantity * editItemForm.unitPrice;
  const invoiceBalance = selectedInvoice
    ? (selectedInvoice.totalAmount || 0) - (selectedInvoice.paidAmount || 0) - (selectedInvoice.insuranceCoveredAmount || 0)
    : 0;

  const canEdit = selectedInvoice && (selectedInvoice.status === 'PENDING' || selectedInvoice.status === 'PARTIAL');
  const canDelete = canEdit || isAdmin;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <button onClick={() => { setSelectedPatient(null); setPatientSearch(''); setVisitId(''); setCreateBilledDate(''); setCreateModalOpen(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Create Invoice
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
          {paymentStatuses.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={invoiceSearchInput}
          onChange={(e) => handleInvoiceSearchInput(e.target.value)}
          placeholder="Search by patient name, number, or invoice #..."
          className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {invoiceSearchInput && (
          <button type="button" onClick={clearInvoiceSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <DataTable columns={columns} data={invoices} page={page} totalPages={totalPages} onPageChange={setPage} onRowClick={openDetail} loading={loading} />

      {/* Create Invoice Modal */}
      <Modal open={createModalOpen} onClose={() => { setCreateModalOpen(false); setShowPatientDropdown(false); }} title="Create Invoice">
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          {/* Patient Search */}
          <div className="relative">
            <label className={labelClass}>Patient *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => handlePatientSearch(e.target.value)}
                onFocus={() => patientResults.length > 0 && setShowPatientDropdown(true)}
                placeholder="Search by name, phone, or patient number..."
                className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {selectedPatient && (
                <button type="button" onClick={() => { setSelectedPatient(null); setPatientSearch(''); setPatientResults([]); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {searchingPatient && <p className="text-xs text-gray-400 mt-1">Searching...</p>}

            {/* Dropdown */}
            {showPatientDropdown && patientResults.length > 0 && !selectedPatient && (
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
            {showPatientDropdown && patientResults.length === 0 && patientSearch.length >= 2 && !searchingPatient && !selectedPatient && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-gray-500 text-center">
                No patients found
              </div>
            )}
          </div>

          {/* Selected Patient Info */}
          {selectedPatient && (
            <div className="bg-blue-50 rounded-lg p-3 text-sm">
              <div className="font-medium text-blue-900">{selectedPatient.fullName}</div>
              <div className="text-blue-700 text-xs mt-0.5">
                {selectedPatient.patientNo} | {selectedPatient.gender} | {selectedPatient.phone || 'No phone'}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Visit ID (optional)</label>
              <input type="number" value={visitId} onChange={(e) => setVisitId(e.target.value)}
                className={inputClass} placeholder="Link to a visit" />
            </div>
            <div>
              <label className={labelClass}>Bill Date (optional – for back-dating)</label>
              <input type="date" value={createBilledDate} onChange={(e) => setCreateBilledDate(e.target.value)}
                className={inputClass} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={submitting || !selectedPatient}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create & Add Services'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Invoice Detail Modal */}
      <Modal open={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setAddItemOpen(false); setPaymentOpen(false); setEditingItem(null); setEditInvoiceOpen(false); }}
        title={selectedInvoice ? `Invoice ${selectedInvoice.invoiceNumber}` : 'Invoice Details'}
        size="xl">
        {detailLoading ? (
          <div className="animate-pulse space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-8 bg-gray-100 rounded" />)}</div>
        ) : selectedInvoice ? (
          <div className="space-y-6">
            {/* Top Action Buttons */}
            <div className="flex justify-end gap-2">
              <button
                onClick={openEditInvoice}
                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">
                <Settings className="w-4 h-4" /> Edit Invoice
              </button>
              <button
                onClick={() => printReceipt(selectedInvoice)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-xl hover:bg-gray-900 transition-colors">
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Patient</p>
                <p className="text-sm font-semibold text-gray-900">{selectedInvoice.patientName}</p>
                <p className="text-xs text-gray-500">{selectedInvoice.patientNo}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(selectedInvoice.totalAmount)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Paid</p>
                <p className="text-sm font-semibold text-green-700">{formatCurrency(selectedInvoice.paidAmount)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Balance</p>
                <p className={`text-sm font-semibold ${invoiceBalance > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                  {formatCurrency(Math.max(0, invoiceBalance))}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Status</p>
                <div className="mt-0.5"><StatusBadge status={selectedInvoice.status} /></div>
              </div>
            </div>

            {/* Notes */}
            {selectedInvoice.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-sm text-yellow-800">
                <span className="font-medium">Notes: </span>{selectedInvoice.notes}
              </div>
            )}

            {/* Insurance coverage */}
            {selectedInvoice.insuranceCoveredAmount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-800">
                <span className="font-medium">Insurance covers: </span>{formatCurrency(selectedInvoice.insuranceCoveredAmount)}
              </div>
            )}

            {/* Outstanding balance alert for PAID invoices with new charges */}
            {selectedInvoice.status === 'PAID' && invoiceBalance > 0 && (
              <div className="bg-orange-50 border border-orange-300 rounded-lg px-3 py-2 text-sm text-orange-800">
                <span className="font-medium">New charges added: </span>
                Outstanding balance of <strong>{formatCurrency(invoiceBalance)}</strong> pending payment.
              </div>
            )}

            {/* Edit Invoice Form */}
            {editInvoiceOpen && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Edit Invoice Details</h4>
                {editInvoiceError && (
                  <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{editInvoiceError}</div>
                )}
                <form onSubmit={handleEditInvoice} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className={labelClass}>Bill Date</label>
                      <input type="date" value={editInvoiceForm.billedDate}
                        onChange={e => setEditInvoiceForm(f => ({ ...f, billedDate: e.target.value }))}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Insurance Coverage (KES)</label>
                      <input type="number" min={0} step="0.01"
                        value={editInvoiceForm.insuranceCoveredAmount || ''}
                        onChange={e => setEditInvoiceForm(f => ({ ...f, insuranceCoveredAmount: Number(e.target.value) || 0 }))}
                        className={inputClass} placeholder="0.00" />
                    </div>
                    <div>
                      <label className={labelClass}>Notes</label>
                      <input type="text" value={editInvoiceForm.notes}
                        onChange={e => setEditInvoiceForm(f => ({ ...f, notes: e.target.value }))}
                        className={inputClass} placeholder="Optional notes" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditInvoiceOpen(false)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={submitting}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800 disabled:opacity-50">
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Services / Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Services</h3>
                <button onClick={openAddItem}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
                  <Plus className="w-3.5 h-3.5" /> Add Service
                </button>
              </div>
              {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Service</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Description</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Qty</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Unit Price</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Total</th>
                        <th className="px-3 py-2 text-xs font-semibold text-gray-500 w-16"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item) => (
                        <tr key={item.id} className="border-b border-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-700">{item.serviceType}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{item.description}</td>
                          <td className="px-3 py-2 text-sm text-gray-700 text-right">{item.quantity}</td>
                          <td className="px-3 py-2 text-sm text-gray-700 text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-3 py-2 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.totalPrice)}</td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => startEditItem(item)} title="Edit"
                                className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              {canDelete && (
                                <button onClick={() => handleDeleteItem(item)} title="Remove"
                                  className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50">
                        <td colSpan={4} className="px-3 py-2 text-sm font-semibold text-gray-700 text-right">Sub Total</td>
                        <td className="px-3 py-2 text-sm font-bold text-gray-900 text-right">{formatCurrency(selectedInvoice.totalAmount)}</td>
                        <td></td>
                      </tr>
                      {selectedInvoice.insuranceCoveredAmount > 0 && (
                        <tr className="bg-blue-50">
                          <td colSpan={4} className="px-3 py-2 text-sm font-semibold text-blue-700 text-right">Insurance Coverage</td>
                          <td className="px-3 py-2 text-sm font-bold text-blue-700 text-right">- {formatCurrency(selectedInvoice.insuranceCoveredAmount)}</td>
                          <td></td>
                        </tr>
                      )}
                      <tr className="bg-gray-100">
                        <td colSpan={4} className="px-3 py-2 text-sm font-bold text-gray-900 text-right">Balance Due</td>
                        <td className={`px-3 py-2 text-sm font-bold text-right ${invoiceBalance > 0 ? 'text-red-600' : 'text-green-700'}`}>
                          {formatCurrency(Math.max(0, invoiceBalance))}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No services added yet. Click "Add Service" to begin.</p>
              )}
            </div>

            {/* Edit Item Form */}
            {editingItem && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Edit: {editingItem.description}</h4>
                {editItemError && (
                  <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{editItemError}</div>
                )}
                <form onSubmit={handleEditItem} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Service Type *</label>
                      <select required value={editItemForm.serviceType}
                        onChange={(e) => setEditItemForm(p => ({ ...p, serviceType: e.target.value }))}
                        className={inputClass}>
                        <option value="">Select service type</option>
                        {serviceTypes.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Description *</label>
                      <input required type="text" value={editItemForm.description}
                        onChange={(e) => setEditItemForm(p => ({ ...p, description: e.target.value }))}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Quantity *</label>
                      <input required type="number" min={1} value={editItemForm.quantity}
                        onChange={(e) => setEditItemForm(p => ({ ...p, quantity: Number(e.target.value) || 1 }))}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Unit Price (KES) *</label>
                      <input required type="number" min={0} step="0.01" value={editItemForm.unitPrice || ''}
                        onChange={(e) => setEditItemForm(p => ({ ...p, unitPrice: Number(e.target.value) || 0 }))}
                        className={inputClass} />
                    </div>
                  </div>
                  {editItemTotal > 0 && (
                    <div className="bg-white rounded-lg p-2 text-right">
                      <span className="text-sm text-gray-500">New Total: </span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(editItemTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => { setEditingItem(null); setEditItemError(''); }}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={submitting}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50">
                      {submitting ? 'Saving...' : 'Update Item'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Add Item Form */}
            {addItemOpen && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Add Service</h4>
                {addItemError && (
                  <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{addItemError}</div>
                )}

                {/* Service Catalog Picker */}
                {!catalogLoading && catalog.length > 0 && (
                  <div className="mb-4">
                    <label className={labelClass}>Pick from Service Catalog (optional)</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto">
                      {catalog.map(svc => (
                        <button
                          key={svc.id}
                          type="button"
                          onClick={() => pickFromCatalog(svc)}
                          className="text-left px-2.5 py-2 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        >
                          <div className="text-xs font-medium text-gray-800 truncate">{svc.serviceName}</div>
                          <div className="text-xs text-blue-600">{formatCurrency(svc.price)}</div>
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 border-t border-blue-100 pt-2">
                      <p className="text-xs text-gray-400">Or fill in manually below:</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleAddItem} className="space-y-3">
                  {/* Drug search — shown when service type is Pharmacy */}
                  {itemForm.serviceType === 'Pharmacy' && (
                    <div>
                      <label className={labelClass}>Search Drug (Pharmacy Inventory)</label>
                      <input
                        type="text"
                        value={drugSearch}
                        onChange={(e) => handleDrugSearchChange(e.target.value)}
                        placeholder="Type drug name..."
                        className={inputClass}
                      />
                      {drugResults.length > 0 && (
                        <div className="mt-1 border border-gray-200 rounded-lg max-h-40 overflow-y-auto bg-white shadow-sm">
                          {drugResults.map((d) => (
                            <button key={d.id} type="button" onClick={() => pickDrug(d)}
                              className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 border-b border-gray-50 last:border-b-0">
                              <span className="font-medium text-gray-900">{d.genericName}</span>
                              {d.brandName && <span className="text-gray-500 ml-1">({d.brandName})</span>}
                              {d.strength && <span className="text-gray-400 ml-1">{d.strength}</span>}
                              <span className="float-right text-blue-600 font-medium">KES {(d.sellingPrice || 0).toLocaleString()}</span>
                              <span className="float-right text-gray-400 mr-3">Stock: {d.quantityInStock}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Service Type *</label>
                      <select required value={itemForm.serviceType}
                        onChange={(e) => { setItemForm((p) => ({ ...p, serviceType: e.target.value })); setDrugSearch(''); setDrugResults([]); }}
                        className={inputClass}>
                        <option value="">Select service type</option>
                        {serviceTypes.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Description *</label>
                      <input required type="text" value={itemForm.description}
                        onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))}
                        className={inputClass} placeholder="e.g. IV Injection, Wound Dressing" />
                    </div>
                    <div>
                      <label className={labelClass}>Quantity *</label>
                      <input required type="number" min={1} value={itemForm.quantity}
                        onChange={(e) => setItemForm((p) => ({ ...p, quantity: Number(e.target.value) || 1 }))}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Unit Price (KES) *</label>
                      <input required type="number" min={0} step="0.01" value={itemForm.unitPrice || ''}
                        onChange={(e) => setItemForm((p) => ({ ...p, unitPrice: Number(e.target.value) || 0 }))}
                        className={inputClass} placeholder="0.00" />
                    </div>
                  </div>
                  {itemTotal > 0 && (
                    <div className="bg-white rounded-lg p-2 text-right">
                      <span className="text-sm text-gray-500">Subtotal: </span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(itemTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => { setAddItemOpen(false); setAddItemError(''); }}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={submitting}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                      {submitting ? 'Adding...' : 'Add Service'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Payments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Payments</h3>
                {(selectedInvoice.status !== 'PAID' || invoiceBalance > 0) && (
                  <button onClick={openPayment}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100">
                    <SplitSquareVertical className="w-3.5 h-3.5" /> Record Payment
                  </button>
                )}
              </div>
              {selectedInvoice.payments && selectedInvoice.payments.length > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Receipt</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Amount</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Method</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Reference</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.payments.map((payment) => (
                        <tr key={payment.id} className="border-b border-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-700">{payment.receiptNumber}</td>
                          <td className="px-3 py-2 text-sm font-medium text-green-700 text-right">{formatCurrency(payment.amount)}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{payment.paymentMethod.replace(/_/g, ' ')}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{payment.referenceNumber || '-'}</td>
                          <td className="px-3 py-2 text-sm text-gray-500">{new Date(payment.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No payments recorded</p>
              )}
            </div>

            {/* Split Payment Form */}
            {paymentOpen && (
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700">Record Payment</h4>
                    <p className="text-xs text-gray-500">Balance: <span className="font-semibold text-red-600">{formatCurrency(Math.max(0, invoiceBalance))}</span> · Add multiple methods for split payment</p>
                  </div>
                  <button type="button" onClick={addSplitEntry}
                    className="inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-900">
                    <Plus className="w-3.5 h-3.5" /> Add Method
                  </button>
                </div>
                {paymentError && (
                  <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{paymentError}</div>
                )}
                <form onSubmit={handleRecordPayment} className="space-y-2">
                  {splitEntries.map((entry, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        {idx === 0 && <label className={labelClass}>Method</label>}
                        <select
                          value={entry.paymentMethod}
                          onChange={e => updateSplitEntry(idx, 'paymentMethod', e.target.value)}
                          className={inputClass}
                        >
                          {paymentMethods.map(m => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
                        </select>
                      </div>
                      <div className="col-span-3">
                        {idx === 0 && <label className={labelClass}>Amount (KES)</label>}
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={entry.amount || ''}
                          onChange={e => updateSplitEntry(idx, 'amount', Number(e.target.value) || 0)}
                          className={inputClass}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="col-span-4">
                        {idx === 0 && <label className={labelClass}>Reference</label>}
                        <input
                          type="text"
                          value={entry.referenceNumber}
                          onChange={e => updateSplitEntry(idx, 'referenceNumber', e.target.value)}
                          className={inputClass}
                          placeholder={entry.paymentMethod === 'MPESA' ? 'M-Pesa code' : 'Ref #'}
                        />
                      </div>
                      <div className="col-span-1 pb-0.5">
                        {splitEntries.length > 1 && (
                          <button type="button" onClick={() => removeSplitEntry(idx)}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {splitEntries.length > 1 && (
                    <div className="bg-white rounded-lg px-3 py-2 flex justify-between text-sm border border-gray-200">
                      <span className="text-gray-500">Total being paid:</span>
                      <span className={`font-semibold ${splitTotal > invoiceBalance + 0.01 ? 'text-orange-600' : 'text-green-700'}`}>
                        {formatCurrency(splitTotal)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={() => { setPaymentOpen(false); setPaymentError(''); }}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={submitting || splitTotal <= 0}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
                      {submitting ? 'Processing...' : `Record ${splitEntries.filter(e => e.amount > 0).length > 1 ? 'Split ' : ''}Payment`}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
