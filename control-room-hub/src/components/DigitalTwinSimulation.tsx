import { useEffect, useMemo, useRef, useState } from 'react';
import { SimulationParams, SimulationResult } from '@/types/machine';
import { machinesData } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Machine3DViewer } from './Machine3DViewer';
import {
  Play,
  RotateCcw,
  Gauge,
  Settings,
  Zap,
  ThermometerSun,
  Cpu,
  Activity,
  Waves,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label'; // Add Label import for the new input fields

interface DigitalTwinSimulationProps {
  selectedMachineId: string;
  onMachineChange: (id: string) => void;
}

type TelemetrySample = {
  timestamp: number;
  machineId: string;
  machineName: string;
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
  vibrationMagnitude: number;
  voltage: number;
  current: number;
  powerConsumption: number;
  powerFactor: number;
  harmonicDistortion: number;
  efficiency: number;
  operatingHours: number;
  startStopCycles: number;
  wearLevel: number;
  bearingWear: number;
  insulationResistance: number;
  humidity: number;
  isRunning: boolean;
};

type TelemetryPayload = {
  exportTime?: string;
  totalDataPoints?: number;
  runtime?: number;
  machines?: Record<string, TelemetrySample[]>;
};

const TELEMETRY_URL = import.meta.env.VITE_TELEMETRY_URL ?? 'http://localhost:8000/telemetry';
const PREDICT_URL = import.meta.env.VITE_PREDICT_URL ?? 'http://localhost:8000/predict';
const HARDWARE_URL = import.meta.env.VITE_HARDWARE_URL ?? 'http://localhost:8000/hardware';
const RETRAIN_URL = import.meta.env.VITE_RETRAIN_URL ?? 'http://localhost:8000/retrain';
const TELEMETRY_POLL_MS = Number(import.meta.env.VITE_TELEMETRY_POLL_MS ?? 1000);
const DEFAULT_FAILURE_THRESHOLD = Number(import.meta.env.VITE_FAILURE_THRESHOLD ?? 0.6);

const defaultParams: SimulationParams = {
  // Mechanical / Physical
  rpm: 980,
  torque: 120,
  loadWeight: 62,
  motorTemp: 188,
  windingTemp: 188,
  bearingTemp: 162,
  ambientTemp: 28,
  vibrationX: 2.1,
  vibrationY: 2.4,
  vibrationZ: 2.2,

  // Electrical
  voltage: 400,
  current: 22,
  powerConsumption: 18,
  powerFactor: 0.88,
  harmonicDistortion: 2.22,
  efficiency: 88,
  insulationResistance: 12,

  // Operational
  operatingHours: 4200,
  startStopCycles: 14,

  // Degradation / Wear
  wearLevel: 18,
  bearingWear: 28,

  // Environmental
  humidity: 48,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const formatNumber = (value: number) => (Number.isFinite(value) ? value : 0);

const getLatestSample = (payload: TelemetryPayload | TelemetrySample[] | null): TelemetrySample | null => {
  if (!payload) return null;
  if (Array.isArray(payload)) {
    return payload.length ? payload[payload.length - 1] : null;
  }
  if (!payload.machines) return null;
  const machineKey = Object.keys(payload.machines)[0];
  const series = machineKey ? payload.machines[machineKey] : null;
  if (!series || series.length === 0) return null;
  return series[series.length - 1];
};

const mapSampleToParams = (sample: TelemetrySample, previous: SimulationParams): SimulationParams => {
  return {
    ...previous,
    // Mechanical / Physical
    rpm: Math.round(sample.rpm),
    torque: Math.round(sample.torque),
    loadWeight: Math.round(sample.loadWeight),
    vibrationX: sample.vibrationX,
    vibrationY: sample.vibrationY,
    vibrationZ: sample.vibrationZ,

    // Electrical
    voltage: sample.voltage,
    current: sample.current,
    powerConsumption: sample.powerConsumption,
    powerFactor: sample.powerFactor,
    harmonicDistortion: sample.harmonicDistortion,
    efficiency: sample.efficiency,
    insulationResistance: sample.insulationResistance,

    // Thermal
    motorTemp: Math.round(sample.motorTemp),
    windingTemp: Math.round(sample.windingTemp),
    bearingTemp: Math.round(sample.bearingTemp),
    ambientTemp: Math.round(sample.ambientTemp),

    // Operational
    operatingHours: Math.round(sample.operatingHours),
    startStopCycles: Math.round(sample.startStopCycles),

    // Degradation / Wear
    wearLevel: Math.round(sample.wearLevel),
    bearingWear: Math.round(sample.bearingWear),

    // Environmental
    humidity: Math.round(sample.humidity),
  };
};

const buildPredictPayload = (sequence: TelemetrySample[]) => ({
  sequence: sequence.map((sample) => ({
    ...sample, // Accessing strictly typed fields is fine if TelemetrySample type is compatible
    // But let's be explicit to avoid type errors if TelemetrySample changes
    rpm: sample.rpm,
    torque: sample.torque,
    loadWeight: sample.loadWeight,
    motorTemp: sample.motorTemp,
    windingTemp: sample.windingTemp,
    bearingTemp: sample.bearingTemp,
    ambientTemp: sample.ambientTemp,
    vibrationX: sample.vibrationX,
    vibrationY: sample.vibrationY,
    vibrationZ: sample.vibrationZ,
    vibrationMagnitude: sample.vibrationMagnitude,
    voltage: sample.voltage,
    current: sample.current,
    powerConsumption: sample.powerConsumption,
    powerFactor: sample.powerFactor,
    harmonicDistortion: sample.harmonicDistortion,
    efficiency: sample.efficiency,
    operatingHours: sample.operatingHours,
    startStopCycles: sample.startStopCycles,
    wearLevel: sample.wearLevel,
    bearingWear: sample.bearingWear,
    insulationResistance: sample.insulationResistance,
    humidity: sample.humidity,
    isRunning: sample.isRunning,
    timestamp: sample.timestamp,
    machineId: sample.machineId,
    machineName: sample.machineName,
  })),
});

export function DigitalTwinSimulation({ selectedMachineId, onMachineChange }: DigitalTwinSimulationProps) {
  const machine = machinesData.find(m => m.id === selectedMachineId) || machinesData[0];

  const [params, setParams] = useState<SimulationParams>(defaultParams);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [autoMode] = useState(false);
  const [failureProbability, setFailureProbability] = useState<number | null>(null);
  const [failureThreshold] = useState(DEFAULT_FAILURE_THRESHOLD);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [showWireframe, setShowWireframe] = useState(false);
  const [friendUrl, setFriendUrl] = useState("http://192.168.56.1:8000/predict");
  const [isPredicting, setIsPredicting] = useState(false); // Renamed from isSending for clarity
  const [predictionStatus, setPredictionStatus] = useState<string | null>(null); // Renamed from sendStatus for clarity
  const telemetryBufferRef = useRef<TelemetrySample[]>([]);

  // Effect to clear prediction status
  useEffect(() => {
    if (predictionStatus) {
      const timer = setTimeout(() => setPredictionStatus(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [predictionStatus]);

  const toggleStreaming = () => {
    setIsStreaming(prev => !prev);
  };


  const handleSendToFriend = async () => {
    setIsPredicting(true);
    setPredictionStatus(null);
    try {
      // Construct the EXACT 27-parameter payload
      const payload = {
        timestamp: Date.now(),
        machineId: selectedMachineId,
        machineName: machine?.name || "Unknown Machine",
        rpm: params.rpm,
        torque: params.torque,
        loadWeight: params.loadWeight,
        motorTemp: params.motorTemp,
        windingTemp: params.windingTemp,
        bearingTemp: params.bearingTemp,
        ambientTemp: params.ambientTemp,
        vibrationX: params.vibrationX,
        vibrationY: params.vibrationY,
        vibrationZ: params.vibrationZ,
        vibrationMagnitude: parseFloat(Math.sqrt(
          Math.pow(params.vibrationX, 2) +
          Math.pow(params.vibrationY, 2) +
          Math.pow(params.vibrationZ, 2)
        ).toFixed(3)),
        voltage: params.voltage,
        current: params.current,
        powerConsumption: params.powerConsumption,
        powerFactor: params.powerFactor,
        harmonicDistortion: params.harmonicDistortion,
        efficiency: params.efficiency,
        operatingHours: params.operatingHours,
        startStopCycles: params.startStopCycles,
        wearLevel: params.wearLevel,
        bearingWear: params.bearingWear,
        insulationResistance: params.insulationResistance,
        humidity: params.humidity,
        isRunning: params.rpm > 0,
        // target_url: friendUrl // No longer needed if ML_API_BASE_URL is set in proxy
      };

      const res = await fetch('/api/send_critical_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to send");
      }

      const data = await res.json();
      // Store the full API response in the result state
      setResult(data); 
      setPredictionStatus("Prediction received!");
    } catch (err: any) {
      setPredictionStatus(`Error: ${err.message}`);
    } finally {
      setIsPredicting(false);
    }
  };

  const derived = useMemo(() => {
    const rpm = params.rpm;
    const loadPercent = clamp(Math.round(params.loadWeight), 0, 100);
    const baseVibration = (params.vibrationX + params.vibrationY + params.vibrationZ) / 3;
    const vibration = parseFloat(baseVibration.toFixed(2));
    const temperature = Math.round((params.motorTemp + params.bearingTemp) / 2);

    const powerPenalty = Math.max(0, 1 - params.powerFactor) * 20;
    const thermalStress = Math.max(0, params.ambientTemp - 25) * 0.3;
    const wearPenalty =
      (params.bearingWear * 0.12) +
      (params.wearLevel * 0.08);

    const riskScore = clamp(
      Math.round(
        (rpm / 2000) * 18 +
        (params.torque / 200) * 12 +
        (vibration / 10) * 15 +
        (temperature / 220) * 12 +
        powerPenalty +
        thermalStress +
        wearPenalty
      ),
      0,
      100
    );

    const expectedTemp = Math.round(temperature); // Simplified
    const expectedVibration = parseFloat(vibration.toFixed(1));

    const remainingLife = Math.max(
      120,
      Math.round(1400 - riskScore * 8 - params.operatingHours / 6 - params.bearingWear * 3)
    );

    return {
      rpm,
      loadPercent,
      vibration,
      temperature,
      riskScore,
      expectedTemp,
      expectedVibration,
      remainingLife,
    };
  }, [params]);

  useEffect(() => {
    if (!autoMode) return;

    let active = true;

    const fetchTelemetry = async () => {
      try {
        const response = await fetch(TELEMETRY_URL);
        if (!response.ok) throw new Error(`Telemetry error ${response.status}`);
        const payload = (await response.json()) as TelemetryPayload | TelemetrySample[];
        const latestSample = getLatestSample(payload);
        if (!latestSample) throw new Error('No telemetry samples');

        if (!active) return;

        setLastUpdate(Date.now());

        setParams((prev) => mapSampleToParams(latestSample, prev));

        const buffer = telemetryBufferRef.current;
        buffer.push(latestSample);
        if (buffer.length > 200) buffer.splice(0, buffer.length - 200);

        if (buffer.length >= 50) {
          const sequence = buffer.slice(-50);
          const predictResponse = await fetch(PREDICT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildPredictPayload(sequence)),
          });
          if (!predictResponse.ok) throw new Error(`Predict error ${predictResponse.status}`);
          const predictJson = await predictResponse.json();
          const nextFailure =
            Number(predictJson.failure_probability ?? predictJson.failureProbability ?? predictJson.failure ?? 0);

          setFailureProbability(nextFailure);

          const isCritical = nextFailure >= failureThreshold;
          const dispatchPayload = {
            failure_probability: nextFailure,
            timestamp: latestSample.timestamp,
            machineId: latestSample.machineId,
            machineName: latestSample.machineName,
            sample: latestSample,
          };

          if (isCritical) {
            void fetch(RETRAIN_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...dispatchPayload, sequence }),
            });
          } else {
            void fetch(HARDWARE_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(dispatchPayload),
            });
          }
        }
      } catch (error) {
        if (!active) return;
        setLastUpdate(null);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, TELEMETRY_POLL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [autoMode, failureThreshold]);

  const runSimulation = () => {
    setIsSimulating(true);

    setTimeout(() => {
      let impact: 'low' | 'medium' | 'high' = 'low';
      if (derived.riskScore > 70) impact = 'high';
      else if (derived.riskScore > 40) impact = 'medium';

      setResult({
        predictedFailureRisk: derived.riskScore,
        expectedTemperature: derived.expectedTemp,
        expectedVibration: derived.expectedVibration,
        productionImpact: impact,
        remainingLife: derived.remainingLife,
      });
      setIsSimulating(false);
    }, 1600);
  };

  const resetToDefault = () => {
    setParams(defaultParams);
    setResult(null);
    setFailureProbability(null);
    telemetryBufferRef.current = [];
  };

  const updateNumber = (key: keyof SimulationParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const autoRisk = failureProbability !== null ? Math.round(failureProbability * 100) : null;

  const predictedRiskPercentage = result?.failureProbability ? Math.round(result.failureProbability * 100) : null;
  const predictedRiskLevel = result?.riskLevel ?? null;
  const predictedInterpretation = result?.interpretation ?? null;

  const currentRisk = predictedRiskPercentage ?? autoRisk ?? derived.riskScore;
  const currentRiskLevel = predictedRiskLevel ?? (currentRisk > 70 ? 'CRITICAL' : currentRisk > 40 ? 'WARNING' : 'SAFE'); // Derive if not directly from API

  const currentTemp = derived.temperature; // Always use derived as API doesn't provide it
  const currentVibration = derived.vibration; // Always use derived as API doesn't provide it
  const remainingLife = derived.remainingLife; // Always use derived as API doesn't provide it
  const statusLabel = autoMode
    ? failureProbability === null
      ? 'PENDING'
      : failureProbability >= failureThreshold
        ? 'CRITICAL'
        : 'SAFE'
    : 'MANUAL';
  const lastUpdateLabel = lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : '--:--';

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 control-hero">
          <h1 className="text-2xl font-semibold tracking-tight">Machine Parameters</h1>
          <div className="flex items-center gap-3">
            <Select value={selectedMachineId} onValueChange={onMachineChange}>
              <SelectTrigger className="h-10 w-44 bg-background/60">
                <SelectValue placeholder="Machine" />
              </SelectTrigger>
              <SelectContent>
                {machinesData.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.id} - {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2" onClick={() => setShowWireframe(!showWireframe)}>
              <Waves className="w-4 h-4" />
              {showWireframe ? 'Solid View' : 'Wireframe View'}
            </Button>
            <Button variant="outline" className="gap-2" onClick={resetToDefault}>
              <RotateCcw className="w-4 h-4" />
              Reset Defaults
            </Button>
            <Button onClick={handleSendToFriend} disabled={isPredicting || autoMode} className="gap-2">
              {isPredicting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Sending Parameters...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run ML Prediction
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs">
            <span className="font-mono text-primary">MANUAL</span>
            <span className="text-muted-foreground">ML Predict mode</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {predictionStatus && (
              <p className={`font-mono text-center text-xs ${predictionStatus.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                {predictionStatus}
              </p>
            )}
          </div>
        </div>

        <div className="telemetry-strip">
          <div className="telemetry-tile">
            <Gauge className="w-4 h-4" />
            <div>
              <p className="telemetry-label">RPM</p>
              <p className="telemetry-value">{params.rpm} RPM</p>
            </div>
          </div>
          <div className="telemetry-tile">
            <Zap className="w-4 h-4" />
            <div>
              <p className="telemetry-label">Power Factor</p>
              <p className="telemetry-value">{params.powerFactor.toFixed(2)}</p>
            </div>
          </div>
          <div className="telemetry-tile">
            <ThermometerSun className="w-4 h-4" />
            <div>
              <p className="telemetry-label">Motor Temp</p>
              <p className="telemetry-value">{params.motorTemp} C</p>
            </div>
          </div>
          <div className="telemetry-tile">
            <Cpu className="w-4 h-4" />
            <div>
              <p className="telemetry-label">Efficiency</p>
              <p className="telemetry-value">{params.efficiency}%</p>
            </div>
          </div>
        </div>
      

      <div className="grid grid-cols-1 xl:grid-cols-[480px_1fr] gap-6">
        <div className="neon-panel space-y-6">
          <h3 className="text-lg font-semibold">Input Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 param-scroll">
            {Object.entries(params).map(([key, value]) => (
              <div key={key} className="space-y-2 param-field">
                <Label htmlFor={key} className="param-label">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Label>
                <div className="param-input-row">
                  <Input
                    id={key}
                    name={key}
                    type={typeof value === 'boolean' ? 'checkbox' : typeof value === 'number' ? 'number' : 'text'}
                    checked={typeof value === 'boolean' ? (value as boolean) : undefined}
                    value={typeof value === 'boolean' ? undefined : (value as string | number)}
                    onChange={(e) => updateNumber(key as keyof SimulationParams, Number(e.target.value))}
                    step={typeof value === 'number' ? "any" : undefined}
                    className={typeof value === 'boolean' ? "h-4 w-4" : "param-input"}
                  />
                  {/* Optionally add units here if desired, e.g., {key === 'rpm' && <span className="param-unit">RPM</span>} */}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Machine3DViewer
            rpm={params.rpm}
            load={derived.loadPercent}
            failureRisk={currentRisk}
            isSimulating={isSimulating}
            temperature={currentTemp}
            vibration={currentVibration}
            machineId={selectedMachineId}
            machineType={machine.type}
            wireframe={showWireframe}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className={cn('stat-tile', currentRisk < 40 ? 'stat-ok' : currentRisk < 70 ? 'stat-warn' : 'stat-alert')}>
              <span className="stat-label">Predicted Risk</span>
              <p className="stat-value">{currentRisk}%</p>
              <span className="stat-sub">Risk Level: {currentRiskLevel}</span>
              {predictedInterpretation && <span className="stat-sub">{predictedInterpretation}</span>}
            </div>
            <div className="stat-tile stat-thermal">
              <span className="stat-label">Avg. Temp</span>
              <p className="stat-value">{currentTemp} C</p>
              <span className="stat-sub">Ambient: {params.ambientTemp} C</span>
            </div>
            <div className="stat-tile stat-vibe">
              <span className="stat-label">Avg. Vibration</span>
              <p className="stat-value">{currentVibration.toFixed(1)}</p>
              <span className="stat-sub">X:{params.vibrationX.toFixed(1)} Y:{params.vibrationY.toFixed(1)} Z:{params.vibrationZ.toFixed(1)}</span>
            </div>
            <div className="stat-tile stat-life">
              <span className="stat-label">Est. Remaining Life</span>
              <p className="stat-value">{remainingLife} h</p>
              <span className="stat-sub">Operating: {params.operatingHours} h</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="signal-panel">
              <h4 className="signal-title">Environment Snapshot</h4>
              <div className="signal-row">
                <span>Humidity</span>
                <span>{params.humidity}%</span>
              </div>
              <div className="signal-row">
                <span>Ambient Temp</span>
                <span>{params.ambientTemp} C</span>
              </div>
              <div className="signal-bar">
                <div style={{ width: `${clamp(params.humidity, 0, 100)}%` }} />
              </div>
            </div>
            <div className="signal-panel">
              <h4 className="signal-title">Efficiency Snapshot</h4>
              <div className="signal-row">
                <span>Efficiency</span>
                <span>{params.efficiency}%</span>
              </div>
              <div className="signal-row">
                <span>Wear Level</span>
                <span>{params.wearLevel}%</span>
              </div>
              <div className="signal-bar">
                <div style={{ width: `${clamp(params.efficiency, 0, 100)}%` }} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Card className="p-4 border-l-4 border-l-primary shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <span>SEND TO PARTNER API</span>
                  <div className={`w-2 h-2 rounded-full ${isPredicting ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-3">
                <Button
                  className="w-full text-xs font-semibold"
                  variant="default"
                  size="sm"
                  onClick={handleSendToFriend}
                  disabled={isPredicting}
                >
                  {isPredicting ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      SENDING JSON...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-3 w-3" />
                      SEND 27 PARAMETERS
                    </>
                  )}
                </Button>
                {predictionStatus && (
                  <p className={`text-[10px] text-center ${predictionStatus.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                    {predictionStatus}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="p-4 border-l-4 border-l-primary shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <span>REAL-TIME TELEMETRY</span>
                  <div className={`w-2 h-2 rounded-full ${autoMode ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background/40 p-3 rounded-lg border border-border/50">
                    <div className="text-xs text-muted-foreground mb-1">Failure Risk</div>
                    <div className={cn("text-2xl font-bold font-mono tracking-tighter",
                      currentRisk > 70 ? "text-red-500" : currentRisk > 40 ? "text-yellow-500" : "text-green-500"
                    )}>
                      {currentRisk}%
                    </div>
                  </div>
                  <div className="bg-background/40 p-3 rounded-lg border border-border/50">
                    <div className="text-xs text-muted-foreground mb-1">Health Score</div>
                    <div className="text-2xl font-bold font-mono tracking-tighter text-blue-500">
                      {100 - currentRisk}%
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Expected Temp</span>
                    <span className="font-mono text-foreground">{currentTemp}°C</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-red-500 transition-all duration-700"
                      style={{ width: `${Math.min(100, (currentTemp / 150) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Vibration Level</span>
                    <span className="font-mono text-foreground">{currentVibration} mm/s</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all duration-700"
                      style={{ width: `${Math.min(100, (currentVibration / 5) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-border/50">
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                    <span>Est. Remaining Life</span>
                    <span className="font-mono text-foreground">{remainingLife} hrs</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="mini-panel">
            <span className="mini-label">Active Power</span>
            <p className="mini-value">{params.powerConsumption} kW</p>
          </div>
          <div className="mini-panel">
            <span className="mini-label">Apparent Power (approx)</span>
            <p className="mini-value">{(params.powerConsumption / params.powerFactor).toFixed(1)} kVA</p>
          </div>
          <div className="mini-panel">
            <span className="mini-label">Insulation Resistance</span>
            <p className="mini-value">{params.insulationResistance} MOhm</p>
          </div>
          <div className="mini-panel">
            <span className="mini-label">Efficiency</span>
            <p className="mini-value">{params.efficiency} %</p>
          </div>
        </div>

        <div className="holo-status">
          <div className="holo-chip">
            <Activity className="w-4 h-4" />
            <div>
              <p className="telemetry-label">Wear Level</p>
              <p className="telemetry-value">{params.wearLevel}%</p>
            </div>
          </div>
          <div className="holo-chip">
            <Waves className="w-4 h-4" />
            <div>
              <p className="telemetry-label">Harmonic Distortion</p>
              <p className="telemetry-value">{params.harmonicDistortion}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}








