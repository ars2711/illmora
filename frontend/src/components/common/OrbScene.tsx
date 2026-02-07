/// <reference types="@react-three/fiber" />
// @ts-nocheck

"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float } from "@react-three/drei";
import { useRef } from "react";
import { Mesh } from "three";

function Orb() {
  const mesh = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    mesh.current.rotation.y = clock.getElapsedTime() * 0.2;
    mesh.current.rotation.x = clock.getElapsedTime() * 0.1;
  });

  return (
    <Float speed={1.6} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={mesh}>
        <sphereGeometry args={[1.4, 64, 64]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.25}
          metalness={0.75}
          emissive="#38bdf8"
          emissiveIntensity={0.35}
        />
      </mesh>
    </Float>
  );
}

export default function OrbScene() {
  return (
    <Canvas camera={{ position: [0, 0, 4] }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 3, 3]} intensity={1.2} />
      <Orb />
      <Environment preset="city" />
    </Canvas>
  );
}
