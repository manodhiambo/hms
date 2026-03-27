import api from './client';
import type { ApiResponse, ActivityLog, Patient, Visit, Appointment, Drug, Prescription, LabTest, LabOrder, ImagingOrder, Billing, BillingItem, Payment, Refund, InsuranceCompany, InsuranceClaim, Ward, Room, Bed, Admission, NursingNote, User, Dashboard, Notification, Expense, PageResponse, AuthResponse, MedicalService } from '../types';

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password }),
  refresh: (refreshToken: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/refresh', { refreshToken }),
};

// Patients
export const patientApi = {
  getAll: (page = 0, size = 20) =>
    api.get<ApiResponse<PageResponse<Patient>>>(`/patients?page=${page}&size=${size}`),
  getById: (id: number) => api.get<ApiResponse<Patient>>(`/patients/${id}`),
  getByNo: (no: string) => api.get<ApiResponse<Patient>>(`/patients/by-no/${no}`),
  search: (q: string, page = 0) =>
    api.get<ApiResponse<PageResponse<Patient>>>(`/patients/search?q=${q}&page=${page}`),
  checkDuplicates: (phone: string, idNumber: string) =>
    api.get<ApiResponse<Patient[]>>(`/patients/check-duplicates?phone=${encodeURIComponent(phone)}&idNumber=${encodeURIComponent(idNumber)}`),
  create: (data: Partial<Patient>) => api.post<ApiResponse<Patient>>('/patients', data),
  update: (id: number, data: Partial<Patient>) => api.put<ApiResponse<Patient>>(`/patients/${id}`, data),
};

// Visits
export const visitApi = {
  getAll: (page = 0) => api.get<ApiResponse<PageResponse<Visit>>>(`/visits?page=${page}`),
  search: (q: string, page = 0) =>
    api.get<ApiResponse<PageResponse<Visit>>>(`/visits/search?q=${encodeURIComponent(q)}&page=${page}`),
  getById: (id: number) => api.get<ApiResponse<Visit>>(`/visits/${id}`),
  getByPatient: (patientId: number, page = 0) =>
    api.get<ApiResponse<PageResponse<Visit>>>(`/visits/patient/${patientId}?page=${page}`),
  getDoctorQueue: (doctorId: number) => api.get<ApiResponse<Visit[]>>(`/visits/doctor/${doctorId}/queue`),
  getTriageQueue: () => api.get<ApiResponse<Visit[]>>('/visits/triage-queue'),
  getLabReviewQueue: () => api.get<ApiResponse<Visit[]>>('/visits/lab-review'),
  create: (data: Partial<Visit>) => api.post<ApiResponse<Visit>>('/visits', data),
  update: (id: number, data: Partial<Visit>) => api.put<ApiResponse<Visit>>(`/visits/${id}`, data),
  updateTriage: (id: number, data: Partial<Visit>) => api.put<ApiResponse<Visit>>(`/visits/${id}/triage`, data),
  complete: (id: number) => api.put<ApiResponse<Visit>>(`/visits/${id}/complete`),
};

// Appointments
export const appointmentApi = {
  getAll: (page = 0) => api.get<ApiResponse<PageResponse<Appointment>>>(`/appointments?page=${page}`),
  getById: (id: number) => api.get<ApiResponse<Appointment>>(`/appointments/${id}`),
  getByDate: (date: string, page = 0) =>
    api.get<ApiResponse<PageResponse<Appointment>>>(`/appointments/date/${date}?page=${page}`),
  getDoctorAppts: (doctorId: number, date: string) =>
    api.get<ApiResponse<Appointment[]>>(`/appointments/doctor/${doctorId}/date/${date}`),
  create: (data: Partial<Appointment>) => api.post<ApiResponse<Appointment>>('/appointments', data),
  updateStatus: (id: number, status: string) =>
    api.put<ApiResponse<Appointment>>(`/appointments/${id}/status?status=${status}`),
};

