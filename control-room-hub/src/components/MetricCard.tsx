import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'stable';
  status?: 'normal' | 'warning' | 'critical';
}

export function MetricCard({ label, value, unit, icon: Icon, status = 'normal' }: MetricCardProps) {
  return (
    <div className="card-glow rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <span className="metric-label">{label}</span>
        <div className={cn(
          'p-2 rounded-lg',
          status === 'normal' && 'bg-primary/10 text-primary',
          status === 'warning' && 'bg-warning/10 text-warning',
          status === 'critical' && 'bg-destructive/10 text-destructive'
        )}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn(
          'data-display',
          status === 'normal' && 'text-foreground',
          status === 'warning' && 'text-warning',
          status === 'critical' && 'text-destructive'
        )}>
          {value}
        </span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}
