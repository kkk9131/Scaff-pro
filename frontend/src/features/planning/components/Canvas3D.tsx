'use client';

import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, OrthographicCamera, Grid, Line } from '@react-three/drei';
import * as THREE from 'three';
import { usePlanningStore } from '@/store/planningStore';

interface ScaffoldVisualizerProps {
  isIsometric?: boolean;
  isPerspective?: boolean;
}

// Building wireframe component
function BuildingWireframe() {
  const buildingRef = useRef<THREE.Group>(null);

  // Demo building dimensions (in meters)
  const width = 10;
  const depth = 8;
  const wallHeight = 5.6;
  const roofHeight = 2;

  // Create building edges
  const wallEdges = [
    // Bottom edges
    [[-width / 2, 0, -depth / 2], [width / 2, 0, -depth / 2]],
    [[width / 2, 0, -depth / 2], [width / 2, 0, depth / 2]],
    [[width / 2, 0, depth / 2], [-width / 2, 0, depth / 2]],
    [[-width / 2, 0, depth / 2], [-width / 2, 0, -depth / 2]],
    // Top edges
    [[-width / 2, wallHeight, -depth / 2], [width / 2, wallHeight, -depth / 2]],
    [[width / 2, wallHeight, -depth / 2], [width / 2, wallHeight, depth / 2]],
    [[width / 2, wallHeight, depth / 2], [-width / 2, wallHeight, depth / 2]],
    [[-width / 2, wallHeight, depth / 2], [-width / 2, wallHeight, -depth / 2]],
    // Vertical edges
    [[-width / 2, 0, -depth / 2], [-width / 2, wallHeight, -depth / 2]],
    [[width / 2, 0, -depth / 2], [width / 2, wallHeight, -depth / 2]],
    [[width / 2, 0, depth / 2], [width / 2, wallHeight, depth / 2]],
    [[-width / 2, 0, depth / 2], [-width / 2, wallHeight, depth / 2]],
    // Roof edges
    [[-width / 2, wallHeight, -depth / 2], [0, wallHeight + roofHeight, -depth / 2]],
    [[width / 2, wallHeight, -depth / 2], [0, wallHeight + roofHeight, -depth / 2]],
    [[-width / 2, wallHeight, depth / 2], [0, wallHeight + roofHeight, depth / 2]],
    [[width / 2, wallHeight, depth / 2], [0, wallHeight + roofHeight, depth / 2]],
    [[0, wallHeight + roofHeight, -depth / 2], [0, wallHeight + roofHeight, depth / 2]],
  ];

  return (
    <group ref={buildingRef}>
      {wallEdges.map((edge, i) => (
        <Line
          key={`building-edge-${i}`}
          points={edge.map(p => new THREE.Vector3(p[0], p[1], p[2]))}
          color="#64748b"
          lineWidth={1.5}
        />
      ))}
    </group>
  );
}

// Scaffold wireframe component
function ScaffoldWireframe() {
  const scaffoldRef = useRef<THREE.Group>(null);

  // Demo scaffold dimensions
  const buildingWidth = 10;
  const buildingDepth = 8;
  const offset = 0.9; // Distance from building
  const spanWidth = 1.8; // Standard span
  const floorHeight = 1.9; // Standard floor height
  const floors = 3;

  // Generate scaffold posts and ledgers
  const posts: [number, number, number][][] = [];
  const ledgers: [number, number, number][][] = [];
  const handrails: [number, number, number][][] = [];

  // Front and back scaffolds
  for (let side = 0; side < 2; side++) {
    const z = side === 0 ? -buildingDepth / 2 - offset : buildingDepth / 2 + offset;

    for (let x = -buildingWidth / 2 - offset; x <= buildingWidth / 2 + offset; x += spanWidth) {
      // Vertical posts
      posts.push([
        [x, 0, z],
        [x, floors * floorHeight, z],
      ]);

      // Horizontal ledgers at each floor
      for (let floor = 1; floor <= floors; floor++) {
        if (x + spanWidth <= buildingWidth / 2 + offset) {
          ledgers.push([
            [x, floor * floorHeight, z],
            [x + spanWidth, floor * floorHeight, z],
          ]);
          // Handrails (slightly higher)
          handrails.push([
            [x, floor * floorHeight + 0.5, z],
            [x + spanWidth, floor * floorHeight + 0.5, z],
          ]);
        }
      }
    }
  }

  // Left and right scaffolds
  for (let side = 0; side < 2; side++) {
    const x = side === 0 ? -buildingWidth / 2 - offset : buildingWidth / 2 + offset;

    for (let z = -buildingDepth / 2 - offset; z <= buildingDepth / 2 + offset; z += spanWidth) {
      // Vertical posts
      posts.push([
        [x, 0, z],
        [x, floors * floorHeight, z],
      ]);

      // Horizontal ledgers at each floor
      for (let floor = 1; floor <= floors; floor++) {
        if (z + spanWidth <= buildingDepth / 2 + offset) {
          ledgers.push([
            [x, floor * floorHeight, z],
            [x, floor * floorHeight, z + spanWidth],
          ]);
          // Handrails
          handrails.push([
            [x, floor * floorHeight + 0.5, z],
            [x, floor * floorHeight + 0.5, z + spanWidth],
          ]);
        }
      }
    }
  }

  return (
    <group ref={scaffoldRef}>
      {/* Posts - amber color */}
      {posts.map((edge, i) => (
        <Line
          key={`post-${i}`}
          points={edge.map(p => new THREE.Vector3(p[0], p[1], p[2]))}
          color="#f59e0b"
          lineWidth={2}
        />
      ))}
      {/* Ledgers - orange color */}
      {ledgers.map((edge, i) => (
        <Line
          key={`ledger-${i}`}
          points={edge.map(p => new THREE.Vector3(p[0], p[1], p[2]))}
          color="#ea580c"
          lineWidth={1.5}
        />
      ))}
      {/* Handrails - green color */}
      {handrails.map((edge, i) => (
        <Line
          key={`handrail-${i}`}
          points={edge.map(p => new THREE.Vector3(p[0], p[1], p[2]))}
          color="#22c55e"
          lineWidth={1}
        />
      ))}
    </group>
  );
}