// Pharmacy
export const pharmacyApi = {
  getDrugs: (page = 0) => api.get<ApiResponse<PageResponse<Drug>>>(`/pharmacy/drugs?page=${page}`),
  getDrug: (id: number) => api.get<ApiResponse<Drug>>(`/pharmacy/drugs/${id}`),
  searchDrugs: (q: string, page = 0) =>
    api.get<ApiResponse<PageResponse<Drug>>>(`/pharmacy/drugs/search?q=${q}&page=${page}`),
  createDrug: (data: Partial<Drug>) => api.post<ApiResponse<Drug>>('/pharmacy/drugs', data),
  updateDrug: (id: number, data: Partial<Drug>) => api.put<ApiResponse<Drug>>(`/pharmacy/drugs/${id}`, data),
  getLowStock: () => api.get<ApiResponse<Drug[]>>('/pharmacy/drugs/low-stock'),
  getExpiring: () => api.get<ApiResponse<Drug[]>>('/pharmacy/drugs/expiring'),
  createPrescription: (data: Partial<Prescription>) =>
    api.post<ApiResponse<Prescription>>('/pharmacy/prescriptions', data),
  getPendingRx: () => api.get<ApiResponse<Prescription[]>>('/pharmacy/prescriptions/pending'),
  getVisitRx: (visitId: number) => api.get<ApiResponse<Prescription[]>>(`/pharmacy/prescriptions/visit/${visitId}`),
  dispense: (id: number, pharmacistId: number) =>
    api.post<ApiResponse<Prescription>>(`/pharmacy/prescriptions/${id}/dispense?pharmacistId=${pharmacistId}`),
  getDispensedRx: () => api.get<ApiResponse<Prescription[]>>('/pharmacy/prescriptions/dispensed'),
  deleteRx: (id: number) => api.delete<ApiResponse<void>>(`/pharmacy/prescriptions/${id}`),
};

// Lab
export const labApi = {
  getTests: () => api.get<ApiResponse<LabTest[]>>('/lab/tests'),
  createTest: (data: Partial<LabTest>) => api.post<ApiResponse<LabTest>>('/lab/tests', data),
  updateTest: (id: number, data: Partial<LabTest>) => api.put<ApiResponse<LabTest>>(`/lab/tests/${id}`, data),
  createOrder: (visitId: number, testId: number, orderedById: number) =>
    api.post<ApiResponse<LabOrder>>('/lab/orders', { visitId, testId, orderedById }),
  getOrdersByVisit: (visitId: number) => api.get<ApiResponse<LabOrder[]>>(`/lab/orders/visit/${visitId}`),
  getOrdersByStatus: (status: string, page = 0) =>
    api.get<ApiResponse<PageResponse<LabOrder>>>(`/lab/orders/status/${status}?page=${page}`),
  searchOrders: (status: string, q: string, page = 0) =>
    api.get<ApiResponse<PageResponse<LabOrder>>>(`/lab/orders/search?status=${status}&q=${encodeURIComponent(q)}&page=${page}`),
  collectSample: (id: number) => api.put<ApiResponse<LabOrder>>(`/lab/orders/${id}/collect-sample`),
  processResult: (id: number, data: { result: string; abnormal: boolean; remarks: string; processedById: number }) =>
    api.put<ApiResponse<LabOrder>>(`/lab/orders/${id}/process`, data),
  verify: (id: number, verifiedById: number) =>
    api.put<ApiResponse<LabOrder>>(`/lab/orders/${id}/verify?verifiedById=${verifiedById}`),
  release: (id: number) => api.put<ApiResponse<LabOrder>>(`/lab/orders/${id}/release`),
};

