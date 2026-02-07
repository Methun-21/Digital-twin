import { machinesData, getProductionLineStatus, getOverallFailureRisk } from '@/data/mockData';
import { MachineCard } from './MachineCard';
import { StatusIndicator } from './StatusIndicator';
import { AlertTriangle, CheckCircle, Activity, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OverviewDashboardProps {
  onViewMachine: (machineId: string) => void;
  onViewSimulation: () => void;
  onViewDecisions: () => void;
}

export function OverviewDashboard({ onViewMachine, onViewSimulation, onViewDecisions }: OverviewDashboardProps) {
  const lineStatus = getProductionLineStatus();
  const overallRisk = getOverallFailureRisk();
  const warningCount = machinesData.filter(m => m.status === 'warning' || m.status === 'critical').length;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Status Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={cn(
          'card-glow rounded-lg p-5',
          lineStatus === 'normal' && 'border-success/30',
          lineStatus === 'warning' && 'border-warning/30',
          lineStatus === 'at-risk' && 'border-destructive/30'
        )}>
          <div className="flex items-center gap-3 mb-3">
            {lineStatus === 'normal' ? (
              <CheckCircle className="w-5 h-5 text-success" />
            ) : (
              <AlertTriangle className={cn(
                'w-5 h-5',
                lineStatus === 'warning' ? 'text-warning' : 'text-destructive'
              )} />
            )}
            <span className="metric-label">Production Line Status</span>
          </div>
          <p className={cn(
            'text-xl font-semibold',
            lineStatus === 'normal' && 'text-success',
            lineStatus === 'warning' && 'text-warning',
            lineStatus === 'at-risk' && 'text-destructive'
          )}>
            {lineStatus === 'normal' && '✓ Normal Operation'}
            {lineStatus === 'warning' && '⚠ Attention Required'}
            {lineStatus === 'at-risk' && '⚠ At Risk'}
          </p>
        </div>

        <div className="card-glow rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="w-5 h-5 text-primary" />
            <span className="metric-label">Overall Failure Risk</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              'data-display text-3xl',
              overallRisk < 30 && 'text-success',
              overallRisk >= 30 && overallRisk < 60 && 'text-warning',
              overallRisk >= 60 && 'text-destructive'
            )}>
              {overallRisk}%
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden mt-3">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                overallRisk < 30 && 'bg-success',
                overallRisk >= 30 && overallRisk < 60 && 'bg-warning',
                overallRisk >= 60 && 'bg-destructive'
              )}
              style={{ width: `${overallRisk}%` }}
            />
          </div>
        </div>

        <div className="card-glow rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-5 h-5 text-warning" />
            <span className="metric-label">Machines Requiring Attention</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="data-display text-3xl text-warning">{warningCount}</span>
            <span className="text-muted-foreground">/ {machinesData.length}</span>
          </div>
        </div>
      </div>

      {/* Machine Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>Machine Status</span>
          <span className="text-xs text-muted-foreground font-normal">Click to view details</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {machinesData.map((machine) => (
            <MachineCard
              key={machine.id}
              machine={machine}
              onClick={() => onViewMachine(machine.id)}
            />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={onViewSimulation}
          className="card-glow rounded-lg p-5 text-left hover:border-primary/50 transition-all group"
        >
          <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
            Run Digital Twin Simulation
          </h3>
          <p className="text-sm text-muted-foreground">
            Simulate what-if scenarios to predict machine behavior
          </p>
        </button>

        <button
          onClick={onViewDecisions}
          className="card-glow rounded-lg p-5 text-left hover:border-primary/50 transition-all group"
        >
          <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
            View AI Recommendations
          </h3>
          <p className="text-sm text-muted-foreground">
            Review and approve AI-generated maintenance actions
          </p>
        </button>
      </div>
    </div>
  );
}
