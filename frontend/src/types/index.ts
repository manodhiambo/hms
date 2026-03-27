export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export type UserRole = 'SUPER_ADMIN' | 'HOSPITAL_ADMIN' | 'DOCTOR' | 'NURSE' | 'PHARMACIST' | 'LAB_TECHNICIAN' | 'RADIOLOGIST' | 'RECEPTIONIST' | 'ACCOUNTANT';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type VisitType = 'OPD' | 'IPD' | 'EMERGENCY';
export type AppointmentStatus = 'SCHEDULED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type AppointmentType = 'NEW' | 'REVIEW' | 'FOLLOW_UP' | 'EMERGENCY';
export type PaymentMethod = 'CASH' | 'MPESA' | 'CARD' | 'BANK_TRANSFER' | 'INSURANCE' | 'DONATION';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED' | 'WAIVED';
export type LabOrderStatus = 'ORDERED' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'COMPLETED' | 'VERIFIED' | 'RELEASED' | 'CANCELLED';
export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
export type AdmissionStatus = 'ADMITTED' | 'DISCHARGED' | 'TRANSFERRED' | 'DECEASED';
export type ClaimStatus = 'DRAFT' | 'SUBMITTED' | 'PRE_AUTHORIZED' | 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED' | 'PAID';
export type ImagingType = 'XRAY' | 'ULTRASOUND' | 'CT_SCAN' | 'MRI';
export type TriagePriority = 'IMMEDIATE' | 'URGENT' | 'LESS_URGENT' | 'NON_URGENT';
export type TriageStatus = 'WAITING' | 'TRIAGED' | 'IN_CONSULTATION' | 'PENDING_LAB_REVIEW' | 'COMPLETED';

export interface AuthResponse {
  token: string;
  refreshToken: string;
  userId: number;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface User {
  id: number;
  fullName: string;
  email: string;
  password?: string;
  plainPassword?: string;
  phone: string;
  role: UserRole;
  department: string;
  specialization: string;
  licenseNumber: string;
  active: boolean;
}

export interface Patient {
  id: number;
  patientNo: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: string;
  phone: string;
  email: string;
  idNumber: string;
  address: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  nextOfKinRelationship: string;
  allergies: string;
  bloodGroup: string;
  insuranceCompanyId: number | null;
  insuranceCompanyName: string;
  insuranceMemberNumber: string;
  age?: number;
}

export interface Visit {
  id: number;
  patientId: number;
  patientName: string;
  patientNo: string;
  doctorId: number | null;
  doctorName: string;
  visitType: VisitType;
  chiefComplaint: string;
  presentingIllness: string;
  examination: string;
  diagnosis: string;
  diagnosisCode: string;
  treatmentPlan: string;
  doctorNotes: string;
  bloodPressure: string;
  temperature: number | null;
  pulseRate: number | null;
  respiratoryRate: number | null;
  weight: number | null;
  height: number | null;
  oxygenSaturation: number | null;
  // Triage
  triageStatus: TriageStatus;
  triagePriority: TriagePriority | null;
  triageNotes: string;
  triagedAt: string;
  triagedById?: number;
  triagedByName: string;
  completed: boolean;
  createdAt: string;
  prescriptions: Prescription[];
  labOrders: LabOrder[];
  imagingOrders: ImagingOrder[];
}

export interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  department: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  notes: string;
  walkIn: boolean;
  createdAt: string;
}

export interface Drug {
  id: number;
  genericName: string;
  brandName: string;
  category: string;
  formulation: string;
  strength: string;
  quantityInStock: number;
  reorderLevel: number;
  batchNumber: string;
  expiryDate: string;
  supplier: string;
  costPrice: number;
  sellingPrice: number;
  controlled: boolean;
  active: boolean;
}

export interface Prescription {
  id: number;
  visitId: number;
  patientName: string;
  patientNo: string;
  drugId: number;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantityPrescribed: number;
  quantityDispensed: number;
  instructions: string;
  dispensed: boolean;
  dispensedByName: string;
  dispensedAt: string;
  createdAt: string;
}

export interface LabTest {
  id: number;
  testName: string;
  testCode: string;
  category: string;
  sampleType: string;
  price: number;
  referenceRange: string;
  unit: string;
  turnaroundTimeHours: number;
  active: boolean;
}

