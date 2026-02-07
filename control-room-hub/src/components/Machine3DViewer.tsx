import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { MachineType } from '@/types/machine';

interface MachineModelProps {
  rpm: number;
  load: number;
  failureRisk: number;
  temperature: number;
}

// ============================================
// SHARED COMPONENTS
// ============================================

function GridFloor({ color }: { color: string }) {
  return (
    <group position={[0, -1.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <gridHelper args={[12, 24, color, color]} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  );
}

function createRingGeometry(radius: number, segments: number = 64) {
  const geo = new THREE.BufferGeometry();
  const vertices: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    vertices.push(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  return geo;
}

// ============================================
// BOILER SYSTEM (B1)
// ============================================

function BoilerHeatColor(temperature: number) {
  if (temperature < 120) return '#6df0ff';
  if (temperature < 180) return '#ffd36a';
  return '#ff6b3d';
}

function BoilerModel({ rpm, load, failureRisk, temperature, wireframe }: MachineModelProps & { wireframe: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const flameRef = useRef<THREE.Mesh>(null);
  const steamRef = useRef<THREE.Group>(null);
  const gaugeNeedleRef = useRef<THREE.Mesh>(null);
  const waterLevelRef = useRef<THREE.Mesh>(null);

  const heatColor = BoilerHeatColor(temperature);
  const glow = Math.min(1, Math.max(0.2, temperature / 220));
  const flamePower = Math.min(1, Math.max(0.2, load / 100));
  const vibration = (failureRisk / 100) * 0.012;
  const pressureRatio = Math.min(1, Math.max(0, (temperature - 80) / 160 + load / 200));

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 20) * vibration;
    }
    if (flameRef.current) {
      const flicker = 0.9 + Math.sin(t * 18) * 0.08 + Math.sin(t * 7) * 0.05;
      flameRef.current.scale.set(1, flamePower * flicker, 1);
      const material = flameRef.current.material as THREE.Material;
      material.opacity = 0.35 + flamePower * 0.4;
    }
    if (steamRef.current) {
      steamRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        mesh.position.y += delta * (0.3 + i * 0.03);
        if (mesh.position.y > 2.2) {
          mesh.position.y = 1.2;
        }
        mesh.scale.setScalar(0.25 + (mesh.position.y - 1.2) * 0.15);
      });
    }
    if (gaugeNeedleRef.current) {
      gaugeNeedleRef.current.rotation.z = -Math.PI * 0.75 + pressureRatio * Math.PI * 1.5;
    }
    if (waterLevelRef.current) {
      waterLevelRef.current.scale.y = 0.3 + pressureRatio * 0.7;
      waterLevelRef.current.position.y = -0.2 + pressureRatio * 0.35;
    }
  });

  const MaterialComponent: any = wireframe ? 'meshBasicMaterial' : 'meshStandardMaterial';

  return (
    <group ref={groupRef} rotation={[0.05, 0.35, 0]}>
      {/* Boiler drum */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.1, 1.1, 3.2, 32, 4, true]} />
        <MaterialComponent
          color={heatColor}
          emissive={wireframe ? undefined : heatColor} // Emissive usually not on basic material or handled differently
          emissiveIntensity={0.22}
          metalness={0.45}
          roughness={0.3}
          transparent
          opacity={wireframe ? 0.3 : 0.55}
          wireframe={wireframe}
        />
      </mesh>

      {/* End caps */}
      {[-1.6, 1.6].map((z, i) => (
        <mesh key={i} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.1, 32]} />
          <MaterialComponent
            color={heatColor}
            emissive={wireframe ? undefined : heatColor}
            emissiveIntensity={0.18}
            metalness={0.4}
            roughness={0.35}
            transparent
            opacity={wireframe ? 0.3 : 0.45}
            wireframe={wireframe}
          />
        </mesh>
      ))}

      {/* Steam dome */}
      <mesh position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.55, 24, 16]} />
        <MaterialComponent
          color={heatColor}
          emissive={wireframe ? undefined : heatColor}
          emissiveIntensity={0.25}
          metalness={0.3}
          roughness={0.4}
          transparent
          opacity={wireframe ? 0.3 : 0.5}
          wireframe={wireframe}
        />
      </mesh>

      {/* Furnace box */}
      <mesh position={[0, -0.7, 0]}>
        <boxGeometry args={[1.8, 0.9, 2.2]} />
        <MaterialComponent
          color={heatColor}
          emissive={wireframe ? undefined : heatColor}
          emissiveIntensity={0.15}
          metalness={0.4}
          roughness={0.45}
          transparent
          opacity={wireframe ? 0.2 : 0.35}
          wireframe={wireframe}
        />
      </mesh>

      {/* Heat exchanger tubes */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} position={[-0.7 + i * 0.13, -0.2, -0.9]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 1.8, 10, 1, true]} />
          <MaterialComponent
            color={heatColor}
            emissive={wireframe ? undefined : heatColor}
            emissiveIntensity={0.12}
            metalness={0.45}
            roughness={0.4}
            transparent
            opacity={wireframe ? 0.2 : 0.45}
            wireframe={wireframe}
          />
        </mesh>
      ))}

      {/* Burner flame - Keep standard material for effect or simplify */}
      <mesh ref={flameRef} position={[0, -0.95, -1.0]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.35, 0.8, 16]} />
        <meshStandardMaterial
          color="#ff7a1a"
          emissive="#ff7a1a"
          emissiveIntensity={0.9}
          transparent
          opacity={0.6}
          wireframe={wireframe} // Flame looks cool in wireframe too
        />
      </mesh>

      {/* Observation window */}
      <mesh position={[0.55, -0.6, -1.0]}>
        <circleGeometry args={[0.18, 24]} />
        <MaterialComponent
          color="#ff9e4a"
          emissive={wireframe ? undefined : "#ff9e4a"}
          emissiveIntensity={0.8}
          transparent
          opacity={0.5}
          wireframe={wireframe}
        />
      </mesh>

      {/* Steam stack */}
      <mesh position={[0.9, 1.1, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 1.1, 16, 1, true]} />
        <MaterialComponent
          color={heatColor}
          emissive={wireframe ? undefined : heatColor}
          emissiveIntensity={0.2}
          metalness={0.35}
          roughness={0.4}
          transparent
          opacity={wireframe ? 0.3 : 0.45}
          wireframe={wireframe}
        />
      </mesh>

      {/* Steam particles - Keep as is or hide in wireframe? Keeping for effect */}
      <group ref={steamRef} position={[0.9, 1.2, 0.6]}>
        {Array.from({ length: 10 }).map((_, i) => (
          <mesh key={i} position={[0, 1.2 + i * 0.08, 0]}>
            <sphereGeometry args={[0.12, 10, 10]} />
            <meshStandardMaterial
              color="#b9f5ff"
              emissive="#b9f5ff"
              emissiveIntensity={0.2}
              transparent
              opacity={0.2 + glow * 0.3}
              wireframe={wireframe}
            />
          </mesh>
        ))}
      </group>

      {/* Water level gauge */}
      <group position={[-1.05, 0.3, 0.6]}>
        <mesh>
          <boxGeometry args={[0.18, 1.2, 0.12]} />
          <MaterialComponent color="#0b1b2d" transparent opacity={0.5} wireframe={wireframe} />
        </mesh>
        <mesh ref={waterLevelRef} position={[0, -0.2, 0]}>
          <boxGeometry args={[0.14, 1, 0.1]} />
          <MaterialComponent
            color="#34d5ff"
            emissive={wireframe ? undefined : "#34d5ff"}
            emissiveIntensity={0.3}
            transparent
            opacity={0.6}
            wireframe={wireframe}
          />
        </mesh>
      </group>

      {/* Pressure gauge */}
      <group position={[1.15, 0.5, -0.4]}>
        <mesh>
          <cylinderGeometry args={[0.22, 0.22, 0.08, 20]} />
          <MaterialComponent
            color={heatColor}
            emissive={wireframe ? undefined : heatColor}
            emissiveIntensity={0.2}
            metalness={0.4}
            roughness={0.4}
            transparent
            opacity={0.5}
            wireframe={wireframe}
          />
        </mesh>
        <mesh ref={gaugeNeedleRef} position={[0, 0.12, 0]}>
          <boxGeometry args={[0.04, 0.28, 0.02]} />
          <meshStandardMaterial color="#ff3d3d" emissive="#ff3d3d" emissiveIntensity={0.6} wireframe={wireframe} />
        </mesh>
      </group>

      {/* Feedwater pipe */}
      <mesh position={[-1.2, -0.2, -0.6]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 1.6, 12, 1, true]} />
        <MaterialComponent
          color={heatColor}
          emissive={wireframe ? undefined : heatColor}
          emissiveIntensity={0.15}
          metalness={0.4}
          roughness={0.35}
          transparent
          opacity={wireframe ? 0.3 : 0.45}
          wireframe={wireframe}
        />
      </mesh>

      {/* Safety valve */}
      <mesh position={[0, 1.3, -0.8]}>
        <cylinderGeometry args={[0.12, 0.2, 0.3, 12]} />
        <MaterialComponent
          color={heatColor}
          emissive={wireframe ? undefined : heatColor}
          emissiveIntensity={0.2}
          metalness={0.4}
          roughness={0.35}
          transparent
          opacity={wireframe ? 0.3 : 0.55}
          wireframe={wireframe}
        />
      </mesh>

      {/* Service platform */}
      <mesh position={[0.8, -0.1, 1.0]}>
        <boxGeometry args={[1.2, 0.1, 0.6]} />
        <MaterialComponent color={heatColor} emissive={wireframe ? undefined : heatColor} emissiveIntensity={0.1} transparent opacity={wireframe ? 0.2 : 0.35} wireframe={wireframe} />
      </mesh>

      {/* Base */}
      <mesh position={[0, -1.25, 0]}>
        <boxGeometry args={[2.6, 0.2, 3.0]} />
        <MaterialComponent
          color={heatColor}
          emissive={wireframe ? undefined : heatColor}
          emissiveIntensity={0.1}
          metalness={0.3}
          roughness={0.5}
          transparent
          opacity={wireframe ? 0.2 : 0.4}
          wireframe={wireframe}
        />
      </mesh>
    </group>
  );
}

