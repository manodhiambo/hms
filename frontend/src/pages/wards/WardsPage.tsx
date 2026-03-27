import { useEffect, useState, useCallback } from 'react';
import { BedDouble, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { wardApi } from '../../api/services';
import type { Ward, Room, Bed, Admission } from '../../types';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import DataTable from '../../components/DataTable';

export default function WardsPage() {
  const [tab, setTab] = useState<'wards' | 'beds' | 'admissions'>('wards');
  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [admPage, setAdmPage] = useState(0);
  const [admTotalPages, setAdmTotalPages] = useState(1);

  // Ward modal
  const [showWardModal, setShowWardModal] = useState(false);
  const [wardForm, setWardForm] = useState({ name: '', type: '', totalBeds: '' });

  // Room modal
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomForm, setRoomForm] = useState({ wardId: '', roomNumber: '', type: 'Standard' });

  // Bed modal
  const [showBedModal, setShowBedModal] = useState(false);
  const [bedForm, setBedForm] = useState({ roomId: '', bedNumber: '', dailyCharge: '' });

  // Expanded ward for rooms view
  const [expandedWard, setExpandedWard] = useState<number | null>(null);
  const [wardRooms, setWardRooms] = useState<Record<number, Room[]>>({});

  const refreshData = useCallback(() => {
    wardApi.getWards().then((r) => setWards(r.data.data)).catch(() => {});
    wardApi.getAvailableBeds().then((r) => setBeds(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    refreshData();
    loadAdmissions(0);
  }, [refreshData]);

  const loadAdmissions = (p: number) => {
    wardApi.getAdmissions('ADMITTED', p).then((r) => {
      setAdmissions(r.data.data.content);
      setAdmTotalPages(r.data.data.totalPages);
      setAdmPage(p);
    }).catch(() => {});
  };

  const toggleWardExpand = async (wardId: number) => {
    if (expandedWard === wardId) {
      setExpandedWard(null);
      return;
    }
    setExpandedWard(wardId);
    if (!wardRooms[wardId]) {
      try {
        const res = await wardApi.getRooms(wardId);
        setWardRooms((prev) => ({ ...prev, [wardId]: res.data.data }));
      } catch { /* handled */ }
    }
  };

  const handleCreateWard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await wardApi.createWard({ name: wardForm.name, type: wardForm.type, totalBeds: Number(wardForm.totalBeds), active: true });
      setShowWardModal(false);
      setWardForm({ name: '', type: '', totalBeds: '' });
      refreshData();
    } catch { /* handled */ }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await wardApi.createRoom({ wardId: Number(roomForm.wardId), roomNumber: roomForm.roomNumber, type: roomForm.type });
      setShowRoomModal(false);
      setRoomForm({ wardId: '', roomNumber: '', type: 'Standard' });
      // Refresh rooms for expanded ward
      if (expandedWard) {
        const res = await wardApi.getRooms(expandedWard);
        setWardRooms((prev) => ({ ...prev, [expandedWard]: res.data.data }));
      }
      refreshData();
    } catch { /* handled */ }
  };

  const handleCreateBed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await wardApi.createBed({ roomId: Number(bedForm.roomId), bedNumber: bedForm.bedNumber, dailyCharge: Number(bedForm.dailyCharge) || 0 });
      setShowBedModal(false);
      setBedForm({ roomId: '', bedNumber: '', dailyCharge: '' });
      // Refresh rooms for expanded ward
      if (expandedWard) {
        const res = await wardApi.getRooms(expandedWard);
        setWardRooms((prev) => ({ ...prev, [expandedWard]: res.data.data }));
      }
      refreshData();
    } catch { /* handled */ }
  };

  const tabs = [
    { id: 'wards' as const, label: 'Wards & Rooms' },
    { id: 'beds' as const, label: `Available Beds (${beds.length})` },
    { id: 'admissions' as const, label: 'Current Admissions' },
  ];

  const admissionCols = [
    { key: 'patientName', label: 'Patient', render: (a: Admission) => <div><div className="font-medium">{a.patientName}</div><div className="text-xs text-gray-500">{a.patientNo}</div></div> },
    { key: 'wardName', label: 'Ward' },
    { key: 'roomNumber', label: 'Room' },
    { key: 'bedNumber', label: 'Bed' },
    { key: 'admittingDoctorName', label: 'Doctor', render: (a: Admission) => a.admittingDoctorName || '-' },
    { key: 'status', label: 'Status', render: (a: Admission) => <StatusBadge status={a.status} /> },
    { key: 'admittedAt', label: 'Admitted', render: (a: Admission) => a.admittedAt ? new Date(a.admittedAt).toLocaleDateString() : '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BedDouble className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Wards & Beds</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowBedModal(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700">
            <Plus className="w-4 h-4" /> Add Bed
          </button>
          <button onClick={() => setShowRoomModal(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add Room
          </button>
          <button onClick={() => setShowWardModal(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
            <Plus className="w-4 h-4" /> Add Ward
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'wards' && (
        <div className="space-y-3">
          {wards.map((w) => (
            <div key={w.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleWardExpand(w.id)}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {expandedWard === w.id ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">{w.name}</h3>
                    <p className="text-sm text-gray-500">Total Beds: {w.totalBeds || 0}</p>
                  </div>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{w.type}</span>
              </button>

              {expandedWard === w.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-4">
                  {wardRooms[w.id] && wardRooms[w.id].length > 0 ? (
                    <div className="space-y-3">
                      {wardRooms[w.id].map((room) => (
                        <div key={room.id} className="bg-white rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-800">Room {room.roomNumber}</h4>
                            <span className="text-xs text-gray-500">{room.type}</span>
                          </div>
                          {room.beds && room.beds.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {room.beds.map((bed) => (
                                <div key={bed.id} className={`rounded-lg border p-3 text-sm ${
                                  bed.status === 'AVAILABLE'
                                    ? 'border-green-200 bg-green-50'
                                    : bed.status === 'OCCUPIED'
                                    ? 'border-red-200 bg-red-50'
                                    : 'border-yellow-200 bg-yellow-50'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">Bed {bed.bedNumber}</span>
                                    <StatusBadge status={bed.status} />
                                  </div>
                                  {bed.dailyCharge > 0 && <p className="text-xs text-gray-500 mt-1">KES {bed.dailyCharge}/day</p>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400">No beds in this room. Click "Add Bed" to create one.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">No rooms in this ward. Click "Add Room" to create one.</p>
                  )}
                </div>
              )}
            </div>
          ))}
          {wards.length === 0 && <p className="text-center text-gray-400 py-8">No wards created yet</p>}
        </div>
      )}

      {tab === 'beds' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {beds.map((b) => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">Bed {b.bedNumber}</span>
                <StatusBadge status={b.status} />
              </div>
              <p className="text-xs text-gray-500">{b.wardName} - Room {b.roomNumber}</p>
              {b.dailyCharge > 0 && <p className="text-xs text-gray-500 mt-1">KES {b.dailyCharge}/day</p>}
            </div>
          ))}
          {beds.length === 0 && <p className="col-span-4 text-center text-gray-400 py-8">No available beds</p>}
        </div>
      )}

      {tab === 'admissions' && (
        <DataTable columns={admissionCols} data={admissions} page={admPage} totalPages={admTotalPages} onPageChange={loadAdmissions} />
      )}

      {/* Add Ward Modal */}
      <Modal open={showWardModal} onClose={() => setShowWardModal(false)} title="Add Ward">
        <form onSubmit={handleCreateWard} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ward Name</label>
            <input value={wardForm.name} onChange={(e) => setWardForm({ ...wardForm, name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={wardForm.type} onChange={(e) => setWardForm({ ...wardForm, type: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required>
              <option value="">Select type</option>
              <option value="General">General</option>
              <option value="ICU">ICU</option>
              <option value="Maternity">Maternity</option>
              <option value="Pediatric">Pediatric</option>
              <option value="Surgical">Surgical</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Beds (planned)</label>
            <input type="number" value={wardForm.totalBeds} onChange={(e) => setWardForm({ ...wardForm, totalBeds: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700">Create Ward</button>
        </form>
      </Modal>

      {/* Add Room Modal */}
      <Modal open={showRoomModal} onClose={() => setShowRoomModal(false)} title="Add Room">
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ward</label>
            <select value={roomForm.wardId} onChange={(e) => setRoomForm({ ...roomForm, wardId: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required>
              <option value="">Select ward</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
            <input value={roomForm.roomNumber} onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
              placeholder="e.g. 101, A1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
            <select value={roomForm.type} onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="Standard">Standard</option>
              <option value="Private">Private</option>
              <option value="Semi-Private">Semi-Private</option>
              <option value="ICU">ICU</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Create Room</button>
        </form>
      </Modal>

      {/* Add Bed Modal */}
      <Modal open={showBedModal} onClose={() => setShowBedModal(false)} title="Add Bed">
        <form onSubmit={handleCreateBed} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ward</label>
            <select
              onChange={(e) => {
                const wId = Number(e.target.value);
                if (wId && !wardRooms[wId]) {
                  wardApi.getRooms(wId).then((r) => setWardRooms((prev) => ({ ...prev, [wId]: r.data.data }))).catch(() => {});
                }
              }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required>
              <option value="">Select ward first</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
            <select value={bedForm.roomId} onChange={(e) => setBedForm({ ...bedForm, roomId: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required>
              <option value="">Select room</option>
              {Object.values(wardRooms).flat().map((r) => (
                <option key={r.id} value={r.id}>Room {r.roomNumber} ({r.wardName})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bed Number</label>
            <input value={bedForm.bedNumber} onChange={(e) => setBedForm({ ...bedForm, bedNumber: e.target.value })}
              placeholder="e.g. 1, A, B1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Charge (KES)</label>
            <input type="number" value={bedForm.dailyCharge} onChange={(e) => setBedForm({ ...bedForm, dailyCharge: e.target.value })}
              placeholder="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-700">Create Bed</button>
        </form>
      </Modal>
    </div>
  );
}
