import { useState } from 'react';
import { machinesData } from '@/data/mockData';
import { MetricCard } from './MetricCard';
import { StatusIndicator } from './StatusIndicator';
import { 
  Thermometer, 
  Activity, 
  Gauge, 
  Zap, 
  Weight, 
  Calendar,
  Play,
  FileText,
  Wrench
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MachineDetailsProps {
  selectedMachineId: string;
  onMachineChange: (id: string) => void;
  onSimulate: () => void;
  onViewExplanation: () => void;
}

export function MachineDetails({ 
  selectedMachineId, 
  onMachineChange, 
  onSimulate,
  onViewExplanation 
}: MachineDetailsProps) {
  const machine = machinesData.find(m => m.id === selectedMachineId) || machinesData[0];

  const getStatus = (value: number, thresholds: [number, number]) => {
    if (value < thresholds[0]) return 'normal';
    if (value < thresholds[1]) return 'warning';
    return 'critical';
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-1">Machine Details</h2>
          <p className="text-sm text-muted-foreground">
            Real-time sensor data and performance metrics
          </p>
        </div>

        <Select value={selectedMachineId} onValueChange={onMachineChange}>
          <SelectTrigger className="w-64 bg-card border-border">
            <SelectValue placeholder="Select Machine" />
          </SelectTrigger>
          <SelectContent>
            {machinesData.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                <div className="flex items-center gap-2">
                  <StatusIndicator status={m.status} size="sm" />
                  <span>{m.id} - {m.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Machine Info Card */}
      <div className="card-glow rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground font-mono">{machine.id}</p>
            <h3 className="text-lg font-semibold">{machine.name}</h3>
          </div>
          <StatusIndicator status={machine.status} showLabel size="lg" />
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Last Maintenance: {machine.lastMaintenance}</span>
          </div>
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            <span>Next Scheduled: {machine.nextMaintenance}</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard
          label="Temperature"
          value={machine.temperature}
          unit="°C"
          icon={Thermometer}
          status={getStatus(machine.temperature, [60, 80])}
        />
        <MetricCard
          label="Vibration"
          value={machine.vibration}
          unit="mm/s"
          icon={Activity}
          status={getStatus(machine.vibration, [4, 6])}
        />
        <MetricCard
          label="RPM"
          value={machine.rpm}
          unit=""
          icon={Gauge}
          status={getStatus(machine.rpm, [1300, 1400])}
        />
        <MetricCard
          label="Load"
          value={machine.load}
          unit="%"
          icon={Weight}
          status={getStatus(machine.load, [75, 90])}
        />
        <MetricCard
          label="Energy"
          value={machine.energyConsumption}
          unit="kWh"
          icon={Zap}
          status={getStatus(machine.energyConsumption, [6, 8])}
        />
        <div className="card-glow rounded-lg p-4">
          <span className="metric-label">Failure Risk</span>
          <div className="mt-3">
            <span className={cn(
              'data-display text-3xl',
              machine.failureRisk < 30 && 'text-success',
              machine.failureRisk >= 30 && machine.failureRisk < 70 && 'text-warning',
              machine.failureRisk >= 70 && 'text-destructive'
            )}>
              {machine.failureRisk}%
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden mt-3">
            <div
              className={cn(
                'h-full rounded-full',
                machine.failureRisk < 30 && 'bg-success',
                machine.failureRisk >= 30 && machine.failureRisk < 70 && 'bg-warning',
                machine.failureRisk >= 70 && 'bg-destructive'
              )}
              style={{ width: `${machine.failureRisk}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={onSimulate} className="gap-2">
          <Play className="w-4 h-4" />
          Simulate What-If Scenario
        </Button>
        <Button variant="outline" onClick={onViewExplanation} className="gap-2">
          <FileText className="w-4 h-4" />
          View Explanation
        </Button>
        <Button variant="outline" className="gap-2">
          <Wrench className="w-4 h-4" />
          Request Maintenance
        </Button>
      </div>
    </div>
  );
}