// ============================================
// INDUCTION MOTOR (M1)
// ============================================

function HeatColor(temperature: number) {
  if (temperature < 70) return '#18f5ff';
  if (temperature < 85) return '#22ff9a';
  return '#ff8b3d';
}

function StatorTeeth({ color }: { color: string }) {
  return (
    <group>
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const x = Math.cos(angle) * 0.7;
        const y = Math.sin(angle) * 0.7;
        return (
          <mesh key={i} position={[x, y, 0]} rotation={[0, 0, angle]}>
            <boxGeometry args={[0.08, 0.2, 1.6]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.25}
              metalness={0.2}
              roughness={0.4}
              transparent
              opacity={0.45}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function RotorCage({ rpm, color, temperature }: { rpm: number; color: string; temperature: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const rotationSpeed = (rpm / 1200) * 3.5;
  const heatIntensity = Math.min(1, Math.max(0, (temperature - 55) / 45));

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.z += delta * rotationSpeed;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 1.6, 24, 1, true]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
          metalness={0.35}
          roughness={0.35}
          transparent
          opacity={0.55}
        />
      </mesh>
      {Array.from({ length: 18 }).map((_, i) => {
        const angle = (i / 18) * Math.PI * 2;
        const x = Math.cos(angle) * 0.52;
        const y = Math.sin(angle) * 0.52;
        return (
          <mesh key={i} position={[x, y, 0]} rotation={[0, 0, angle]}>
            <boxGeometry args={[0.05, 0.05, 1.6]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.35}
              metalness={0.4}
              roughness={0.3}
              transparent
              opacity={0.7}
            />
          </mesh>
        );
      })}
      {[-0.85, 0.85].map((z, i) => (
        <mesh key={i} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.55, 0.04, 12, 48]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.3}
            metalness={0.3}
            roughness={0.35}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 1.8, 8]} />
        <meshStandardMaterial
          color={heatIntensity > 0.5 ? '#ff6a00' : color}
          emissive={heatIntensity > 0.5 ? '#ff6a00' : color}
          emissiveIntensity={0.45}
          metalness={0.2}
          roughness={0.5}
          transparent
          opacity={0.25 + heatIntensity * 0.35}
        />
      </mesh>
    </group>
  );
}

function CoolingFan({ rpm, color }: { rpm: number; color: string }) {
  const fanRef = useRef<THREE.Group>(null);
  const rotationSpeed = (rpm / 1200) * 6;

  useFrame((_, delta) => {
    if (fanRef.current) {
      fanRef.current.rotation.z += delta * rotationSpeed;
    }
  });

  return (
    <group ref={fanRef} position={[0, 0, -1.2]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.15, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
          metalness={0.4}
          roughness={0.35}
          transparent
          opacity={0.5}
        />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} rotation={[0, 0, (i / 8) * Math.PI * 2]}>
          <boxGeometry args={[0.08, 0.5, 0.05]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.25}
            metalness={0.35}
            roughness={0.4}
            transparent
            opacity={0.55}
          />
        </mesh>
      ))}
    </group>
  );
}

