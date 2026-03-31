import { useEffect, useState, useCallback } from 'react';
import { X, FileText, ClipboardList, FlaskConical, Receipt, LogOut, Stethoscope, Plus, Save } from 'lucide-react';
import { wardApi, labApi, billingApi } from '../api/services';
import type { Admission, NursingNote, TreatmentEntry, LabOrder, Billing } from '../types';
import { useAuthStore } from '../store/authStore';
import StatusBadge from './StatusBadge';

interface Props {
  admission: Admission;
  onClose: () => void;
  onDischarge: () => void;
}

type CardexTab = 'admission-note' | 'nursing-notes' | 'treatment-sheet' | 'lab-orders' | 'billing' | 'discharge';

const TREATMENT_TYPES = ['MEDICATION', 'PROCEDURE', 'NURSING_CARE', 'IV_FLUID', 'OBSERVATION'];
const ROUTES = ['Oral', 'IV', 'IM', 'SC', 'Topical', 'Inhalation', 'Sublingual', 'Rectal', 'Nasal', 'Other'];

export default function BedCardexModal({ admission, onClose, onDischarge }: Props) {
  const userId = useAuthStore((s) => s.userId);
  const [activeTab, setActiveTab] = useState<CardexTab>('admission-note');

  // Admission note
  const [admissionNote, setAdmissionNote] = useState(admission.admissionNote || '');
  const [savingNote, setSavingNote] = useState(false);

  // Nursing notes
  const [nursingNotes, setNursingNotes] = useState<NursingNote[]>([]);
  const [nursingForm, setNursingForm] = useState({ notes: '', vitalSigns: '' });
  const [savingNursing, setSavingNursing] = useState(false);

  // Treatment sheet
  const [treatmentEntries, setTreatmentEntries] = useState<TreatmentEntry[]>([]);
  const [treatmentForm, setTreatmentForm] = useState({
    treatmentType: 'MEDICATION', description: '', dose: '', route: '',
    frequency: '', scheduledTime: '', notes: ''
  });
  const [savingTreatment, setSavingTreatment] = useState(false);

  // Lab orders
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);

  // Billing
  const [billing, setBilling] = useState<Billing | null>(null);

  // Discharge
  const [dischargeSummary, setDischargeSummary] = useState(admission.dischargeSummary || '');
  const [discharging, setDischarging] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [notesRes, treatRes] = await Promise.all([
        wardApi.getNursingNotes(admission.id),
        wardApi.getTreatmentEntries(admission.id),
      ]);
      setNursingNotes(notesRes.data.data);
      setTreatmentEntries(treatRes.data.data);
    } catch { /* handled */ }

    if (admission.visitId) {
      try {
        const labRes = await labApi.getOrdersByVisit(admission.visitId);
        setLabOrders(labRes.data.data);
      } catch { /* handled */ }
      try {
        const billRes = await billingApi.getByVisit(admission.visitId);
        setBilling(billRes.data.data);
      } catch { /* handled */ }
    }
  }, [admission.id, admission.visitId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaveAdmissionNote = async () => {
    setSavingNote(true);
    try {
      await wardApi.updateAdmissionNote(admission.id, admissionNote);
    } catch { /* handled */ } finally {
      setSavingNote(false);
    }
  };

  const handleAddNursingNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSavingNursing(true);
    try {
      await wardApi.addNursingNote({
        admissionId: admission.id,
        nurseId: userId,
        notes: nursingForm.notes,
        vitalSigns: nursingForm.vitalSigns,
      });
      setNursingForm({ notes: '', vitalSigns: '' });
      const res = await wardApi.getNursingNotes(admission.id);
      setNursingNotes(res.data.data);
    } catch { /* handled */ } finally {
      setSavingNursing(false);
    }
  };

  const handleAddTreatmentEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSavingTreatment(true);
    try {
      await wardApi.addTreatmentEntry({
        admissionId: admission.id,
        recordedById: userId,
        ...treatmentForm,
      });
      setTreatmentForm({ treatmentType: 'MEDICATION', description: '', dose: '', route: '', frequency: '', scheduledTime: '', notes: '' });
      const res = await wardApi.getTreatmentEntries(admission.id);
      setTreatmentEntries(res.data.data);
    } catch { /* handled */ } finally {
      setSavingTreatment(false);
    }
  };

  const handleDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    setDischarging(true);
    try {
      await wardApi.discharge(admission.id, dischargeSummary);
      onDischarge();
    } catch { /* handled */ } finally {
      setDischarging(false);
    }
  };

  const tabs: { id: CardexTab; label: string; icon: React.ReactNode }[] = [
    { id: 'admission-note', label: 'Admission Note', icon: <Stethoscope className="w-4 h-4" /> },
    { id: 'nursing-notes', label: 'Nursing Notes', icon: <FileText className="w-4 h-4" /> },
    { id: 'treatment-sheet', label: 'Treatment Sheet', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'lab-orders', label: 'Lab Orders', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'billing', label: 'Billing', icon: <Receipt className="w-4 h-4" /> },
    { id: 'discharge', label: 'Discharge', icon: <LogOut className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl my-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Nursing Cardex — {admission.patientName}</h2>
            <p className="text-sm text-gray-500">
              {admission.patientNo} · {admission.wardName} · Room {admission.roomNumber} · Bed {admission.bedNumber}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 border-b border-gray-200 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === t.id
                  ? 'bg-white border border-b-white border-gray-200 text-primary-600 -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">

          {/* Admission Note */}
          {activeTab === 'admission-note' && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Admission Reason</p>
                <p className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 border border-gray-200">
                  {admission.admissionReason || <span className="text-gray-400">Not specified</span>}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admission Note (Clinical History & Examination)</label>
                <textarea
                  rows={10}
                  value={admissionNote}
                  onChange={(e) => setAdmissionNote(e.target.value)}
                  placeholder="Document presenting complaint, history of presenting illness, past medical history, examination findings, initial assessment and plan..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
              <button
                onClick={handleSaveAdmissionNote}
                disabled={savingNote}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />{savingNote ? 'Saving...' : 'Save Admission Note'}
              </button>
            </div>
          )}

          {/* Nursing Notes */}
          {activeTab === 'nursing-notes' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-800 mb-3">Add Nursing Note</h3>
                <form onSubmit={handleAddNursingNote} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vital Signs</label>
                    <input
                      value={nursingForm.vitalSigns}
                      onChange={(e) => setNursingForm({ ...nursingForm, vitalSigns: e.target.value })}
                      placeholder="e.g. BP 120/80, T 36.5°C, HR 80, RR 18, SpO2 98%"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-red-500">*</span></label>
                    <textarea
                      rows={5}
                      value={nursingForm.notes}
                      onChange={(e) => setNursingForm({ ...nursingForm, notes: e.target.value })}
                      placeholder="Document nursing assessment, interventions, patient response, concerns..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingNursing}
                    className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />{savingNursing ? 'Saving...' : 'Add Note'}
                  </button>
                </form>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 mb-3">Nursing Notes History</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {nursingNotes.length === 0 && <p className="text-sm text-gray-400">No nursing notes yet</p>}
                  {nursingNotes.map((n) => (
                    <div key={n.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-primary-600">{n.nurseName}</span>
                        <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                      {n.vitalSigns && (
                        <p className="text-xs text-emerald-700 bg-emerald-50 rounded px-2 py-1 mb-1">{n.vitalSigns}</p>
                      )}
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{n.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Treatment Sheet */}
          {activeTab === 'treatment-sheet' && (
            <div className="space-y-6">
              <form onSubmit={handleAddTreatmentEntry} className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
                <h3 className="font-medium text-gray-800">Add Treatment Entry</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
                    <select
                      value={treatmentForm.treatmentType}
                      onChange={(e) => setTreatmentForm({ ...treatmentForm, treatmentType: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    >
                      {TREATMENT_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                    <input
                      value={treatmentForm.description}
                      onChange={(e) => setTreatmentForm({ ...treatmentForm, description: e.target.value })}
                      placeholder="e.g. Amoxicillin, Wound dressing, Catheterization..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Dose</label>
                    <input
                      value={treatmentForm.dose}
                      onChange={(e) => setTreatmentForm({ ...treatmentForm, dose: e.target.value })}
                      placeholder="e.g. 500mg, 1L"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Route</label>
                    <select
                      value={treatmentForm.route}
                      onChange={(e) => setTreatmentForm({ ...treatmentForm, route: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Select route</option>
                      {ROUTES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Frequency</label>
                    <input
                      value={treatmentForm.frequency}
                      onChange={(e) => setTreatmentForm({ ...treatmentForm, frequency: e.target.value })}
                      placeholder="e.g. TDS, BD, OD, PRN"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Scheduled Time</label>
                    <input
                      value={treatmentForm.scheduledTime}
                      onChange={(e) => setTreatmentForm({ ...treatmentForm, scheduledTime: e.target.value })}
                      placeholder="e.g. 08:00, 14:00, 20:00"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                  <input
                    value={treatmentForm.notes}
                    onChange={(e) => setTreatmentForm({ ...treatmentForm, notes: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingTreatment}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />{savingTreatment ? 'Saving...' : 'Add Entry'}
                </button>
              </form>

              {/* Treatment entries table */}
              <div>
                <h3 className="font-medium text-gray-800 mb-3">Treatment Sheet</h3>
                {treatmentEntries.length === 0 ? (
                  <p className="text-sm text-gray-400">No treatment entries yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-3 py-2 text-xs font-medium text-gray-600">Date/Time</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-gray-600">Type</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-gray-600">Description</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-gray-600">Dose/Route</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-gray-600">Frequency</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-gray-600">By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {treatmentEntries.map((e) => (
                          <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-3 py-2 text-xs text-gray-500">{new Date(e.createdAt).toLocaleString()}</td>
                            <td className="px-3 py-2">
                              <span className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">{e.treatmentType.replace('_', ' ')}</span>
                            </td>
                            <td className="px-3 py-2 font-medium">{e.description}</td>
                            <td className="px-3 py-2 text-gray-600">{[e.dose, e.route].filter(Boolean).join(' / ') || '-'}</td>
                            <td className="px-3 py-2 text-gray-600">{e.frequency || '-'}</td>
                            <td className="px-3 py-2 text-xs text-gray-500">{e.recordedByName || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lab Orders */}
          {activeTab === 'lab-orders' && (
            <div>
              {!admission.visitId && (
                <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3 mb-4">
                  This admission is not linked to a visit. Lab orders are tied to visits.
                </p>
              )}
              {labOrders.length === 0 ? (
                <p className="text-sm text-gray-400">No lab orders for this admission</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-600">Test</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-600">Category</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-600">Status</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-600">Result</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-600">Ordered By</th>
                        <th className="text-left px-3 py-2 text-xs font-medium text-gray-600">Ordered At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {labOrders.map((o) => (
                        <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium">{o.testName}</td>
                          <td className="px-3 py-2 text-gray-500">{o.category}</td>
                          <td className="px-3 py-2"><StatusBadge status={o.status} /></td>
                          <td className={`px-3 py-2 ${o.abnormal ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                            {o.result || '-'}{o.abnormal ? ' ⚠' : ''}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-500">{o.orderedByName}</td>
                          <td className="px-3 py-2 text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Billing */}
          {activeTab === 'billing' && (
            <div>
              {!admission.visitId && (
                <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3 mb-4">
                  This admission is not linked to a visit. Billing is tied to visits.
                </p>
              )}
              {!billing ? (
                <p className="text-sm text-gray-400">No billing record found for this admission</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl border border-gray-200 p-4">
                    <div>
                      <p className="text-sm text-gray-500">Invoice</p>
                      <p className="font-semibold">{billing.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="font-bold text-lg">KES {billing.totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Paid</p>
                      <p className="font-semibold text-emerald-600">KES {billing.paidAmount.toLocaleString()}</p>
                    </div>
                    <StatusBadge status={billing.status} />
                  </div>
                  {billing.items && billing.items.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="text-left px-3 py-2 text-xs font-medium text-gray-600">Service</th>
                            <th className="text-left px-3 py-2 text-xs font-medium text-gray-600">Description</th>
                            <th className="text-right px-3 py-2 text-xs font-medium text-gray-600">Qty</th>
                            <th className="text-right px-3 py-2 text-xs font-medium text-gray-600">Unit Price</th>
                            <th className="text-right px-3 py-2 text-xs font-medium text-gray-600">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {billing.items.map((item) => (
                            <tr key={item.id} className="border-b border-gray-100">
                              <td className="px-3 py-2 text-xs text-gray-500">{item.serviceType}</td>
                              <td className="px-3 py-2">{item.description}</td>
                              <td className="px-3 py-2 text-right">{item.quantity}</td>
                              <td className="px-3 py-2 text-right">KES {item.unitPrice.toLocaleString()}</td>
                              <td className="px-3 py-2 text-right font-medium">KES {item.totalPrice.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Discharge */}
          {activeTab === 'discharge' && (
            <div className="space-y-4">
              {admission.status === 'DISCHARGED' ? (
                <div className="space-y-3">
                  <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg p-3">
                    Patient discharged on {admission.dischargedAt ? new Date(admission.dischargedAt).toLocaleString() : '-'}
                  </p>
                  {admission.dischargeSummary && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Discharge Summary</p>
                      <p className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 border border-gray-200 whitespace-pre-wrap">
                        {admission.dischargeSummary}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleDischarge} className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-800 font-medium">Discharge Patient</p>
                    <p className="text-xs text-amber-700 mt-1">
                      This will discharge {admission.patientName} from Bed {admission.bedNumber} and mark the bed as available.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discharge Summary</label>
                    <textarea
                      rows={8}
                      value={dischargeSummary}
                      onChange={(e) => setDischargeSummary(e.target.value)}
                      placeholder="Document discharge diagnosis, treatment given, condition at discharge, discharge medications, follow-up instructions..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={discharging}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" />{discharging ? 'Discharging...' : 'Discharge Patient'}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
