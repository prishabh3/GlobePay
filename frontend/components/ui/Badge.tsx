interface BadgeProps {
  text: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

const variantClasses: Record<string, string> = {
  success: 'bg-green-50 text-green-700 ring-1 ring-green-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  default: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
};

export function statusVariant(status: string): BadgeProps['variant'] {
  const s = status?.toUpperCase();
  if (['ACTIVE', 'APPROVED', 'COMPLETED', 'SENT'].includes(s)) return 'success';
  if (['PENDING', 'IN_REVIEW', 'UNDER_REVIEW', 'PROCESSING'].includes(s)) return 'warning';
  if (['REJECTED', 'FAILED', 'CANCELLED', 'CLOSED'].includes(s)) return 'danger';
  if (['FROZEN'].includes(s)) return 'info';
  return 'default';
}

export default function Badge({ text, variant = 'default' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${variantClasses[variant]}`}>
      {text}
    </span>
  );
}
