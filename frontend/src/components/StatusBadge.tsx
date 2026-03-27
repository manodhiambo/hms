const colors: Record<string, string> = {
  SCHEDULED: 'bg-blue-50 text-blue-700',
  CHECKED_IN: 'bg-indigo-50 text-indigo-700',
  IN_PROGRESS: 'bg-yellow-50 text-yellow-700',
  COMPLETED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-700',
  NO_SHOW: 'bg-gray-100 text-gray-600',
  PENDING: 'bg-yellow-50 text-yellow-700',
  PARTIAL: 'bg-orange-50 text-orange-700',
  PAID: 'bg-green-50 text-green-700',
  ORDERED: 'bg-blue-50 text-blue-700',
  SAMPLE_COLLECTED: 'bg-indigo-50 text-indigo-700',
  PROCESSING: 'bg-purple-50 text-purple-700',
  VERIFIED: 'bg-teal-50 text-teal-700',
  RELEASED: 'bg-green-50 text-green-700',
  AVAILABLE: 'bg-green-50 text-green-700',
  OCCUPIED: 'bg-red-50 text-red-700',
  RESERVED: 'bg-yellow-50 text-yellow-700',
  MAINTENANCE: 'bg-gray-100 text-gray-600',
  ADMITTED: 'bg-blue-50 text-blue-700',
  DISCHARGED: 'bg-green-50 text-green-700',
  DRAFT: 'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-blue-50 text-blue-700',
  APPROVED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
  PROCESSED: 'bg-teal-50 text-teal-700',
  DISPENSED: 'bg-green-50 text-green-700',
  // Triage statuses
  WAITING: 'bg-gray-100 text-gray-700',
  TRIAGED: 'bg-blue-50 text-blue-700',
  IN_CONSULTATION: 'bg-purple-50 text-purple-700',
  PENDING_LAB_REVIEW: 'bg-amber-50 text-amber-700',
};

export default function StatusBadge({ status }: { status: string }) {
  const color = colors[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
