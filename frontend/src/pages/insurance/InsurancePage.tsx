import { useState, useEffect, useCallback } from 'react';
import { Building2, Filter, FileCheck, Pencil } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { insuranceApi } from '../../api/services';
import type { InsuranceCompany, InsuranceClaim, ClaimStatus } from '../../types';

type Tab = 'companies' | 'claims';

const claimStatuses: ClaimStatus[] = ['DRAFT', 'SUBMITTED', 'PRE_AUTHORIZED', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'PAID'];

const emptyCompanyForm = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
};

const emptyClaimForm = {
  billingId: '',
  insuranceCompanyId: '',
  patientId: '',
  claimAmount: 0,
  remarks: '',
};

export default function InsurancePage() {
  const [activeTab, setActiveTab] = useState<Tab>('companies');

  // Companies state
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [companyForm, setCompanyForm] = useState(emptyCompanyForm);

  // Claims state
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [claimsPage, setClaimsPage] = useState(0);
  const [claimsTotalPages, setClaimsTotalPages] = useState(1);
  const [claimsLoading, setClaimsLoading] = useState(true);
  const [claimStatusFilter, setClaimStatusFilter] = useState('');
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimForm, setClaimForm] = useState(emptyClaimForm);

  // Update claim status state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [approvedAmount, setApprovedAmount] = useState(0);
  const [statusRemarks, setStatusRemarks] = useState('');

  const [editCompanyModal, setEditCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<InsuranceCompany | null>(null);
  const [editCompanyForm, setEditCompanyForm] = useState(emptyCompanyForm);
  const [submitting, setSubmitting] = useState(false);

  // Fetch companies
  const fetchCompanies = useCallback(async () => {
    setCompaniesLoading(true);
    try {
      const res = await insuranceApi.getCompanies();
      setCompanies(res.data.data);
    } catch {
      // Error handled silently
    } finally {
      setCompaniesLoading(false);
    }
  }, []);

  // Fetch claims
  const fetchClaims = useCallback(async () => {
    setClaimsLoading(true);
    try {
      const res = await insuranceApi.getClaims(claimsPage);
      const data = res.data.data;
      setClaims(data.content);
      setClaimsTotalPages(data.totalPages);
    } catch {
      // Error handled silently
    } finally {
      setClaimsLoading(false);
    }
  }, [claimsPage]);

  useEffect(() => {
    if (activeTab === 'companies') fetchCompanies();
    else fetchClaims();
  }, [activeTab, fetchCompanies, fetchClaims]);

  useEffect(() => {
    setClaimsPage(0);
  }, [claimStatusFilter]);

  // Filtered claims (client-side filter since API doesn't have status filter for claims)
  const filteredClaims = claimStatusFilter
    ? claims.filter((c) => c.status === claimStatusFilter)
    : claims;

  // Handlers
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await insuranceApi.createCompany(companyForm);
      setCompanyModalOpen(false);
      setCompanyForm(emptyCompanyForm);
      fetchCompanies();
    } catch {
      // Error handled silently
    } finally {
      setSubmitting(false);
    }
  };

  const openEditCompany = (company: InsuranceCompany) => {
    setEditingCompany(company);
    setEditCompanyForm({
      name: company.name, contactPerson: company.contactPerson || '',
      phone: company.phone || '', email: company.email || '', address: company.address || '',
    });
    setEditCompanyModal(true);
  };

  const handleEditCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;
    setSubmitting(true);
    try {
      await insuranceApi.updateCompany(editingCompany.id, editCompanyForm);
      setEditCompanyModal(false);
      setEditingCompany(null);
      fetchCompanies();
    } catch { /* handled */ } finally { setSubmitting(false); }
  };

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await insuranceApi.createClaim({
        billingId: Number(claimForm.billingId),
        insuranceCompanyId: Number(claimForm.insuranceCompanyId),
        patientId: Number(claimForm.patientId),
        claimAmount: claimForm.claimAmount,
        remarks: claimForm.remarks,
      });
      setClaimModalOpen(false);
      setClaimForm(emptyClaimForm);
      fetchClaims();
    } catch {
      // Error handled silently
    } finally {
      setSubmitting(false);
    }
  };

  const openStatusModal = (claim: InsuranceClaim) => {
    setSelectedClaim(claim);
    setNewStatus(claim.status);
    setApprovedAmount(claim.approvedAmount || 0);
    setStatusRemarks('');
    setStatusModalOpen(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;
    setSubmitting(true);
    try {
      await insuranceApi.updateClaimStatus(selectedClaim.id, {
        status: newStatus,
        approvedAmount: approvedAmount || undefined,
        remarks: statusRemarks || undefined,
      });
      setStatusModalOpen(false);
      fetchClaims();
    } catch {
      // Error handled silently
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);

  // Company columns
  const companyColumns = [
    { key: 'name', label: 'Company Name' },
    { key: 'contactPerson', label: 'Contact Person' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'address', label: 'Address' },
    {
      key: 'active',
      label: 'Status',
      render: (c: InsuranceCompany) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {c.active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (c: InsuranceCompany) => (
        <button onClick={(e) => { e.stopPropagation(); openEditCompany(c); }}
          className="text-gray-400 hover:text-blue-600 p-1" title="Edit Company">
          <Pencil className="w-4 h-4" />
        </button>
      ),
    },
  ];

  // Claim columns
  const claimColumns = [
    { key: 'claimNumber', label: 'Claim #' },
    { key: 'patientName', label: 'Patient' },
    { key: 'insuranceCompanyName', label: 'Insurance' },
    { key: 'invoiceNumber', label: 'Invoice #' },
    {
      key: 'claimAmount',
      label: 'Claimed',
      render: (c: InsuranceClaim) => <span className="font-medium">{formatCurrency(c.claimAmount)}</span>,
    },
    {
      key: 'approvedAmount',
      label: 'Approved',
      render: (c: InsuranceClaim) => (
        <span className={c.approvedAmount > 0 ? 'text-green-700 font-medium' : 'text-gray-400'}>
          {c.approvedAmount > 0 ? formatCurrency(c.approvedAmount) : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (c: InsuranceClaim) => <StatusBadge status={c.status} />,
    },
    {
      key: 'actions',
      label: '',
      render: (c: InsuranceClaim) => (
        <button
          onClick={(e) => { e.stopPropagation(); openStatusModal(c); }}
          className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          Update Status
        </button>
      ),
    },
  ];

  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelClass = 'block text-sm font-medium text-gray-600 mb-1';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Insurance</h1>
        {activeTab === 'companies' ? (
          <button
            onClick={() => { setCompanyForm(emptyCompanyForm); setCompanyModalOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Building2 className="w-4 h-4" />
            Add Company
          </button>
        ) : (
          <button
            onClick={() => { setClaimForm(emptyClaimForm); setClaimModalOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <FileCheck className="w-4 h-4" />
            New Claim
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('companies')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'companies' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Companies
        </button>
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'claims' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Claims
        </button>
      </div>

      {/* Companies Tab */}
      {activeTab === 'companies' && (
        <DataTable
          columns={companyColumns}
          data={companies}
          loading={companiesLoading}
        />
      )}

      {/* Claims Tab */}
      {activeTab === 'claims' && (
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setClaimStatusFilter('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  claimStatusFilter === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {claimStatuses.map((s) => (
                <button
                  key={s}
                  onClick={() => setClaimStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    claimStatusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <DataTable
            columns={claimColumns}
            data={filteredClaims}
            page={claimsPage}
            totalPages={claimsTotalPages}
            onPageChange={setClaimsPage}
            loading={claimsLoading}
          />
        </div>
      )}

      {/* Add Company Modal */}
      <Modal open={companyModalOpen} onClose={() => setCompanyModalOpen(false)} title="Add Insurance Company">
        <form onSubmit={handleCreateCompany} className="space-y-4">
          <div>
            <label className={labelClass}>Company Name *</label>
            <input
              required
              type="text"
              value={companyForm.name}
              onChange={(e) => setCompanyForm((p) => ({ ...p, name: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Contact Person *</label>
            <input
              required
              type="text"
              value={companyForm.contactPerson}
              onChange={(e) => setCompanyForm((p) => ({ ...p, contactPerson: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Phone *</label>
              <input
                required
                type="tel"
                value={companyForm.phone}
                onChange={(e) => setCompanyForm((p) => ({ ...p, phone: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email *</label>
              <input
                required
                type="email"
                value={companyForm.email}
                onChange={(e) => setCompanyForm((p) => ({ ...p, email: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Address</label>
            <input
              type="text"
              value={companyForm.address}
              onChange={(e) => setCompanyForm((p) => ({ ...p, address: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCompanyModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Adding...' : 'Add Company'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Company Modal */}
      <Modal open={editCompanyModal} onClose={() => { setEditCompanyModal(false); setEditingCompany(null); }} title="Edit Insurance Company">
        <form onSubmit={handleEditCompany} className="space-y-4">
          <div>
            <label className={labelClass}>Company Name *</label>
            <input required type="text" value={editCompanyForm.name}
              onChange={(e) => setEditCompanyForm((p) => ({ ...p, name: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Contact Person *</label>
            <input required type="text" value={editCompanyForm.contactPerson}
              onChange={(e) => setEditCompanyForm((p) => ({ ...p, contactPerson: e.target.value }))} className={inputClass} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Phone *</label>
              <input required type="tel" value={editCompanyForm.phone}
                onChange={(e) => setEditCompanyForm((p) => ({ ...p, phone: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email *</label>
              <input required type="email" value={editCompanyForm.email}
                onChange={(e) => setEditCompanyForm((p) => ({ ...p, email: e.target.value }))} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Address</label>
            <input type="text" value={editCompanyForm.address}
              onChange={(e) => setEditCompanyForm((p) => ({ ...p, address: e.target.value }))} className={inputClass} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setEditCompanyModal(false); setEditingCompany(null); }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {submitting ? 'Saving...' : 'Update Company'}</button>
          </div>
        </form>
      </Modal>

      {/* New Claim Modal */}
      <Modal open={claimModalOpen} onClose={() => setClaimModalOpen(false)} title="New Insurance Claim">
        <form onSubmit={handleCreateClaim} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Billing / Invoice ID *</label>
              <input
                required
                type="number"
                value={claimForm.billingId}
                onChange={(e) => setClaimForm((p) => ({ ...p, billingId: e.target.value }))}
                className={inputClass}
                placeholder="Enter billing ID"
              />
            </div>
            <div>
              <label className={labelClass}>Insurance Company *</label>
              <select
                required
                value={claimForm.insuranceCompanyId}
                onChange={(e) => setClaimForm((p) => ({ ...p, insuranceCompanyId: e.target.value }))}
                className={inputClass}
              >
                <option value="">Select company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Patient ID *</label>
              <input
                required
                type="number"
                value={claimForm.patientId}
                onChange={(e) => setClaimForm((p) => ({ ...p, patientId: e.target.value }))}
                className={inputClass}
                placeholder="Enter patient ID"
              />
            </div>
            <div>
              <label className={labelClass}>Claim Amount *</label>
              <input
                required
                type="number"
                min={0}
                step="0.01"
                value={claimForm.claimAmount}
                onChange={(e) => setClaimForm((p) => ({ ...p, claimAmount: Number(e.target.value) }))}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Remarks</label>
            <textarea
              value={claimForm.remarks}
              onChange={(e) => setClaimForm((p) => ({ ...p, remarks: e.target.value }))}
              rows={3}
              className={inputClass}
              placeholder="Additional notes for this claim"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setClaimModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Claim Status Modal */}
      <Modal open={statusModalOpen} onClose={() => setStatusModalOpen(false)} title="Update Claim Status">
        {selectedClaim && (
          <form onSubmit={handleUpdateStatus} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="text-xs text-gray-500">Claim: <span className="font-medium text-gray-700">{selectedClaim.claimNumber}</span></p>
              <p className="text-xs text-gray-500">Patient: <span className="font-medium text-gray-700">{selectedClaim.patientName}</span></p>
              <p className="text-xs text-gray-500">Amount: <span className="font-medium text-gray-700">{formatCurrency(selectedClaim.claimAmount)}</span></p>
              <p className="text-xs text-gray-500">Current Status: <StatusBadge status={selectedClaim.status} /></p>
            </div>
            <div>
              <label className={labelClass}>New Status *</label>
              <select
                required
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className={inputClass}
              >
                {claimStatuses.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            {(newStatus === 'APPROVED' || newStatus === 'PARTIALLY_APPROVED' || newStatus === 'PAID') && (
              <div>
                <label className={labelClass}>Approved Amount</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
            )}
            <div>
              <label className={labelClass}>Remarks</label>
              <textarea
                value={statusRemarks}
                onChange={(e) => setStatusRemarks(e.target.value)}
                rows={3}
                className={inputClass}
                placeholder="Reason for status change"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