export interface LabOrder {
  id: number;
  visitId: number;
  patientName: string;
  patientNo: string;
  testId: number;
  testName: string;
  testCode: string;
  category: string;
  orderedById: number;
  orderedByName: string;
  status: LabOrderStatus;
  result: string;
  abnormal: boolean;
  remarks: string;
  processedByName: string;
  verifiedByName: string;
  sampleCollectedAt: string;
  processedAt: string;
  verifiedAt: string;
  releasedAt: string;
  createdAt: string;
}

export interface ImagingOrder {
  id: number;
  visitId: number;
  imagingType: ImagingType;
  bodyPart: string;
  clinicalIndication: string;
  status: LabOrderStatus;
  findings: string;
  impression: string;
  price: number;
  radiologistName: string;
  completedAt: string;
  createdAt: string;
}

export interface Expense {
  id: number;
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  referenceNumber: string;
  vendor: string;
  recordedByName: string;
  createdAt: string;
}

export interface Billing {
  id: number;
  invoiceNumber: string;
  patientId: number;
  patientName: string;
  patientNo: string;
  patientAge?: number;
  patientDateOfBirth?: string;
  visitId: number | null;
  totalAmount: number;
  paidAmount: number;
  insuranceCoveredAmount: number;
  status: PaymentStatus;
  items: BillingItem[];
  payments: Payment[];
  createdAt: string;
  billedDate?: string;
  notes?: string;
}

export interface BillingItem {
  id: number;
  billingId: number;
  serviceType: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  serviceId?: number;
  drugId?: number;
}

export interface Payment {
  id: number;
  billingId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  receiptNumber: string;
  receivedByName: string;
  createdAt: string;
}

export type RefundStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';

export interface Refund {
  id: number;
  refundNumber: string;
  prescriptionId: number;
  drugName: string;
  dosage: string;
  quantityDispensed: number;
  patientId: number;
  patientName: string;
  patientNo: string;
  quantityReturned: number;
  refundAmount: number;
  reason: string;
  notes: string;
  status: RefundStatus;
  refundMethod: string;
  referenceNumber: string;
  requestedByName: string;
  processedByName: string;
  processedAt: string;
  createdAt: string;
}

export interface InsuranceCompany {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  active: boolean;
}

export interface InsuranceClaim {
  id: number;
  claimNumber: string;
  billingId: number;
  invoiceNumber: string;
  insuranceCompanyId: number;
  insuranceCompanyName: string;
  patientId: number;
  patientName: string;
  claimAmount: number;
  approvedAmount: number;
  status: ClaimStatus;
  remarks: string;
  submittedAt: string;
  createdAt: string;
}

export interface Ward {
  id: number;
  name: string;
  type: string;
  totalBeds: number;
  active: boolean;
  availableBeds: number;
  occupiedBeds: number;
}

export interface Room {
  id: number;
  roomNumber: string;
  wardId: number;
  wardName: string;
  type: string;
  beds: Bed[];
}

export interface Bed {
  id: number;
  bedNumber: string;
  roomId: number;
  roomNumber: string;
  wardName: string;
  status: BedStatus;
  dailyCharge: number;
}

export interface Admission {
  id: number;
  patientId: number;
  patientName: string;
  patientNo: string;
  visitId: number | null;
  bedId: number;
  bedNumber: string;
  roomNumber: string;
  wardName: string;
  admittingDoctorId: number | null;
  admittingDoctorName: string;
  status: AdmissionStatus;
  admissionReason: string;
  dischargeSummary: string;
  admittedAt: string;
  dischargedAt: string;
  createdAt: string;
}

export interface NursingNote {
  id: number;
  admissionId: number;
  nurseId: number;
  nurseName: string;
  notes: string;
  vitalSigns: string;
  createdAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface MedicalService {
  id: number;
  serviceName: string;
  category: string;
  price: number;
  description: string;
  active: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: number;
  userId: number | null;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string | null;
  entityId: number | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface Dashboard {
  patientsToday: number;
  totalPatients: number;
  appointmentsToday: number;
  visitsToday: number;
  revenueToday: number;
  revenueThisMonth: number;
  pendingLabOrders: number;
  pendingBills: number;
  occupiedBeds: number;
  availableBeds: number;
  totalBeds: number;
  bedOccupancyRate: number;
  lowStockDrugs: Drug[];
  departmentVisits: Record<string, number>;
}