// Camera controller for isometric view
function IsometricCameraController() {
  const { camera } = useThree();

  React.useEffect(() => {
    // Isometric angle
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 2, 0);
  }, [camera]);

  return null;
}

// Loading placeholder
function LoadingPlaceholder() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#374151" wireframe />
    </mesh>
  );
}

export function Canvas3D({ isIsometric = false, isPerspective = false }: ScaffoldVisualizerProps) {
  const { currentView } = usePlanningStore();

  return (
    <div className="relative h-full w-full bg-zinc-950">
      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-900/50" />

      <Canvas
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        shadows
      >
        <color attach="background" args={['#09090b']} />
        <fog attach="fog" args={['#09090b', 20, 50]} />

        <Suspense fallback={<LoadingPlaceholder />}>
          {/* Lighting */}
          <ambientLight intensity={0.3} />
          <directionalLight position={[10, 20, 10]} intensity={0.5} />
          <directionalLight position={[-10, 10, -10]} intensity={0.3} />

          {/* Camera */}
          {isIsometric ? (
            <>
              <OrthographicCamera
                makeDefault
                position={[20, 20, 20]}
                zoom={30}
                near={0.1}
                far={100}
              />
              <IsometricCameraController />
            </>
          ) : (
            <PerspectiveCamera
              makeDefault
              position={[15, 10, 15]}
              fov={45}
              near={0.1}
              far={100}
            />
          )}

          {/* Controls */}
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={5}
            maxDistance={50}
            maxPolarAngle={Math.PI / 2}
            target={[0, 2, 0]}
          />

          {/* Ground grid */}
          <Grid
            args={[30, 30]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#27272a"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#3f3f46"
            fadeDistance={40}
            fadeStrength={1}
            position={[0, 0, 0]}
          />

          {/* Building */}
          <BuildingWireframe />

          {/* Scaffold */}
          <ScaffoldWireframe />
        </Suspense>
      </Canvas>

      {/* View mode indicator */}
      <div className="absolute left-4 top-4 rounded-lg bg-zinc-900/80 px-3 py-2 text-xs font-medium text-zinc-400 backdrop-blur-sm">
        {isIsometric ? 'Isometric View' : isPerspective ? 'Perspective View' : '3D View'}
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1 rounded-lg bg-zinc-900/80 px-3 py-2 text-xs text-zinc-500 backdrop-blur-sm">
        <span>Drag: Rotate</span>
        <span>Scroll: Zoom</span>
        <span>Right-click: Pan</span>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 rounded-lg bg-zinc-900/80 px-3 py-2 text-xs backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="h-2 w-4 rounded-sm bg-slate-500" />
          <span className="text-zinc-400">Building</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-4 rounded-sm bg-amber-500" />
          <span className="text-zinc-400">Posts</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-4 rounded-sm bg-orange-600" />
          <span className="text-zinc-400">Ledgers</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-4 rounded-sm bg-green-500" />
          <span className="text-zinc-400">Handrails</span>
        </div>
      </div>
    </div>
  );
}