function MagneticFieldLines({ rpm, color }: { rpm: number; color: string }) {
  const fieldRef = useRef<THREE.Group>(null);
  const rotationSpeed = (rpm / 1200) * 1.2;

  useFrame((_, delta) => {
    if (fieldRef.current) {
      fieldRef.current.rotation.z += delta * rotationSpeed;
    }
  });

  return (
    <group ref={fieldRef}>
      {Array.from({ length: 6 }).map((_, i) => (
        <lineLoop key={i} geometry={createRingGeometry(0.78 + i * 0.03, 64)}>
          <lineBasicMaterial color={color} transparent opacity={0.25} />
        </lineLoop>
      ))}
    </group>
  );
}

function InductionMotorModel({ rpm, load, failureRisk, temperature, wireframe }: MachineModelProps & { wireframe?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const baseColor = HeatColor(temperature);

  useFrame((state) => {
    if (groupRef.current) {
      const vibration = (load / 100) * 0.006 + (failureRisk / 100) * 0.003;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 30) * vibration;
    }
  });

  const MaterialComponent: any = wireframe ? 'meshBasicMaterial' : 'meshStandardMaterial';

  return (
    <group ref={groupRef} rotation={[0.1, 0.4, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1, 1, 2.2, 28, 4, true]} />
        <MaterialComponent
          color={baseColor}
          emissive={wireframe ? undefined : baseColor}
          emissiveIntensity={0.18}
          metalness={0.5}
          roughness={0.25}
          transparent
          opacity={0.6}
          wireframe={wireframe}
        />
      </mesh>

      <StatorTeeth color={baseColor} />

      {Array.from({ length: 12 }).map((_, i) => (
        <lineLoop key={i} geometry={createRingGeometry(1, 48)} position={[0, 0, -1.05 + i * 0.19]}>
          <lineBasicMaterial color={baseColor} transparent opacity={0.2} />
        </lineLoop>
      ))}

      <RotorCage rpm={rpm} color={baseColor} temperature={temperature} />
      <MagneticFieldLines rpm={rpm} color={baseColor} />

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 3.6, 10]} />
        <MaterialComponent
          color={baseColor}
          emissive={wireframe ? undefined : baseColor}
          emissiveIntensity={0.25}
          metalness={0.6}
          roughness={0.2}
          transparent
          opacity={0.7}
          wireframe={wireframe}
        />
      </mesh>

      {[-1.2, 1.2].map((z, i) => (
        <group key={i} position={[0, 0, z]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.65, 0.08, 12, 36]} />
            <MaterialComponent
              color={baseColor}
              emissive={wireframe ? undefined : baseColor}
              emissiveIntensity={0.2}
              metalness={0.4}
              roughness={0.3}
              transparent
              opacity={0.5}
              wireframe={wireframe}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 0.2, 18]} />
            <MaterialComponent
              color={baseColor}
              emissive={wireframe ? undefined : baseColor}
              emissiveIntensity={0.2}
              metalness={0.4}
              roughness={0.3}
              transparent
              opacity={0.45}
              wireframe={wireframe}
            />
          </mesh>
        </group>
      ))}

      <mesh position={[0.9, 0.7, 0.4]}>
        <boxGeometry args={[0.5, 0.3, 0.4]} />
        <MaterialComponent
          color={baseColor}
          emissive={wireframe ? undefined : baseColor}
          emissiveIntensity={0.2}
          metalness={0.4}
          roughness={0.4}
          transparent
          opacity={0.5}
          wireframe={wireframe}
        />
      </mesh>

      <CoolingFan rpm={rpm} color={baseColor} />

      <mesh position={[0, -1.25, 0]}>
        <boxGeometry args={[2.4, 0.15, 1.4]} />
        <MaterialComponent
          color={baseColor}
          emissive={wireframe ? undefined : baseColor}
          emissiveIntensity={0.15}
          metalness={0.3}
          roughness={0.4}
          transparent
          opacity={0.5}
          wireframe={wireframe}
        />
      </mesh>
      <mesh position={[0, -1.1, 0]}>
        <boxGeometry args={[0.35, 0.35, 2.2]} />
        <MaterialComponent
          color={baseColor}
          emissive={wireframe ? undefined : baseColor}
          emissiveIntensity={0.12}
          metalness={0.3}
          roughness={0.4}
          transparent
          opacity={0.4}
          wireframe={wireframe}
        />
      </mesh>
    </group>
  );
}

