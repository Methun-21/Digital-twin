import { MachineData, AIRecommendation } from '@/types/machine';

export const machinesData: MachineData[] = [
  {
    id: 'B1',
    name: 'High-Pressure Boiler',
    type: 'boiler',
    status: 'healthy',
    failureRisk: 14,
    temperature: 182,
    vibration: 1.9,
    rpm: 980,
    load: 62,
    energyConsumption: 18.4,
    lastMaintenance: '2025-12-05',
    nextMaintenance: '2026-01-05',
  },
];

export const aiRecommendations: AIRecommendation[] = [
  {
    id: 'REC-001',
    action: 'Reduce draft fan speed by 8% and inspect burner nozzles within 48 hours for Boiler B1',
    reasoning: [
      'Steam temperature trending above recommended limits',
      'Vibration spikes observed during load ramp-up',
      'Fuel valve response lag detected in control loop',
      'Operating load near upper bound for extended duration',
    ],
    featureImportance: [
      { feature: 'Steam Temperature', impact: 'high' },
      { feature: 'Vibration', impact: 'high' },
      { feature: 'Control Response', impact: 'medium' },
      { feature: 'Load', impact: 'low' },
    ],
    urgency: 'high',
  },
];

export const getProductionLineStatus = () => {
  const criticalCount = machinesData.filter(m => m.status === 'critical').length;
  const warningCount = machinesData.filter(m => m.status === 'warning').length;
  
  if (criticalCount > 0) return 'at-risk';
  if (warningCount > 0) return 'warning';
  return 'normal';
};

export const getOverallFailureRisk = () => {
  const avgRisk = machinesData.reduce((sum, m) => sum + m.failureRisk, 0) / machinesData.length;
  return Math.round(avgRisk);
};

