import { MachineStatus } from '@/types/machine';
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: MachineStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const statusConfig = {
  healthy: {
    label: 'Healthy',
    dotClass: 'bg-success',
  },
  warning: {
    label: 'At Risk',
    dotClass: 'bg-warning',
  },
  critical: {
    label: 'Critical',
    dotClass: 'bg-destructive',
  },
};

const sizeConfig = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

export function StatusIndicator({ status, size = 'md', showLabel = false }: StatusIndicatorProps) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className={cn('rounded-full pulse-dot', sizeConfig[size], config.dotClass)} />
      {showLabel && (
        <span className={cn(
          'text-sm font-medium',
          status === 'healthy' && 'text-success',
          status === 'warning' && 'text-warning',
          status === 'critical' && 'text-destructive'
        )}>
          {config.label}
        </span>
      )}
    </div>
  );
}
