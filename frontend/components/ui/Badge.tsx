interface BadgeProps {
  text: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

const variantClasses: Record<string, string> = {
  success: 'bg-green-900/50 text-green-400 border border-green-700',
  warning: 'bg-yellow-900/50 text-yellow-400 border border-yellow-700',
  danger: 'bg-red-900/50 text-red-400 border border-red-700',
  info: 'bg-blue-900/50 text-blue-400 border border-blue-700',
  default: 'bg-slate-700 text-slate-300 border border-slate-600',
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
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${variantClasses[variant]}`}>
      {text}
    </span>
  );
}
