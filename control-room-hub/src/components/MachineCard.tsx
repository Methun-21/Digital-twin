import { MachineData } from '@/types/machine';
import { StatusIndicator } from './StatusIndicator';
import { cn } from '@/lib/utils';
import { Activity, Thermometer, Gauge } from 'lucide-react';

interface MachineCardProps {
  machine: MachineData;
  onClick?: () => void;
  isSelected?: boolean;
}

export function MachineCard({ machine, onClick, isSelected }: MachineCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'card-glow rounded-lg p-5 cursor-pointer transition-all duration-300',
        isSelected && 'ring-2 ring-primary',
        'hover:translate-y-[-2px]'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground font-mono mb-1">{machine.id}</p>
          <h3 className="font-semibold text-foreground">{machine.name}</h3>
        </div>
        <StatusIndicator status={machine.status} size="lg" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="metric-label">Failure Risk</span>
          <span className={cn(
            'data-display text-lg',
            machine.failureRisk < 30 && 'text-success',
            machine.failureRisk >= 30 && machine.failureRisk < 70 && 'text-warning',
            machine.failureRisk >= 70 && 'text-destructive'
          )}>
            {machine.failureRisk}%
          </span>
        </div>

        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              machine.failureRisk < 30 && 'bg-success',
              machine.failureRisk >= 30 && machine.failureRisk < 70 && 'bg-warning',
              machine.failureRisk >= 70 && 'bg-destructive'
            )}
            style={{ width: `${machine.failureRisk}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Thermometer className="w-3.5 h-3.5" />
            <span className="text-xs font-mono">{machine.temperature}°C</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Activity className="w-3.5 h-3.5" />
            <span className="text-xs font-mono">{machine.vibration} mm/s</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Gauge className="w-3.5 h-3.5" />
            <span className="text-xs font-mono">{machine.rpm} RPM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
