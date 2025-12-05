"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Line, OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { usePlanningStore, type Point } from "@/store/planningStore";
import { useMemo } from "react";
import * as THREE from "three";

interface BuildingMeshProps {
    points: Point[];
    floorHeight: number;
    totalFloors: number;
    roofHeight: number;
    scale: number | null;
}

function BuildingMesh({ points, floorHeight, totalFloors, roofHeight, scale }: BuildingMeshProps) {
    const { shape, walls, height } = useMemo(() => {
        if (points.length < 3) return { shape: null, walls: [], height: 0 };

        const scaleFactor = scale ? 1 / (scale * 1000) : 0.01;

        const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
        const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;

        const pts3d = points.map(p => ({
            x: (p.x - cx) * scaleFactor,
            z: (p.y - cy) * scaleFactor,
        }));

        const shape = new THREE.Shape();
        shape.moveTo(pts3d[0].x, pts3d[0].z);
        for (let i = 1; i < pts3d.length; i++) {
            shape.lineTo(pts3d[i].x, pts3d[i].z);
        }
        shape.closePath();

        const wallHeight = (floorHeight * totalFloors + roofHeight) / 1000;

        const walls: [number, number, number][][] = [];
        for (let i = 0; i < pts3d.length; i++) {
            const next = (i + 1) % pts3d.length;
            walls.push([
                [pts3d[i].x, 0, pts3d[i].z],
                [pts3d[i].x, wallHeight, pts3d[i].z],
            ]);
            walls.push([
                [pts3d[i].x, wallHeight, pts3d[i].z],
                [pts3d[next].x, wallHeight, pts3d[next].z],
            ]);
            for (let f = 0; f < totalFloors; f++) {
                const y = (floorHeight * (f + 1)) / 1000;
                if (y < wallHeight) {
                    walls.push([
                        [pts3d[i].x, y, pts3d[i].z],
                        [pts3d[next].x, y, pts3d[next].z],
                    ]);
                }
            }
        }

        return { shape, walls, height: wallHeight };
    }, [points, floorHeight, totalFloors, roofHeight, scale]);

    if (!shape) return null;

    return (
        <group>
            {/* Wireframe edges only */}
            {walls.map((line, i) => (
                <Line
                    key={i}
                    points={line}
                    color="#00F0FF"
                    lineWidth={1.5}
                />
            ))}
        </group>
    );
}

interface View3DProps {
    viewMode?: "3D" | "ISO" | "PERSP";
}

export function View3D({ viewMode = "3D" }: View3DProps) {
    const { polylinePoints, building, scale } = usePlanningStore();
    const hasBuilding = polylinePoints.length >= 3;

    // Camera positions for different modes
    const cameraConfig = {
        "3D": { position: [20, 15, 20] as [number, number, number], enableRotate: true },
        "PERSP": { position: [25, 12, 5] as [number, number, number], enableRotate: false }, // Fixed 45° presentation angle
        "ISO": { position: [30, 24, 30] as [number, number, number], enableRotate: false },
    };

    const config = cameraConfig[viewMode];

    // View mode labels
    const viewLabels = {
        "3D": "3D自由視点",
        "PERSP": "パース（固定）",
        "ISO": "等角投影",
    };

    return (
        <div className="absolute inset-0 bg-transparent">
            <Canvas>
                {/* Camera based on view mode */}
                {viewMode === "ISO" ? (
                    <OrthographicCamera
                        makeDefault
                        zoom={40}
                        position={config.position}
                        near={0.1}
                        far={1000}
                    />
                ) : (
                    <PerspectiveCamera
                        makeDefault
                        fov={viewMode === "PERSP" ? 35 : 50} // Narrower FOV for presentation
                        position={config.position}
                        near={0.1}
                        far={1000}
                    />
                )}

                <ambientLight intensity={0.4} />
                <pointLight position={[10, 20, 10]} intensity={1} color="#00F0FF" />
                <pointLight position={[-10, 10, -10]} intensity={0.5} color="#FF6B35" />

                <Grid
                    infiniteGrid
                    fadeDistance={50}
                    sectionColor="#333"
                    cellColor="#222"
                    sectionSize={5}
                    cellSize={1}
                />

                {hasBuilding && (
                    <BuildingMesh
                        points={polylinePoints}
                        floorHeight={building.floorHeight}
                        totalFloors={building.totalFloors}
                        roofHeight={building.roofHeight}
                        scale={scale}
                    />
                )}

                <OrbitControls
                    makeDefault
                    enableRotate={config.enableRotate}
                    enablePan={true}
                    enableZoom={true}
                />
            </Canvas>

            {!hasBuilding && (
                <div className="absolute top-4 left-4 p-3 bg-surface-1/80 backdrop-blur rounded-lg border border-white/10 text-sm text-text-muted">
                    2Dビューでポリラインを描いてください
                </div>
            )}
        </div>
    );
}