// Imaging
export const imagingApi = {
  getAll: (page = 0) => api.get<ApiResponse<PageResponse<ImagingOrder>>>(`/imaging/orders?page=${page}`),
  getByVisit: (visitId: number) => api.get<ApiResponse<ImagingOrder[]>>(`/imaging/orders/visit/${visitId}`),
  getByStatus: (status: string, page = 0) =>
    api.get<ApiResponse<PageResponse<ImagingOrder>>>(`/imaging/orders/status/${status}?page=${page}`),
  create: (data: Partial<ImagingOrder>) => api.post<ApiResponse<ImagingOrder>>('/imaging/orders', data),
  complete: (id: number, data: { findings: string; impression: string; radiologistId: number }) =>
    api.put<ApiResponse<ImagingOrder>>(`/imaging/orders/${id}/complete`, data),
};

// Billing
export const billingApi = {
  getAll: (page = 0) => api.get<ApiResponse<PageResponse<Billing>>>(`/billing?page=${page}&sort=createdAt,desc`),
  getById: (id: number) => api.get<ApiResponse<Billing>>(`/billing/${id}`),
  search: (q: string, page = 0) =>
    api.get<ApiResponse<PageResponse<Billing>>>(`/billing/search?q=${encodeURIComponent(q)}&page=${page}`),
  getByPatient: (patientId: number, page = 0) =>
    api.get<ApiResponse<PageResponse<Billing>>>(`/billing/patient/${patientId}?page=${page}`),
  getByStatus: (status: string, page = 0) =>
    api.get<ApiResponse<PageResponse<Billing>>>(`/billing/status/${status}?page=${page}&sort=createdAt,desc`),
  getByVisit: (visitId: number) => api.get<ApiResponse<Billing>>(`/billing/visit/${visitId}`),
  create: (data: Partial<Billing>) => api.post<ApiResponse<Billing>>('/billing', data),
  addItem: (billingId: number, item: Partial<BillingItem>) =>
    api.post<ApiResponse<Billing>>(`/billing/${billingId}/items`, item),
  updateItem: (billingId: number, itemId: number, item: Partial<BillingItem>) =>
    api.put<ApiResponse<Billing>>(`/billing/${billingId}/items/${itemId}`, item),
  deleteItem: (billingId: number, itemId: number) =>
    api.delete<ApiResponse<Billing>>(`/billing/${billingId}/items/${itemId}`),
  update: (id: number, data: Partial<Billing>) => api.put<ApiResponse<Billing>>(`/billing/${id}`, data),
  processPayment: (data: Partial<Payment>) => api.post<ApiResponse<Billing>>('/billing/payments', data),
  populateFromVisit: (billingId: number) =>
    api.post<ApiResponse<Billing>>(`/billing/${billingId}/populate-from-visit`),
};

// Refunds
export const refundApi = {
  getAll: (page = 0) => api.get<ApiResponse<PageResponse<Refund>>>(`/refunds?page=${page}`),
  getById: (id: number) => api.get<ApiResponse<Refund>>(`/refunds/${id}`),
  getByStatus: (status: string, page = 0) =>
    api.get<ApiResponse<PageResponse<Refund>>>(`/refunds/status/${status}?page=${page}`),
  getByPatient: (patientId: number) => api.get<ApiResponse<Refund[]>>(`/refunds/patient/${patientId}`),
  create: (data: Partial<Refund>) => api.post<ApiResponse<Refund>>('/refunds', data),
  approve: (id: number, data: { processedById: string; refundMethod?: string; referenceNumber?: string }) =>
    api.put<ApiResponse<Refund>>(`/refunds/${id}/approve`, data),
  reject: (id: number, data: { processedById: string; notes?: string }) =>
    api.put<ApiResponse<Refund>>(`/refunds/${id}/reject`, data),
};

// Insurance
export const insuranceApi = {
  getCompanies: () => api.get<ApiResponse<InsuranceCompany[]>>('/insurance/companies'),
  createCompany: (data: Partial<InsuranceCompany>) =>
    api.post<ApiResponse<InsuranceCompany>>('/insurance/companies', data),
  updateCompany: (id: number, data: Partial<InsuranceCompany>) =>
    api.put<ApiResponse<InsuranceCompany>>(`/insurance/companies/${id}`, data),
  getClaims: (page = 0) => api.get<ApiResponse<PageResponse<InsuranceClaim>>>(`/insurance/claims?page=${page}`),
  createClaim: (data: Partial<InsuranceClaim>) =>
    api.post<ApiResponse<InsuranceClaim>>('/insurance/claims', data),
  updateClaimStatus: (id: number, data: { status: string; approvedAmount?: number; remarks?: string }) =>
    api.put<ApiResponse<InsuranceClaim>>(`/insurance/claims/${id}/status`, data),
};