// ============================================
// CENTRIFUGAL PUMP (M2)
// ============================================

function ImpellerBlade({
  angle,
  color
}: {
  angle: number;
  color: string;
}) {
  const bladeGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0.15, 0, 0),
      new THREE.Vector3(0.4, 0.3, 0),
      new THREE.Vector3(0.7, 0.15, 0)
    );
    const points = curve.getPoints(10);
    const vertices: number[] = [];
    points.forEach(p => vertices.push(p.x, p.y, p.z));
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geo;
  }, []);

  return (
    <group rotation={[0, 0, angle]}>
      <lineSegments geometry={bladeGeometry}>
        <lineBasicMaterial color={color} transparent opacity={0.9} />
      </lineSegments>
      <lineSegments geometry={bladeGeometry} scale-x={1} scale-y={-0.3} scale-z={1} position-z={0.08}>
        <lineBasicMaterial color={color} transparent opacity={0.6} />
      </lineSegments>
    </group>
  );
}

function PumpImpeller({ rpm, color, temperature }: { rpm: number; color: string; temperature: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const rotationSpeed = (rpm / 1200) * 4;
  const bladeCount = 8;
  const heatIntensity = Math.min(1, Math.max(0, (temperature - 50) / 50));

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.z += delta * rotationSpeed;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Hub */}
      <mesh>
        <cylinderGeometry args={[0.15, 0.15, 0.3, 12]} />
        <meshBasicMaterial
          color={heatIntensity > 0.5 ? '#ff6600' : color}
          transparent
          opacity={0.3 + heatIntensity * 0.2}
        />
      </mesh>

      {/* Impeller blades */}
      {Array.from({ length: bladeCount }).map((_, i) => (
        <ImpellerBlade
          key={i}
          angle={(i / bladeCount) * Math.PI * 2}
          color={color}
        />
      ))}

      {/* Outer ring */}
      <lineLoop geometry={createRingGeometry(0.7, 48)}>
        <lineBasicMaterial color={color} transparent opacity={0.8} />
      </lineLoop>
    </group>
  );
}

