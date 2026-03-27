import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, MapPin, Shield, Droplets, AlertTriangle,
  Calendar, User, Plus, BedDouble, FileText, Pill, Search, Printer,
  ChevronDown, ChevronUp, X, LogOut, Share2,
} from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import { patientApi, visitApi, billingApi, userApi, wardApi, pharmacyApi } from '../../api/services';
import { useHospitalStore } from '../../store/hospitalStore';
import type {
  Patient, Visit, Billing, User as UserType, Ward, Room, Bed, Admission,
  Drug, Prescription, VisitType,
} from '../../types';

type Tab = 'overview' | 'visits' | 'admissions' | 'billing';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);

// ─── Main Component ───────────────────────────────────────────────

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [billings, setBillings] = useState<Billing[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [visitsPage, setVisitsPage] = useState(0);
  const [visitsTotalPages, setVisitsTotalPages] = useState(1);
  const [billingsPage, setBillingsPage] = useState(0);
  const [billingsTotalPages, setBillingsTotalPages] = useState(1);

  // Modal state
  const [showNewVisit, setShowNewVisit] = useState(false);
  const [showAdmit, setShowAdmit] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [prescribeVisitId, setPrescribeVisitId] = useState<number | null>(null);
  const [dischargeAdmission, setDischargeAdmission] = useState<Admission | null>(null);

  const patientId = Number(id);

  useEffect(() => {
    const fetchPatient = async () => {
      setLoading(true);
      try {
        const res = await patientApi.getById(patientId);
        setPatient(res.data.data);
      } catch {
        // Error
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [patientId]);

  const fetchVisits = useCallback(() => {
    visitApi.getByPatient(patientId, visitsPage).then((res) => {
      setVisits(res.data.data.content);
      setVisitsTotalPages(res.data.data.totalPages);
    }).catch(() => {});
  }, [patientId, visitsPage]);

  const fetchBillings = useCallback(() => {
    billingApi.getByPatient(patientId, billingsPage).then((res) => {
      setBillings(res.data.data.content);
      setBillingsTotalPages(res.data.data.totalPages);
    }).catch(() => {});
  }, [patientId, billingsPage]);

  const fetchAdmissions = useCallback(() => {
    wardApi.getAdmissions('ADMITTED').then((res) => {
      const all = res.data.data.content;
      setAdmissions(all.filter((a) => a.patientId === patientId));
    }).catch(() => {});
  }, [patientId]);

  useEffect(() => {
    if (activeTab === 'visits') fetchVisits();
  }, [activeTab, fetchVisits]);

  useEffect(() => {
    if (activeTab === 'billing') fetchBillings();
  }, [activeTab, fetchBillings]);

  useEffect(() => {
    if (activeTab === 'admissions') fetchAdmissions();
  }, [activeTab, fetchAdmissions]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-20 text-gray-500">
        Patient not found.
        <button onClick={() => navigate('/patients')} className="block mx-auto mt-4 text-blue-600 hover:underline">
          Back to patients
        </button>
      </div>
    );
  }

  const age = patient.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'visits', label: 'Visits' },
    { key: 'admissions', label: 'Admissions' },
    { key: 'billing', label: 'Billing' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/patients')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{patient.fullName}</h1>
            <p className="text-sm text-gray-500">{patient.patientNo}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewVisit(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> New Visit
          </button>
          <button
            onClick={() => setShowAdmit(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
          >
            <BedDouble className="w-4 h-4" /> Admit
          </button>
          <button
            onClick={() => setShowInvoice(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            <FileText className="w-4 h-4" /> Create Invoice
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <InfoItem icon={<User className="w-4 h-4" />} label="Gender" value={patient.gender.charAt(0) + patient.gender.slice(1).toLowerCase()} />
          <InfoItem icon={<Calendar className="w-4 h-4" />} label="Date of Birth" value={`${patient.dateOfBirth}${age !== null ? ` (${age} yrs)` : ''}`} />
          <InfoItem icon={<Phone className="w-4 h-4" />} label="Phone" value={patient.phone} />
          <InfoItem icon={<Mail className="w-4 h-4" />} label="Email" value={patient.email || '-'} />
          <InfoItem icon={<MapPin className="w-4 h-4" />} label="Address" value={patient.address || '-'} />
          <InfoItem icon={<Droplets className="w-4 h-4" />} label="Blood Group" value={patient.bloodGroup || '-'} />
          <InfoItem icon={<AlertTriangle className="w-4 h-4" />} label="Allergies" value={patient.allergies || 'None'} />
          <InfoItem icon={<Shield className="w-4 h-4" />} label="Insurance" value={patient.insuranceCompanyName || 'None'} />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab patient={patient} />}
      {activeTab === 'visits' && (
        <VisitsTab
          visits={visits}
          page={visitsPage}
          totalPages={visitsTotalPages}
          onPageChange={setVisitsPage}
          onPrescribe={(visitId) => setPrescribeVisitId(visitId)}
        />
      )}
      {activeTab === 'admissions' && (
        <AdmissionsTab admissions={admissions} onDischarge={(a) => setDischargeAdmission(a)} />
      )}
      {activeTab === 'billing' && (
        <BillingTab
          billings={billings}
          patient={patient}
          page={billingsPage}
          totalPages={billingsTotalPages}
          onPageChange={setBillingsPage}
        />
      )}

      {/* Modals */}
      {showNewVisit && (
        <NewVisitModal
          patientId={patientId}
          onClose={() => setShowNewVisit(false)}
          onCreated={() => {
            setShowNewVisit(false);
            setActiveTab('visits');
            setVisitsPage(0);
            fetchVisits();
          }}
        />
      )}
      {showAdmit && (
        <AdmitModal
          patientId={patientId}
          onClose={() => setShowAdmit(false)}
          onCreated={() => {
            setShowAdmit(false);
            setActiveTab('admissions');
            fetchAdmissions();
          }}
        />
      )}
      {showInvoice && (
        <CreateInvoiceModal
          patientId={patientId}
          visits={visits}
          onClose={() => setShowInvoice(false)}
          onCreated={() => {
            setShowInvoice(false);
            setActiveTab('billing');
            setBillingsPage(0);
            fetchBillings();
          }}
        />
      )}
      {prescribeVisitId !== null && (
        <PrescribeModal
          visitId={prescribeVisitId}
          onClose={() => setPrescribeVisitId(null)}
          onCreated={() => {
            setPrescribeVisitId(null);
            fetchVisits();
          }}
        />
      )}
      {dischargeAdmission && (
        <DischargeModal
          admission={dischargeAdmission}
          onClose={() => setDischargeAdmission(null)}
          onDischarged={() => {
            setDischargeAdmission(null);
            fetchAdmissions();
          }}
        />
      )}
    </div>
  );
}

// ─── Shared Components ────────────────────────────────────────────

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-400 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-900 font-medium text-right">{value}</dd>
    </div>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

function InputField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
const btnPrimary = 'w-full py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50';

// ─── Overview Tab ─────────────────────────────────────────────────

function OverviewTab({ patient }: { patient: Patient }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Demographics</h3>
        <dl className="space-y-3">
          <DetailRow label="Full Name" value={patient.fullName} />
          <DetailRow label="ID Number" value={patient.idNumber || '-'} />
          <DetailRow label="Gender" value={patient.gender.charAt(0) + patient.gender.slice(1).toLowerCase()} />
          <DetailRow label="Date of Birth" value={patient.dateOfBirth} />
          <DetailRow label="Phone" value={patient.phone} />
          <DetailRow label="Email" value={patient.email || '-'} />
          <DetailRow label="Address" value={patient.address || '-'} />
        </dl>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Next of Kin</h3>
          <dl className="space-y-3">
            <DetailRow label="Name" value={patient.nextOfKinName || '-'} />
            <DetailRow label="Phone" value={patient.nextOfKinPhone || '-'} />
            <DetailRow label="Relationship" value={patient.nextOfKinRelationship || '-'} />
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Medical & Insurance</h3>
          <dl className="space-y-3">
            <DetailRow label="Blood Group" value={patient.bloodGroup || '-'} />
            <DetailRow label="Allergies" value={patient.allergies || 'None'} />
            <DetailRow label="Insurance Company" value={patient.insuranceCompanyName || 'None'} />
            <DetailRow label="Member Number" value={patient.insuranceMemberNumber || '-'} />
          </dl>
        </div>
      </div>
    </div>
  );
}

// ─── Visits Tab ───────────────────────────────────────────────────

function VisitsTab({
  visits,
  page,
  totalPages,
  onPageChange,
  onPrescribe,
}: {
  visits: Visit[];
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onPrescribe: (visitId: number) => void;
}) {
  if (visits.length === 0 && page === 0) {
    return <p className="text-center py-12 text-gray-400">No visits recorded.</p>;
  }

  return (
    <div className="space-y-4">
      {visits.map((visit) => (
        <VisitCard key={visit.id} visit={visit} onPrescribe={onPrescribe} />
      ))}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      )}
    </div>
  );
}

function VisitCard({ visit, onPrescribe }: { visit: Visit; onPrescribe: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [rxLoaded, setRxLoaded] = useState(false);

  useEffect(() => {
    if (expanded && !rxLoaded) {
      pharmacyApi.getVisitRx(visit.id).then((res) => {
        setPrescriptions(res.data.data);
        setRxLoaded(true);
      }).catch(() => setRxLoaded(true));
    }
  }, [expanded, rxLoaded, visit.id]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <StatusBadge status={visit.visitType} />
          {visit.completed && <StatusBadge status="COMPLETED" />}
        </div>
        <div className="flex items-center gap-2">
          {!visit.completed && (
            <button
              onClick={() => onPrescribe(visit.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100"
            >
              <Pill className="w-3.5 h-3.5" /> Prescribe
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <span className="text-xs text-gray-500">{new Date(visit.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div><span className="text-gray-500">Doctor:</span> <span className="font-medium text-gray-900">{visit.doctorName || 'Unassigned'}</span></div>
        <div><span className="text-gray-500">Chief Complaint:</span> <span className="font-medium text-gray-900">{visit.chiefComplaint || '-'}</span></div>
        {visit.diagnosis && (
          <div className="md:col-span-2"><span className="text-gray-500">Diagnosis:</span> <span className="font-medium text-gray-900">{visit.diagnosis}</span></div>
        )}
      </div>

      <div className="flex gap-4 mt-3 text-xs text-gray-500">
        {visit.prescriptions?.length > 0 && <span>{visit.prescriptions.length} prescription(s)</span>}
        {visit.labOrders?.length > 0 && <span>{visit.labOrders.length} lab order(s)</span>}
        {visit.imagingOrders?.length > 0 && <span>{visit.imagingOrders.length} imaging order(s)</span>}
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
          {/* Vitals */}
          {(visit.bloodPressure || visit.temperature || visit.pulseRate) && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Vitals</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {visit.bloodPressure && <div><span className="text-gray-500">BP:</span> {visit.bloodPressure}</div>}
                {visit.temperature && <div><span className="text-gray-500">Temp:</span> {visit.temperature}°C</div>}
                {visit.pulseRate && <div><span className="text-gray-500">Pulse:</span> {visit.pulseRate} bpm</div>}
                {visit.respiratoryRate && <div><span className="text-gray-500">RR:</span> {visit.respiratoryRate}/min</div>}
                {visit.oxygenSaturation && <div><span className="text-gray-500">SpO2:</span> {visit.oxygenSaturation}%</div>}
                {visit.weight && <div><span className="text-gray-500">Weight:</span> {visit.weight} kg</div>}
                {visit.height && <div><span className="text-gray-500">Height:</span> {visit.height} cm</div>}
              </div>
            </div>
          )}

          {/* Treatment Plan */}
          {visit.treatmentPlan && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Treatment Plan</h4>
              <p className="text-sm text-gray-700">{visit.treatmentPlan}</p>
            </div>
          )}

          {/* Prescriptions */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Prescriptions</h4>
            {!rxLoaded ? (
              <p className="text-xs text-gray-400">Loading...</p>
            ) : prescriptions.length === 0 ? (
              <p className="text-xs text-gray-400">No prescriptions for this visit.</p>
            ) : (
              <div className="space-y-2">
                {prescriptions.map((rx) => (
                  <div key={rx.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-900">{rx.drugName}</span>
                      <span className="text-gray-500 ml-2">{rx.dosage} — {rx.frequency} — {rx.duration}</span>
                    </div>
                    <StatusBadge status={rx.dispensed ? 'DISPENSED' : 'PENDING'} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admissions Tab ───────────────────────────────────────────────

function AdmissionsTab({
  admissions,
  onDischarge,
}: {
  admissions: Admission[];
  onDischarge: (a: Admission) => void;
}) {
  if (admissions.length === 0) {
    return <p className="text-center py-12 text-gray-400">No active admissions.</p>;
  }

  return (
    <div className="space-y-4">
      {admissions.map((adm) => (
        <div key={adm.id} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <StatusBadge status={adm.status} />
              <span className="text-sm font-medium text-gray-900">Ward: {adm.wardName}</span>
            </div>
            <span className="text-xs text-gray-500">{new Date(adm.admittedAt).toLocaleDateString()}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Room:</span> <span className="font-medium">{adm.roomNumber}</span></div>
            <div><span className="text-gray-500">Bed:</span> <span className="font-medium">{adm.bedNumber}</span></div>
            <div><span className="text-gray-500">Doctor:</span> <span className="font-medium">{adm.admittingDoctorName || '-'}</span></div>
            <div><span className="text-gray-500">Reason:</span> <span className="font-medium">{adm.admissionReason || '-'}</span></div>
          </div>
          {adm.status === 'ADMITTED' && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => onDischarge(adm)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100"
              >
                <LogOut className="w-4 h-4" /> Discharge Patient
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Billing Tab ──────────────────────────────────────────────────

function BillingTab({
  billings,
  patient,
  page,
  totalPages,
  onPageChange,
}: {
  billings: Billing[];
  patient: Patient;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  const hospital = useHospitalStore();

  if (billings.length === 0 && page === 0) {
    return <p className="text-center py-12 text-gray-400">No billing records.</p>;
  }

  const printReceipt = (bill: Billing) => {
    const win = window.open('', '_blank');
    if (!win) return;
    const balance = bill.totalAmount - bill.paidAmount - bill.insuranceCoveredAmount;
    win.document.write(`<!DOCTYPE html><html><head><title>Receipt - ${bill.invoiceNumber}</title>
<style>
body{font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:20px;color:#333}
.header{text-align:center;border-bottom:2px solid #333;padding-bottom:15px;margin-bottom:20px}
.header h1{margin:0;font-size:22px} .header p{margin:2px 0;font-size:12px;color:#666}
.info{display:flex;justify-content:space-between;margin-bottom:20px;font-size:13px}
table{width:100%;border-collapse:collapse;margin-bottom:20px}
th,td{padding:8px 10px;text-align:left;border-bottom:1px solid #ddd;font-size:13px}
th{background:#f5f5f5;font-weight:600}
.totals{text-align:right;font-size:14px;margin-bottom:20px}
.totals div{margin:4px 0} .totals .balance{font-weight:700;font-size:16px;color:#333}
.payments{margin-bottom:20px} .payments h3{font-size:14px;margin-bottom:8px}
.footer{text-align:center;font-size:11px;color:#999;border-top:1px solid #ddd;padding-top:10px;margin-top:30px}
@media print{body{padding:0}}
</style></head><body>
<div class="header">
<h1>${hospital.name}</h1>
<p>${hospital.tagline}</p>
<p>${hospital.address} | Tel: ${hospital.phone} | ${hospital.email}</p>
<p style="margin-top:8px;font-weight:600">Receipt / Invoice</p>
</div>
<div class="info">
<div><strong>Patient:</strong> ${patient.fullName}<br/><strong>Patient No:</strong> ${patient.patientNo}<br/><strong>Phone:</strong> ${patient.phone}</div>
<div style="text-align:right"><strong>Invoice:</strong> ${bill.invoiceNumber}<br/><strong>Date:</strong> ${new Date(bill.createdAt).toLocaleDateString()}<br/><strong>Status:</strong> ${bill.status}</div>
</div>
<table><thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>
${(bill.items || []).map(i => `<tr><td>${i.description}</td><td>${i.quantity}</td><td>${formatCurrency(i.unitPrice)}</td><td>${formatCurrency(i.totalPrice)}</td></tr>`).join('')}
${!bill.items || bill.items.length === 0 ? '<tr><td colspan="4" style="text-align:center;color:#999">No items</td></tr>' : ''}
</tbody></table>
<div class="totals">
<div>Total: <strong>${formatCurrency(bill.totalAmount)}</strong></div>
<div>Paid: <strong style="color:green">${formatCurrency(bill.paidAmount)}</strong></div>
<div>Insurance: <strong style="color:#2563eb">${formatCurrency(bill.insuranceCoveredAmount)}</strong></div>
<div class="balance">Balance: ${formatCurrency(balance)}</div>
</div>
${bill.payments?.length > 0 ? `<div class="payments"><h3>Payments</h3><table><thead><tr><th>Date</th><th>Method</th><th>Amount</th><th>Receipt #</th><th>Received By</th></tr></thead><tbody>
${bill.payments.map(p => `<tr><td>${new Date(p.createdAt).toLocaleDateString()}</td><td>${p.paymentMethod}</td><td>${formatCurrency(p.amount)}</td><td>${p.receiptNumber || '-'}</td><td>${p.receivedByName || '-'}</td></tr>`).join('')}
</tbody></table></div>` : ''}
<div class="footer"><p>Thank you for choosing ${hospital.name}</p><p>Printed on ${new Date().toLocaleString()}</p><p style="margin-top:6px;font-size:10px;color:#bbb">Developed by Helvino Technologies Limited | helvino.org | 0703445756</p></div>
</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  const shareReceiptWhatsApp = (bill: Billing) => {
    const balance = bill.totalAmount - bill.paidAmount - bill.insuranceCoveredAmount;
    const items = bill.items || [];
    const payments = bill.payments || [];

    const lines = [
      `*${hospital.name}*`,
      `_${hospital.tagline}_`,
      `${hospital.address} | Tel: ${hospital.phone}`,
      '',
      `*RECEIPT / INVOICE*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `*Invoice:* ${bill.invoiceNumber}`,
      `*Patient:* ${patient.fullName} (${patient.patientNo})`,
      `*Date:* ${new Date(bill.createdAt).toLocaleDateString()}`,
      `*Status:* ${bill.status}`,
    ];

    if (items.length > 0) {
      lines.push('', `*Services:*`);
      items.forEach((item) => {
        lines.push(`• ${item.description} (x${item.quantity}) — ${formatCurrency(item.totalPrice)}`);
      });
    }

    lines.push(
      '',
      `*Total:* ${formatCurrency(bill.totalAmount)}`,
      `*Paid:* ${formatCurrency(bill.paidAmount)}`,
      `*Insurance:* ${formatCurrency(bill.insuranceCoveredAmount)}`,
      `*Balance:* ${formatCurrency(Math.max(0, balance))}`,
    );

    if (payments.length > 0) {
      lines.push('', `*Payments:*`);
      payments.forEach((p) => {
        lines.push(`• ${formatCurrency(p.amount)} via ${p.paymentMethod.replace(/_/g, ' ')} on ${new Date(p.createdAt).toLocaleDateString()}${p.receiptNumber ? ` (${p.receiptNumber})` : ''}`);
      });
    }

    lines.push('', `━━━━━━━━━━━━━━━━━━━━`, `_Thank you for choosing ${hospital.name}_`);

    const text = encodeURIComponent(lines.join('\n'));
    const cleanPhone = (patient.phone || '').replace(/[\s\-()]/g, '').replace(/^0/, '254');
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      {billings.map((bill) => (
        <div key={bill.id} className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-900">{bill.invoiceNumber}</span>
              <StatusBadge status={bill.status} />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => shareReceiptWhatsApp(bill)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                <Share2 className="w-3.5 h-3.5" /> WhatsApp
              </button>
              <button
                onClick={() => printReceipt(bill)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
              <span className="text-xs text-gray-500">{new Date(bill.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><p className="text-gray-500">Total</p><p className="font-semibold text-gray-900">{formatCurrency(bill.totalAmount)}</p></div>
            <div><p className="text-gray-500">Paid</p><p className="font-semibold text-green-700">{formatCurrency(bill.paidAmount)}</p></div>
            <div><p className="text-gray-500">Insurance</p><p className="font-semibold text-blue-700">{formatCurrency(bill.insuranceCoveredAmount)}</p></div>
          </div>
          {bill.items?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Items</p>
              <div className="space-y-1">
                {bill.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs text-gray-700">
                    <span>{item.description} (x{item.quantity})</span>
                    <span>{formatCurrency(item.totalPrice)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      )}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
      <div className="flex gap-2">
        <button disabled={page === 0} onClick={() => onPageChange(page - 1)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50">Previous</button>
        <button disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50">Next</button>
      </div>
    </div>
  );
}

// ─── New Visit Modal ──────────────────────────────────────────────

function NewVisitModal({ patientId, onClose, onCreated }: { patientId: number; onClose: () => void; onCreated: () => void }) {
  const [doctors, setDoctors] = useState<UserType[]>([]);
  const [doctorId, setDoctorId] = useState('');
  const [visitType, setVisitType] = useState<VisitType>('OPD');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    userApi.getByRole('DOCTOR').then((res) => setDoctors(res.data.data)).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await visitApi.create({ patientId, doctorId: doctorId ? Number(doctorId) : undefined, visitType, chiefComplaint });
      onCreated();
    } catch {
      alert('Failed to create visit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="New Visit" onClose={onClose}>
      <div className="space-y-4">
        <InputField label="Doctor">
          <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className={inputCls}>
            <option value="">Select Doctor</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.fullName} — {d.specialization || d.department}</option>)}
          </select>
        </InputField>
        <InputField label="Visit Type">
          <select value={visitType} onChange={(e) => setVisitType(e.target.value as VisitType)} className={inputCls}>
            <option value="OPD">Outpatient (OPD)</option>
            <option value="IPD">Inpatient (IPD)</option>
            <option value="EMERGENCY">Emergency</option>
          </select>
        </InputField>
        <InputField label="Chief Complaint">
          <textarea value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} rows={3} className={inputCls} placeholder="Describe the chief complaint..." />
        </InputField>
        <button onClick={handleSubmit} disabled={saving} className={btnPrimary}>{saving ? 'Creating...' : 'Create Visit'}</button>
      </div>
    </ModalShell>
  );
}

// ─── Admit Modal ──────────────────────────────────────────────────

function AdmitModal({ patientId, onClose, onCreated }: { patientId: number; onClose: () => void; onCreated: () => void }) {
  const [doctors, setDoctors] = useState<UserType[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [wardId, setWardId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [bedId, setBedId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    userApi.getByRole('DOCTOR').then((res) => setDoctors(res.data.data)).catch(() => {});
    wardApi.getWards().then((res) => setWards(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (wardId) {
      setRoomId('');
      setBedId('');
      setRooms([]);
      setBeds([]);
      wardApi.getRooms(Number(wardId)).then((res) => setRooms(res.data.data)).catch(() => {});
    }
  }, [wardId]);

  useEffect(() => {
    if (roomId) {
      setBedId('');
      wardApi.getAvailableBeds().then((res) => {
        setBeds(res.data.data.filter((b) => b.roomId === Number(roomId)));
      }).catch(() => {});
    }
  }, [roomId]);

  const handleSubmit = async () => {
    if (!bedId) { alert('Please select a bed'); return; }
    setSaving(true);
    try {
      await wardApi.admit({
        patientId,
        bedId: Number(bedId),
        admittingDoctorId: doctorId ? Number(doctorId) : undefined,
        admissionReason: reason,
      });
      onCreated();
    } catch {
      alert('Failed to admit patient');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Admit Patient" onClose={onClose}>
      <div className="space-y-4">
        <InputField label="Ward">
          <select value={wardId} onChange={(e) => setWardId(e.target.value)} className={inputCls}>
            <option value="">Select Ward</option>
            {wards.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.availableBeds} beds available)</option>)}
          </select>
        </InputField>
        <InputField label="Room">
          <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className={inputCls} disabled={!wardId}>
            <option value="">Select Room</option>
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.roomNumber} ({r.type})</option>)}
          </select>
        </InputField>
        <InputField label="Bed">
          <select value={bedId} onChange={(e) => setBedId(e.target.value)} className={inputCls} disabled={!roomId}>
            <option value="">Select Bed</option>
            {beds.map((b) => <option key={b.id} value={b.id}>{b.bedNumber} — {formatCurrency(b.dailyCharge)}/day</option>)}
          </select>
        </InputField>
        <InputField label="Admitting Doctor">
          <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className={inputCls}>
            <option value="">Select Doctor</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
          </select>
        </InputField>
        <InputField label="Admission Reason">
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className={inputCls} placeholder="Reason for admission..." />
        </InputField>
        <button onClick={handleSubmit} disabled={saving || !bedId} className={btnPrimary}>{saving ? 'Admitting...' : 'Admit Patient'}</button>
      </div>
    </ModalShell>
  );
}

// ─── Prescribe Modal ──────────────────────────────────────────────

function PrescribeModal({ visitId, onClose, onCreated }: { visitId: number; onClose: () => void; onCreated: () => void }) {
  const [drugSearch, setDrugSearch] = useState('');
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [quantity, setQuantity] = useState('');
  const [instructions, setInstructions] = useState('');
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (drugSearch.length < 2) { setDrugs([]); return; }
    const timer = setTimeout(() => {
      setSearching(true);
      pharmacyApi.searchDrugs(drugSearch).then((res) => setDrugs(res.data.data.content)).catch(() => {}).finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [drugSearch]);

  const handleSubmit = async () => {
    if (!selectedDrug) return;
    setSaving(true);
    try {
      await pharmacyApi.createPrescription({
        visitId,
        drugId: selectedDrug.id,
        dosage,
        frequency,
        duration,
        quantityPrescribed: Number(quantity),
        instructions,
      });
      onCreated();
    } catch {
      alert('Failed to create prescription');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Prescribe Medication" onClose={onClose}>
      <div className="space-y-4">
        {!selectedDrug ? (
          <InputField label="Search Drug">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                value={drugSearch}
                onChange={(e) => setDrugSearch(e.target.value)}
                className={`${inputCls} pl-9`}
                placeholder="Type to search drugs..."
              />
            </div>
            {searching && <p className="text-xs text-gray-400 mt-1">Searching...</p>}
            {drugs.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                {drugs.map((drug) => (
                  <button
                    key={drug.id}
                    onClick={() => { setSelectedDrug(drug); setDrugs([]); setDrugSearch(''); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                  >
                    <span className="font-medium">{drug.brandName}</span>
                    <span className="text-gray-500 ml-2">({drug.genericName})</span>
                    <span className="text-gray-400 ml-2">{drug.strength} — Stock: {drug.quantityInStock}</span>
                  </button>
                ))}
              </div>
            )}
          </InputField>
        ) : (
          <div className="bg-blue-50 rounded-lg px-3 py-2 flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium text-blue-900">{selectedDrug.brandName}</span>
              <span className="text-blue-700 ml-2">({selectedDrug.genericName}) {selectedDrug.strength}</span>
            </div>
            <button onClick={() => setSelectedDrug(null)} className="text-blue-500 hover:text-blue-700"><X className="w-4 h-4" /></button>
          </div>
        )}
        <InputField label="Dosage">
          <input value={dosage} onChange={(e) => setDosage(e.target.value)} className={inputCls} placeholder="e.g., 500mg" />
        </InputField>
        <InputField label="Frequency">
          <input value={frequency} onChange={(e) => setFrequency(e.target.value)} className={inputCls} placeholder="e.g., 3 times daily" />
        </InputField>
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Duration">
            <input value={duration} onChange={(e) => setDuration(e.target.value)} className={inputCls} placeholder="e.g., 5 days" />
          </InputField>
          <InputField label="Quantity">
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputCls} placeholder="15" />
          </InputField>
        </div>
        <InputField label="Instructions">
          <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={2} className={inputCls} placeholder="Take after meals..." />
        </InputField>
        <button onClick={handleSubmit} disabled={saving || !selectedDrug || !dosage || !frequency} className={btnPrimary}>{saving ? 'Prescribing...' : 'Create Prescription'}</button>
      </div>
    </ModalShell>
  );
}

// ─── Discharge Modal ──────────────────────────────────────────────

function DischargeModal({ admission, onClose, onDischarged }: { admission: Admission; onClose: () => void; onDischarged: () => void }) {
  const [summary, setSummary] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await wardApi.discharge(admission.id, summary);
      onDischarged();
    } catch {
      alert('Failed to discharge patient');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Discharge Patient" onClose={onClose}>
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <p><span className="text-gray-500">Ward:</span> <span className="font-medium">{admission.wardName}</span></p>
          <p><span className="text-gray-500">Room:</span> <span className="font-medium">{admission.roomNumber}</span> — <span className="text-gray-500">Bed:</span> <span className="font-medium">{admission.bedNumber}</span></p>
          <p><span className="text-gray-500">Admitted:</span> <span className="font-medium">{new Date(admission.admittedAt).toLocaleDateString()}</span></p>
        </div>
        <InputField label="Discharge Summary">
          <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={4} className={inputCls} placeholder="Summary of stay, outcomes, follow-up instructions..." />
        </InputField>
        <button onClick={handleSubmit} disabled={saving || !summary.trim()} className="w-full py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
          {saving ? 'Discharging...' : 'Discharge Patient'}
        </button>
      </div>
    </ModalShell>
  );
}

// ─── Create Invoice Modal ─────────────────────────────────────────

function CreateInvoiceModal({
  patientId,
  visits,
  onClose,
  onCreated,
}: {
  patientId: number;
  visits: Visit[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [visitId, setVisitId] = useState('');
  const [items, setItems] = useState([{ serviceType: 'CONSULTATION', description: '', quantity: 1, unitPrice: 0 }]);
  const [saving, setSaving] = useState(false);

  const addItem = () => setItems([...items, { serviceType: 'SERVICE', description: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string | number) => {
    const updated = [...items];
    (updated[i] as Record<string, string | number>)[field] = value;
    setItems(updated);
  };

  const handleSubmit = async () => {
    const validItems = items.filter((it) => it.description && it.unitPrice > 0);
    if (validItems.length === 0) { alert('Add at least one item'); return; }
    setSaving(true);
    try {
      const res = await billingApi.create({
        patientId,
        visitId: visitId ? Number(visitId) : undefined,
      });
      const billingId = res.data.data.id;
      for (const item of validItems) {
        await billingApi.addItem(billingId, {
          serviceType: item.serviceType,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        });
      }
      onCreated();
    } catch {
      alert('Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Create Invoice" onClose={onClose}>
      <div className="space-y-4">
        <InputField label="Linked Visit (optional)">
          <select value={visitId} onChange={(e) => setVisitId(e.target.value)} className={inputCls}>
            <option value="">No linked visit</option>
            {visits.map((v) => (
              <option key={v.id} value={v.id}>
                {new Date(v.createdAt).toLocaleDateString()} — {v.visitType} — {v.chiefComplaint || 'No complaint'}
              </option>
            ))}
          </select>
        </InputField>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Items</label>
            <button onClick={addItem} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Item
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <select
                    value={item.serviceType}
                    onChange={(e) => updateItem(i, 'serviceType', e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="CONSULTATION">Consultation</option>
                    <option value="PROCEDURE">Procedure</option>
                    <option value="MEDICATION">Medication</option>
                    <option value="LAB_TEST">Lab Test</option>
                    <option value="IMAGING">Imaging</option>
                    <option value="SERVICE">Service</option>
                    <option value="BED_CHARGE">Bed Charge</option>
                  </select>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                  )}
                </div>
                <input
                  value={item.description}
                  onChange={(e) => updateItem(i, 'description', e.target.value)}
                  className={inputCls}
                  placeholder="Description"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))}
                    className={inputCls}
                    placeholder="Qty"
                    min={1}
                  />
                  <input
                    type="number"
                    value={item.unitPrice || ''}
                    onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value))}
                    className={inputCls}
                    placeholder="Unit Price"
                    min={0}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-right text-sm font-medium text-gray-700">
          Total: {formatCurrency(items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0))}
        </div>

        <button onClick={handleSubmit} disabled={saving} className={btnPrimary}>{saving ? 'Creating...' : 'Create Invoice'}</button>
      </div>
    </ModalShell>
  );
}