// Wards
export const wardApi = {
  getWards: () => api.get<ApiResponse<Ward[]>>('/wards'),
  createWard: (data: Partial<Ward>) => api.post<ApiResponse<Ward>>('/wards', data),
  updateWard: (id: number, data: Partial<Ward>) => api.put<ApiResponse<Ward>>(`/wards/${id}`, data),
  getRooms: (wardId: number) => api.get<ApiResponse<Room[]>>(`/wards/${wardId}/rooms`),
  createRoom: (data: Partial<Room>) => api.post<ApiResponse<Room>>('/wards/rooms', data),
  createBed: (data: Partial<Bed>) => api.post<ApiResponse<Bed>>('/wards/beds', data),
  getAvailableBeds: () => api.get<ApiResponse<Bed[]>>('/wards/beds/available'),
  admit: (data: Partial<Admission>) => api.post<ApiResponse<Admission>>('/wards/admissions', data),
  getAdmissions: (status: string, page = 0) =>
    api.get<ApiResponse<PageResponse<Admission>>>(`/wards/admissions/status/${status}?page=${page}`),
  discharge: (id: number, dischargeSummary: string) =>
    api.put<ApiResponse<Admission>>(`/wards/admissions/${id}/discharge`, { dischargeSummary }),
  addNursingNote: (data: Partial<NursingNote>) =>
    api.post<ApiResponse<NursingNote>>('/wards/nursing-notes', data),
  getNursingNotes: (admissionId: number) =>
    api.get<ApiResponse<NursingNote[]>>(`/wards/admissions/${admissionId}/nursing-notes`),
};

// Users
export const userApi = {
  getAll: () => api.get<ApiResponse<User[]>>('/users'),
  getById: (id: number) => api.get<ApiResponse<User>>(`/users/${id}`),
  getByRole: (role: string) => api.get<ApiResponse<User[]>>(`/users/role/${role}`),
  create: (data: Partial<User>) => api.post<ApiResponse<User>>('/users', data),
  update: (id: number, data: Partial<User>) => api.put<ApiResponse<User>>(`/users/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/users/${id}`),
  changePassword: (id: number, currentPassword: string, newPassword: string) =>
    api.put<ApiResponse<void>>(`/users/${id}/password`, { currentPassword, newPassword }),
  adminResetPassword: (id: number, newPassword: string) =>
    api.put<ApiResponse<void>>(`/users/${id}/admin-reset-password`, { newPassword }),
};

// Dashboard
export const dashboardApi = {
  get: () => api.get<ApiResponse<Dashboard>>('/dashboard'),
};

// Reports
export const reportApi = {
  financial: (startDate: string, endDate: string) =>
    api.get<ApiResponse<Record<string, unknown>>>(`/reports/financial?startDate=${startDate}&endDate=${endDate}`),
  patients: (startDate: string, endDate: string) =>
    api.get<ApiResponse<Record<string, unknown>>>(`/reports/patients?startDate=${startDate}&endDate=${endDate}`),
  morbidity: (startDate: string, endDate: string) =>
    api.get<ApiResponse<Array<{ diagnosis: string; diagnosisCode: string | null; count: number }>>>(`/reports/morbidity?startDate=${startDate}&endDate=${endDate}`),
  moh: (startDate: string, endDate: string) =>
    api.get<ApiResponse<Record<string, unknown>>>(`/reports/moh?startDate=${startDate}&endDate=${endDate}`),
  revenue: (startDate: string, endDate: string) =>
    api.get<ApiResponse<Record<string, unknown>>>(`/reports/revenue?startDate=${startDate}&endDate=${endDate}`),
};

