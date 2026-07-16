import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ─── Low-poly Airplane ─── */
function Airplane() {
  const groupRef = useRef();
  const clock = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    clock.current += delta * 0.3;
    const t = clock.current;
    // Fly in a wide arc
    groupRef.current.position.x = Math.sin(t) * 6;
    groupRef.current.position.y = Math.cos(t * 0.7) * 1.5 + 1;
    groupRef.current.position.z = Math.cos(t) * 2 - 3;
    // Bank rotation
    groupRef.current.rotation.z = Math.sin(t) * 0.3;
    groupRef.current.rotation.y = t + Math.PI / 2;
  });

  return (
    <group ref={groupRef} scale={0.25}>
      {/* Fuselage */}
      <mesh>
        <cylinderGeometry args={[0.15, 0.3, 2.5, 8]} />
        <meshStandardMaterial color="#38BDF8" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Nose cone */}
      <mesh position={[0, 1.4, 0]}>
        <coneGeometry args={[0.15, 0.6, 8]} />
        <meshStandardMaterial color="#06B6D4" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Wings */}
      <mesh position={[0, 0.2, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[4, 0.06, 0.6]} />
        <meshStandardMaterial color="#FFD166" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Tail wing */}
      <mesh position={[0, -1.1, 0]}>
        <boxGeometry args={[1.6, 0.05, 0.4]} />
        <meshStandardMaterial color="#FFD166" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Tail fin */}
      <mesh position={[0, -0.8, 0.3]}>
        <boxGeometry args={[0.06, 0.6, 0.5]} />
        <meshStandardMaterial color="#FF7F50" metalness={0.3} roughness={0.5} />
      </mesh>
    </group>
  );
}

/* ─── Wireframe Globe ─── */
function Globe() {
  const meshRef = useRef();

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <mesh ref={meshRef} position={[4.5, 2, -4]} scale={1.8}>
      <sphereGeometry args={[1, 24, 24]} />
      <meshStandardMaterial
        color="#38BDF8"
        wireframe
        transparent
        opacity={0.35}
      />
    </mesh>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      camera={{ position: [0, 0, 8], fov: 50 }}
      style={{ pointerEvents: "none" }}
      dpr={[1, 1.5]}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <Airplane />
      <Globe />
    </Canvas>
  );
}
