"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";

function BuildingMesh() {
    return (
        <group position={[0, 0, 0]}>
            {/* Simple House Shape */}
            <mesh position={[0, 2.5, 0]}>
                <boxGeometry args={[10, 5, 8]} />
                <meshStandardMaterial color="#2a2a2a" wireframe />
            </mesh>
            {/* Roof */}
            <mesh position={[0, 6, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[6.5, 3, 4]} />
                <meshStandardMaterial color="#2a2a2a" wireframe />
            </mesh>
        </group>
    );
}

function ScaffoldMesh() {
    // Mock scaffolding around the building
    return (
        <group>
            {/* Posts */}
            {[...Array(6)].map((_, i) => (
                <mesh key={i} position={[-5.5 + i * 2.2, 2.5, 4.5]}>
                    <cylinderGeometry args={[0.05, 0.05, 5]} />
                    <meshStandardMaterial color="#FF6B35" />
                </mesh>
            ))}
            {/* Handrails */}
            <mesh position={[0, 4, 4.5]}>
                <boxGeometry args={[12, 0.05, 0.05]} />
                <meshStandardMaterial color="#FF6B35" />
            </mesh>
        </group>
    )
}

export function View3D() {
    return (
        <div className="absolute inset-0 bg-transparent">
            <Canvas camera={{ position: [15, 10, 15], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#00F0FF" />

                {/* Environment */}
                <Grid infiniteGrid fadeDistance={50} sectionColor="#444" cellColor="#222" />
                <Environment preset="city" />

                {/* Objects */}
                <BuildingMesh />
                <ScaffoldMesh />

                <OrbitControls makeDefault />
            </Canvas>
        </div>
    );
}
