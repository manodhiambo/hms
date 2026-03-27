-- ============================================================
-- HMS: Clear All Fake/Test Data
-- Run this once in psql or your DB client to wipe fake data.
-- Users, drugs, lab tests, settings, and audit logs are kept.
-- ============================================================

BEGIN;

-- 1. Child records first (FK order)
DELETE FROM nursing_notes;
DELETE FROM imaging_orders;
DELETE FROM lab_orders;
DELETE FROM prescriptions;
DELETE FROM billing_items;
DELETE FROM payments;
DELETE FROM insurance_claims;
DELETE FROM billing;

-- 2. Admissions (references patients, visits, beds)
DELETE FROM admissions;

-- 3. Clinical records
DELETE FROM visits;
DELETE FROM appointments;

-- 4. Patients
DELETE FROM patients;

-- 5. Ward structure (beds → rooms → wards)
DELETE FROM beds;
DELETE FROM rooms;
DELETE FROM wards;

-- 6. Expenses
DELETE FROM expenses;

COMMIT;

-- ============================================================
-- Done. Staff users, drug inventory, lab test catalog,
-- hospital settings, and audit logs are untouched.
-- ============================================================