// Medical Services
export const medicalServiceApi = {
  getAll: () => api.get<ApiResponse<MedicalService[]>>('/services'),
  getActive: () => api.get<ApiResponse<MedicalService[]>>('/services/active'),
  create: (data: Partial<MedicalService>) => api.post<ApiResponse<MedicalService>>('/services', data),
  update: (id: number, data: Partial<MedicalService>) => api.put<ApiResponse<MedicalService>>(`/services/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/services/${id}`),
};

// Data Management (SUPER_ADMIN only)
export const dataApi = {
  clearPatients: () => api.delete<ApiResponse<void>>('/admin/data/patients'),
  clearWards: () => api.delete<ApiResponse<void>>('/admin/data/wards'),
  clearBilling: () => api.delete<ApiResponse<void>>('/admin/data/billing'),
  clearAppointments: () => api.delete<ApiResponse<void>>('/admin/data/appointments'),
  clearExpenses: () => api.delete<ApiResponse<void>>('/admin/data/expenses'),
  deletePatient: (id: number) => api.delete<ApiResponse<void>>(`/admin/data/patients/${id}`),
  deleteBilling: (id: number) => api.delete<ApiResponse<void>>(`/admin/data/billing/${id}`),
};

// Audit Logs (SUPER_ADMIN only)
export const auditApi = {
  getLogs: (params: { userId?: number; action?: string; start?: string; end?: string; page?: number; size?: number }) => {
    const q = new URLSearchParams();
    if (params.userId) q.append('userId', String(params.userId));
    if (params.action) q.append('action', params.action);
    if (params.start) q.append('start', params.start);
    if (params.end) q.append('end', params.end);
    q.append('page', String(params.page ?? 0));
    q.append('size', String(params.size ?? 50));
    return api.get<ApiResponse<PageResponse<ActivityLog>>>(`/audit/logs?${q.toString()}`);
  },
};

// Hospital Settings
export const settingsApi = {
  get: () => api.get<ApiResponse<{ name: string; tagline: string; address: string; phone: string; email: string }>>('/settings'),
  update: (data: { name: string; tagline: string; address: string; phone: string; email: string }) =>
    api.put<ApiResponse<{ name: string; tagline: string; address: string; phone: string; email: string }>>('/settings', data),
};

// Expenses
export const expenseApi = {
  getAll: (page = 0, size = 20) =>
    api.get<ApiResponse<PageResponse<Expense>>>(`/expenses?page=${page}&size=${size}&sort=expenseDate,desc`),
  getByDateRange: (start: string, end: string, page = 0) =>
    api.get<ApiResponse<PageResponse<Expense>>>(`/expenses/range?start=${start}&end=${end}&page=${page}&sort=expenseDate,desc`),
  getTotal: (start: string, end: string) =>
    api.get<ApiResponse<number>>(`/expenses/total?start=${start}&end=${end}`),
  create: (data: Partial<Expense>, recordedById?: number) =>
    api.post<ApiResponse<Expense>>(`/expenses${recordedById ? `?recordedById=${recordedById}` : ''}`, data),
  update: (id: number, data: Partial<Expense>) =>
    api.put<ApiResponse<Expense>>(`/expenses/${id}`, data),
  delete: (id: number) =>
    api.delete<ApiResponse<void>>(`/expenses/${id}`),
};

// Notifications
export const notificationApi = {
  get: (userId: number, page = 0) =>
    api.get<ApiResponse<PageResponse<Notification>>>(`/notifications/user/${userId}?page=${page}`),
  unreadCount: (userId: number) => api.get<ApiResponse<number>>(`/notifications/user/${userId}/unread-count`),
  markRead: (id: number) => api.put<ApiResponse<void>>(`/notifications/${id}/read`),
  markAllRead: (userId: number) => api.put<ApiResponse<void>>(`/notifications/user/${userId}/read-all`),
};