function CentrifugalPumpModel({ rpm, load, failureRisk, temperature }: MachineModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const baseColor = HeatColor(temperature);

  useFrame((state) => {
    if (groupRef.current) {
      const vibration = (load / 100) * 0.005;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 25) * vibration;
    }
  });

  const suctionPipeGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const segments = 24;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      vertices.push(Math.cos(angle) * 0.35, Math.sin(angle) * 0.35, 0);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geo;
  }, []);

  return (
    <group ref={groupRef} rotation={[0.15, 0.3, 0]}>
      {/* Volute casing (spiral) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.6, 0.25, 8, 32]} />
        <meshBasicMaterial color={baseColor} wireframe transparent opacity={0.4} />
      </mesh>

      {/* Casing front */}
      <group position={[0, 0, 0.15]}>
        <lineLoop geometry={createRingGeometry(0.85, 48)}>
          <lineBasicMaterial color={baseColor} transparent opacity={0.6} />
        </lineLoop>
        <lineLoop geometry={createRingGeometry(0.35, 24)}>
          <lineBasicMaterial color={baseColor} transparent opacity={0.6} />
        </lineLoop>
      </group>

      {/* Impeller */}
      <group position={[0, 0, 0.1]}>
        <PumpImpeller rpm={rpm} color={baseColor} temperature={temperature} />
      </group>

      {/* Suction inlet pipe */}
      <group position={[0, 0, 0.8]}>
        <mesh rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 1.2, 16, 1, true]} />
          <meshBasicMaterial color={baseColor} wireframe transparent opacity={0.4} />
        </mesh>
        <group position={[0, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
          <lineLoop geometry={suctionPipeGeometry}>
            <lineBasicMaterial color={baseColor} transparent opacity={0.7} />
          </lineLoop>
        </group>
      </group>

      {/* Discharge outlet */}
      <group position={[0.9, 0.3, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.25, 0.25, 0.8, 12, 1, true]} />
          <meshBasicMaterial color={baseColor} wireframe transparent opacity={0.4} />
        </mesh>
      </group>

      {/* Motor coupling */}
      <group position={[0, 0, -0.5]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.35, 0.6, 16, 2, true]} />
          <meshBasicMaterial color={baseColor} wireframe transparent opacity={0.3} />
        </mesh>
      </group>

      {/* Motor body */}
      <group position={[0, 0, -1.2]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 1.2, 20, 3, true]} />
          <meshBasicMaterial color={baseColor} wireframe transparent opacity={0.35} />
        </mesh>
        {/* Cooling fins */}
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} position={[0.52 * Math.cos((i / 8) * Math.PI * 2), 0.52 * Math.sin((i / 8) * Math.PI * 2), 0]} rotation={[Math.PI / 2, 0, (i / 8) * Math.PI * 2]}>
            <boxGeometry args={[0.05, 1, 0.15]} />
            <meshBasicMaterial color={baseColor} wireframe transparent opacity={0.25} />
          </mesh>
        ))}
      </group>

      {/* Base plate */}
      <mesh position={[0, -0.9, -0.3]}>
        <boxGeometry args={[1.6, 0.1, 2.5]} />
        <meshBasicMaterial color={baseColor} wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// ============================================
// GEARBOX & CONVEYOR (M3)
// ============================================

