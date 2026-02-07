export type MachineStatus = 'healthy' | 'warning' | 'critical';
export type MachineType = 'boiler' | 'motor' | 'pump' | 'gearbox';

export interface MachineData {
  id: string;
  name: string;
  type: MachineType;
  status: MachineStatus;
  failureRisk: number;
  temperature: number;
  vibration: number;
  rpm: number;
  load: number;
  energyConsumption: number;
  lastMaintenance: string;
  nextMaintenance: string;
}

export interface SimulationParams {
  // Mechanical / Physical
  rpm: number;
  torque: number;
  loadWeight: number;
  motorTemp: number;
  windingTemp: number;
  bearingTemp: number;
  ambientTemp: number;
  vibrationX: number;
  vibrationY: number;
  vibrationZ: number;

  // Electrical
  voltage: number;
  current: number;
  powerConsumption: number;
  powerFactor: number;
  harmonicDistortion: number;
  efficiency: number;
  insulationResistance: number;

  // Operational
  operatingHours: number;
  startStopCycles: number;

  // Degradation / Wear
  wearLevel: number;
  bearingWear: number;

  // Environmental
  humidity: number;
}

export interface SimulationResult {
  failureProbability: number;
  riskLevel: string;
  interpretation: string;
}

export interface AIRecommendation {
  id: string;
  action: string;
  reasoning: string[];
  featureImportance: {
    feature: string;
    impact: 'high' | 'medium' | 'low';
  }[];
  urgency: 'low' | 'medium' | 'high';
  approved?: boolean;
}