function Gear({
  position,
  radius,
  teeth = 12,
  thickness = 0.3,
  color = '#00ffff',
  rotationSpeed = 0,
  direction = 1,
  temperature = 60
}: {
  position: [number, number, number];
  radius: number;
  teeth?: number;
  thickness?: number;
  color?: string;
  rotationSpeed?: number;
  direction?: number;
  temperature?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const heatIntensity = Math.min(1, Math.max(0, (temperature - 50) / 50));

  useFrame((_, delta) => {
    if (groupRef.current && rotationSpeed) {
      groupRef.current.rotation.z += delta * rotationSpeed * direction;
    }
  });

  const teethGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const toothHeight = radius * 0.15;

    for (let i = 0; i < teeth; i++) {
      const angle = (i / teeth) * Math.PI * 2;
      const nextAngle = ((i + 0.3) / teeth) * Math.PI * 2;

      // Tooth shape
      vertices.push(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      vertices.push(Math.cos(angle) * (radius + toothHeight), Math.sin(angle) * (radius + toothHeight), 0);

      vertices.push(Math.cos(angle) * (radius + toothHeight), Math.sin(angle) * (radius + toothHeight), 0);
      vertices.push(Math.cos(nextAngle) * (radius + toothHeight), Math.sin(nextAngle) * (radius + toothHeight), 0);

      vertices.push(Math.cos(nextAngle) * (radius + toothHeight), Math.sin(nextAngle) * (radius + toothHeight), 0);
      vertices.push(Math.cos(nextAngle) * radius, Math.sin(nextAngle) * radius, 0);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geo;
  }, [teeth, radius]);

  const spokeGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const spokes = 6;

    for (let i = 0; i < spokes; i++) {
      const angle = (i / spokes) * Math.PI * 2;
      vertices.push(0, 0, 0);
      vertices.push(Math.cos(angle) * radius * 0.8, Math.sin(angle) * radius * 0.8, 0);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geo;
  }, [radius]);

  return (
    <group ref={groupRef} position={position}>
      {/* Main gear body */}
      <mesh>
        <cylinderGeometry args={[radius, radius, thickness, teeth * 2, 1, true]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.4} />
      </mesh>

      {/* Front face */}
      <group position={[0, 0, thickness / 2]}>
        <lineLoop geometry={createRingGeometry(radius, teeth * 2)}>
          <lineBasicMaterial color={color} transparent opacity={0.8} />
        </lineLoop>
        <lineLoop geometry={createRingGeometry(radius * 0.3, 16)}>
          <lineBasicMaterial color={color} transparent opacity={0.8} />
        </lineLoop>
        <lineSegments geometry={spokeGeometry}>
          <lineBasicMaterial color={color} transparent opacity={0.6} />
        </lineSegments>
        <lineSegments geometry={teethGeometry}>
          <lineBasicMaterial color={color} transparent opacity={0.9} />
        </lineSegments>
      </group>

      {/* Back face */}
      <group position={[0, 0, -thickness / 2]}>
        <lineLoop geometry={createRingGeometry(radius, teeth * 2)}>
          <lineBasicMaterial color={color} transparent opacity={0.8} />
        </lineLoop>
        <lineSegments geometry={teethGeometry}>
          <lineBasicMaterial color={color} transparent opacity={0.9} />
        </lineSegments>
      </group>

      {/* Center hub with heat */}
      <mesh>
        <cylinderGeometry args={[radius * 0.2, radius * 0.2, thickness + 0.1, 12]} />
        <meshBasicMaterial
          color={heatIntensity > 0.5 ? '#ff6600' : color}
          transparent
          opacity={0.25 + heatIntensity * 0.25}
        />
      </mesh>
    </group>
  );
}

function ConveyorBelt({ rpm, load, color, temperature }: { rpm: number; load: number; color: string; temperature: number }) {
  const beltRef = useRef<THREE.Group>(null);
  const beltSpeed = (rpm / 1200) * 2;
  const heatIntensity = Math.min(1, Math.max(0, (temperature - 50) / 50));

  useFrame((state) => {
    if (beltRef.current) {
      // Animate belt segments
      beltRef.current.children.forEach((child, i) => {
        if (child.type === 'Mesh' && i < 20) {
          const offset = (state.clock.elapsedTime * beltSpeed + i * 0.5) % 10;
          child.position.x = -5 + offset;
        }
      });
    }
  });

  const rollerPositions = [-2.2, 2.2];

  return (
    <group position={[0, -0.8, 0]}>
      {/* Belt frame */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[5, 0.15, 1]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
      </mesh>

      {/* Top belt surface */}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[4.8, 0.05, 0.9]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.5} />
      </mesh>

      {/* Belt segments (moving) */}
      <group ref={beltRef}>
        {Array.from({ length: 20 }).map((_, i) => (
          <mesh key={i} position={[-5 + i * 0.5, 0.15, 0]}>
            <boxGeometry args={[0.4, 0.02, 0.85]} />
            <meshBasicMaterial
              color={heatIntensity > 0.5 ? '#ff6600' : color}
              wireframe
              transparent
              opacity={0.6}
            />
          </mesh>
        ))}
      </group>

      {/* Drive rollers */}
      {rollerPositions.map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 1.1, 16, 1, true]} />
            <meshBasicMaterial color={color} wireframe transparent opacity={0.5} />
          </mesh>
          <lineLoop geometry={createRingGeometry(0.2, 16)} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.55]}>
            <lineBasicMaterial color={color} transparent opacity={0.7} />
          </lineLoop>
        </group>
      ))}

      {/* Support legs */}
      {[-1.8, -0.6, 0.6, 1.8].map((x, i) => (
        <mesh key={i} position={[x, -0.35, 0]}>
          <boxGeometry args={[0.1, 0.5, 0.8]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
        </mesh>
      ))}

      {/* Base plate */}
      <mesh position={[0, -0.65, 0]}>
        <boxGeometry args={[5.2, 0.08, 1.2]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

function GearboxConveyorModel({ rpm, load, failureRisk, temperature }: MachineModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const baseColor = temperature < 70 ? '#00ffff' : temperature < 85 ? '#00ff88' : '#ff8800';
  const rotationSpeed = (rpm / 1200) * 3;

  useFrame((state) => {
    if (groupRef.current) {
      const vibration = (load / 100) * 0.006;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 25) * vibration;
    }
  });

  return (
    <group ref={groupRef} rotation={[0.15, 0.3, 0]}>
      {/* Gearbox housing */}
      <mesh position={[-0.8, 0.4, 0]}>
        <boxGeometry args={[1.8, 1.4, 1.2]} />
        <meshBasicMaterial color={baseColor} wireframe transparent opacity={0.3} />
      </mesh>

      {/* Input shaft */}
      <mesh position={[-2, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.8, 12, 1, true]} />
        <meshBasicMaterial color={baseColor} wireframe transparent opacity={0.5} />
      </mesh>

      {/* Large input gear */}
      <Gear
        position={[-1.4, 0.6, 0]}
        radius={0.5}
        teeth={20}
        thickness={0.25}
        color={baseColor}
        rotationSpeed={rotationSpeed}
        direction={1}
        temperature={temperature}
      />

      {/* Medium intermediate gear */}
      <Gear
        position={[-0.5, 0.25, 0]}
        radius={0.35}
        teeth={14}
        thickness={0.25}
        color={baseColor}
        rotationSpeed={rotationSpeed * 1.4}
        direction={-1}
        temperature={temperature}
      />

      {/* Small output gear */}
      <Gear
        position={[0.3, 0.1, 0]}
        radius={0.25}
        teeth={10}
        thickness={0.25}
        color={baseColor}
        rotationSpeed={rotationSpeed * 2}
        direction={1}
        temperature={temperature}
      />

      {/* Output shaft to conveyor */}
      <mesh position={[0.8, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 1, 10, 1, true]} />
        <meshBasicMaterial color={baseColor} wireframe transparent opacity={0.5} />
      </mesh>

      {/* Connecting shaft lines */}
      <mesh position={[-1.4, 0.6, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.4, 8, 1, true]} />
        <meshBasicMaterial color={baseColor} wireframe transparent opacity={0.4} />
      </mesh>

      {/* Conveyor belt system */}
      <ConveyorBelt rpm={rpm} load={load} color={baseColor} temperature={temperature} />

      {/* Motor mount */}
      <group position={[-2.3, 0.6, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.5, 16, 2, true]} />
          <meshBasicMaterial color={baseColor} wireframe transparent opacity={0.35} />
        </mesh>
        <lineLoop geometry={createRingGeometry(0.3, 24)} rotation={[0, Math.PI / 2, 0]} position={[-0.25, 0, 0]}>
          <lineBasicMaterial color={baseColor} transparent opacity={0.6} />
        </lineLoop>
      </group>

      {/* Gearbox mounting feet */}
      {[[-1.5, -0.35, 0.5], [-1.5, -0.35, -0.5], [-0.1, -0.35, 0.5], [-0.1, -0.35, -0.5]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <boxGeometry args={[0.2, 0.15, 0.2]} />
          <meshBasicMaterial color={baseColor} wireframe transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface Machine3DViewerProps {
  rpm: number;
  load: number;
  failureRisk: number;
  isSimulating: boolean;
  temperature: number;
  vibration: number;
  machineId: string;
  machineType: MachineType;
  wireframe?: boolean;
}

export function Machine3DViewer({
  rpm,
  load,
  failureRisk,
  isSimulating,
  temperature,
  vibration,
  machineId,
  machineType,
  wireframe = false
}: Machine3DViewerProps) {
  const baseColor = temperature < 70 ? '#00ffff' : temperature < 85 ? '#00ff88' : '#ff8800';

  const getMachineLabel = () => {
    switch (machineType) {
      case 'boiler': return 'INDUSTRIAL BOILER';
      case 'motor': return 'INDUCTION MOTOR';
      case 'pump': return 'CENTRIFUGAL PUMP';
      case 'gearbox': return 'GEARBOX & CONVEYOR';
      default: return 'MACHINE';
    }
  };

  return (
    <div className="boiler-stage relative w-full h-[440px] rounded-2xl overflow-hidden border border-primary/30 shadow-[0_0_40px_rgba(24,245,255,0.12)]">
      {/* Top Label */}
      <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded border border-muted bg-background/80 backdrop-blur-sm">
        <span className="text-xs text-muted-foreground font-mono tracking-wider">
          {getMachineLabel()}: <span className="text-foreground font-semibold">{machineId}</span>
        </span>
      </div>

      {/* RPM indicator */}
      <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded border border-primary/50 bg-primary/10 backdrop-blur-sm">
        <span className="text-xs text-primary font-mono">{rpm} RPM</span>
      </div>

      {/* Boiler Temperature Label */}
      <div className="absolute top-16 right-8 z-10">
        <div className="relative">
          <div className={`px-3 py-1.5 rounded border backdrop-blur-sm ${temperature < 70
            ? 'border-primary/50 bg-primary/10 text-primary'
            : temperature < 85
              ? 'border-success/50 bg-success/10 text-success'
              : 'border-warning/50 bg-warning/10 text-warning'
            }`}>
            <span className="text-xs font-mono">Steam: {temperature} C</span>
          </div>
          <div className={`absolute left-0 top-1/2 w-8 h-px -translate-x-full ${temperature < 70 ? 'bg-primary/50' : temperature < 85 ? 'bg-success/50' : 'bg-warning/50'
            }`} />
          <div className={`absolute left-0 top-1/2 w-2 h-2 -translate-x-[calc(100%+32px)] -translate-y-1/2 rounded-full ${temperature < 70 ? 'bg-primary' : temperature < 85 ? 'bg-success' : 'bg-warning'
            }`} />
        </div>
      </div>

      {/* Bearing Vibration Label */}
      <div className="absolute bottom-20 right-8 z-10">
        <div className="relative">
          <div className={`px-3 py-1.5 rounded border backdrop-blur-sm ${vibration < 4
            ? 'border-primary/50 bg-primary/10 text-primary'
            : vibration < 6
              ? 'border-warning/50 bg-warning/10 text-warning'
              : 'border-destructive/50 bg-destructive/10 text-destructive'
            }`}>
            <span className="text-xs font-mono">Vibration: {vibration.toFixed(1)} mm/s</span>
          </div>
          <div className={`absolute left-0 top-1/2 w-12 h-px -translate-x-full ${vibration < 4 ? 'bg-primary/50' : vibration < 6 ? 'bg-warning/50' : 'bg-destructive/50'
            }`} />
          <div className={`absolute left-0 top-1/2 w-2 h-2 -translate-x-[calc(100%+48px)] -translate-y-1/2 rounded-full ${vibration < 4 ? 'bg-primary' : vibration < 6 ? 'bg-warning' : 'bg-destructive'
            }`} />
        </div>
      </div>

      {/* Simulating overlay */}
      {isSimulating && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-primary font-mono text-sm animate-pulse">COMPUTING PREDICTION...</span>
          </div>
        </div>
      )}

      <div className="holo-glow" />
      <div className="holo-scanlines" />
      <div className="holo-rings" />

      <Canvas>
        <PerspectiveCamera makeDefault position={[5, 2.5, 5]} fov={35} />
        <OrbitControls
          enablePan={false}
          minDistance={4}
          maxDistance={12}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2}
          autoRotate
          autoRotateSpeed={0.4}
        />

        <ambientLight intensity={0.25} />
        <directionalLight position={[4, 6, 4]} intensity={0.45} color="#9fe7ff" />
        <pointLight position={[3, 3, 3]} intensity={0.35} color="#63fff4" />
        <pointLight position={[-4, -2, 3]} intensity={0.2} color="#ff9a4f" />
        <spotLight position={[0, 6, 4]} intensity={0.35} angle={0.4} penumbra={0.6} color="#7cf6ff" />

        {machineType === 'boiler' && (
          <BoilerModel rpm={rpm} load={load} failureRisk={failureRisk} temperature={temperature} wireframe={wireframe} />
        )}
        {machineType === 'motor' && (
          <InductionMotorModel rpm={rpm} load={load} failureRisk={failureRisk} temperature={temperature} wireframe={wireframe} />
        )}
        {machineType === 'pump' && (
          <CentrifugalPumpModel rpm={rpm} load={load} failureRisk={failureRisk} temperature={temperature} />
        )}
        {machineType === 'gearbox' && (
          <GearboxConveyorModel rpm={rpm} load={load} failureRisk={failureRisk} temperature={temperature} />
        )}

        <GridFloor color={baseColor} />

        <fog attach="fog" args={['#0a0a18', 6, 20]} />

        <EffectComposer>
          <Bloom
            intensity={0.9}
            luminanceThreshold={0.15}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}


